import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Shield, Package, AlertTriangle, AlertCircle, Info,
  TrendingUp, Bell, ExternalLink, BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { getStats, getAdvisories } from "@/lib/storage";
import { Advisory } from "@/lib/mockData";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area } from "recharts";

const Dashboard = () => {
  const [stats, setStats] = useState(getStats());
  const [recentAdvisories, setRecentAdvisories] = useState<Advisory[]>([]);

  useEffect(() => {
    setStats(getStats());
    const advisories = getAdvisories();
    setRecentAdvisories(advisories.slice(0, 5));
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Chart data
  const severityChartData = useMemo(() => [
    { name: "Critical", value: stats.critical, fill: "hsl(0 84% 60%)" },
    { name: "High", value: stats.high, fill: "hsl(25 95% 53%)" },
    { name: "Medium", value: stats.medium, fill: "hsl(45 93% 47%)" },
    { name: "Low", value: stats.low, fill: "hsl(142 71% 45%)" },
  ], [stats]);

  const trendChartData = useMemo(() => {
    const advisories = getAdvisories();
    const monthlyData: Record<string, { critical: number; high: number; medium: number; low: number }> = {};
    
    advisories.forEach((advisory) => {
      const date = new Date(advisory.lastModified);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { critical: 0, high: 0, medium: 0, low: 0 };
      }
      
      const severity = advisory.Severity.toLowerCase() as keyof typeof monthlyData[typeof monthKey];
      if (severity in monthlyData[monthKey]) {
        monthlyData[monthKey][severity]++;
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        ...data,
      }));
  }, []);

  const chartConfig = {
    critical: { label: "Critical", color: "hsl(0 84% 60%)" },
    high: { label: "High", color: "hsl(25 95% 53%)" },
    medium: { label: "Medium", color: "hsl(45 93% 47%)" },
    low: { label: "Low", color: "hsl(142 71% 45%)" },
  };

  const pieChartConfig = {
    Critical: { label: "Critical", color: "hsl(0 84% 60%)" },
    High: { label: "High", color: "hsl(25 95% 53%)" },
    Medium: { label: "Medium", color: "hsl(45 93% 47%)" },
    Low: { label: "Low", color: "hsl(142 71% 45%)" },
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Monitor your vulnerability landscape</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard
              title="Total Products"
              value={stats.totalProducts}
              icon={Package}
              variant="accent"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatCard
              title="Critical"
              value={stats.critical}
              icon={AlertCircle}
              variant="critical"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatCard
              title="High"
              value={stats.high}
              icon={AlertTriangle}
              variant="high"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StatCard
              title="Medium"
              value={stats.medium}
              icon={TrendingUp}
              variant="medium"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <StatCard
              title="Low"
              value={stats.low}
              icon={Info}
              variant="low"
            />
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="flex items-center gap-3 p-6 border-b border-border">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Severity Distribution</h2>
                <p className="text-sm text-muted-foreground">Vulnerabilities by severity level</p>
              </div>
            </div>
            <div className="p-6">
              <ChartContainer config={pieChartConfig} className="h-[280px] w-full">
                <PieChart>
                  <Pie
                    data={severityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </div>
          </motion.div>

          {/* Vulnerability Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="flex items-center gap-3 p-6 border-b border-border">
              <div className="h-10 w-10 rounded-lg bg-severity-high/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-severity-high" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Vulnerability Trends</h2>
                <p className="text-sm text-muted-foreground">Monthly vulnerability distribution</p>
              </div>
            </div>
            <div className="p-6">
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <AreaChart data={trendChartData}>
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="critical"
                    stackId="1"
                    stroke="hsl(0 84% 60%)"
                    fill="hsl(0 84% 60% / 0.6)"
                  />
                  <Area
                    type="monotone"
                    dataKey="high"
                    stackId="1"
                    stroke="hsl(25 95% 53%)"
                    fill="hsl(25 95% 53% / 0.6)"
                  />
                  <Area
                    type="monotone"
                    dataKey="medium"
                    stackId="1"
                    stroke="hsl(45 93% 47%)"
                    fill="hsl(45 93% 47% / 0.6)"
                  />
                  <Area
                    type="monotone"
                    dataKey="low"
                    stackId="1"
                    stroke="hsl(142 71% 45%)"
                    fill="hsl(142 71% 45% / 0.6)"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            </div>
          </motion.div>
        </div>

        {/* Recent Advisories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Recent Advisories</h2>
                <p className="text-sm text-muted-foreground">Latest vulnerability alerts</p>
              </div>
            </div>
            <Link to="/advisories" target="_blank">
              <Button variant="outline" size="sm">
                View All
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recentAdvisories.map((advisory) => (
              <div 
                key={advisory.cve_id}
                className="p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    advisory.Severity === 'Critical' ? 'bg-severity-critical/10' :
                    advisory.Severity === 'High' ? 'bg-severity-high/10' :
                    advisory.Severity === 'Medium' ? 'bg-severity-medium/10' :
                    'bg-severity-low/10'
                  }`}>
                    <Shield className={`h-5 w-5 ${
                      advisory.Severity === 'Critical' ? 'text-severity-critical' :
                      advisory.Severity === 'High' ? 'text-severity-high' :
                      advisory.Severity === 'Medium' ? 'text-severity-medium' :
                      'text-severity-low'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {advisory.cve_id}
                      </span>
                      <SeverityBadge severity={advisory.Severity} />
                      <span className="text-xs text-muted-foreground">
                        CVSS {advisory.cvss_score}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {advisory.Description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{advisory.tech_stack_vendor} - {advisory.tech_stack_product}</span>
                      <span>{formatDate(advisory.lastModified)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
