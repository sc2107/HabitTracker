import { Router, type IRouter } from "express";
import { eq, and, gte } from "drizzle-orm";
import { db, habitsTable, habitEntriesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { computeStreak, getTodayDate } from "../lib/habitUtils";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/dashboard", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const today = getTodayDate();

  const habits = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.userId, userId));

  const totalHabits = habits.length;

  if (totalHabits === 0) {
    res.json({
      completedToday: 0,
      totalHabits: 0,
      completedThisWeek: 0,
      weeklyBars: [],
      habitStreaks: [],
    });
    return;
  }

  const habitIds = habits.map((h) => h.id);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

  const allEntries = await Promise.all(
    habitIds.map((id) =>
      db
        .select({ completedDate: habitEntriesTable.completedDate })
        .from(habitEntriesTable)
        .where(
          and(
            eq(habitEntriesTable.habitId, id),
            gte(habitEntriesTable.completedDate, cutoff),
          ),
        ),
    ),
  );

  const entryMap = new Map<number, string[]>();
  habitIds.forEach((id, i) => {
    entryMap.set(id, allEntries[i].map((e) => e.completedDate));
  });

  const completedToday = habits.filter((h) =>
    (entryMap.get(h.id) ?? []).includes(today),
  ).length;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  let completedThisWeek = 0;
  for (const dates of entryMap.values()) {
    completedThisWeek += dates.filter((d) => d >= weekStartStr).length;
  }

  const weeklyMap = new Map<string, number>();
  for (const dates of entryMap.values()) {
    for (const date of dates) {
      const d = new Date(date + "T00:00:00");
      const dayOfWeek = d.getDay();
      const weekBegin = new Date(d);
      weekBegin.setDate(d.getDate() - dayOfWeek);
      const key = weekBegin.toISOString().slice(0, 10);
      weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + 1);
    }
  }

  const weeklyBars = Array.from(weeklyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, count]) => ({ date, count }));

  const habitStreaks = habits.map((h) => ({
    habitId: h.id,
    title: h.title,
    streak: computeStreak(entryMap.get(h.id) ?? [], today),
  }));

  res.json({
    completedToday,
    totalHabits,
    completedThisWeek,
    weeklyBars,
    habitStreaks,
  });
});

export default router;
