import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Activity, User, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const actionColors: Record<string, string> = {
  create: "bg-success/10 text-success",
  update: "bg-info/10 text-info",
  delete: "bg-destructive/10 text-destructive",
  login: "bg-primary/10 text-primary",
  logout: "bg-muted text-muted-foreground",
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*, profiles:user_id(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error) setLogs(data || []);
    setLoading(false);
  }

  const filteredLogs = logs.filter((log) =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
    log.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const todayLogs = logs.filter((log) => 
    new Date(log.created_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Activity Logs</h1>
        <p className="page-description">System audit trail</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Activity className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Total Logs</p><p className="text-2xl font-bold">{logs.length}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><Clock className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Today's Activity</p><p className="text-2xl font-bold">{todayLogs}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Action</th><th>Entity</th><th>Description</th><th>Time</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No activity logs found</td></tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50">
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-muted"><User className="h-3 w-3" /></div>
                        <span className="font-medium">{log.profiles?.full_name || "System"}</span>
                      </div>
                    </td>
                    <td><Badge className={actionColors[log.action.toLowerCase()] || "bg-muted"}>{log.action}</Badge></td>
                    <td className="text-muted-foreground">{log.entity_type || "-"}</td>
                    <td className="text-muted-foreground max-w-[300px] truncate">{log.description || "-"}</td>
                    <td className="text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
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