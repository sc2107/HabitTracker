import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { useGetHabits, useGetHistory, getGetHistoryQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function History() {
  const { isLoading: isAuthLoading } = useAuth({ requireAuth: true });
  const { data: habits, isLoading: isHabitsLoading } = useGetHabits();
  const [selectedHabitId, setSelectedHabitId] = useState<string>("");

  // Select first habit by default
  if (!selectedHabitId && habits && habits.length > 0) {
    setSelectedHabitId(habits[0].id.toString());
  }

  const { data: history, isLoading: isHistoryLoading } = useGetHistory(
    parseInt(selectedHabitId), 
    { query: { enabled: !!selectedHabitId, queryKey: getGetHistoryQueryKey(parseInt(selectedHabitId)) } }
  );

  if (isAuthLoading) return null;

  return (
    <Layout>
      <div className="p-6 pb-24">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">History</h1>
          <p className="text-gray-500 text-sm mt-1">Look back at your consistency</p>
        </header>

        {isHabitsLoading ? (
          <Skeleton className="h-12 w-full rounded-lg mb-8" />
        ) : habits?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No habits added yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Habit</label>
              <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
                <SelectTrigger className="w-full h-12 bg-white">
                  <SelectValue placeholder="Select a habit" />
                </SelectTrigger>
                <SelectContent>
                  {habits?.map((habit) => (
                    <SelectItem key={habit.id} value={habit.id.toString()}>{habit.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedHabitId && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Last 30 Days</h3>
                
                {isHistoryLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <DotGrid completedDates={history?.completedDates || []} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function DotGrid({ completedDates }: { completedDates: string[] }) {
  const today = new Date();
  const startDate = subDays(today, 29);
  const days = eachDayOfInterval({ start: startDate, end: today });
  
  const completedSet = new Set(completedDates);

  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-3">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
        <div key={i} className="text-center text-xs font-medium text-gray-400 mb-2">
          {day}
        </div>
      ))}
      
      {/* Pad start of grid to align with correct day of week */}
      {Array.from({ length: days[0].getDay() }).map((_, i) => (
        <div key={`pad-${i}`} className="aspect-square" />
      ))}
      
      {days.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const isCompleted = completedSet.has(dateStr);
        const isToday = dateStr === format(today, "yyyy-MM-dd");
        
        return (
          <div 
            key={dateStr}
            title={format(date, "MMM do, yyyy")}
            className={cn(
              "aspect-square rounded-md transition-colors",
              isCompleted 
                ? "bg-emerald-500 shadow-sm" 
                : "bg-gray-100 border border-gray-200",
              isToday && !isCompleted && "ring-2 ring-indigo-200 ring-offset-1"
            )}
          />
        );
      })}
    </div>
  );
}
