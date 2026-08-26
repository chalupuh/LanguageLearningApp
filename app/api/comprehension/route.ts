import { guardAiRequest } from "../ai-guard";

export async function POST(request: Request) {
  const denied = guardAiRequest(request);
  if (denied) return denied;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ error: "AI coaching is not configured." }, { status: 503 });

  const body = await request.json() as { summary?: string; passage?: string; level?: string };
  const summary = body.summary?.trim() ?? "";
  const passage = body.passage?.trim() ?? "";
  if (!summary || summary.length > 1000 || !passage || passage.length > 4000) {
    return Response.json({ error: "A short summary and passage are required." }, { status: 400 });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      input: `Reference French passage:\n${passage}\n\nLearner's first-listen summary:\n${summary}`,
      instructions: `Assess listening comprehension for a learner around ${body.level || "B1-B2"}. Judge meaning, not French grammar. Score on a 0-100 percentage scale: 90-100 captures the situation, key details, and outcome; 70-89 captures the main situation and outcome; 40-69 captures only part of the situation; below 40 substantially misunderstands it. Be warm, specific, and concise. Never reveal the full transcript in the feedback and never invent an action not present in the reference.`,
      text: { format: { type: "json_schema", name: "comprehension_feedback", strict: true, schema: {
        type: "object", additionalProperties: false,
        properties: {
          score: { type: "integer", minimum: 0, maximum: 100 },
          understood: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
          missed: { type: "array", items: { type: "string" }, maxItems: 3 },
          misconception: { type: ["string", "null"] },
          listening_target: { type: "string" },
        },
        required: ["score", "understood", "missed", "misconception", "listening_target"],
      } } },
    }),
  });
  if (!response.ok) return Response.json({ error: "Comprehension feedback is unavailable." }, { status: response.status });
  const result = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const output = result.output?.flatMap(item => item.content || []).find(item => item.type === "output_text")?.text;
  if (!output) return Response.json({ error: "Comprehension feedback was empty." }, { status: 502 });
  return Response.json(JSON.parse(output));
}
