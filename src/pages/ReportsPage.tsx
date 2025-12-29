import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, DollarSign, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--info))"];

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalLeads: 0,
    wonLeads: 0,
    totalDeals: 0,
    closedDeals: 0,
    totalRevenue: 0,
    pendingPayroll: 0,
  });
  const [leadsByStatus, setLeadsByStatus] = useState<any[]>([]);
  const [dealsByStage, setDealsByStage] = useState<any[]>([]);
  const [monthlyPayroll, setMonthlyPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  async function fetchReportData() {
    const [employeesRes, leadsRes, dealsRes, payrollRes] = await Promise.all([
      supabase.from("employees").select("status"),
      supabase.from("leads").select("status, value"),
      supabase.from("deals").select("stage, value"),
      supabase.from("payroll").select("month, year, net_salary, status"),
    ]);

    const employees = employeesRes.data || [];
    const leads = leadsRes.data || [];
    const deals = dealsRes.data || [];
    const payroll = payrollRes.data || [];

    setStats({
      totalEmployees: employees.length,
      activeEmployees: employees.filter((e) => e.status === "active").length,
      totalLeads: leads.length,
      wonLeads: leads.filter((l) => l.status === "won").length,
      totalDeals: deals.length,
      closedDeals: deals.filter((d) => d.stage === "closed_won").length,
      totalRevenue: deals.filter((d) => d.stage === "closed_won").reduce((sum, d) => sum + Number(d.value || 0), 0),
      pendingPayroll: payroll.filter((p) => p.status === "pending").reduce((sum, p) => sum + Number(p.net_salary || 0), 0),
    });

    // Leads by status
    const leadStatusCounts = leads.reduce((acc: any, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});
    setLeadsByStatus(Object.entries(leadStatusCounts).map(([name, value]) => ({ name, value })));

    // Deals by stage
    const dealStageCounts = deals.reduce((acc: any, deal) => {
      acc[deal.stage] = (acc[deal.stage] || 0) + Number(deal.value || 0);
      return acc;
    }, {});
    setDealsByStage(Object.entries(dealStageCounts).map(([name, value]) => ({ name: name.replace("_", " "), value })));

    // Monthly payroll
    const currentYear = new Date().getFullYear();
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthPayroll = payroll.filter((p) => p.year === currentYear && p.month === i + 1);
      return {
        month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
        total: monthPayroll.reduce((sum, p) => sum + Number(p.net_salary || 0), 0),
      };
    });
    setMonthlyPayroll(monthlyData);

    setLoading(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading reports...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="page-description">Analytics and insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Active Employees</p><p className="text-2xl font-bold">{stats.activeEmployees}/{stats.totalEmployees}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><CheckCircle className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Won Leads</p><p className="text-2xl font-bold">{stats.wonLeads}/{stats.totalLeads}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10"><TrendingUp className="h-5 w-5 text-info" /></div>
              <div><p className="text-sm text-muted-foreground">Closed Deals</p><p className="text-2xl font-bold">{stats.closedDeals}/{stats.totalDeals}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10"><DollarSign className="h-5 w-5 text-warning" /></div>
              <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Leads by Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={leadsByStatus} cx="50%" cy="50%" outerRadius={100} fill="hsl(var(--primary))" dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {leadsByStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Deal Pipeline Value</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dealsByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Monthly Payroll ({new Date().getFullYear()})</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyPayroll}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}