const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export async function POST(request: Request) {
  const { videoId } = await request.json().catch(() => ({ videoId: "" }));
  if (!VIDEO_ID.test(videoId)) return Response.json({ error: "Invalid YouTube video." }, { status: 400 });
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const watch = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    clearTimeout(timeout);
    if (!watch.ok) throw new Error();
    const html = await watch.text();
    const marker = "ytInitialPlayerResponse = ";
    const start = html.indexOf(marker);
    if (start < 0) throw new Error();
    const jsonStart = start + marker.length;
    const jsonEnd = html.indexOf(";</script>", jsonStart);
    if (jsonEnd < 0) throw new Error();
    const player = JSON.parse(html.slice(jsonStart, jsonEnd));
    const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    const track = tracks.find((item: any) => item.languageCode?.startsWith("fr")) ?? tracks[0];
    if (!track?.baseUrl) return Response.json({ transcript: null, reason: "No public captions are available." });
    const captions = await fetch(`${track.baseUrl}&fmt=json3`, { signal: AbortSignal.timeout(8000) });
    if (!captions.ok) throw new Error();
    const data = await captions.json();
    const transcript = (data.events ?? []).flatMap((event: any) => event.segs ?? []).map((segment: any) => segment.utf8 ?? "").join(" ").replace(/\s+/g, " ").trim();
    return Response.json({ transcript: transcript || null, language: track.languageCode, generated: track.kind === "asr" });
  } catch {
    return Response.json({ transcript: null, reason: "Captions could not be retrieved. Paste a transcript to continue." });
  }
}
