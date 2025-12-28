import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DesignationsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">Designations</h1><p className="page-description">Manage job titles and positions</p></div>
      <Card><CardHeader><CardTitle>Designations</CardTitle></CardHeader><CardContent className="py-12 text-center text-muted-foreground">No designations configured yet.</CardContent></Card>
    </div>
  );
}
