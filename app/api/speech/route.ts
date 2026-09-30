const VOICE = "marin";
const VOICE_VERSION = "multilingual-v2";
const CACHE_SECONDS = 60 * 60 * 24 * 30;
const ALLOWED_VOICES = new Set(["marin", "cedar", "coral", "onyx"]);

type EdgeCacheStorage = CacheStorage & { default?: Cache };

async function speechCacheKey(request: Request, text: string, voice: string, language: string) {
  const source = new TextEncoder().encode(`${VOICE_VERSION}\n${language}\n${voice}\n${text}`);
  const digest = await crypto.subtle.digest("SHA-256", source);
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  return new Request(new URL(`/api/speech/cache/${hash}`, request.url), { method: "GET" });
}

export async function POST(request: Request) {
  const denied = guardAiRequest(request);
  if (denied) return denied;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ error: "AI voice is not configured." }, { status: 503 });
  const { text, voice: requestedVoice, language: requestedLanguage } = await request.json() as { text?: string; voice?: string; language?: string };
  if (!text?.trim() || text.length > 3000) return Response.json({ error: "Invalid speech text." }, { status: 400 });
  const normalizedText = text.trim();
  const voice = requestedVoice && ALLOWED_VOICES.has(requestedVoice) ? requestedVoice : VOICE;
  const language=requestedLanguage==="sv"?"Swedish":"French";
  const cacheKey = await speechCacheKey(request, normalizedText, voice, language);
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
    body: JSON.stringify({ model: "gpt-4o-mini-tts", voice, input: normalizedText, instructions: `Speak natural contemporary ${language} with a native ${language} accent. ${language==="Swedish"?"Clear, unhurried A1 beginner-friendly pacing, without unnatural syllable breaks.":"Warm, realistic conversational pacing."} No English accent or theatrical delivery.`, response_format: "mp3" }),
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
