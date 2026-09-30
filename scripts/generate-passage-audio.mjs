import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { passages } from "../content/passages.ts";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const keyLine = envText.split(/\r?\n/).find(line => /^\s*OPENAI_API_KEY\s*=/.test(line));
const apiKey = process.env.OPENAI_API_KEY || keyLine?.replace(/^\s*OPENAI_API_KEY\s*=\s*/, "").trim().replace(/^(["'])(.*)\1$/, "$2");
if (!apiKey) throw new Error("OPENAI_API_KEY is not configured in .env.local");

const outputDir = new URL("../public/audio/passages/", import.meta.url);
await mkdir(outputDir, { recursive: true });

const selected = process.argv.slice(2);
for (const passage of passages.filter(item => item.audioFile && (!selected.length || selected.includes(item.id)))) {
  const target = new URL(`${passage.id}.mp3`, outputDir);
  try {
    const existing = await stat(target);
    if (existing.size > 1000) {
      console.log(`skip ${passage.id} (${existing.size} bytes)`);
      continue;
    }
  } catch {}

  const clips = [];
  for (const [index, turn] of (passage.dialogue || [{text:passage.text,voice:passage.speaker.voice}]).entries()) {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: turn.voice,
      input: turn.text,
      instructions: `Speak natural contemporary ${passage.language==="sv"?"Swedish with a native Swedish accent":"French with a native metropolitan French accent"}. ${passage.poem?"Recite this poem thoughtfully, preserving line rhythm without singing.":"Use conversational intonation."} This is ${passage.topic} material for a ${passage.level} listener. Warm, unforced delivery; articulate clearly without exaggerated pauses. Read only the supplied words.`,
      response_format: "mp3",
    }),
  });
  if (!response.ok) throw new Error(`Audio generation failed for ${passage.id}: ${response.status}`);
  const audio = new Uint8Array(await response.arrayBuffer());
  clips.push(audio);
  console.log(`generated ${passage.id} turn ${index+1}`);
  }
  // Decode/re-encode concatenated MP3 frames: produces one seekable stream with
  // a correct duration instead of multiple competing MP3 duration headers.
  const encoded=spawnSync("ffmpeg",["-hide_banner","-loglevel","error","-f","mp3","-i","pipe:0","-codec:a","libmp3lame","-q:a","2","-f","mp3","pipe:1"],{input:Buffer.concat(clips),maxBuffer:20*1024*1024});
  if(encoded.status!==0)throw Error(`Could not assemble ${passage.id}`);
  await writeFile(target,encoded.stdout);
  console.log(`wrote ${passage.id} (${encoded.stdout.length} bytes)`);
}
