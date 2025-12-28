import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserRolesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">User Roles</h1><p className="page-description">Manage access control</p></div>
      <Card><CardHeader><CardTitle>Roles & Permissions</CardTitle></CardHeader><CardContent className="py-12 text-center text-muted-foreground">Configure user roles and permissions here.</CardContent></Card>
    </div>
  );
}
