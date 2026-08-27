import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("request status survives progress saves and acknowledgement is user/version scoped", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(await readFile(new URL("drizzle/0001_secret_human_cannonball.sql", root), "utf8"));
    const upsert = db.prepare("INSERT INTO feedback_resolutions VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id,note_id) DO UPDATE SET handled=excluded.handled,message=excluded.message,updated_at=excluded.updated_at,seen_at=NULL WHERE feedback_resolutions.handled != excluded.handled");
    upsert.run("nikki", "shadow", 1, "Show transcript", "Implemented", 100, null);
    const ack = db.prepare("UPDATE feedback_resolutions SET seen_at=? WHERE user_id=? AND note_id=? AND updated_at=?");
    assert.equal(ack.run(150, "other", "shadow", 100).changes, 0);
    assert.equal(ack.run(150, "nikki", "shadow", 99).changes, 0);
    assert.equal(ack.run(150, "nikki", "shadow", 100).changes, 1);
    upsert.run("nikki", "shadow", 1, "Show transcript", "Implemented", 200, null);
    assert.equal(db.prepare("SELECT seen_at FROM feedback_resolutions").get().seen_at, 150);
    upsert.run("nikki", "shadow", 0, "Show transcript", "Reopened", 300, null);
    upsert.run("nikki", "shadow", 1, "Show transcript", "Fixed again", 400, null);
    assert.equal(ack.run(500, "nikki", "shadow", 100).changes, 0);
    assert.equal(db.prepare("SELECT seen_at FROM feedback_resolutions").get().seen_at, null);
  } finally { db.close(); }
  const route = await readFile(new URL("app/api/feedback-updates/route.ts", root), "utf8");
  assert.match(route, /eq\(feedbackResolutions.userId, auth.identity.userId\)/);
  assert.match(route, /eq\(feedbackResolutions.updatedAt, body.updatedAt\)/);
});

test("Paris progress uses bounded practice milestones, not a B2 proficiency score", async () => {
  const ts = await import("typescript");
  const source = await readFile(new URL("app/progress-journey.tsx", root), "utf8");
  const calculation = source.slice(source.indexOf("const PRACTICE_GOAL"), source.indexOf("export default"));
  const js = ts.transpileModule(calculation, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const { practiceMilestone } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
  assert.deepEqual(practiceMilestone(-1), { total: 0, percent: 0, remaining: 5000 });
  assert.equal(practiceMilestone(2500).percent, 50);
  assert.equal(practiceMilestone(6000).percent, 100);
  assert.equal(practiceMilestone(Infinity).total, 0);
  assert.match(source, /not a fluency estimate/);
  assert.match(source, /🥐.*☕.*🧸/);
  assert.match(await readFile(new URL("app/progress-journey.css", root), "utf8"), /prefers-reduced-motion/);
});

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
  assert.match(page, /\[\"today\",\"library\",\"studio\",\"progress\",\"about\"\]/);
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
  assert.match(page, /function ClipTimeline/);
  assert.match(page, /Selected passage/);
  assert.match(page, /Move selected passage/);
  assert.match(page, /Drag the pink passage to move it/);
  assert.match(page, /getDuration/);
  assert.match(page, /onStateChange:report/);
  assert.match(page, /function FeedbackNotebook/);
  assert.match(page, /Nikki’s notebook/);
  assert.match(page, /feedbackNotes/);
  assert.match(page, /Awaiting review/);
  assert.match(page, /function AccessGate/);
  assert.match(page, /Continue with ChatGPT/);
  assert.match(appAuth, /ALLOWED_USER_EMAILS/);
  assert.match(appAuth, /status: 403/);
  assert.match(sessionRoute, /authorized: true/);
  assert.match(page, /Studio shadowing/);
  assert.match(transcriptRoute, /captionTracks/);
  assert.match(transcriptRoute, /does not expose captions/);
  assert.match(transcriptRoute, /fmt=json3/);
  assert.match(transcriptRoute, /videoDetails/);
  assert.match(transcriptRoute, /videoDetails\?\.videoId === expectedVideoId/);
  assert.match(transcriptRoute, /"automatic" : "manual"/);
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
  assert.match(page, /function NewUpdates/);
  assert.match(page, /What’s new at À l’Oreille/);
  assert.match(page, /lastSeenUpdateId/);
  assert.match(page, /You’ll only see this again after the app gets another update/);
  assert.match(page, /function DailyReviewCard/);
  assert.match(page, /Review complete/);
  assert.match(page, /Return to Today/);
  assert.match(page, /review-confirmation/);
  assert.match(feedbackInbox, /OWNER_EMAIL/);
  assert.match(feedbackInbox, /collectFeedbackNotes/);
  assert.match(comprehension, /0-100 percentage scale/);
  assert.match(guard, /Sign in to use AI coaching/);
});

test("extracts full feedback from large learner records without modifying progress", async () => {
  const ts = await import("typescript");
  const source = await readFile(new URL("lib/feedback-notes.ts", root), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const { collectFeedbackNotes } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
  const noteText = "Please make shadow playback easier.\n".repeat(12);
  const records = [{ email: "learner@example.com", state: JSON.stringify({ speakingAttempts: [{ transcript: "x".repeat(20000) }], feedbackNotes: [
    { id: "old", createdAt: "2026-08-26T10:00:00Z", kind: "idea", text: "Show a transcript", resolved: true },
    { id: "new", createdAt: "2026-08-27T10:00:00Z", kind: "bug", text: noteText, resolved: false },
  ] }) }];
  const original = JSON.stringify(records);
  const result = collectFeedbackNotes(records);
  assert.equal(result.unreadableRecords, 0);
  assert.equal(result.notes.length, 2);
  assert.equal(result.notes[0].text, noteText);
  assert.equal(result.notes[0].submittedBy, "learner@example.com");
  assert.equal(result.notes[1].resolved, true);
  assert.equal(JSON.stringify(records), original);
  assert.equal(collectFeedbackNotes([{ email: null, state: "broken" }]).unreadableRecords, 1);
});

test("feedback inbox rejects non-owners and exposes owner navigation only to the owner", async () => {
  const previous = { allowed: process.env.ALLOWED_USER_EMAILS, owner: process.env.OWNER_EMAIL };
  process.env.ALLOWED_USER_EMAILS = "owner@example.com,learner@example.com";
  process.env.OWNER_EMAIL = "owner@example.com";
  try {
    const { default: worker } = await import(new URL("../dist/server/index.js", import.meta.url));
    const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
    const ctx = { waitUntil() {}, passThroughOnException() {} };
    const request = (path, email) => new Request(`https://example.com${path}`, { headers: email ? { "oai-authenticated-user-id": `test-${email}`, "oai-authenticated-user-email": email } : {} });
    assert.equal((await worker.fetch(request("/api/feedback-inbox", null), env, ctx)).status, 401);
    const denied = await worker.fetch(request("/api/feedback-inbox", "learner@example.com"), env, ctx);
    assert.equal(denied.status, 403);
    assert.match(denied.headers.get("cache-control"), /no-store/);
    assert.equal((await denied.json()).notes, undefined);
    const patchRequest = new Request("https://example.com/api/feedback-inbox", { method: "PATCH", headers: { "oai-authenticated-user-id": "learner", "oai-authenticated-user-email": "learner@example.com", "Content-Type": "application/json" }, body: JSON.stringify({ handled: true }) });
    assert.equal((await worker.fetch(patchRequest, env, ctx)).status, 403);
    assert.equal((await worker.fetch(request("/api/feedback-updates", null), env, ctx)).status, 401);
    const crossOrigin = new Request("https://example.com/api/feedback-inbox", { method: "PATCH", headers: { "oai-authenticated-user-id": "owner", "oai-authenticated-user-email": "owner@example.com", Origin: "https://other.example" }, body: "{}" });
    assert.equal((await worker.fetch(crossOrigin, env, ctx)).status, 403);
    const owner = await worker.fetch(request("/api/session", "owner@example.com"), env, ctx);
    assert.equal((await owner.json()).isOwner, true);
    const learner = await worker.fetch(request("/api/session", "learner@example.com"), env, ctx);
    assert.equal((await learner.json()).isOwner, false);
    process.env.OWNER_EMAIL = "";
    assert.equal((await worker.fetch(request("/api/feedback-inbox", "owner@example.com"), env, ctx)).status, 403);
    const page = await worker.fetch(request("/feedback", null), env, ctx);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Nikki’s feedback/);
    assert.match(html, /Opening the feedback notebook/);
    assert.doesNotMatch(html, /learner@example.com/);
  } finally {
    if (previous.allowed === undefined) delete process.env.ALLOWED_USER_EMAILS; else process.env.ALLOWED_USER_EMAILS = previous.allowed;
    if (previous.owner === undefined) delete process.env.OWNER_EMAIL; else process.env.OWNER_EMAIL = previous.owner;
  }
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
