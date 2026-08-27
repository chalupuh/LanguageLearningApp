"use client";
import { useEffect, useState } from "react";
import type { InboxNote } from "../../lib/feedback-notes";
import "./feedback.css";

export default function FeedbackInbox() {
  const [notes, setNotes] = useState<InboxNote[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "signed-out" | "denied">("loading");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(false);
  const [revision, setRevision] = useState(0);
  const [kind, setKind] = useState("all");
  const [state, setState] = useState("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading"); setError(""); setCopied(""); setNotes([]); setWarning(false);
    fetch("/api/feedback-inbox", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "Feedback could not be loaded. Please retry.");
          setStatus(response.status === 401 ? "signed-out" : response.status === 403 ? "denied" : "error");
          return;
        }
        if (!Array.isArray(data.notes)) throw new Error("Invalid feedback response");
        setNotes(data.notes); setWarning(Boolean(data.unreadableRecords)); setStatus("ready");
      }).catch(() => { if (!controller.signal.aborted) { setError("Could not reach the feedback inbox. Check your connection and retry."); setStatus("error"); } });
    return () => controller.abort();
  }, [revision]);
  const visible = notes.filter(note => (kind === "all" || note.kind === kind) &&
    (state === "all" || note.resolved === (state === "handled")) &&
    `${note.text} ${note.submittedBy ?? ""}`.toLowerCase().includes(query.toLowerCase().trim()));
  const copy = async () => {
    const text = visible.map(note => `[${note.kind === "bug" ? "Bug" : "Feature request"} · ${note.resolved ? "Handled" : "Open"}]\n${note.submittedBy ?? "Unknown author"} · ${note.createdAt}\n${note.text}`).join("\n\n---\n\n");
    try { await navigator.clipboard.writeText(text); setCopied("Visible notes copied. Ready to paste into our development conversation."); }
    catch { setCopied("Copy was unavailable. You can select and copy the note text below."); }
  };
  return <main className="owner-inbox">
    <a className="inbox-back" href="/">← Back to À l’Oreille</a>
    <header className="inbox-heading"><div><p className="eyebrow">Owner’s notebook · private to you</p><h1>Nikki’s feedback.</h1><p>Her words, in full. A shared starting point for the next improvement.</p></div><button onClick={() => setRevision(value => value + 1)} disabled={status === "loading"}>Refresh</button></header>
    {status === "loading" && <p role="status" className="inbox-message">Opening the feedback notebook…</p>}
    {status !== "loading" && status !== "ready" && <section className="inbox-message" role="alert"><h2>We couldn’t open the inbox.</h2><p>{error}</p>{status === "signed-out" && <a href="/signin-with-chatgpt?return_to=%2Ffeedback">Sign in with ChatGPT →</a>}{status === "denied" && <a href="/signout-with-chatgpt?return_to=%2Ffeedback">Switch ChatGPT account →</a>}<p>No feedback has been changed.</p></section>}
    {status === "ready" && <>
      <div className="inbox-counts"><span><strong>{notes.filter(note => !note.resolved).length}</strong> open notes</span><span><strong>{notes.filter(note => note.kind === "bug").length}</strong> bug reports</span><span><strong>{notes.filter(note => note.kind === "idea").length}</strong> feature requests</span></div>
      {warning && <p role="alert" className="inbox-message">Some saved feedback could not be read. This list may be incomplete; please report this to the developer.</p>}
      <div className="inbox-filters"><label>Search notes<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search wording or author…"/></label><label>Type<select value={kind} onChange={event => setKind(event.target.value)}><option value="all">All types</option><option value="bug">Bug reports</option><option value="idea">Feature requests</option></select></label><label>Status<select value={state} onChange={event => setState(event.target.value)}><option value="all">Open and handled</option><option value="open">Open</option><option value="handled">Handled</option></select></label></div>
      <div className="inbox-results"><span>{visible.length} of {notes.length} notes · newest first</span><button onClick={copy} disabled={!visible.length}>Copy visible notes</button></div>
      {copied && <p role="status">{copied}</p>}
      <section className="inbox-notes" aria-label="Submitted feedback">{visible.map((note, index) => <article key={`${note.submittedBy}-${note.id}-${index}`} className={`inbox-note ${note.kind}`}><header><span className="inbox-kind">{note.kind === "bug" ? "Bug report" : "Feature request"}</span><span>{note.resolved ? "Handled" : "Open"}</span></header><p className="inbox-note-text">{note.text}</p><footer><span>{note.submittedBy || "Unknown author"}</span><time dateTime={note.createdAt}>{Number.isNaN(Date.parse(note.createdAt)) ? "Date unavailable" : new Date(note.createdAt).toLocaleString()}</time></footer></article>)}</section>
      {!visible.length && <div className="inbox-message"><h2>{notes.length ? "No notes match these filters." : "No submitted feedback yet."}</h2><p>{notes.length ? "Try another search or choose All types and Open and handled." : "Notes saved and synced from Nikki’s N menu will appear here. Use Refresh to check again."}</p></div>}
      <p className="inbox-footnote">This view reads the original synced notebooks. Reading it does not mark notes handled or change anyone’s progress.</p>
    </>}
  </main>;
}
