import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">Reports</h1><p className="page-description">Analytics and insights</p></div>
      <Card><CardHeader><CardTitle>Reports Dashboard</CardTitle></CardHeader><CardContent className="py-12 text-center text-muted-foreground">Reports functionality coming soon.</CardContent></Card>
    </div>
  );
}
