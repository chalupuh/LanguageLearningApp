import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const learnerProgress = sqliteTable("learner_progress", {
  userId: text("user_id").primaryKey(),
  email: text("email"),
  state: text("state").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
