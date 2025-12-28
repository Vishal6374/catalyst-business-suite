import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function EmployeesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Employees</h1><p className="page-description">Manage your team members</p></div>
        <Button><Plus className="mr-2 h-4 w-4" />Add Employee</Button>
      </div>
      <Card><CardContent className="py-12 text-center text-muted-foreground">No employees yet. Add your first team member to get started.</CardContent></Card>
    </div>
  );
}
