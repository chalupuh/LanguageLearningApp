export const MAX_DRAFT_BYTES = 250000;
export function validDraftSource(value: unknown): value is string {
  return typeof value === "string" && /^(library:[a-z0-9-]{1,80}|studio:[A-Za-z0-9_-]{11})$/.test(value);
}
export function validDraft(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const d = value as Record<string, unknown>;
  return d.version === 1 && typeof d.title === "string" && d.title.length <= 200 &&
    Number.isInteger(d.step) && Number(d.step) >= 0 && Number(d.step) <= 3 &&
    typeof d.done === "boolean" && new TextEncoder().encode(JSON.stringify(value)).length <= MAX_DRAFT_BYTES;
}
