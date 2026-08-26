import { guardAiRequest } from "../ai-guard";

export async function POST(request: Request) {
  const denied = guardAiRequest(request);
  if (denied) return denied;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ error: "AI feedback is not configured." }, { status: 503 });
  const form = await request.formData();
  const audio = form.get("audio");
  const level = String(form.get("level") || "B1");
  const task = String(form.get("task") || "spoken retell");
  if (!(audio instanceof File)) return Response.json({ error: "An audio recording is required." }, { status: 400 });
  if (audio.size > 8 * 1024 * 1024) return Response.json({ error: "Keep recordings under 8 MB." }, { status: 413 });

  const transcriptionForm = new FormData();
  transcriptionForm.append("file", audio, "recording.webm");
  transcriptionForm.append("model", "gpt-transcribe");
  transcriptionForm.append("language", "fr");
  const transcriptionResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: transcriptionForm });
  if (!transcriptionResponse.ok) return Response.json({ error: "The recording could not be transcribed." }, { status: transcriptionResponse.status });
  const transcription = await transcriptionResponse.json() as { text: string };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      input: `You are a rigorous but encouraging French coach. Assess this ${task} by a learner targeting CEFR ${level}. Transcript: ${transcription.text}`,
      instructions: "Focus on communicative fluency, grammar, natural phrasing, and useful next actions. Do not infer pronunciation details that a text transcript cannot prove. Return concise JSON matching the schema.",
      text: { format: { type: "json_schema", name: "learner_feedback", strict: true, schema: { type: "object", additionalProperties: false, properties: { cefr_estimate: { type: "string" }, score: { type: "integer", minimum: 0, maximum: 100 }, summary: { type: "string" }, strengths: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 }, corrections: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 }, next_drill: { type: "string" }, xp_earned: { type: "integer", minimum: 0, maximum: 50 } }, required: ["cefr_estimate", "score", "summary", "strengths", "corrections", "next_drill", "xp_earned"] } } },
    }),
  });
  if (!response.ok) return Response.json({ error: "AI feedback could not be generated." }, { status: response.status });
  const result = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const outputText = result.output?.flatMap(item => item.content || []).find(item => item.type === "output_text")?.text;
  if (!outputText) return Response.json({ error: "AI feedback was empty." }, { status: 502 });
  return Response.json({ transcript: transcription.text, feedback: JSON.parse(outputText) });
}
