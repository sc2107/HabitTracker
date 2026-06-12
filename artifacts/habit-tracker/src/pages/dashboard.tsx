import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { useGetDashboard } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

export default function Dashboard() {
  const { isLoading: isAuthLoading } = useAuth({ requireAuth: true });
  const { data: stats, isLoading } = useGetDashboard();

  if (isAuthLoading) return null;

  return (
    <Layout>
      <div className="p-6 pb-24">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Your progress at a glance</p>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : !stats ? (
          <div className="text-center py-12 text-gray-500">Failed to load statistics</div>
        ) : (
          <div className="space-y-6">
            
            {/* Top Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-600 text-white p-5 rounded-xl shadow-sm">
                <p className="text-indigo-100 text-sm font-medium mb-1">Today's Progress</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{stats.completedToday}</span>
                  <span className="text-indigo-200 font-medium">/ {stats.totalHabits}</span>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                <p className="text-gray-500 text-sm font-medium mb-1">This Week</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">{stats.completedThisWeek}</span>
                  <span className="text-gray-400 font-medium text-sm">completions</span>
                </div>
              </div>
            </div>

            {/* Weekly Chart */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-6">Weekly Activity</h3>
              <div className="flex items-end justify-between h-40 gap-2">
                {stats.weeklyBars.map((bar, i) => {
                  const height = Math.max(4, (bar.count / (Math.max(...stats.weeklyBars.map(b => b.count)) || 1)) * 100);
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 gap-2">
                      <div className="w-full relative group flex justify-center h-full items-end">
                        <div 
                          className="w-full max-w-[24px] bg-indigo-100 rounded-t-sm relative transition-all group-hover:bg-indigo-200"
                          style={{ height: `${height}%` }}
                        >
                          {bar.count > 0 && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-indigo-700">
                              {bar.count}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        {format(parseISO(bar.date), 'E')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Streaks */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Current Streaks</h3>
              {stats.habitStreaks.length > 0 ? (
                <div className="space-y-4">
                  {stats.habitStreaks.map(habit => (
                    <div key={habit.habitId} className="flex items-center justify-between">
                      <span className="font-medium text-gray-700 truncate pr-4">{habit.title}</span>
                      <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-full text-orange-700 font-medium text-sm">
                        🔥 {habit.streak}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No active streaks. Complete habits daily to build streaks!</p>
              )}
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
}
