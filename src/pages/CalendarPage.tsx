import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">Calendar</h1><p className="page-description">View and manage your schedule</p></div>
      <Card><CardHeader><CardTitle>Calendar View</CardTitle></CardHeader><CardContent className="py-12 text-center text-muted-foreground">Calendar functionality coming soon.</CardContent></Card>
    </div>
  );
}
