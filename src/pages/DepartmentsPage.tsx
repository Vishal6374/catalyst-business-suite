import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DepartmentsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">Departments</h1><p className="page-description">Manage organization structure</p></div>
      <Card><CardHeader><CardTitle>Departments</CardTitle></CardHeader><CardContent className="py-12 text-center text-muted-foreground">No departments configured yet.</CardContent></Card>
    </div>
  );
}
