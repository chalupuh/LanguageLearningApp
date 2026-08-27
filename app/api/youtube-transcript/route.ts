const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
type CaptionTrack = { baseUrl?: string; languageCode?: string; kind?: string; name?: { simpleText?: string; runs?: Array<{ text?: string }> } };
type CaptionCue = { start: number; duration: number; text: string };

function parsePlayerResponse(html: string, expectedVideoId: string) {
  let fallback: any = null;
  for (const marker of ["ytInitialPlayerResponse = ", "var ytInitialPlayerResponse = "]) {
    let searchFrom = 0;
    while (searchFrom < html.length) {
      const markerStart = html.indexOf(marker, searchFrom);
      if (markerStart < 0) break;
      const start = html.indexOf("{", markerStart + marker.length);
      if (start < 0) break;
      let depth = 0, quoted = false, escaped = false;
      for (let index = start; index < html.length; index++) {
        const character = html[index];
        if (quoted) { if (escaped) escaped = false; else if (character === "\\") escaped = true; else if (character === '"') quoted = false; continue; }
        if (character === '"') quoted = true;
        else if (character === "{") depth++;
        else if (character === "}" && --depth === 0) {
          const candidate = JSON.parse(html.slice(start, index + 1));
          if (candidate?.videoDetails?.videoId === expectedVideoId) return candidate;
          fallback ??= candidate;
          searchFrom = index + 1;
          break;
        }
      }
    }
  }
  if (fallback) return fallback;
  throw new Error("Player data was not found.");
}

function cueText(value: string) { return value.replace(/\n/g, " ").replace(/\s+/g, " ").trim(); }
function makeTranscript(cues: CaptionCue[]) {
  const lines: string[] = [];
  for (const cue of cues) {
    if (!cue.text || lines.at(-1) === cue.text) continue;
    if (lines.at(-1) && cue.text.startsWith(lines.at(-1)!)) lines[lines.length - 1] = cue.text;
    else lines.push(cue.text);
  }
  return lines.join(" ").replace(/\s+([,.!?;:])/g, "$1").trim();
}

export async function POST(request: Request) {
  const { videoId } = await request.json().catch(() => ({ videoId: "" }));
  if (!VIDEO_ID.test(videoId)) return Response.json({ error: "Invalid YouTube video." }, { status: 400 });
  try {
    const watch = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { signal: AbortSignal.timeout(10000), headers: { "User-Agent": "Mozilla/5.0 (compatible; ALOreille/1.0)" } });
    if (!watch.ok) throw new Error();
    const player = parsePlayerResponse(await watch.text(), videoId);
    const durationSeconds = Number(player?.videoDetails?.lengthSeconds ?? 0) || null;
    const tracks: CaptionTrack[] = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    const frenchTracks = tracks.filter(track => track.languageCode?.toLowerCase().startsWith("fr"));
    const track = frenchTracks.sort((a, b) => Number(a.kind === "asr") - Number(b.kind === "asr"))[0];
    if (!track?.baseUrl) return Response.json({ transcript: null, durationSeconds, reason: tracks.length ? "This video has captions, but no French caption track." : "This video does not expose captions.", availableLanguages: [...new Set(tracks.map(item => item.languageCode).filter(Boolean))] });
    const captions = await fetch(`${track.baseUrl}${track.baseUrl.includes("?") ? "&" : "?"}fmt=json3`, { signal: AbortSignal.timeout(10000) });
    if (!captions.ok) throw new Error();
    const data = await captions.json();
    const cues: CaptionCue[] = (data.events ?? []).map((event: any) => ({ start: Number(event.tStartMs ?? 0) / 1000, duration: Number(event.dDurationMs ?? 0) / 1000, text: cueText((event.segs ?? []).map((segment: any) => segment.utf8 ?? "").join("")) })).filter((cue: CaptionCue) => cue.text && !/^\[(music|musique)\]$/i.test(cue.text));
    const transcript = makeTranscript(cues);
    const trackName = track.name?.simpleText ?? track.name?.runs?.map(run => run.text ?? "").join("") ?? track.languageCode;
    return Response.json({ transcript: transcript || null, cues, durationSeconds, language: track.languageCode, source: track.kind === "asr" ? "automatic" : "manual", trackName });
  } catch {
    return Response.json({ transcript: null, reason: "Captions could not be retrieved. Paste the French transcript to continue." });
  }
}
