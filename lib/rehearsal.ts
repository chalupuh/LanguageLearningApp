export type RehearsalMode = "echo" | "build" | "rhythm";
export const rehearsalModes: RehearsalMode[] = ["echo", "build", "rhythm"];

// Captions often have no punctuation. Keep every activity short without
// inventing sentence timings or claiming these are linguistic boundaries.
export function rehearsalPhrases(text: string): string[] {
  const sentences = text.trim().split(/(?<=[.!?;])\s+|\n+/u).filter(Boolean);
  return sentences.flatMap(sentence => {
    const words = sentence.trim().split(/\s+/u), phrases: string[] = [];
    for (let i = 0; i < words.length; i += 14) phrases.push(words.slice(i, i + 14).join(" "));
    return phrases;
  });
}

export function phraseChunks(phrase: string): string[] {
  // Punctuation first, then short word groups. These are memory aids,
  // not an automatic grammar or liaison analysis.
  return phrase.split(/(?<=[,;:])\s+/u).flatMap(part => {
    const words = part.trim().split(/\s+/u).filter(Boolean), chunks: string[] = [];
    for (let i = 0; i < words.length; i += 3) chunks.push(words.slice(i, i + 3).join(" "));
    return chunks;
  });
}

export function suggestedRehearsal(source: string): RehearsalMode {
  return rehearsalModes[Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0) % rehearsalModes.length];
}

export function correctlyBuilt(chunks: string[], order: number[]): boolean {
  return chunks.length > 0 && order.length === chunks.length && new Set(order).size === chunks.length &&
    order.every(index => Number.isInteger(index) && index >= 0 && index < chunks.length) &&
    order.map(index => chunks[index]).join(" ") === chunks.join(" ");
}

export function rehearsalComplete(mode: RehearsalMode, heard: boolean, confirmed: boolean, built: boolean, noticed: boolean): boolean {
  return mode === "build" ? built : heard && confirmed && (mode !== "rhythm" || noticed);
}
