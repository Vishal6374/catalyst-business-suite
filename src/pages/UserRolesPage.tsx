import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Shield, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const roleColors: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive",
  manager: "bg-warning/10 text-warning",
  employee: "bg-info/10 text-info",
};

const roleDescriptions: Record<string, string> = {
  admin: "Full system access",
  manager: "Team management access",
  employee: "Basic access",
};

export default function UserRolesPage() {
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ user_id: "", role: "employee" });

  useEffect(() => {
    fetchUserRoles();
    fetchProfiles();
  }, []);

  async function fetchUserRoles() {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*, profiles:user_id(full_name, email)")
      .order("created_at", { ascending: false });
    if (!error) setUserRoles(data || []);
    setLoading(false);
  }

  async function fetchProfiles() {
    const { data } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
    if (data) setProfiles(data);
  }

  async function createUserRole(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("user_roles").insert([{
      user_id: formData.user_id,
      role: formData.role as "admin" | "manager" | "employee",
    }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role assigned successfully" });
      setDialogOpen(false);
      setFormData({ user_id: "", role: "employee" });
      fetchUserRoles();
    }
  }

  async function deleteUserRole(id: string) {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role removed" });
      fetchUserRoles();
    }
  }

  const roleStats = {
    admin: userRoles.filter((r) => r.role === "admin").length,
    manager: userRoles.filter((r) => r.role === "manager").length,
    employee: userRoles.filter((r) => r.role === "employee").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">User Roles</h1>
          <p className="page-description">Manage access control</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Assign Role</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign User Role</DialogTitle></DialogHeader>
            <form onSubmit={createUserRole} className="space-y-4">
              <div>
                <Label>User</Label>
                <Select value={formData.user_id} onValueChange={(v) => setFormData({ ...formData, user_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Assign Role</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(["admin", "manager", "employee"] as const).map((role) => (
          <Card key={role}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${roleColors[role].replace("text-", "bg-").replace("/10", "/10")}`}>
                  <Shield className={`h-5 w-5 ${roleColors[role].split(" ")[1]}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{role}s</p>
                  <p className="text-2xl font-bold">{roleStats[role]}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>User Role Assignments</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Role</th><th>Permissions</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
              ) : userRoles.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No role assignments found</td></tr>
              ) : (
                userRoles.map((ur) => (
                  <tr key={ur.id} className="hover:bg-muted/50">
                    <td className="font-medium">{ur.profiles?.full_name || "Unknown"}</td>
                    <td className="text-muted-foreground">{ur.profiles?.email}</td>
                    <td><Badge className={roleColors[ur.role]}>{ur.role}</Badge></td>
                    <td className="text-muted-foreground">{roleDescriptions[ur.role]}</td>
                    <td>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteUserRole(ur.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}