import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function DesignationsPage() {
  const { toast } = useToast();
  const [designations, setDesignations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", department_id: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDesignations();
    fetchDepartments();
  }, []);

  async function fetchDesignations() {
    const { data, error } = await supabase
      .from("designations")
      .select("*, departments(name)")
      .order("title");
    if (!error) setDesignations(data || []);
    setLoading(false);
  }

  async function fetchDepartments() {
    const { data } = await supabase.from("departments").select("id, name").order("name");
    if (data) setDepartments(data);
  }

  async function createDesignation(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("designations").insert([{
      title: formData.title,
      description: formData.description,
      department_id: formData.department_id || null,
    }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Designation created successfully" });
      setDialogOpen(false);
      setFormData({ title: "", description: "", department_id: "" });
      setEditingId(null);
      fetchDesignations();
    }
  }

  async function updateDesignation(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const { error } = await supabase.from("designations").update({
      title: formData.title,
      description: formData.description,
      department_id: formData.department_id || null,
    }).eq("id", editingId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Designation updated successfully" });
      setDialogOpen(false);
      setFormData({ title: "", description: "", department_id: "" });
      setEditingId(null);
      fetchDesignations();
    }
  }

  async function deleteDesignation(id: string) {
    const { error } = await supabase.from("designations").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Designation deleted" });
      fetchDesignations();
    }
  }

  const filteredDesignations = designations.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Designations</h1>
          <p className="page-description">Manage job titles and positions</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setFormData({ title: "", description: "", department_id: "" });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ title: "", description: "", department_id: "" });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Designation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit Designation" : "Create Designation"}</DialogTitle></DialogHeader>
            <form onSubmit={editingId ? updateDesignation : createDesignation} className="space-y-4">
              <div><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
              <div>
                <Label>Department</Label>
                <Select value={formData.department_id} onValueChange={(v) => setFormData({ ...formData, department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <Button type="submit" className="w-full">{editingId ? "Update Designation" : "Create Designation"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search designations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted-foreground col-span-full text-center py-8">Loading...</p>
        ) : filteredDesignations.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">No designations found</p>
        ) : (
          filteredDesignations.map((desig) => (
            <Card key={desig.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{desig.title}</h3>
                    {desig.departments?.name && <p className="text-sm text-primary">{desig.departments.name}</p>}
                    {desig.description && <p className="text-sm text-muted-foreground mt-1">{desig.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingId(desig.id);
                        setFormData({
                          title: desig.title || "",
                          description: desig.description || "",
                          department_id: desig.department_id || "",
                        });
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDesignation(desig.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
