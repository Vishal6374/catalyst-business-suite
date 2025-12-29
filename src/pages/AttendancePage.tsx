import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Clock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Database } from "@/integrations/supabase/types";

const statusColors: Record<string, string> = {
  present: "bg-success/10 text-success",
  absent: "bg-destructive/10 text-destructive",
  late: "bg-warning/10 text-warning",
  half_day: "bg-info/10 text-info",
};

export default function AttendancePage() {
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<(Database["public"]["Tables"]["attendance"]["Row"] & { employees?: { employee_id: string; profiles?: { full_name: string | null } } })[]>([]);
  const [employees, setEmployees] = useState<{ id: string; employee_id: string; profiles?: { full_name: string | null } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Database["public"]["Tables"]["attendance"]["Row"] | null>(null);
  const [formData, setFormData] = useState({
    employee_id: "",
    date: new Date().toISOString().split("T")[0],
    check_in: "09:00",
    check_out: "17:00",
    status: "present",
    notes: "",
  });

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, []);

  async function fetchAttendance() {
    const { data, error } = await supabase
      .from("attendance")
      .select("*, employees(employee_id, profiles:user_id(full_name))")
      .order("date", { ascending: false })
      .limit(100);
    if (!error) setAttendance(data || []);
    setLoading(false);
  }

  async function fetchEmployees() {
    const { data } = await supabase
      .from("employees")
      .select("id, employee_id, profiles:user_id(full_name)")
      .eq("status", "active")
      .order("employee_id");
    if (data) setEmployees(data);
  }

  async function createAttendance(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      const { error } = await supabase.from("attendance").update({
        employee_id: formData.employee_id,
        date: formData.date,
        check_in: formData.check_in,
        check_out: formData.check_out,
        status: formData.status as "present" | "absent" | "late" | "half_day",
        notes: formData.notes,
      }).eq("id", editing.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Attendance updated successfully" });
    } else {
      const { error } = await supabase.from("attendance").insert([{
        employee_id: formData.employee_id,
        date: formData.date,
        check_in: formData.check_in,
        check_out: formData.check_out,
        status: formData.status as "present" | "absent" | "late" | "half_day",
        notes: formData.notes,
      }]);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Attendance recorded successfully" });
    }
    setDialogOpen(false);
    setEditing(null);
    setFormData({ employee_id: "", date: new Date().toISOString().split("T")[0], check_in: "09:00", check_out: "17:00", status: "present", notes: "" });
    fetchAttendance();
  }

  const filteredAttendance = attendance.filter((a) =>
    a.employees?.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
    a.employees?.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const todayStats = {
    present: attendance.filter((a) => a.date === new Date().toISOString().split("T")[0] && a.status === "present").length,
    absent: attendance.filter((a) => a.date === new Date().toISOString().split("T")[0] && a.status === "absent").length,
    late: attendance.filter((a) => a.date === new Date().toISOString().split("T")[0] && a.status === "late").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-description">Track employee attendance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Record Attendance</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Attendance</DialogTitle></DialogHeader>
            <form onSubmit={createAttendance} className="space-y-4">
              <div>
                <Label>Employee</Label>
                <Select value={formData.employee_id} onValueChange={(v) => setFormData({ ...formData, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.profiles?.full_name || e.employee_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Check In</Label><Input type="time" value={formData.check_in} onChange={(e) => setFormData({ ...formData, check_in: e.target.value })} /></div>
                <div><Label>Check Out</Label><Input type="time" value={formData.check_out} onChange={(e) => setFormData({ ...formData, check_out: e.target.value })} /></div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
              <Button type="submit" className="w-full">Record Attendance</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><Clock className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Present Today</p><p className="text-2xl font-bold">{todayStats.present}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><Clock className="h-5 w-5 text-destructive" /></div>
              <div><p className="text-sm text-muted-foreground">Absent Today</p><p className="text-2xl font-bold">{todayStats.absent}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
              <div><p className="text-sm text-muted-foreground">Late Today</p><p className="text-2xl font-bold">{todayStats.late}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by employee..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Attendance Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="data-table">
            <thead>
              <tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
              ) : filteredAttendance.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No attendance records found</td></tr>
              ) : (
                filteredAttendance.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/50">
                    <td className="font-medium">{a.employees?.profiles?.full_name || a.employees?.employee_id}</td>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td>{a.check_in || "-"}</td>
                    <td>{a.check_out || "-"}</td>
                    <td><Badge className={statusColors[a.status]}>{a.status.replace("_", " ")}</Badge></td>
                    <td className="text-muted-foreground max-w-[200px] truncate">{a.notes || "-"}</td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditing(a);
                            setFormData({
                              employee_id: a.employee_id,
                              date: a.date.split("T")[0],
                              check_in: a.check_in || "",
                              check_out: a.check_out || "",
                              status: a.status,
                              notes: a.notes || "",
                            });
                            setDialogOpen(true);
                          }}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            if (!confirm("Delete this attendance record?")) return;
                            const { error } = await supabase.from("attendance").delete().eq("id", a.id);
                            if (error) {
                              toast({ title: "Error", description: error.message, variant: "destructive" });
                              return;
                            }
                            toast({ title: "Attendance deleted" });
                            fetchAttendance();
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
