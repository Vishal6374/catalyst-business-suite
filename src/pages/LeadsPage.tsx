import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LayoutList, LayoutGrid, Download, Trash2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LeadForm } from "@/components/leads/LeadForm";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsKanban } from "@/components/leads/LeadsKanban";
import { LeadDetailsSheet } from "@/components/leads/LeadDetailsSheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function LeadsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Selection
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  
  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<"delete" | "status" | null>(null);
  const [bulkStatus, setBulkStatus] = useState("new");

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (!error) setLeads(data || []);
    setLoading(false);
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      (lead.company_name?.toLowerCase() || lead.title?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (lead.contact_name?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (lead.email?.toLowerCase() || "").includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    
    let matchesDate = true;
    if (dateFilter !== "all") {
      const date = new Date(lead.created_at);
      const now = new Date();
      if (dateFilter === "today") {
        matchesDate = date.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesDate = date >= weekAgo;
      } else if (dateFilter === "month") {
        matchesDate = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesStatus && matchesSource && matchesDate;
  });

  const handleSelectLead = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedLeads);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const handleCreate = () => {
    setEditingLead(null);
    setIsFormOpen(true);
  };

  const handleEdit = (lead: any) => {
    setEditingLead(lead);
    setIsFormOpen(true);
  };

  const handleView = (lead: any) => {
    setSelectedLeadForDetails(lead);
    setIsDetailsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await supabase.from("activity_logs").insert([{
        action: "deleted_lead",
        entity_type: "lead",
        entity_id: id,
        description: "Deleted lead",
        user_id: user?.id,
      }]);
      toast({ title: "Lead deleted successfully" });
      fetchLeads();
    }
  };

  const handleConvert = async (lead: any) => {
    // 1. Create Contact
    const { data: contact, error: contactError } = await supabase.from("contacts").insert([{
      first_name: lead.contact_name ? lead.contact_name.split(' ')[0] : (lead.title || "Unknown"),
      last_name: lead.contact_name ? lead.contact_name.split(' ').slice(1).join(' ') : "",
      email: lead.email,
      phone: lead.phone,
      notes: `Converted from Lead: ${lead.company_name || lead.title}. \n${lead.notes || ""}`,
      created_by: user?.id,
      company_id: lead.company_id // If we had this mapped
    }]).select().single();

    if (contactError) {
      toast({ title: "Error converting lead", description: contactError.message, variant: "destructive" });
      return;
    }

    // 2. Update Lead Status
    await supabase.from("leads").update({ status: "qualified", contact_id: contact.id }).eq("id", lead.id);

    // 3. Log Activity
    await supabase.from("activity_logs").insert([{
      action: "converted_to_contact",
      entity_type: "lead",
      entity_id: lead.id,
      description: `Lead converted to contact #${contact.id}`,
      user_id: user?.id
    }]);

    toast({ title: "Lead converted to contact successfully" });
    fetchLeads();
  };

  const handleBulkAction = async () => {
    const leadIds = Array.from(selectedLeads);
    if (leadIds.length === 0) return;

    if (bulkActionType === "delete") {
      await supabase.from("leads").delete().in("id", leadIds);
      toast({ title: `${leadIds.length} leads deleted` });
    } else if (bulkActionType === "status") {
      await supabase.from("leads").update({ status: bulkStatus }).in("id", leadIds);
      toast({ title: `${leadIds.length} leads updated` });
    }

    setSelectedLeads(new Set());
    setIsBulkActionOpen(false);
    fetchLeads();
  };

  const handleExport = () => {
    const headers = ["Company", "Contact", "Email", "Phone", "Status", "Source", "Value", "Notes", "Created At"];
    const csvContent = [
      headers.join(","),
      ...filteredLeads.map(lead => [
        `"${lead.company_name || lead.title || ""}"`,
        `"${lead.contact_name || ""}"`,
        `"${lead.email || ""}"`,
        `"${lead.phone || ""}"`,
        `"${lead.status}"`,
        `"${lead.source || ""}"`,
        `"${lead.value || 0}"`,
        `"${(lead.notes || "").replace(/"/g, '""')}"`,
        `"${new Date(lead.created_at).toLocaleDateString()}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading leads...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-description">Manage your sales leads pipeline</p>
        </div>
        <div className="flex gap-2">
          {selectedLeads.size > 0 && (
            <>
              <Button variant="outline" onClick={() => { setBulkActionType("status"); setIsBulkActionOpen(true); }}>
                <CheckCircle className="mr-2 h-4 w-4" /> Update Status
              </Button>
              <Button variant="destructive" onClick={() => { setBulkActionType("delete"); setIsBulkActionOpen(true); }}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedLeads.size})
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <div className="border rounded-md flex">
            <Button 
              variant={viewMode === "table" ? "secondary" : "ghost"} 
              size="icon" 
              onClick={() => setViewMode("table")}
              className="rounded-none rounded-l-md"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "kanban" ? "secondary" : "ghost"} 
              size="icon" 
              onClick={() => setViewMode("kanban")}
              className="rounded-none rounded-r-md"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> New Lead
          </Button>
        </div>
      </div>

      <LeadFilters 
        search={search} onSearchChange={setSearch}
        statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
        sourceFilter={sourceFilter} onSourceFilterChange={setSourceFilter}
        dateFilter={dateFilter} onDateFilterChange={setDateFilter}
      />

      {viewMode === "table" ? (
        <LeadsTable 
          leads={filteredLeads}
          selectedLeads={selectedLeads}
          onSelectLead={handleSelectLead}
          onSelectAll={handleSelectAll}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onConvert={handleConvert}
          onView={handleView}
        />
      ) : (
        <LeadsKanban 
          leads={filteredLeads}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onConvert={handleConvert}
          onView={handleView}
        />
      )}

      <LeadForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSuccess={fetchLeads} 
        initialData={editingLead} 
      />

      <LeadDetailsSheet
        lead={selectedLeadForDetails}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <Dialog open={isBulkActionOpen} onOpenChange={setIsBulkActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk {bulkActionType === "delete" ? "Delete" : "Update"}</DialogTitle>
          </DialogHeader>
          {bulkActionType === "delete" ? (
            <p>Are you sure you want to delete {selectedLeads.size} leads? This action cannot be undone.</p>
          ) : (
            <div className="space-y-4">
              <Label>New Status</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkActionOpen(false)}>Cancel</Button>
            <Button variant={bulkActionType === "delete" ? "destructive" : "default"} onClick={handleBulkAction}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
