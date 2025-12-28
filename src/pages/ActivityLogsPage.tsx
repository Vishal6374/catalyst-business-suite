import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActivityLogsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">Activity Logs</h1><p className="page-description">System audit trail</p></div>
      <Card><CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader><CardContent className="py-12 text-center text-muted-foreground">No activity logs yet.</CardContent></Card>
    </div>
  );
}
