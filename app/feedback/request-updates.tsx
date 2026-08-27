"use client";
import { useEffect, useRef, useState } from "react";
import "./feedback.css";
type Update = { noteId: string; noteText: string; handled: boolean; message: string; updatedAt: number; seenAt: number | null };
export default function RequestUpdates({ onUpdates }: { onUpdates?: (updates: Update[]) => void }) {
  const callback = useRef(onUpdates); callback.current = onUpdates;
  const [updates, setUpdates] = useState<Update[]>([]), [error, setError] = useState(""), [pending, setPending] = useState("");
  useEffect(() => {
    let active = true;
    const load = () => fetch("/api/feedback-updates", { cache: "no-store" }).then(async response => { if (!response.ok) throw new Error(); return response.json(); }).then(data => { if (active) { setUpdates(data.updates || []); setError(""); } }).catch(() => { if (active) setError("Request updates could not be loaded. They’ll be checked again when you return to the app."); });
    void load();
    const focus = () => { void load(); };
    window.addEventListener("focus", focus);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 60000);
    return () => { active = false; window.removeEventListener("focus", focus); window.clearInterval(timer); };
  }, []);
  const acknowledge = async (update: Update) => {
    setPending(update.noteId);
    try {
      const response = await fetch("/api/feedback-updates", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ noteId: update.noteId, updatedAt: update.updatedAt }) });
      if (!response.ok) throw new Error();
      setUpdates(items => items.map(item => item.noteId === update.noteId && item.updatedAt === update.updatedAt ? { ...item, seenAt: Date.now() } : item)); setError("");
    } catch { setError("Could not save your acknowledgement. Please try again."); }
    finally { setPending(""); }
  };
  useEffect(() => { callback.current?.(updates); }, [updates]);
  const unread = updates.filter(update => update.handled && !update.seenAt);
  if (!updates.length && !error) return null;
  return <aside className="request-updates" aria-label="Updates to your requests">
    {error && <p role="status">{error}</p>}
    {unread.map(update => <article key={`${update.noteId}-${update.updatedAt}`}><p className="eyebrow">You asked. It’s here.</p><h2>Your request has been implemented.</h2><blockquote>{update.noteText}</blockquote><p>{update.message}</p><button onClick={() => acknowledge(update)} disabled={Boolean(pending)}>{pending === update.noteId ? "Saving…" : "Got it, thank you"}</button></article>)}
    <details><summary>Your request history · {updates.filter(update => update.handled).length} implemented</summary>{updates.map(update => <article key={update.noteId}><strong>{update.handled ? "Implemented" : "Reopened"} · {new Date(update.updatedAt).toLocaleDateString()}</strong><blockquote>{update.noteText}</blockquote><p>{update.message}</p></article>)}</details>
  </aside>;
}
