import { guardAiRequest, fetchAi } from "../ai-guard";

export async function POST(request: Request) {
  const denied = await guardAiRequest(request);
  if (denied) return denied;
  try {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ error: "AI feedback is not configured." }, { status: 503 });
  const form = await request.formData();
  const audio = form.get("audio");
  const language=form.get("language")==="sv"?"sv":"fr";
  const level = String(form.get("level") || "B1");
  const task = String(form.get("task") || "spoken retell");
  const reference = String(form.get("reference") || "").slice(0, 3000);
  const timing = String(form.get("timing") || "").slice(0, 1000);
  if (!(audio instanceof File)) return Response.json({ error: "An audio recording is required." }, { status: 400 });
  if (audio.size > 8 * 1024 * 1024) return Response.json({ error: "Keep recordings under 8 MB." }, { status: 413 });

  const transcriptionForm = new FormData();
  transcriptionForm.append("file", audio, audio.type.includes("mp4") ? "recording.m4a" : audio.type.includes("ogg") ? "recording.ogg" : "recording.webm");
  transcriptionForm.append("model", "gpt-transcribe");
  transcriptionForm.append("language", language);
  const transcriptionResponse = await fetchAi("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: transcriptionForm });
  if (!transcriptionResponse.ok) return Response.json({ error: "The recording could not be transcribed." }, { status: transcriptionResponse.status });
  const transcription = await transcriptionResponse.json() as { text: string };

  const response = await fetchAi("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      input: `You are a rigorous but encouraging ${language==="sv"?"Swedish A1":"French"} coach. Assess this ${task} by a learner targeting CEFR ${level}.\nTranscript: ${transcription.text}\nReference text when available: ${reference || "No fixed reference; this is a free retell."}\nBrowser-measured timing: ${timing || "Unavailable."}`,
      instructions: (language==="sv"?"Give A1-friendly Swedish corrections with English explanations. Do not teach French liaison; use the liaison_practice field for Swedish word stress or vowel-length practice, without claiming sound-level diagnosis. ":"")+"Set cefr_estimate to \"Task feedback\"; do not infer a CEFR level from this short sample. Suggest at most one priority correction and allow none when the response works. Focus on communicative fluency, word accuracy against the reference when one exists, rhythm, pauses, natural phrasing, and useful next actions. Use timing measurements only as approximate signals. Identify one likely language-appropriate rhythm or linking opportunity from the reference or transcript, but explicitly phrase it as something to practise—not a sound-level error you proved. Do not claim to hear or score individual phonemes. Make replay_drill a short exact phrase plus a concrete listen-repeat instruction. Return concise JSON matching the schema.",
      text: { format: { type: "json_schema", name: "learner_feedback", strict: true, schema: { type: "object", additionalProperties: false, properties: { cefr_estimate: { type: "string" }, score: { type: "integer", minimum: 0, maximum: 100 }, summary: { type: "string" }, strengths: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 }, corrections: { type: "array", items: { type: "string" }, minItems: 0, maxItems: 3 }, word_accuracy: { type: "string" }, rhythm: { type: "string" }, pauses: { type: "string" }, liaison_practice: { type: "string" }, replay_drill: { type: "string" }, next_drill: { type: "string" }, xp_earned: { type: "integer", minimum: 0, maximum: 50 } }, required: ["cefr_estimate", "score", "summary", "strengths", "corrections", "word_accuracy", "rhythm", "pauses", "liaison_practice", "replay_drill", "next_drill", "xp_earned"] } } },
    }),
  });
  if (!response.ok) return Response.json({ error: "AI feedback could not be generated." }, { status: response.status });
  const result = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const outputText = result.output?.flatMap(item => item.content || []).find(item => item.type === "output_text")?.text;
  if (!outputText) return Response.json({ error: "AI feedback was empty." }, { status: 502 });
  return Response.json({ transcript: transcription.text, feedback: JSON.parse(outputText) });
  } catch { return Response.json({error:"Coaching could not finish. Your recording remains available here; please retry."},{status:502}); }
}
