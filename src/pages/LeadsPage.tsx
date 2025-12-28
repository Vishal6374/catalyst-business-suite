import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const statusColors: Record<string, string> = {
  new: "bg-info/10 text-info",
  contacted: "bg-warning/10 text-warning",
  qualified: "bg-primary/10 text-primary",
  proposal: "bg-chart-4/10 text-chart-4",
  negotiation: "bg-chart-5/10 text-chart-5",
  won: "bg-success/10 text-success",
  lost: "bg-destructive/10 text-destructive",
};

export default function LeadsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", value: "", status: "new", source: "" });

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (!error) setLeads(data || []);
    setLoading(false);
  }

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("leads").insert({
      title: formData.title,
      description: formData.description,
      value: parseFloat(formData.value) || 0,
      status: formData.status,
      source: formData.source,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead created successfully" });
      setDialogOpen(false);
      setFormData({ title: "", description: "", value: "", status: "new", source: "" });
      fetchLeads();
    }
  }

  const filteredLeads = leads.filter((lead) => lead.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Leads</h1><p className="page-description">Manage your sales leads</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Lead</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Lead</DialogTitle></DialogHeader>
            <form onSubmit={createLead} className="space-y-4">
              <div><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Value ($)</Label><Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} /></div>
                <div><Label>Source</Label><Input value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} placeholder="Website, Referral..." /></div>
              </div>
              <div><Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"].map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Create Lead</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex gap-4"><div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div></div>
      <Card>
        <CardContent className="p-0">
          <table className="data-table">
            <thead><tr><th>Title</th><th>Value</th><th>Status</th><th>Source</th><th>Created</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr> : filteredLeads.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No leads found</td></tr> : filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/50">
                  <td className="font-medium">{lead.title}</td>
                  <td>${Number(lead.value || 0).toLocaleString()}</td>
                  <td><Badge className={statusColors[lead.status] || "bg-muted"}>{lead.status}</Badge></td>
                  <td>{lead.source || "-"}</td>
                  <td className="text-muted-foreground">{new Date(lead.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
