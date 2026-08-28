import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const root = new URL("../", import.meta.url);
const moduleUrl = source => "data:text/javascript;base64," + Buffer.from(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText).toString("base64");
const validation = await readFile(new URL("lib/session-drafts.ts", root), "utf8");
const { validDraft, validDraftSource } = await import(moduleUrl(validation));
const base = { version: 1, title: "Un café", step: 0, done: false, text: "", audioPosition: 0 };

test("draft API saves through real SQLite, enforces account ownership and rejects stale revisions", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  const { drizzle } = await import("drizzle-orm/d1");
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(await readFile(new URL("drizzle/0004_elite_wild_pack.sql", root), "utf8"));
  const previous = process.env.ALLOWED_USER_EMAILS;
  process.env.ALLOWED_USER_EMAILS = "nikki@example.com,owner@example.com";
  globalThis.__sessionDraftDb = drizzle({ prepare(sql) {
    let bindings = [];
    const statement = { bind(...values) { bindings = values; return statement; },
      async raw() { const stmt = sqlite.prepare(sql); stmt.setReturnArrays(true); return stmt.all(...bindings); },
      async all() { return { success: true, results: sqlite.prepare(sql).all(...bindings) }; },
      async run() { return { success: true, meta: { changes: sqlite.prepare(sql).run(...bindings).changes } }; },
    }; return statement;
  } });
  try {
    const auth = moduleUrl(await readFile(new URL("app/api/app-auth.ts", root), "utf8"));
    const schema = moduleUrl((await readFile(new URL("db/schema.ts", root), "utf8")).replace('"drizzle-orm/sqlite-core"', JSON.stringify(import.meta.resolve("drizzle-orm/sqlite-core"))));
    const db = moduleUrl("export const getDb = () => globalThis.__sessionDraftDb");
    let source = await readFile(new URL("app/api/session-drafts/route.ts", root), "utf8");
    for (const [specifier, url] of Object.entries({ "../app-auth": auth, "../../../lib/session-drafts": moduleUrl(validation), "../../../db": db, "../../../db/schema": schema, "drizzle-orm": import.meta.resolve("drizzle-orm") })) source = source.replaceAll(JSON.stringify(specifier), JSON.stringify(url));
    const { GET, PUT } = await import(moduleUrl(source));
    const request = (body, user = "nikki", origin = "https://app.test") => new Request("https://app.test/api/session-drafts", { method: body ? "PUT" : "GET", headers: { "oai-authenticated-user-id": user, "oai-authenticated-user-email": user + "@example.com", origin }, ...(body ? { body: JSON.stringify(body) } : {}) });
    assert.equal((await GET(new Request("https://app.test/api/session-drafts"))).status, 401);
    assert.equal((await GET(request(null, "outsider"))).status, 403);
    const body = { source: "library:cafe", state: base, revision: 0 };
    assert.equal((await PUT(request(body, "nikki", "https://evil.test"))).status, 403);
    assert.equal((await PUT(request({ ...body, revision: -1 }))).status, 400);
    assert.equal((await PUT(request(body))).status, 200);
    assert.equal((await PUT(request(body))).status, 409);
    assert.equal((await PUT(request({ ...body, state: { ...base, step: 3, text: "Retell" }, revision: 1 }))).status, 200);
    let response = await GET(request());
    assert.match(response.headers.get("cache-control"), /private, no-store/);
    assert.equal((await response.json()).drafts[0].state.step, 3);
    assert.equal((await (await GET(request(null, "owner"))).json()).drafts.length, 0);
    assert.equal((await PUT(request({ ...body, userId: "nikki" }, "owner"))).status, 200);
    assert.equal((await (await GET(request())).json()).drafts[0].state.text, "Retell");
  } finally {
    if (previous === undefined) delete process.env.ALLOWED_USER_EMAILS; else process.env.ALLOWED_USER_EMAILS = previous;
    delete globalThis.__sessionDraftDb; sqlite.close();
  }
});

test("draft contract accepts recoverable state and rejects invalid identities and oversized drafts", () => {
  assert.equal(validDraft(base), true);
  for (const source of ["library:cafe", "studio:Zpcrn1b6baQ"]) assert.equal(validDraftSource(source), true);
  for (const source of ["other:123", "studio:bad", "../nikki", "", null]) assert.equal(validDraftSource(source), false);
  for (const state of [null, [], { ...base, version: 2 }, { ...base, step: 4 }, { ...base, done: "yes" }, { ...base, transcript: "é".repeat(150000) }]) assert.equal(validDraft(state), false);
});

test("draft migration isolates users and compare-and-swap rejects stale writes", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(await readFile(new URL("drizzle/0004_elite_wild_pack.sql", root), "utf8"));
    const insert = db.prepare("INSERT INTO session_drafts VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING");
    insert.run("nikki", "library:cafe", JSON.stringify(base), 1, 1);
    insert.run("owner", "library:cafe", JSON.stringify({ ...base, text: "Other account" }), 1, 1);
    const update = db.prepare("UPDATE session_drafts SET state=?,revision=revision+1 WHERE user_id=? AND source=? AND revision=?");
    assert.equal(update.run(JSON.stringify({ ...base, step: 2 }), "nikki", "library:cafe", 1).changes, 1);
    assert.equal(update.run("stale", "nikki", "library:cafe", 1).changes, 0);
    assert.equal(db.prepare("SELECT revision FROM session_drafts WHERE user_id=?").get("owner").revision, 1);
  } finally { db.close(); }
});

test("session hook restores, autosaves, survives unmount and prevents stale-tab overwrite without XP calls", async () => {
  const savedGlobals = Object.fromEntries(["window", "document", "localStorage", "fetch", "__draftHooks"].map(key => [key, globalThis[key]]));
  const storage = new Map(), timers = new Map(), remote = new Map(), requests = [];
  let timerId = 0, cells = [], cursor = 0, effects = [], mounted = false, queued = false, source = "library:cafe", state = base, result, loadFailure = null;
  const enqueue = () => { if (!queued && mounted) { queued = true; queueMicrotask(() => { queued = false; if (mounted) render(); }); } };
  globalThis.__draftHooks = {
    useRef(value) { const i = cursor++; return cells[i] ??= { current: value }; },
    useState(initial) { const i = cursor++; cells[i] ??= { value: initial }; return [cells[i].value, value => { const next = typeof value === "function" ? value(cells[i].value) : value; if (!Object.is(next, cells[i].value)) { cells[i].value = next; enqueue(); } }]; },
    useEffect(fn, deps) { const i = cursor++, old = cells[i]; if (!old || deps.some((dep, j) => !Object.is(dep, old.deps[j]))) { effects.push(() => { old?.cleanup?.(); cells[i] = { deps, cleanup: fn() }; }); } },
  };
  const eventTarget = () => ({ addEventListener() {}, removeEventListener() {} });
  globalThis.window = { ...eventTarget(), setInterval(fn) { const id = ++timerId; timers.set(id, fn); return id; }, clearInterval(id) { timers.delete(id); }, setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); }, confirm: () => true };
  globalThis.document = eventTarget();
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url, options });
    if (!options.method && loadFailure === "unavailable") return Response.json({ error: "Database unavailable" }, { status: 503 });
    if (!options.method && loadFailure === "timeout") return new Promise((resolve, reject) => options.signal.addEventListener("abort", () => reject(new Error("Aborted")), { once: true }));
    const key = options.method ? JSON.parse(options.body).source : new URL(url, "https://app.test").searchParams.get("source");
    if (!options.method) return Response.json({ userId: "nikki", drafts: remote.has(key) ? [remote.get(key)] : [] });
    const body = JSON.parse(options.body), existing = remote.get(key);
    if ((existing?.revision ?? 0) !== body.revision) return Response.json({ error: "Newer draft" }, { status: 409 });
    remote.set(key, { source: key, state: body.state, revision: body.revision + 1 });
    return Response.json({ revision: body.revision + 1 });
  };
  let hook;
  const render = () => { cursor = 0; effects = []; result = hook(source, state, draft => { state = draft ?? base; }); const pending = effects; effects = []; pending.forEach(fn => fn()); };
  const settle = async () => { for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve)); };
  const flush = async () => { for (const fn of [...timers.values()]) fn(); await settle(); };
  const mount = async () => { cells = []; mounted = true; render(); await settle(); };
  const unmount = () => { mounted = false; cells.forEach(cell => cell?.cleanup?.()); };
  try {
    let code = await readFile(new URL("app/session-recovery.tsx", root), "utf8");
    code = code.slice(0, code.indexOf("export function SessionSaveStatus"));
    code = code.replace('import { useEffect, useRef, useState } from "react";', "const { useEffect, useRef, useState } = globalThis.__draftHooks;").replace('import { validDraft, validDraftSource } from "../lib/session-drafts";', validation.replaceAll("export ", "")).replace('import "./session-recovery.css";', "");
    hook = (await import(moduleUrl(code))).useSessionDraft;
    remote.set(source, { source, state: { ...base, step: 2, text: "Bonjour", audioPosition: 19 }, revision: 1 });
    await mount();
    assert.equal(result.ready, true);
    assert.equal(state.step, 2);
    assert.equal(state.audioPosition, 19);
    state = { ...state, text: "My updated answer", step: 3 }; render(); await settle();
    assert.equal(JSON.parse(storage.get("a-loreille-draft:nikki:library:cafe")).state.text, state.text);
    await flush();
    assert.equal(remote.get(source).state.text, "My updated answer");
    unmount(); state = base; await mount();
    assert.equal(state.step, 3);
    // Closing before the debounce must flush the final edit.
    state = { ...state, text: "Last keystroke" }; render(); await settle(); unmount(); await settle();
    assert.equal(remote.get(source).state.text, "Last keystroke");
    state = base; await mount();
    // A newer device wins over the old revision, even when this tab retries.
    remote.set(source, { ...remote.get(source), revision: remote.get(source).revision + 1, state: { ...base, text: "Newer device" } });
    state = { ...state, text: "Stale tab" }; render(); await settle(); await flush();
    assert.equal(remote.get(source).state.text, "Newer device");
    assert.match(result.status, /Newer work/);
    assert.ok(requests.every(request => request.url.startsWith("/api/session-drafts")));
    unmount();
    // A keepalive may reach the server even if the old page never receives its response.
    const prior = remote.get(source);
    storage.set("a-loreille-draft:nikki:library:cafe", JSON.stringify({ state: { ...prior.state, text: "Unsent final edit" }, revision: prior.revision - 1, inFlight: JSON.stringify(prior.state) }));
    state = base; await mount(); assert.equal(state.text, "Unsent final edit"); await flush();
    assert.equal(remote.get(source).state.text, "Unsent final edit");
    // Different passages keep separate answers.
    source = "library:marche"; state = base; render(); await settle(); assert.equal(state.text, "");
    unmount(); await settle();
    source = "library:cafe"; state = base; loadFailure = "unavailable";
    const savedBeforeFailure = JSON.stringify(remote.get(source));
    const writesBeforeFailure = requests.filter(r => r.options.method).length;
    await mount(); await flush();
    assert.equal(result.ready, false);
    assert.match(result.loadError, /storage is unavailable/);
    assert.equal(JSON.stringify(remote.get(source)), savedBeforeFailure);
    assert.equal(requests.filter(r => r.options.method).length, writesBeforeFailure);
    loadFailure = null; result.retry(); await settle();
    assert.equal(result.ready, true); assert.equal(result.loadError, "");
    assert.equal(state.text, "Unsent final edit");
    unmount(); state = base; loadFailure = "timeout"; await mount(); await flush();
    assert.equal(result.ready, false); assert.match(result.loadError, /took too long/);
    loadFailure = null; result.retry(); await settle(); assert.equal(result.ready, true);
  } finally {
    unmount();
    for (const [key, value] of Object.entries(savedGlobals)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
});
