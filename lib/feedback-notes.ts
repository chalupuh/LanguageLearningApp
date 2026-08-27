export type InboxNote = {
  id: string; createdAt: string; kind: "idea" | "bug";
  text: string; resolved: boolean; submittedBy: string | null;
  userId?: string; implementationMessage?: string;
};

// Read the existing notebook without copying or modifying learner progress.
export function collectFeedbackNotes(records: Array<{ userId?: string; email: string | null; state: string }>) {
  const notes: InboxNote[] = [];
  let unreadableRecords = 0;
  for (const record of records) {
    try {
      const state = JSON.parse(record.state);
      if (!state || typeof state !== "object") { unreadableRecords++; continue; }
      if (state.feedbackNotes === undefined) continue;
      if (!Array.isArray(state.feedbackNotes)) { unreadableRecords++; continue; }
      for (const note of state.feedbackNotes) {
        if (!note || typeof note.text !== "string") { unreadableRecords++; continue; }
        notes.push({ id: String(note.id ?? ""), createdAt: String(note.createdAt ?? ""),
          kind: note.kind === "bug" ? "bug" : "idea", text: note.text,
          resolved: note.resolved === true, submittedBy: record.email, userId: record.userId });
      }
    } catch { unreadableRecords++; }
  }
  return { notes: notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), unreadableRecords };
}
