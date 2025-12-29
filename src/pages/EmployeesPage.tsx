import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-warning/10 text-warning",
  terminated: "bg-destructive/10 text-destructive",
};

export default function EmployeesPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    user_id: "",
    department_id: "",
    designation_id: "",
    phone: "",
    address: "",
    salary: "",
    hire_date: new Date().toISOString().split("T")[0],
    status: "active",
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchDesignations();
    fetchProfiles();
  }, []);

  async function fetchEmployees() {
    const { data, error } = await supabase
      .from("employees")
      .select("*, departments(name), designations(title), profiles:user_id(full_name, email)")
      .order("created_at", { ascending: false });
    if (!error) setEmployees(data || []);
    setLoading(false);
  }

  async function fetchDepartments() {
    const { data } = await supabase.from("departments").select("id, name").order("name");
    if (data) setDepartments(data);
  }

  async function fetchDesignations() {
    const { data } = await supabase.from("designations").select("id, title").order("title");
    if (data) setDesignations(data);
  }

  async function fetchProfiles() {
    const { data } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
    if (data) setProfiles(data);
  }

  async function createEmployee(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("employees").insert([{
      employee_id: formData.employee_id,
      user_id: formData.user_id || null,
      department_id: formData.department_id || null,
      designation_id: formData.designation_id || null,
      phone: formData.phone,
      address: formData.address,
      salary: parseFloat(formData.salary) || 0,
      hire_date: formData.hire_date,
      status: formData.status as "active" | "inactive" | "terminated",
    }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Employee added successfully" });
      setDialogOpen(false);
      setFormData({ employee_id: "", user_id: "", department_id: "", designation_id: "", phone: "", address: "", salary: "", hire_date: new Date().toISOString().split("T")[0], status: "active" });
      fetchEmployees();
    }
  }

  const filteredEmployees = employees.filter((emp) =>
    emp.employee_id.toLowerCase().includes(search.toLowerCase()) ||
    emp.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.profiles?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-description">Manage your team members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
            <form onSubmit={createEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Employee ID</Label><Input value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} placeholder="EMP001" required /></div>
                <div>
                  <Label>Link to User</Label>
                  <Select value={formData.user_id} onValueChange={(v) => setFormData({ ...formData, user_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                    <SelectContent>{profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department</Label>
                  <Select value={formData.department_id} onValueChange={(v) => setFormData({ ...formData, department_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Designation</Label>
                  <Select value={formData.designation_id} onValueChange={(v) => setFormData({ ...formData, designation_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                    <SelectContent>{designations.map((d) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                <div><Label>Salary</Label><Input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} /></div>
              </div>
              <div><Label>Address</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Hire Date</Label><Input type="date" value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} required /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">Add Employee</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted-foreground col-span-full text-center py-8">Loading...</p>
        ) : filteredEmployees.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">No employees found</p>
        ) : (
          filteredEmployees.map((emp) => (
            <Card key={emp.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {emp.profiles?.full_name?.[0] || emp.employee_id[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{emp.profiles?.full_name || emp.employee_id}</h3>
                      <Badge className={statusColors[emp.status]}>{emp.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{emp.designations?.title || "No designation"}</p>
                    <p className="text-xs text-muted-foreground">{emp.departments?.name || "No department"}</p>
                    <div className="flex flex-col gap-1 mt-2 text-sm">
                      {emp.profiles?.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" /><span className="truncate">{emp.profiles.email}</span>
                        </div>
                      )}
                      {emp.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />{emp.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}