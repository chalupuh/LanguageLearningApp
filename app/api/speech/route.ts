export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ error: "AI voice is not configured." }, { status: 503 });
  const { text } = await request.json() as { text?: string };
  if (!text?.trim() || text.length > 3000) return Response.json({ error: "Invalid speech text." }, { status: 400 });
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "marin", input: text, instructions: "Speak as a native French woman from Paris in her late twenties. Natural, conversational, warm, realistic pacing. Do not sound instructional or theatrical.", response_format: "mp3" }),
  });
  if (!response.ok) return Response.json({ error: "The AI voice could not be generated." }, { status: response.status });
  return new Response(response.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=86400" } });
}
