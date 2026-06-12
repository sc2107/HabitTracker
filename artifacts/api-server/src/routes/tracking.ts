import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, habitsTable, habitEntriesTable } from "@workspace/db";
import {
  ToggleCompletionBody,
  GetHistoryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { computeStreak } from "../lib/habitUtils";

const router: IRouter = Router();

router.use(requireAuth);

router.post("/complete", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const parsed = ToggleCompletionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { habitId, date } = parsed.data;

  const [habit] = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.id, habitId));

  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  if (habit.userId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const [existing] = await db
    .select()
    .from(habitEntriesTable)
    .where(
      and(
        eq(habitEntriesTable.habitId, habitId),
        eq(habitEntriesTable.completedDate, date),
      ),
    );

  if (existing) {
    await db
      .delete(habitEntriesTable)
      .where(eq(habitEntriesTable.id, existing.id));
    res.json({ completed: false, habitId, date });
  } else {
    await db
      .insert(habitEntriesTable)
      .values({ habitId, completedDate: date });
    res.json({ completed: true, habitId, date });
  }
});

router.get("/history/:habitId", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = GetHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { habitId } = params.data;

  const [habit] = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.id, habitId));

  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  if (habit.userId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

  const entries = await db
    .select({ completedDate: habitEntriesTable.completedDate })
    .from(habitEntriesTable)
    .where(eq(habitEntriesTable.habitId, habitId));

  const completedDates = entries
    .map((e) => e.completedDate)
    .filter((d) => d >= cutoff)
    .sort();

  res.json({ habitId, completedDates });
});

export default router;
