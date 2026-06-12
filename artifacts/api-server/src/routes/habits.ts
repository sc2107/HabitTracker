import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, habitsTable, habitEntriesTable } from "@workspace/db";
import {
  CreateHabitBody,
  UpdateHabitBody,
  UpdateHabitParams,
  DeleteHabitParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { computeStreak, getTodayDate } from "../lib/habitUtils";

const router: IRouter = Router();

router.use(requireAuth);

async function getHabitWithStatus(habitId: number, today: string) {
  const entries = await db
    .select({ completedDate: habitEntriesTable.completedDate })
    .from(habitEntriesTable)
    .where(eq(habitEntriesTable.habitId, habitId))
    .orderBy(desc(habitEntriesTable.completedDate));

  const completedDates = entries.map((e) => e.completedDate);
  const completedToday = completedDates.includes(today);
  const streak = computeStreak(completedDates, today);
  return { completedToday, streak };
}

router.get("/habits", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const today = getTodayDate();

  const habits = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.userId, userId))
    .orderBy(habitsTable.createdAt);

  const results = await Promise.all(
    habits.map(async (h) => {
      const { completedToday, streak } = await getHabitWithStatus(h.id, today);
      return {
        id: h.id,
        userId: h.userId,
        title: h.title,
        description: h.description ?? null,
        createdAt: h.createdAt,
        completedToday,
        streak,
      };
    }),
  );

  res.json(results);
});

router.post("/habits", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const parsed = CreateHabitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [habit] = await db
    .insert(habitsTable)
    .values({ userId, title: parsed.data.title, description: parsed.data.description ?? null })
    .returning();

  const today = getTodayDate();
  const { completedToday, streak } = await getHabitWithStatus(habit.id, today);

  res.status(201).json({
    id: habit.id,
    userId: habit.userId,
    title: habit.title,
    description: habit.description ?? null,
    createdAt: habit.createdAt,
    completedToday,
    streak,
  });
});

router.put("/habits/:id", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = UpdateHabitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateHabitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  if (existing.userId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const updates: Partial<typeof habitsTable.$inferInsert> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;

  const [updated] = await db
    .update(habitsTable)
    .set(updates)
    .where(eq(habitsTable.id, params.data.id))
    .returning();

  const today = getTodayDate();
  const { completedToday, streak } = await getHabitWithStatus(updated.id, today);

  res.json({
    id: updated.id,
    userId: updated.userId,
    title: updated.title,
    description: updated.description ?? null,
    createdAt: updated.createdAt,
    completedToday,
    streak,
  });
});

router.delete("/habits/:id", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = DeleteHabitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  if (existing.userId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db
    .delete(habitsTable)
    .where(and(eq(habitsTable.id, params.data.id), eq(habitsTable.userId, userId)));

  res.sendStatus(204);
});

export default router;
