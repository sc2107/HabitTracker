import { pgTable, serial, integer, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { habitsTable } from "./habits";

export const habitEntriesTable = pgTable(
  "habit_entries",
  {
    id: serial("id").primaryKey(),
    habitId: integer("habit_id").notNull().references(() => habitsTable.id, { onDelete: "cascade" }),
    completedDate: date("completed_date", { mode: "string" }).notNull(),
  },
  (table) => ({
    uniqueHabitDate: unique().on(table.habitId, table.completedDate),
  }),
);

export const insertHabitEntrySchema = createInsertSchema(habitEntriesTable).omit({ id: true });
export type InsertHabitEntry = z.infer<typeof insertHabitEntrySchema>;
export type HabitEntry = typeof habitEntriesTable.$inferSelect;
