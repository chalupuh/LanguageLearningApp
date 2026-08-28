"use client";
import { useEffect, useRef, useState } from "react";
import { validDraft, validDraftSource } from "../lib/session-drafts";
import "./session-recovery.css";

type Draft = { version: number; title: string; step: number; done: boolean; [key: string]: any };
type Saved = { source: string; state: Draft; revision: number; updatedAt: number };
const stages = ["First listen", "Decode", "Shadow", "Retell"];
const cacheKey = (user: string, source: string) => `a-loreille-draft:${user}:${source}`;

export function useSessionDraft(source: string | null, state: Draft, restore: (draft: Draft | null) => void) {
  const [readySource, setReadySource] = useState<string | null>(null), [status, setStatus] = useState("Restoring your session…"), [reload, setReload] = useState(0);
  const [loadError, setLoadError] = useState("");
  const restoreRef = useRef(restore); restoreRef.current = restore;
  const current = useRef<{ source: string; user: string; revision: number; latest: Draft; sent: string; inFlight: string; saving: boolean; conflict: boolean; closed: boolean; flush: () => Promise<void> } | null>(null);
  const serialized = JSON.stringify(state);
  useEffect(() => {
    setReadySource(null);
    setLoadError("");
    if (!source) return;
    let cancelled = false;
    const controller = new AbortController();
    const loadTimer = window.setTimeout(() => controller.abort(), 12000);
    setStatus("Restoring your session…");
    fetch("/api/session-drafts?source=" + encodeURIComponent(source), { cache: "no-store", signal: controller.signal }).then(async r => {
      if (!r.ok) {
        const message = r.status === 401 || r.status === 403 ? "Your sign-in needs refreshing. Return to Today and reload the app." : "Saved-session storage is unavailable. Retry loading or return to Today. Your saved work has not been replaced.";
        throw Error(message);
      }
      const data = await r.json();
      if (!data || typeof data.userId !== "string" || !Array.isArray(data.drafts)) throw Error("The saved session could not be read. Retry loading or return to Today.");
      return data;
    }).then(data => {
      window.clearTimeout(loadTimer);
      if (cancelled) return;
      const remote: Saved | undefined = data.drafts[0];
      let draft = remote?.state ?? null;
      let local: { state: Draft; revision: number; inFlight?: string } | null = null;
      try { local = JSON.parse(localStorage.getItem(cacheKey(data.userId, source)) || "null"); } catch {}
      // Recover unsynced edits only when they are based on this exact server version.
      const recoverable = local && validDraft(local.state) && (local.revision === (remote?.revision ?? 0) || (remote && local.revision + 1 === remote.revision && local.inFlight === JSON.stringify(remote.state)));
      if (recoverable) draft = local!.state;
      else if (local && validDraft(local.state) && JSON.stringify(local.state) !== JSON.stringify(remote?.state)) {
        try { localStorage.setItem(cacheKey(data.userId, source) + ":conflict-backup", JSON.stringify(local)); } catch {}
      }
      const entry = { source, user: data.userId, revision: remote?.revision ?? 0, latest: draft as Draft, sent: JSON.stringify(remote?.state ?? null), inFlight: "", saving: false, conflict: false, closed: false, flush: async () => {} };
      const cache = () => { try { localStorage.setItem(cacheKey(entry.user, source), JSON.stringify({ state: entry.latest, revision: entry.revision, inFlight: entry.inFlight })); return true; } catch { return false; } };
      entry.flush = async () => {
        if (!entry.latest || entry.saving || entry.conflict || JSON.stringify(entry.latest) === entry.sent) return;
        const snapshot = JSON.stringify(entry.latest);
        if (!validDraft(entry.latest)) { if (!entry.closed) setStatus("Draft too large to sync. Shorten the pasted transcript."); return; }
        entry.saving = true; entry.inFlight = snapshot; cache();
        try {
          const body = JSON.stringify({ source, state: entry.latest, revision: entry.revision });
          const r = await fetch("/api/session-drafts", { method: "PUT", headers: { "Content-Type": "application/json" }, body, keepalive: new TextEncoder().encode(body).length < 60000 });
          const result = await r.json();
          if (!r.ok) { entry.conflict = r.status === 409; throw Error(result.error || "Waiting to sync"); }
          entry.revision = result.revision; entry.sent = snapshot; entry.inFlight = ""; cache();
          if (!entry.closed) setStatus(JSON.stringify(entry.latest) === snapshot ? "Saved · available on your other devices" : "Saving…");
        } catch (error) { if (!entry.closed) setStatus(entry.conflict ? "Newer work exists on another tab or device. Reload saved session." : cache() ? "Saved on this device · waiting to sync" : "Not saved. Keep this page open and retry."); }
        finally { entry.saving = false; }
        if (entry.closed && !entry.conflict && entry.sent === snapshot && JSON.stringify(entry.latest) !== snapshot) void entry.flush();
      };
      current.current = entry;
      restoreRef.current(draft);
      setReadySource(source);
      setStatus("Session restored · audio paused");
    }).catch(error => { if (!cancelled) { const message = controller.signal.aborted ? "Loading took too long. Retry loading or return to Today. Your saved work has not been replaced." : error instanceof Error ? error.message : "Could not load your session."; setLoadError(message); setStatus(message); } }).finally(() => window.clearTimeout(loadTimer));
    const flush = () => { void current.current?.flush(); };
    const timer = window.setInterval(flush, 3000);
    window.addEventListener("pagehide", flush); window.addEventListener("online", flush); document.addEventListener("visibilitychange", flush);
    return () => { cancelled = true; controller.abort(); window.clearTimeout(loadTimer); window.clearInterval(timer); window.removeEventListener("pagehide", flush); window.removeEventListener("online", flush); document.removeEventListener("visibilitychange", flush); const entry = current.current; if (entry?.source === source) { entry.closed = true; void entry.flush(); current.current = null; } };
  }, [source, reload]);
  useEffect(() => {
    const entry = current.current;
    if (!source || readySource !== source || entry?.source !== source) return;
    entry.latest = JSON.parse(serialized);
    if (serialized === entry.sent) return;
    try { localStorage.setItem(cacheKey(entry.user, source), JSON.stringify({ state: entry.latest, revision: entry.revision, inFlight: entry.inFlight })); setStatus(entry.conflict ? "Newer work exists on another tab or device. Reload saved session." : "Saved on this device · syncing…"); }
    catch { setStatus("Saving… keep this page open until saved."); }
    const timer = window.setTimeout(() => void entry.flush(), 450);
    return () => window.clearTimeout(timer);
  }, [source, readySource, serialized]);
  return { ready: Boolean(source && source === readySource), status, loadError,
    retry: () => { if (!current.current) setReload(n => n + 1); else void current.current.flush(); },
    reload: () => { if (window.confirm("Load the saved version? Unsynced edits in this tab will be replaced.")) { const entry = current.current; if (entry) { entry.conflict = true; try { localStorage.removeItem(cacheKey(entry.user, entry.source)); } catch {} } setReload(n => n + 1); } },
  };
}

export function SessionSaveStatus({ recovery, restart }: { recovery: ReturnType<typeof useSessionDraft>; restart: () => void }) {
  if (!recovery.ready) return null;
  return <div className="session-save"><span role="status">{recovery.status}</span><button onClick={recovery.retry}>Retry save</button><button onClick={recovery.reload}>Reload saved session</button><button onClick={() => { if (window.confirm("Start this session over? Its answers and playback position will be cleared. Earned XP is kept.")) restart(); }}>Start over</button></div>;
}

export function SessionRecoveryGate({ recovery, onLeave }: { recovery: ReturnType<typeof useSessionDraft>; onLeave: () => void }) {
  return <section className="session-loading" aria-label="Restore practice session">
    {recovery.loadError ? <><h2>We couldn’t open this session.</h2><p role="alert">{recovery.loadError}</p><button className="primary" onClick={recovery.retry}>Retry loading session</button></> : <p role="status">Restoring your saved passage…</p>}
    <button className="secondary" onClick={onLeave}>Return to Today</button>
  </section>;
}

export function ContinueSessions({ onContinue }: { onContinue: (source: string) => void }) {
  const [drafts, setDrafts] = useState<Saved[]>([]), [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = () => fetch("/api/session-drafts", { cache: "no-store" }).then(async r => { if (!r.ok) throw Error(); return r.json(); }).then(data => { if (!active) return; const rows: Saved[] = data.drafts; try { const prefix = `a-loreille-draft:${data.userId}:`; for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i)!; if (!key.startsWith(prefix)) continue; const source = key.slice(prefix.length), local = JSON.parse(localStorage.getItem(key)!); if (!validDraftSource(source) || !validDraft(local?.state)) continue; const index = rows.findIndex(r => r.source === source); if (local.revision === (rows[index]?.revision ?? 0)) { const row = { source, state: local.state, revision: local.revision, updatedAt: rows[index]?.updatedAt ?? Date.now() }; if (index < 0) rows.unshift(row); else rows[index] = row; } } } catch {} setDrafts(rows.filter(r => !r.state.done)); setError(""); }).catch(() => { if (active) setError("Saved sessions could not be loaded yet."); });
    void load(); const timer = window.setInterval(load, 5000); window.addEventListener("focus", load);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", load); };
  }, []);
  if (!drafts.length && !error) return null;
  return <section className="continue-sessions" aria-label="Continue your session"><p className="eyebrow">Right where you left off</p><h2>Continue your session</h2>{error && <p role="status">{error}</p>}{drafts.slice(0, 6).map(draft => <button key={draft.source} onClick={() => onContinue(draft.source)}><strong>{draft.state.title}</strong><span>{stages[draft.state.step]} · Step {draft.state.step + 1} of 4 →</span></button>)}</section>;
}
