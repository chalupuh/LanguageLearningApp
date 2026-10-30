"use client";
import { useEffect, useRef, useState } from "react";
import { validDraft, validDraftSource } from "../lib/session-drafts";
import "./session-recovery.css";

type Draft = { version: number; title: string; step: number; done: boolean; [key: string]: any };
type Saved = { source: string; state: Draft; revision: number; updatedAt: number };
const stages = ["First listen", "Listen closer", "Retell practice", "Retell"];
const cacheKey = (user: string, source: string) => `a-loreille-draft:${user}:${source}`;

export function useSessionDraft(source: string | null, state: Draft, restore: (draft: Draft | null) => void, language:"fr"|"sv"|"es"="fr") {
  const [readySource, setReadySource] = useState<string | null>(null), [status, setStatus] = useState("Restoring your session…"), [reload, setReload] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [conflict, setConflict] = useState<{local: Draft; remote: Draft | null} | null>(null);
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
    fetch("/api/session-drafts?source=" + encodeURIComponent(source)+(language==="fr"?"":"&language="+language), { cache: "no-store", signal: controller.signal }).then(async r => {
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
      let conflicted = false;
      let local: { state: Draft; revision: number; inFlight?: string; sent?: string } | null = null;
      try { local = JSON.parse(localStorage.getItem(cacheKey(data.userId, source)) || "null"); } catch {}
      // Recover unsynced edits only when they are based on this exact server version.
      const recoverable = local && validDraft(local.state) && (local.revision === (remote?.revision ?? 0) || (remote && local.revision + 1 === remote.revision && local.inFlight === JSON.stringify(remote.state)));
      if (recoverable) draft = local!.state;
      else if (local && validDraft(local.state) && local.sent !== JSON.stringify(local.state) && JSON.stringify(local.state) !== JSON.stringify(remote?.state)) {
        conflicted = true; draft = local.state; setConflict({local: local.state, remote: remote?.state ?? null});
        try { localStorage.setItem(cacheKey(data.userId, source) + ":conflict-backup:" + Date.now(), JSON.stringify(local)); } catch {}
      }
      const entry = { source, user: data.userId, revision: remote?.revision ?? 0, latest: draft as Draft, sent: JSON.stringify(remote?.state ?? null), inFlight: "", saving: false, conflict: conflicted, closed: false, flush: async () => {} };
      const cache = () => { try { localStorage.setItem(cacheKey(entry.user, source), JSON.stringify({ state: entry.latest, revision: entry.revision, inFlight: entry.inFlight, sent: entry.sent })); return true; } catch { return false; } };
      entry.flush = async () => {
        if (!entry.latest || entry.saving || entry.conflict || JSON.stringify(entry.latest) === entry.sent) return;
        const snapshot = JSON.stringify(entry.latest);
        if (!validDraft(entry.latest)) { if (!entry.closed) setStatus("Draft too large to sync. Shorten the pasted transcript."); return; }
        entry.saving = true; entry.inFlight = snapshot; cache();
        try {
          const body = JSON.stringify({ source, state: entry.latest, revision: entry.revision });
          const r = await fetch("/api/session-drafts"+(language==="fr"?"":"?language="+language), { method: "PUT", headers: { "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(15000), keepalive: new TextEncoder().encode(body).length < 60000 });
          const result = await r.json();
          if(r.status===409){
            const check=await fetch("/api/session-drafts?source="+encodeURIComponent(source)+(language==="fr"?"":"&language="+language),{cache:"no-store",signal:AbortSignal.timeout(12000)});
            if(!check.ok)throw Error("Could not check the saved session");const data=await check.json();const remote:Saved|undefined=data.drafts?.[0];
            if(data.userId!==entry.user||!remote||!validDraft(remote.state)||!Number.isSafeInteger(remote.revision))throw Error("Invalid saved session");
            // A timed-out request may already have committed. Reconcile it without
            // asking the learner to resolve two identical versions.
            if(JSON.stringify(remote.state)===snapshot){entry.revision=remote.revision;entry.sent=snapshot;entry.inFlight="";cache();if(!entry.closed)setStatus("Saved · available on your other devices");return;}
            entry.conflict=true;if(!entry.closed)setConflict({local:entry.latest,remote:remote.state});
          }
          if (!r.ok) throw Error(result.error || "Waiting to sync");
          if(!Number.isSafeInteger(result.revision)||result.revision<=entry.revision)throw Error("Invalid save revision");
          entry.revision = result.revision; entry.sent = snapshot; entry.inFlight = ""; cache();
          if (!entry.closed) setStatus(JSON.stringify(entry.latest) === snapshot ? "Saved · available on your other devices" : "Saving…");
        } catch (error) { if (!entry.closed) setStatus(entry.conflict ? "Newer work exists on another tab or device. Reload saved session." : cache() ? "Saved on this device · waiting to sync" : "Not saved. Keep this page open and retry."); }
        finally { entry.saving = false; }
        if (entry.closed && !entry.conflict && entry.sent === snapshot && JSON.stringify(entry.latest) !== snapshot) void entry.flush();
      };
      current.current = entry;
      restoreRef.current(draft);
      setReadySource(source);
      setStatus(conflicted?"Newer work exists on another device. Choose which version to keep.":"Session restored · audio paused");
    }).catch(error => { if (!cancelled) { const message = controller.signal.aborted ? "Loading took too long. Retry loading or return to Today. Your saved work has not been replaced." : error instanceof Error ? error.message : "Could not load your session."; setLoadError(message); setStatus(message); } }).finally(() => window.clearTimeout(loadTimer));
    const flush = () => { void current.current?.flush(); };
    const timer = window.setInterval(flush, 3000);
    window.addEventListener("pagehide", flush); window.addEventListener("online", flush); document.addEventListener("visibilitychange", flush);
    return () => { cancelled = true; controller.abort(); window.clearTimeout(loadTimer); window.clearInterval(timer); window.removeEventListener("pagehide", flush); window.removeEventListener("online", flush); document.removeEventListener("visibilitychange", flush); const entry = current.current; if (entry?.source === source) { entry.closed = true; void entry.flush(); current.current = null; } };
  }, [source, reload, language]);
  useEffect(() => {
    const entry = current.current;
    if (!source || readySource !== source || entry?.source !== source) return;
    entry.latest = JSON.parse(serialized);
    if(entry.conflict)setConflict(value=>value?{...value,local:entry.latest}:value);
    if (serialized === entry.sent) return;
    try { localStorage.setItem(cacheKey(entry.user, source), JSON.stringify({ state: entry.latest, revision: entry.revision, inFlight: entry.inFlight })); setStatus(entry.conflict ? "Newer work exists on another tab or device. Reload saved session." : "Saved on this device · syncing…"); }
    catch { setStatus("Saving… keep this page open until saved."); }
    const timer = window.setTimeout(() => void entry.flush(), 450);
    return () => window.clearTimeout(timer);
  }, [source, readySource, serialized]);
  const download = () => {
    const entry = current.current;
    const url = URL.createObjectURL(new Blob([JSON.stringify({source, local:entry?.latest, saved:conflict?.remote}, null, 2)], {type:"application/json"}));
    const link = document.createElement("a"); link.href=url; link.download="practice-session-backup.json"; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const resolveConflict = async (keepLocal:boolean) => {
    const entry=current.current; if(!entry||entry.saving)return;
    entry.saving=true;
    try {
      const response=await fetch("/api/session-drafts?source="+encodeURIComponent(entry.source)+(language==="fr"?"":"&language="+language),{cache:"no-store",signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw Error(); const data=await response.json(); const remote:Saved|undefined=data.drafts?.[0];
      if(entry.closed||current.current!==entry)return;
      if(data.userId!==entry.user||(remote&&!validDraft(remote.state)))throw Error();
      // Preserve a separately downloadable copy before replacing the working version.
      if(!keepLocal){localStorage.setItem(cacheKey(entry.user,entry.source)+":conflict-backup:"+Date.now(),JSON.stringify({state:entry.latest,revision:entry.revision}));entry.latest=(remote?.state??null) as Draft;restoreRef.current(remote?.state??null);}
      entry.revision=remote?.revision??0;entry.sent=JSON.stringify(remote?.state??null);entry.inFlight="";entry.conflict=false;setConflict(null);
      setStatus(keepLocal?"Saving your chosen version…":"Saved version restored · audio paused");
    } catch {if(!entry.closed)setStatus("Could not resolve this conflict. Download your edits and retry; this tab still has your work.");}
    finally {entry.saving=false;}
    if(!entry.conflict)void entry.flush();
  };
  return { ready: Boolean(source && source === readySource), status, loadError, conflict, download, resolveConflict,
    retry: () => { if (!current.current) setReload(n => n + 1); else void current.current.flush(); },
    reload: () => { if (window.confirm("Load the saved version? A backup of your current edits will be kept on this device.")) void resolveConflict(false); },
  };
}

export function SessionSaveStatus({ recovery, restart }: { recovery: ReturnType<typeof useSessionDraft>; restart: () => void }) {
  if (!recovery.ready) return null;
  const needsAttention=/unavailable|failed|retry|newer|another|couldn|refresh/i.test(recovery.status);
  return <div className="session-save"><span role="status">{recovery.status}</span>{recovery.conflict&&<section role="alert"><h2>Two versions of this practice exist</h2><p>Your edits are still here. Choose a version before syncing continues.</p><details><summary>Compare answers</summary><p>Your version: {String(recovery.conflict.local.retell||recovery.conflict.local.text||"No written answer")}</p><p>Saved version: {recovery.conflict.remote?String(recovery.conflict.remote.retell||recovery.conflict.remote.text||"No written answer"):"Load the latest saved version using the button below."}</p></details><button onClick={()=>void recovery.resolveConflict(true)}>Keep my edits</button><button onClick={()=>void recovery.resolveConflict(false)}>Use saved version</button></section>}<details open={needsAttention}><summary>Session options</summary><div><button onClick={recovery.download}>Download session backup</button><button onClick={recovery.retry}>Retry save</button><button onClick={recovery.reload}>Reload saved session</button><button onClick={() => { if (window.confirm("Start this session over? Its answers and playback position will be cleared. Earned XP is kept.")) restart(); }}>Start over</button></div></details></div>;
}

export function SessionRecoveryGate({ recovery, onLeave }: { recovery: ReturnType<typeof useSessionDraft>; onLeave: () => void }) {
  return <section className="session-loading" aria-label="Restore practice session">
    {recovery.loadError ? <><h2>We couldn’t open this session.</h2><p role="alert">{recovery.loadError}</p><button className="primary" onClick={recovery.retry}>Retry loading session</button></> : <p role="status">Restoring your saved passage…</p>}
    <button className="secondary" onClick={onLeave}>Return to Today</button>
  </section>;
}

export function ContinueSessions({ onContinue, language="fr", allowSource=()=>true }: { onContinue: (source: string) => void; language?:"fr"|"sv"|"es";allowSource?:(source:string)=>boolean }) {
  const [drafts, setDrafts] = useState<Saved[]>([]), [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = () => fetch("/api/session-drafts"+(language==="fr"?"":"?language="+language), { cache: "no-store" }).then(async r => { if (!r.ok) throw Error(); return r.json(); }).then(data => { if (!active) return; const rows: Saved[] = data.drafts; try { const prefix = `a-loreille-draft:${data.userId}:`; for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i)!; if (!key.startsWith(prefix)) continue; const source = key.slice(prefix.length), local = JSON.parse(localStorage.getItem(key)!); if (!validDraftSource(source) || !validDraft(local?.state)) continue; const index = rows.findIndex(r => r.source === source); if (local.revision === (rows[index]?.revision ?? 0)) { const row = { source, state: local.state, revision: local.revision, updatedAt: rows[index]?.updatedAt ?? Date.now() }; if (index < 0) rows.unshift(row); else rows[index] = row; } } } catch {} setDrafts(rows.filter(r => !r.state.done && !r.source.startsWith("studio:"))); setError(""); }).catch(() => { if (active) setError("Saved sessions could not be loaded yet."); });
    void load(); const timer = window.setInterval(load, 5000); window.addEventListener("focus", load);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", load); };
  }, []);
  const visibleDrafts=drafts.filter(draft=>allowSource(draft.source));
  if (!visibleDrafts.length && !error) return null;
  return <section className="continue-sessions" aria-label="Continue your session"><p className="eyebrow">Right where you left off</p><h2>Continue your session</h2>{error && <p role="status">{error}</p>}{visibleDrafts.slice(0, 6).map(draft => <button key={draft.source} onClick={() => onContinue(draft.source)}><strong>{draft.state.title}</strong><span>{stages[draft.state.step]} · Step {draft.state.step + 1} of 4 →</span></button>)}</section>;
}
