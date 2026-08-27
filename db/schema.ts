import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

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
