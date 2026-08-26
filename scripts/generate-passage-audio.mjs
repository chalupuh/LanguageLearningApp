import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { passages } from "../content/passages.ts";

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const keyLine = envText.split(/\r?\n/).find(line => /^\s*OPENAI_API_KEY\s*=/.test(line));
const apiKey = keyLine?.replace(/^\s*OPENAI_API_KEY\s*=\s*/, "").trim();
if (!apiKey) throw new Error("OPENAI_API_KEY is not configured in .env.local");

const outputDir = new URL("../public/audio/passages/", import.meta.url);
await mkdir(outputDir, { recursive: true });

for (const passage of passages.filter(item => item.level === "B1" && item.audioFile)) {
  const target = new URL(`${passage.id}.mp3`, outputDir);
  try {
    const existing = await stat(target);
    if (existing.size > 1000) {
      console.log(`skip ${passage.id} (${existing.size} bytes)`);
      continue;
    }
  } catch {}

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: passage.speaker.voice,
      input: passage.text,
      instructions: `Speak as ${passage.speaker.name}, a ${passage.speaker.age}-year-old native French speaker living in ${passage.speaker.location}. Natural contemporary conversation, warm and unforced, with realistic pacing for a B1 listener. Do not sound instructional or theatrical.`,
      response_format: "mp3",
    }),
  });
  if (!response.ok) throw new Error(`Audio generation failed for ${passage.id}: ${response.status}`);
  const audio = new Uint8Array(await response.arrayBuffer());
  await writeFile(target, audio);
  console.log(`wrote ${passage.id} (${audio.length} bytes)`);
}
