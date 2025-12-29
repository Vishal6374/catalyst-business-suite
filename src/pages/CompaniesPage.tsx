import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Globe, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function CompaniesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    address: "",
    city: "",
    country: "",
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setCompanies(data || []);
    setLoading(false);
  }

  async function createCompany(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("companies").insert([{
      ...formData,
      created_by: user?.id,
    }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Company created successfully" });
      setDialogOpen(false);
      setFormData({ name: "", email: "", phone: "", website: "", industry: "", address: "", city: "", country: "" });
      fetchCompanies();
    }
  }

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-description">Manage your business accounts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Company</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create New Company</DialogTitle></DialogHeader>
            <form onSubmit={createCompany} className="space-y-4">
              <div><Label>Company Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Website</Label><Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://" /></div>
                <div><Label>Industry</Label><Input value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} /></div>
              </div>
              <div><Label>Address</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>City</Label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
                <div><Label>Country</Label><Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full">Create Company</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted-foreground col-span-full text-center py-8">Loading...</p>
        ) : filteredCompanies.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">No companies found</p>
        ) : (
          filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {company.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{company.name}</h3>
                    {company.industry && <p className="text-sm text-muted-foreground">{company.industry}</p>}
                    <div className="flex flex-col gap-1 mt-2 text-sm">
                      {company.website && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary">{company.website}</a>
                        </div>
                      )}
                      {company.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" /><span className="truncate">{company.email}</span>
                        </div>
                      )}
                      {(company.city || company.country) && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />{[company.city, company.country].filter(Boolean).join(", ")}
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