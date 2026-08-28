import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";

export const usageSessions = sqliteTable("usage_sessions", {
  userId: text("user_id").notNull(), id: text("id").notNull(), email: text("email"),
  source: text("source").notNull(), startedAt: integer("started_at").notNull(),
  lastActiveAt: integer("last_active_at").notNull(), stage: integer("stage").notNull(),
  completedAt: integer("completed_at"),
}, table => [primaryKey({ columns: [table.userId, table.id] }), index("idx_usage_sessions_email_active").on(table.email, table.lastActiveAt)]);
export const usageSamples = sqliteTable("usage_samples", {
  userId: text("user_id").notNull(), sessionId: text("session_id").notNull(), seq: integer("seq").notNull(),
  start: integer("start").notNull(), end: integer("end").notNull(),
}, table => [primaryKey({ columns: [table.userId, table.sessionId, table.seq] }), index("idx_usage_samples_user_end").on(table.userId, table.end)]);

export const journeyEvents = sqliteTable("journey_events", {
  userId: text("user_id").notNull(), id: text("id").notNull(), kind: text("kind").notNull(),
  source: text("source").notNull(), xp: integer("xp").notNull(), createdAt: integer("created_at").notNull(), details: text("details").notNull(),
}, table => [primaryKey({ columns: [table.userId, table.id] })]);
export const journeyProfiles = sqliteTable("journey_profiles", {
  userId: text("user_id").primaryKey(), historicalXp: integer("historical_xp").notNull(),
  avatar: text("avatar").notNull().default("default"), background: text("background").notNull().default("default"),
 frame: text("frame").notNull().default("default"), weeklyGoal: integer("weekly_goal").notNull().default(3),
});

export const learnerProgress = sqliteTable("learner_progress", {
  userId: text("user_id").primaryKey(),
  email: text("email"),
  state: text("state").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const feedbackResolutions = sqliteTable("feedback_resolutions", {
  userId: text("user_id").notNull(),
  noteId: text("note_id").notNull(),
  handled: integer("handled", { mode: "boolean" }).notNull(),
  noteText: text("note_text").notNull(),
  message: text("message").notNull(),
  updatedAt: integer("updated_at").notNull(),
  seenAt: integer("seen_at"),
}, table => [primaryKey({ columns: [table.userId, table.noteId] })]);
