import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Target,
  Briefcase,
  Users,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
}

function StatCard({ title, value, change, trend, icon }: StatCardProps) {
  return (
    <Card className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {trend === "up" && <TrendingUp className="h-4 w-4 text-success" />}
              {trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
              <span
                className={`text-sm ${
                  trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {change}
              </span>
            </div>
          )}
        </div>
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </Card>
  );
}

const revenueData = [
  { month: "Jan", value: 4000 },
  { month: "Feb", value: 3000 },
  { month: "Mar", value: 5000 },
  { month: "Apr", value: 4500 },
  { month: "May", value: 6000 },
  { month: "Jun", value: 5500 },
];

const dealStageData = [
  { name: "Prospecting", value: 12, color: "hsl(217, 91%, 60%)" },
  { name: "Qualification", value: 8, color: "hsl(142, 76%, 36%)" },
  { name: "Proposal", value: 15, color: "hsl(38, 92%, 50%)" },
  { name: "Negotiation", value: 6, color: "hsl(280, 87%, 65%)" },
  { name: "Closed Won", value: 10, color: "hsl(142, 76%, 46%)" },
];

const taskData = [
  { name: "Mon", completed: 8, pending: 3 },
  { name: "Tue", completed: 12, pending: 5 },
  { name: "Wed", completed: 6, pending: 4 },
  { name: "Thu", completed: 10, pending: 2 },
  { name: "Fri", completed: 15, pending: 6 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    leads: 0,
    deals: 0,
    employees: 0,
    tasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [leadsRes, dealsRes, employeesRes, tasksRes] = await Promise.all([
          supabase.from("leads").select("id", { count: "exact", head: true }),
          supabase.from("deals").select("id", { count: "exact", head: true }),
          supabase.from("employees").select("id", { count: "exact", head: true }),
          supabase.from("tasks").select("id", { count: "exact", head: true }),
        ]);

        setStats({
          leads: leadsRes.count || 0,
          deals: dealsRes.count || 0,
          employees: employeesRes.count || 0,
          tasks: tasksRes.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">{greeting()}, {user?.email?.split("@")[0]}!</h1>
        <p className="page-description">Here's what's happening with your business today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={stats.leads}
          change="+12% from last month"
          trend="up"
          icon={<Target className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Active Deals"
          value={stats.deals}
          change="+8% from last month"
          trend="up"
          icon={<Briefcase className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Employees"
          value={stats.employees}
          change="No change"
          trend="neutral"
          icon={<Users className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Open Tasks"
          value={stats.tasks}
          change="-5% from last week"
          trend="down"
          icon={<ClipboardList className="h-6 w-6 text-primary" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenue Overview</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/reports">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Deal Pipeline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Deal Pipeline</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/deals">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dealStageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dealStageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              {dealStageData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Weekly Task Overview</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tasks">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="completed" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="justify-start">
              <Link to="/leads">
                <Plus className="mr-2 h-4 w-4" /> New Lead
              </Link>
            </Button>
            <Button asChild variant="secondary" className="justify-start">
              <Link to="/deals">
                <Plus className="mr-2 h-4 w-4" /> New Deal
              </Link>
            </Button>
            <Button asChild variant="secondary" className="justify-start">
              <Link to="/tasks">
                <Plus className="mr-2 h-4 w-4" /> New Task
              </Link>
            </Button>
            <Button asChild variant="secondary" className="justify-start">
              <Link to="/contacts">
                <Plus className="mr-2 h-4 w-4" /> New Contact
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
