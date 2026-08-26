const VOICE = "marin";
const VOICE_VERSION = "french-paris-v1";
const CACHE_SECONDS = 60 * 60 * 24 * 30;
const ALLOWED_VOICES = new Set(["marin", "cedar", "coral", "onyx"]);

type EdgeCacheStorage = CacheStorage & { default?: Cache };

async function speechCacheKey(request: Request, text: string, voice: string) {
  const source = new TextEncoder().encode(`${VOICE_VERSION}\n${voice}\n${text}`);
  const digest = await crypto.subtle.digest("SHA-256", source);
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  return new Request(new URL(`/api/speech/cache/${hash}`, request.url), { method: "GET" });
}

export async function POST(request: Request) {
  const denied = guardAiRequest(request);
  if (denied) return denied;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ error: "AI voice is not configured." }, { status: 503 });
  const { text, voice: requestedVoice } = await request.json() as { text?: string; voice?: string };
  if (!text?.trim() || text.length > 3000) return Response.json({ error: "Invalid speech text." }, { status: 400 });
  const normalizedText = text.trim();
  const voice = requestedVoice && ALLOWED_VOICES.has(requestedVoice) ? requestedVoice : VOICE;
  const cacheKey = await speechCacheKey(request, normalizedText, voice);
  const edgeCache = (globalThis.caches as EdgeCacheStorage | undefined)?.default;
  const cached = await edgeCache?.match(cacheKey).catch(() => undefined);
  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set("X-Voice-Cache", "HIT");
    return new Response(cached.body, { status: cached.status, headers });
  }
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini-tts", voice, input: normalizedText, instructions: "Speak in natural, contemporary conversational French. Warm, realistic pacing with clear meaning but no instructional or theatrical delivery.", response_format: "mp3" }),
  });
  if (!response.ok) return Response.json({ error: "The AI voice could not be generated." }, { status: response.status });
  const audio = await response.arrayBuffer();
  const generated = new Response(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": `public, max-age=86400, s-maxage=${CACHE_SECONDS}`,
      "X-Voice-Cache": "MISS",
    },
  });
  if (edgeCache) await edgeCache.put(cacheKey, generated.clone()).catch(() => undefined);
  return generated;
}
import { guardAiRequest } from "../ai-guard";
