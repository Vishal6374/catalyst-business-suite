import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

const leaveTypeLabels: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  emergency: "Emergency Leave",
};

export default function LeaveRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    fetchLeaveRequests();
    fetchEmployees();
  }, []);

  async function fetchLeaveRequests() {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*, employees(employee_id, profiles:user_id(full_name))")
      .order("created_at", { ascending: false });
    if (!error) setLeaveRequests(data || []);
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

  async function createLeaveRequest(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("leave_requests").insert([{
      employee_id: formData.employee_id,
      leave_type: formData.leave_type as "annual" | "sick" | "maternity" | "paternity" | "emergency",
      start_date: formData.start_date,
      end_date: formData.end_date,
      reason: formData.reason,
    }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Leave request submitted successfully" });
      setDialogOpen(false);
      setFormData({ employee_id: "", leave_type: "annual", start_date: "", end_date: "", reason: "" });
      fetchLeaveRequests();
    }
  }

  async function updateLeaveStatus(id: string, status: "approved" | "rejected") {
    const { error } = await supabase
      .from("leave_requests")
      .update({ status, approved_by: user?.id, approved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Leave request ${status}` });
      fetchLeaveRequests();
    }
  }

  const filteredRequests = leaveRequests.filter((r) =>
    r.employees?.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
    r.employees?.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = leaveRequests.filter((r) => r.status === "pending").length;

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Leave Requests</h1>
          <p className="page-description">Manage time-off requests</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Request Leave</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit Leave Request</DialogTitle></DialogHeader>
            <form onSubmit={createLeaveRequest} className="space-y-4">
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
              <div>
                <Label>Leave Type</Label>
                <Select value={formData.leave_type} onValueChange={(v) => setFormData({ ...formData, leave_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="maternity">Maternity Leave</SelectItem>
                    <SelectItem value="paternity">Paternity Leave</SelectItem>
                    <SelectItem value="emergency">Emergency Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required /></div>
                <div><Label>End Date</Label><Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required /></div>
              </div>
              <div><Label>Reason</Label><Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Reason for leave..." /></div>
              <Button type="submit" className="w-full">Submit Request</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {pendingCount > 0 && (
        <Card className="border-warning">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10"><Calendar className="h-5 w-5 text-warning" /></div>
              <div><p className="text-sm text-muted-foreground">Pending Approval</p><p className="text-2xl font-bold">{pendingCount} request{pendingCount > 1 ? "s" : ""}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by employee..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Leave Requests</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="data-table">
            <thead>
              <tr><th>Employee</th><th>Type</th><th>Duration</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No leave requests found</td></tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/50">
                    <td className="font-medium">{r.employees?.profiles?.full_name || r.employees?.employee_id}</td>
                    <td>{leaveTypeLabels[r.leave_type]}</td>
                    <td>{new Date(r.start_date).toLocaleDateString()} - {new Date(r.end_date).toLocaleDateString()}</td>
                    <td>{calculateDays(r.start_date, r.end_date)}</td>
                    <td className="text-muted-foreground max-w-[200px] truncate">{r.reason || "-"}</td>
                    <td><Badge className={statusColors[r.status]}>{r.status}</Badge></td>
                    <td>
                      {r.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-success" onClick={() => updateLeaveStatus(r.id, "approved")}>Approve</Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateLeaveStatus(r.id, "rejected")}>Reject</Button>
                        </div>
                      )}
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