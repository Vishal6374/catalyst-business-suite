import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AttendancePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">Attendance</h1><p className="page-description">Track employee attendance</p></div>
      <Card><CardHeader><CardTitle>Attendance Records</CardTitle></CardHeader><CardContent className="py-12 text-center text-muted-foreground">No attendance records yet.</CardContent></Card>
    </div>
  );
}
