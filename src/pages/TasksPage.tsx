import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  urgent: "bg-destructive/10 text-destructive",
};

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    due_date: "",
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setTasks(data || []);
    setLoading(false);
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("tasks").insert([{
      title: formData.title,
      description: formData.description,
      priority: formData.priority as "low" | "medium" | "high" | "urgent",
      status: formData.status as "todo" | "in_progress" | "completed" | "cancelled",
      due_date: formData.due_date || null,
      created_by: user?.id,
    }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Task created successfully" });
      setDialogOpen(false);
      setFormData({ title: "", description: "", priority: "medium", status: "todo", due_date: "" });
      fetchTasks();
    }
  }

  async function toggleTaskStatus(task: any) {
    const newStatus = task.status === "completed" ? "todo" : "completed";
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus, completed_at: newStatus === "completed" ? new Date().toISOString() : null })
      .eq("id", task.id);
    if (!error) fetchTasks();
  }

  const filteredTasks = tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
  const todoTasks = filteredTasks.filter((t) => t.status === "todo" || t.status === "in_progress");
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-description">Manage your work items</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
            <form onSubmit={createTask} className="space-y-4">
              <div><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Due Date</Label><Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full">Create Task</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Circle className="h-4 w-4" /> To Do ({todoTasks.length})
            </h2>
            {todoTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending tasks</p>
            ) : (
              todoTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox checked={task.status === "completed"} onCheckedChange={() => toggleTaskStatus(task)} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{task.title}</h3>
                          <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                        </div>
                        {task.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Calendar className="h-3 w-3" />{new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" /> Completed ({completedTasks.length})
            </h2>
            {completedTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No completed tasks</p>
            ) : (
              completedTasks.map((task) => (
                <Card key={task.id} className="opacity-60 hover:opacity-100 transition-opacity">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox checked={true} onCheckedChange={() => toggleTaskStatus(task)} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate line-through">{task.title}</h3>
                        {task.completed_at && (
                          <p className="text-xs text-muted-foreground mt-1">Completed {new Date(task.completed_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}