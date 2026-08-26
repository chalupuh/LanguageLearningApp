import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the French listening coach", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /À l’Oreille/);
  assert.match(html, /French that finally clicks/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("keeps the learning loop and AI routes honest", async () => {
  const [page, speech, feedback, comprehension, guard, appAuth, sessionRoute, feedbackInbox, progressRoute, transcriptRoute, schema, hosting] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/api/speech/route.ts", root), "utf8"),
    readFile(new URL("app/api/feedback/route.ts", root), "utf8"),
    readFile(new URL("app/api/comprehension/route.ts", root), "utf8"),
    readFile(new URL("app/api/ai-guard.ts", root), "utf8"),
    readFile(new URL("app/api/app-auth.ts", root), "utf8"),
    readFile(new URL("app/api/session/route.ts", root), "utf8"),
    readFile(new URL("app/api/feedback-inbox/route.ts", root), "utf8"),
    readFile(new URL("app/api/progress/route.ts", root), "utf8"),
    readFile(new URL("app/api/youtube-transcript/route.ts", root), "utf8"),
    readFile(new URL("db/schema.ts", root), "utf8"),
    readFile(new URL(".openai/hosting.json", root), "utf8"),
  ]);
  assert.match(page, /Check my understanding/);
  assert.match(page, /Reveal full transcript/);
  assert.match(page, /without pretending to score individual sounds/);
  assert.match(page, /Bring your own French/);
  assert.match(page, /Today’s review/);
  assert.match(page, /Your earprint/);
  assert.match(page, /Again.*Hard.*Good.*Easy/s);
  assert.match(page, /\[\"today\",\"library\",\"studio\",\"about\"\]/);
  assert.doesNotMatch(page, /\[\"home\",\"practice\",\"library\",\"studio\",\"progress\"\]/);
  assert.match(page, /function SelectionSaver/);
  assert.match(page, /Save phrase/);
  assert.match(page, /Already in your notebook/);
  assert.match(page, /p\.text\.includes\(phrase\)/);
  assert.match(page, /function PhraseReviewDeck/);
  assert.match(page, /function SpeakingHistory/);
  assert.match(page, /Export backup/);
  assert.match(page, /function AboutView/);
  assert.match(page, /function StudioView/);
  assert.match(page, /function FeedbackNotebook/);
  assert.match(page, /Nikki’s notebook/);
  assert.match(page, /feedbackNotes/);
  assert.match(page, /Mark handled/);
  assert.match(page, /function AccessGate/);
  assert.match(page, /Continue with ChatGPT/);
  assert.match(appAuth, /ALLOWED_USER_EMAILS/);
  assert.match(appAuth, /status: 403/);
  assert.match(sessionRoute, /authorized: true/);
  assert.match(page, /Studio shadowing/);
  assert.match(transcriptRoute, /captionTracks/);
  assert.match(transcriptRoute, /No public captions are available/);
  assert.match(appAuth, /oai-authenticated-user-id/);
  assert.match(progressRoute, /onConflictDoUpdate/);
  assert.match(schema, /learner_progress/);
  assert.match(hosting, /\"d1\": \"DB\"/);
  assert.match(page, /aria-pressed/);
  assert.match(speech, /X-Voice-Cache/);
  assert.match(feedback, /8 \* 1024 \* 1024/);
  assert.match(feedback, /word_accuracy/);
  assert.match(feedback, /liaison_practice/);
  assert.match(feedback, /replay_drill/);
  assert.match(page, /French reference · follow along/);
  assert.match(page, /measureSpeechTiming/);
  assert.match(page, /Liaison to practise/);
  assert.match(page, /function DailyReviewCard/);
  assert.match(page, /Review complete/);
  assert.match(page, /Return to Today/);
  assert.match(page, /review-confirmation/);
  assert.match(feedbackInbox, /OWNER_EMAIL/);
  assert.match(feedbackInbox, /submittedBy/);
  assert.match(comprehension, /0-100 percentage scale/);
  assert.match(guard, /Sign in to use AI coaching/);
});

test("ships a complete audio-backed B1 starter library", async () => {
  const catalog = await readFile(new URL("content/passages.ts", root), "utf8");
  const audioFiles = [...catalog.matchAll(/audioFile: "(\/audio\/passages\/[^"]+\.mp3)"/g)].map(
    ([, file]) => file,
  );

  assert.equal(audioFiles.length, 8);
  assert.equal(new Set(audioFiles).size, 8);
  assert.match(catalog, /name: "Léa"/);
  assert.match(catalog, /name: "Thomas"/);
  assert.match(catalog, /name: "Inès"/);
  assert.match(catalog, /name: "Malik"/);

  for (const audioFile of audioFiles) {
    const file = new URL(`public${audioFile}`, root);
    const details = await stat(file);
    assert.ok(details.size > 100_000, `${audioFile} should contain generated speech`);
  }
});

test("allows only invited ChatGPT accounts", async () => {
  const previousAllowlist = process.env.ALLOWED_USER_EMAILS;
  process.env.ALLOWED_USER_EMAILS = "owner@example.com,learner@example.com";
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("auth-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const request = (email) => new Request("https://example.com/api/session", { headers: email ? { "oai-authenticated-user-id": `user-${email}`, "oai-authenticated-user-email": email } : {} });

  assert.equal((await worker.fetch(request(null), env, ctx)).status, 401);
  assert.equal((await worker.fetch(request("stranger@example.com"), env, ctx)).status, 403);
  assert.equal((await worker.fetch(request("learner@example.com"), env, ctx)).status, 200);
  if (previousAllowlist === undefined) delete process.env.ALLOWED_USER_EMAILS;
  else process.env.ALLOWED_USER_EMAILS = previousAllowlist;
});
