import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function DepartmentsPage() {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    const { data, error } = await supabase
      .from("departments")
      .select("*, employees(count)")
      .order("name");
    if (!error) setDepartments(data || []);
    setLoading(false);
  }

  async function createDepartment(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("departments").insert([formData]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Department created successfully" });
      setDialogOpen(false);
      setFormData({ name: "", description: "" });
      setEditingId(null);
      fetchDepartments();
    }
  }

  async function updateDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const { error } = await supabase.from("departments").update(formData).eq("id", editingId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Department updated successfully" });
      setDialogOpen(false);
      setFormData({ name: "", description: "" });
      setEditingId(null);
      fetchDepartments();
    }
  }

  async function deleteDepartment(id: string) {
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Department deleted" });
      fetchDepartments();
    }
  }

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-description">Manage organization structure</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setFormData({ name: "", description: "" });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "", description: "" });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Department" : "Create Department"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={editingId ? updateDepartment : createDepartment} className="space-y-4">
              <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <Button type="submit" className="w-full">{editingId ? "Update Department" : "Create Department"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search departments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted-foreground col-span-full text-center py-8">Loading...</p>
        ) : filteredDepartments.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">No departments found</p>
        ) : (
          filteredDepartments.map((dept) => (
            <Card key={dept.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{dept.name}</h3>
                    {dept.description && <p className="text-sm text-muted-foreground mt-1">{dept.description}</p>}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                      <Users className="h-3 w-3" />
                      {dept.employees?.[0]?.count || 0} employees
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingId(dept.id);
                        setFormData({ name: dept.name || "", description: dept.description || "" });
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDepartment(dept.id)}>
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
