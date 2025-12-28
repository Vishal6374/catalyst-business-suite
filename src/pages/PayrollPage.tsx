import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PayrollPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">Payroll</h1><p className="page-description">Manage salary and compensation</p></div>
      <Card><CardHeader><CardTitle>Payroll Records</CardTitle></CardHeader><CardContent className="py-12 text-center text-muted-foreground">No payroll records yet.</CardContent></Card>
    </div>
  );
}
