import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const stages = [
  { value: "prospecting", label: "Prospecting", color: "bg-muted text-muted-foreground" },
  { value: "qualification", label: "Qualification", color: "bg-info/10 text-info" },
  { value: "proposal", label: "Proposal", color: "bg-warning/10 text-warning" },
  { value: "negotiation", label: "Negotiation", color: "bg-primary/10 text-primary" },
  { value: "closed_won", label: "Closed Won", color: "bg-success/10 text-success" },
  { value: "closed_lost", label: "Closed Lost", color: "bg-destructive/10 text-destructive" },
];

export default function DealsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deals, setDeals] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    value: "",
    stage: "prospecting",
    probability: "50",
    company_id: "",
    contact_id: "",
    expected_close_date: "",
  });

  useEffect(() => {
    fetchDeals();
    fetchCompanies();
    fetchContacts();
  }, []);

  async function fetchDeals() {
    const { data, error } = await supabase
      .from("deals")
      .select("*, companies(name), contacts(first_name, last_name)")
      .order("created_at", { ascending: false });
    if (!error) setDeals(data || []);
    setLoading(false);
  }

  async function fetchCompanies() {
    const { data } = await supabase.from("companies").select("id, name").order("name");
    if (data) setCompanies(data);
  }

  async function fetchContacts() {
    const { data } = await supabase.from("contacts").select("id, first_name, last_name").order("first_name");
    if (data) setContacts(data);
  }

  async function createDeal(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("deals").insert([{
      title: formData.title,
      description: formData.description,
      value: parseFloat(formData.value) || 0,
      stage: formData.stage as "prospecting" | "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost",
      probability: parseInt(formData.probability) || 50,
      company_id: formData.company_id || null,
      contact_id: formData.contact_id || null,
      expected_close_date: formData.expected_close_date || null,
      created_by: user?.id,
    }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deal created successfully" });
      setDialogOpen(false);
      setFormData({ title: "", description: "", value: "", stage: "prospecting", probability: "50", company_id: "", contact_id: "", expected_close_date: "" });
      fetchDeals();
    }
  }

  const dealsByStage = stages.map((stage) => ({
    ...stage,
    deals: deals.filter((d) => d.stage === stage.value),
    total: deals.filter((d) => d.stage === stage.value).reduce((sum, d) => sum + Number(d.value || 0), 0),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Deals</h1>
          <p className="page-description">Track your sales pipeline</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Deal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create New Deal</DialogTitle></DialogHeader>
            <form onSubmit={createDeal} className="space-y-4">
              <div><Label>Deal Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Value ($)</Label><Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} /></div>
                <div><Label>Probability (%)</Label><Input type="number" min="0" max="100" value={formData.probability} onChange={(e) => setFormData({ ...formData, probability: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Stage</Label>
                  <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{stages.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Expected Close</Label><Input type="date" value={formData.expected_close_date} onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company</Label>
                  <Select value={formData.company_id} onValueChange={(v) => setFormData({ ...formData, company_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Contact</Label>
                  <Select value={formData.contact_id} onValueChange={(v) => setFormData({ ...formData, contact_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                    <SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">Create Deal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6 overflow-x-auto">
          {dealsByStage.map((stage) => (
            <Card key={stage.value} className="min-w-[280px]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
                  <Badge variant="secondary">{stage.deals.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />{stage.total.toLocaleString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {stage.deals.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No deals</p>
                ) : (
                  stage.deals.map((deal) => (
                    <Card key={deal.id} className="bg-muted/50">
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm truncate">{deal.title}</h4>
                        <p className="text-xs text-muted-foreground">${Number(deal.value || 0).toLocaleString()}</p>
                        {deal.companies?.name && <p className="text-xs text-muted-foreground mt-1">{deal.companies.name}</p>}
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}