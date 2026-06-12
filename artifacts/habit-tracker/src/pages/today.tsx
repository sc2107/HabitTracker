import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { useGetHabits, useToggleCompletion, getGetHabitsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, Plus, Flame, MoreVertical, Trash, Edit, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateHabit, useDeleteHabit, useUpdateHabit, useLogout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Today() {
  const { isLoading: isAuthLoading } = useAuth({ requireAuth: true });
  const { data: habits, isLoading: isHabitsLoading } = useGetHabits();
  const queryClient = useQueryClient();
  const toggleCompletion = useToggleCompletion();
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  
  if (isAuthLoading) return null;

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const handleToggle = (habitId: number, currentStatus: boolean) => {
    // Optimistic update
    const previousHabits = queryClient.getQueryData(getGetHabitsQueryKey());
    
    queryClient.setQueryData(getGetHabitsQueryKey(), (old: any) => {
      if (!old) return old;
      return old.map((habit: any) => {
        if (habit.id === habitId) {
          const newStatus = !currentStatus;
          let newStreak = habit.streak;
          
          if (newStatus && !currentStatus) {
            newStreak += 1;
          } else if (!newStatus && currentStatus) {
            newStreak = Math.max(0, newStreak - 1);
          }
          
          return { ...habit, completedToday: newStatus, streak: newStreak };
        }
        return habit;
      });
    });

    toggleCompletion.mutate(
      { data: { habitId, date: todayStr } },
      {
        onError: () => {
          // Revert on error
          queryClient.setQueryData(getGetHabitsQueryKey(), previousHabits);
        }
      }
    );
  };

  return (
    <Layout>
      <div className="p-6 pb-24">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Today</h1>
            <p className="text-gray-500 text-sm mt-1">{format(new Date(), "EEEE, MMMM do")}</p>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900" onClick={() => setIsSettingsDrawerOpen(true)}>
            <Settings className="w-5 h-5" />
          </Button>
        </header>

        {isHabitsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[88px] w-full rounded-xl" />
            <Skeleton className="h-[88px] w-full rounded-xl" />
            <Skeleton className="h-[88px] w-full rounded-xl" />
          </div>
        ) : habits?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <Check className="w-8 h-8 text-indigo-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No habits yet</h2>
            <p className="text-gray-500 mb-8 max-w-[250px]">Start small. Add a daily habit you want to build.</p>
            <Button 
              onClick={() => setIsAddDrawerOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 h-12"
            >
              Add your first habit
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {habits?.map((habit) => (
              <HabitCard 
                key={habit.id} 
                habit={habit} 
                onToggle={() => handleToggle(habit.id, habit.completedToday)} 
              />
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-24 right-4 sm:right-auto sm:left-[calc(50%+240px-4rem)]">
        <Button
          onClick={() => setIsAddDrawerOpen(true)}
          className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <AddHabitDrawer open={isAddDrawerOpen} onOpenChange={setIsAddDrawerOpen} />
      <SettingsDrawer open={isSettingsDrawerOpen} onOpenChange={setIsSettingsDrawerOpen} />
    </Layout>
  );
}

function HabitCard({ habit, onToggle }: { habit: any, onToggle: () => void }) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteHabit = useDeleteHabit();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = () => {
    deleteHabit.mutate({ id: habit.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetHabitsQueryKey() });
        setIsDeleteDialogOpen(false);
        toast({ title: "Habit deleted" });
      },
      onError: () => {
        toast({ title: "Could not delete habit", variant: "destructive" });
      }
    });
  };

  return (
    <>
      <div 
        className={cn(
          "group relative flex items-center p-4 bg-white border rounded-xl transition-all cursor-pointer select-none active:scale-[0.98]",
          habit.completedToday ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200 hover:border-indigo-200 hover:shadow-sm"
        )}
        onClick={(e) => {
          // Prevent toggle if clicking the dropdown menu
          if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu]')) return;
          onToggle();
        }}
      >
        <div 
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all mr-4",
            habit.completedToday 
              ? "bg-emerald-500 border-emerald-500 scale-110" 
              : "border-gray-300 group-hover:border-indigo-400 bg-transparent"
          )}
        >
          <Check className={cn("w-5 h-5 text-white transition-opacity", habit.completedToday ? "opacity-100" : "opacity-0")} />
        </div>
        
        <div className="flex-1 min-w-0 pr-4">
          <h3 className={cn(
            "font-semibold truncate transition-colors",
            habit.completedToday ? "text-emerald-900" : "text-gray-900"
          )}>
            {habit.title}
          </h3>
          {habit.description && (
            <p className="text-sm text-gray-500 truncate mt-0.5">{habit.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {habit.streak > 0 && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              habit.completedToday ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
            )}>
              🔥 {habit.streak}
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsEditDrawerOpen(true)} className="cursor-pointer">
                <Edit className="w-4 h-4 mr-2" />
                Edit habit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="cursor-pointer text-red-600 focus:text-red-600">
                <Trash className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <EditHabitDrawer habit={habit} open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen} />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete habit</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the habit "{habit.title}" and all its history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              {deleteHabit.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AddHabitDrawer({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const createHabit = useCreateHabit();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createHabit.mutate({ data: { title, description } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetHabitsQueryKey() });
        onOpenChange(false);
        setTitle("");
        setDescription("");
      },
      onError: () => {
        toast({ title: "Couldn't save — check your connection", variant: "destructive" });
      }
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-8">
        <DrawerHeader className="px-0 pt-6">
          <DrawerTitle className="text-xl">Add new habit</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Habit name</Label>
            <Input 
              id="title" 
              placeholder="e.g. Drink water" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              autoFocus
              className="h-12 text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea 
              id="description" 
              placeholder="Any specifics to remember?" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none min-h-[100px]"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg font-medium active:scale-95 transition-transform"
            disabled={!title.trim() || createHabit.isPending}
          >
            {createHabit.isPending ? "Saving..." : "Save habit"}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

function EditHabitDrawer({ habit, open, onOpenChange }: { habit: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [title, setTitle] = useState(habit.title);
  const [description, setDescription] = useState(habit.description || "");
  const updateHabit = useUpdateHabit();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    updateHabit.mutate({ id: habit.id, data: { title, description } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetHabitsQueryKey() });
        onOpenChange(false);
      },
      onError: () => {
        toast({ title: "Couldn't update habit", variant: "destructive" });
      }
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-8">
        <DrawerHeader className="px-0 pt-6">
          <DrawerTitle className="text-xl">Edit habit</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Habit name</Label>
            <Input 
              id="edit-title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="h-12 text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (optional)</Label>
            <Textarea 
              id="edit-description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none min-h-[100px]"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg font-medium active:scale-95 transition-transform"
            disabled={!title.trim() || updateHabit.isPending}
          >
            {updateHabit.isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

function SettingsDrawer({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const logout = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        window.location.href = "/login";
      }
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-12">
        <DrawerHeader className="px-0 pt-6">
          <DrawerTitle className="text-xl">Settings</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 mt-4">
          <Button 
            variant="outline" 
            className="w-full h-12 text-gray-700 justify-start px-4 font-medium border-gray-200"
            onClick={handleLogout}
          >
            Sign out
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
