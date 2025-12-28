import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div><h1 className="page-title">Settings</h1><p className="page-description">Manage your account settings</p></div>
      <Card>
        <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Email</Label><Input value={user?.email || ""} disabled /></div>
          <div><Label>Full Name</Label><Input placeholder="Your full name" /></div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
