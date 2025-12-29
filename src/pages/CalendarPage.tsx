import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium" });
  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  async function fetchData() {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const [tasksRes, leaveRes] = await Promise.all([
      supabase.from("tasks").select("*").gte("due_date", startOfMonth.toISOString()).lte("due_date", endOfMonth.toISOString()),
      supabase.from("leave_requests").select("*, employees(profiles:user_id(full_name))").gte("start_date", startOfMonth.toISOString().split("T")[0]).lte("end_date", endOfMonth.toISOString().split("T")[0]),
    ]);

    if (tasksRes.data) setTasks(tasksRes.data);
    if (leaveRes.data) setLeaveRequests(leaveRes.data);
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayTasks = tasks.filter((t) => t.due_date?.startsWith(dateStr));
    const dayLeaves = leaveRequests.filter((l) => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      const current = new Date(dateStr);
      return current >= start && current <= end;
    });
    return { tasks: dayTasks, leaves: dayLeaves };
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());

  const isToday = (day: number) => {
    const now = new Date();
    return day === now.getDate() && currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();
  };

  const openDayDialog = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setNewTask({ title: "", description: "", priority: "medium" });
    setRescheduleTaskId(null);
    setRescheduleDate(dateStr);
    setDayDialogOpen(true);
  };

  async function createTaskForDay(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("tasks").insert([{
      title: newTask.title,
      description: newTask.description || null,
      priority: newTask.priority as "low" | "medium" | "high" | "urgent",
      status: "todo",
      due_date: selectedDate,
      created_by: user?.id,
    }]);
    if (!error) {
      setNewTask({ title: "", description: "", priority: "medium" });
      setDayDialogOpen(false);
      fetchData();
    }
  }

  async function rescheduleTask() {
    if (!rescheduleTaskId || !rescheduleDate) return;
    const { error } = await supabase.from("tasks").update({ due_date: rescheduleDate }).eq("id", rescheduleTaskId);
    if (!error) {
      setRescheduleTaskId(null);
      setDayDialogOpen(false);
      fetchData();
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Calendar</h1>
        <p className="page-description">View and manage your schedule</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <CardTitle>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={today}>Today</Button>
              <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {dayNames.map((day) => (
              <div key={day} className="bg-muted p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            {getDaysInMonth().map((day, index) => {
              const events = day ? getEventsForDay(day) : { tasks: [], leaves: [] };
              return (
                <div
                  key={index}
                  className={`bg-background min-h-[100px] p-2 cursor-pointer ${!day ? "bg-muted/30" : ""} ${isToday(day!) ? "ring-2 ring-primary ring-inset" : ""}`}
                  onClick={() => day && openDayDialog(day)}
                >
                  {day && (
                    <>
                      <span className={`text-sm font-medium ${isToday(day) ? "text-primary" : ""}`}>{day}</span>
                      <div className="mt-1 space-y-1">
                        {events.tasks.slice(0, 2).map((task) => (
                          <div key={task.id} className="text-xs p-1 rounded bg-primary/10 text-primary truncate">
                            {task.title}
                          </div>
                        ))}
                        {events.leaves.slice(0, 1).map((leave) => (
                          <div key={leave.id} className="text-xs p-1 rounded bg-warning/10 text-warning truncate">
                            {leave.employees?.profiles?.full_name || "Leave"}
                          </div>
                        ))}
                        {(events.tasks.length > 2 || events.leaves.length > 1) && (
                          <Badge variant="secondary" className="text-xs">+{events.tasks.length + events.leaves.length - 3} more</Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary/10 border border-primary/20" />
          <span className="text-muted-foreground">Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-warning/10 border border-warning/20" />
          <span className="text-muted-foreground">Leave</span>
        </div>
      </div>

      <Dialog
        open={dayDialogOpen}
        onOpenChange={(open) => {
          setDayDialogOpen(open);
          if (!open) {
            setRescheduleTaskId(null);
            setNewTask({ title: "", description: "", priority: "medium" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage {selectedDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm">Tasks</h3>
              <div className="space-y-2 max-h-[200px] overflow-auto mt-2">
                {tasks.filter((t) => t.due_date?.startsWith(selectedDate)).map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <span className="text-sm flex-1 truncate">{task.title}</span>
                    <Input type="date" className="h-8 w-40" value={rescheduleTaskId === task.id ? rescheduleDate : selectedDate} onChange={(e) => { setRescheduleTaskId(task.id); setRescheduleDate(e.target.value); }} />
                    <Button size="sm" variant="outline" onClick={rescheduleTask}>Reschedule</Button>
                  </div>
                ))}
                {tasks.filter((t) => t.due_date?.startsWith(selectedDate)).length === 0 && (
                  <p className="text-sm text-muted-foreground">No tasks on this day</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-sm">Create Task</h3>
              <form onSubmit={createTaskForDay} className="space-y-2 mt-2">
                <div>
                  <Label>Title</Label>
                  <Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Create Task on {selectedDate}</Button>
              </form>
            </div>
            <div>
              <h3 className="font-medium text-sm">Leave</h3>
              <div className="space-y-2 max-h-[160px] overflow-auto mt-2">
                {leaveRequests.filter((l) => {
                  const d = new Date(selectedDate);
                  return d >= new Date(l.start_date) && d <= new Date(l.end_date);
                }).map((leave) => (
                  <div key={leave.id} className="flex items-center gap-2">
                    <span className="text-sm flex-1 truncate">{leave.employees?.profiles?.full_name || "Leave"}</span>
                    <Badge variant="secondary" className="text-xs">{leave.type}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
