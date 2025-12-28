import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function TasksPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Tasks</h1><p className="page-description">Manage your tasks and to-dos</p></div>
        <Button><Plus className="mr-2 h-4 w-4" />New Task</Button>
      </div>
      <Card><CardContent className="py-12 text-center text-muted-foreground">No tasks yet. Create your first task to get started.</CardContent></Card>
    </div>
  );
}
