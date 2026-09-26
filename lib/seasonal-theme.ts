export type ManualTheme = "classic" | "autumn" | "halloween" | "winter" | "valentine" | "spring" | "summer";
export type ThemePreference = "auto" | ManualTheme;

// Northern Hemisphere calendar seasons, using the learner's local date.
export function seasonalTheme(date = new Date()): ManualTheme {
  const month = date.getMonth();
  if (month === 9) return "halloween";
  if (month === 1 && date.getDate() <= 14) return "valentine";
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

export function resolveTheme(preference: ThemePreference, date = new Date()): ManualTheme {
  return preference === "auto" ? seasonalTheme(date) : preference;
}
