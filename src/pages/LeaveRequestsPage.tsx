import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function LeaveRequestsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Leave Requests</h1><p className="page-description">Manage time-off requests</p></div>
        <Button><Plus className="mr-2 h-4 w-4" />Request Leave</Button>
      </div>
      <Card><CardHeader><CardTitle>Leave Requests</CardTitle></CardHeader><CardContent className="py-12 text-center text-muted-foreground">No leave requests yet.</CardContent></Card>
    </div>
  );
}
