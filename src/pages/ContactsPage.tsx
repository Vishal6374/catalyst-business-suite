import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Phone, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ContactsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    company_id: "",
    notes: "",
  });

  useEffect(() => {
    fetchContacts();
    fetchCompanies();
  }, []);

  async function fetchContacts() {
    const { data, error } = await supabase
      .from("contacts")
      .select("*, companies(name)")
      .order("created_at", { ascending: false });
    if (!error) setContacts(data || []);
    setLoading(false);
  }

  async function fetchCompanies() {
    const { data } = await supabase.from("companies").select("id, name").order("name");
    if (data) setCompanies(data);
  }

  async function createContact(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("contacts").insert([{
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      position: formData.position,
      company_id: formData.company_id || null,
      notes: formData.notes,
      created_by: user?.id,
    }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contact created successfully" });
      setDialogOpen(false);
      setFormData({ first_name: "", last_name: "", email: "", phone: "", position: "", company_id: "", notes: "" });
      fetchContacts();
    }
  }

  const filteredContacts = contacts.filter((c) =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-description">Manage your business contacts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Contact</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Contact</DialogTitle></DialogHeader>
            <form onSubmit={createContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>First Name</Label><Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required /></div>
                <div><Label>Last Name</Label><Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Position</Label><Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} /></div>
                <div>
                  <Label>Company</Label>
                  <Select value={formData.company_id} onValueChange={(v) => setFormData({ ...formData, company_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
              <Button type="submit" className="w-full">Create Contact</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted-foreground col-span-full text-center py-8">Loading...</p>
        ) : filteredContacts.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">No contacts found</p>
        ) : (
          filteredContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {contact.first_name[0]}{contact.last_name?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{contact.first_name} {contact.last_name}</h3>
                    {contact.position && <p className="text-sm text-muted-foreground">{contact.position}</p>}
                    {contact.companies?.name && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Building className="h-3 w-3" />{contact.companies.name}
                      </div>
                    )}
                    <div className="flex flex-col gap-1 mt-2 text-sm">
                      {contact.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" /><span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />{contact.phone}
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