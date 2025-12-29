import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

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
                  className={`bg-background min-h-[100px] p-2 ${!day ? "bg-muted/30" : ""} ${isToday(day!) ? "ring-2 ring-primary ring-inset" : ""}`}
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
    </div>
  );
}