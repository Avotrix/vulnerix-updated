// Dashboard page component
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Shield, Package, AlertTriangle, AlertCircle, Info,
  TrendingUp, Bell, ExternalLink, BarChart3, Activity, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { useDashboardStats, useTechStackResults } from "@/hooks/useSupabaseData";
import { useRealtimeResults } from "@/hooks/useRealtimeResults";
import { getCertInToggle, setCertInToggle } from "@/lib/storage";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis } from "recharts";

const Dashboard = () => {
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { results: allAdvisories, isLoading: advisoriesLoading, refetch: refetchResults } = useTechStackResults();
  const [certInEnabled, setCertInEnabledState] = useState(getCertInToggle);

  // Real-time subscription for auto-updating dashboard
  const handleRealtimeUpdate = useCallback(() => {
    console.log('[Dashboard] Real-time update received, refetching data...');
    refetchStats();
    refetchResults();
  }, [refetchStats, refetchResults]);

  // Subscribe to real-time updates from tech_stack_results
  useRealtimeResults(handleRealtimeUpdate);

  const handleCertInToggle = (enabled: boolean) => {
    setCertInEnabledState(enabled);
    setCertInToggle(enabled);
  };

  // Filter advisories based on CERT-In toggle
  const filteredAdvisories = useMemo(() => {
    if (certInEnabled) {
      return allAdvisories; // Include all (NVD + CERT-In)
    }
    // NVD only - exclude advisories that are CERT-In only (no CVE ID)
    return allAdvisories.filter(a => a.cve_id && a.cve_id.startsWith('CVE-'));
  }, [allAdvisories, certInEnabled]);

  // Calculate filtered stats based on toggle
  const filteredStats = useMemo(() => {
    return {
      totalProducts: stats.totalProducts,
      critical: filteredAdvisories.filter(a => a.Severity === 'Critical').length,
      high: filteredAdvisories.filter(a => a.Severity === 'High').length,
      medium: filteredAdvisories.filter(a => a.Severity === 'Medium').length,
      low: filteredAdvisories.filter(a => a.Severity === 'Low').length,
      totalAdvisories: filteredAdvisories.length
    };
  }, [filteredAdvisories, stats.totalProducts]);

  // Count CVE and CERT-In entries (only when CERT-In is enabled)
  const cveCount = useMemo(() => {
    return filteredAdvisories.filter(a => a.cve_id && a.cve_id.startsWith('CVE-')).length;
  }, [filteredAdvisories]);

  const certInCount = useMemo(() => {
    if (!certInEnabled) return 0;
    return filteredAdvisories.filter(a => a.cvin_id && a.cvin_id.trim() !== '').length;
  }, [filteredAdvisories, certInEnabled]);

  // Calculate overall risk level based on filtered data
  const overallRiskLevel = useMemo(() => {
    if (filteredStats.critical > 0) return { level: 'CRITICAL', color: 'text-severity-critical', bg: 'bg-severity-critical/10' };
    if (filteredStats.high > 0) return { level: 'HIGH', color: 'text-severity-high', bg: 'bg-severity-high/10' };
    if (filteredStats.medium > 0) return { level: 'MEDIUM', color: 'text-severity-medium', bg: 'bg-severity-medium/10' };
    if (filteredStats.low > 0) return { level: 'LOW', color: 'text-severity-low', bg: 'bg-severity-low/10' };
    return { level: 'NONE', color: 'text-muted-foreground', bg: 'bg-muted' };
  }, [filteredStats]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Chart data - uses filtered stats
  const severityChartData = useMemo(() => [
    { name: "Critical", value: filteredStats.critical, fill: "hsl(0 84% 60%)" },
    { name: "High", value: filteredStats.high, fill: "hsl(25 95% 53%)" },
    { name: "Medium", value: filteredStats.medium, fill: "hsl(45 93% 47%)" },
    { name: "Low", value: filteredStats.low, fill: "hsl(142 71% 45%)" },
  ].filter(item => item.value > 0), [filteredStats]);

  const trendChartData = useMemo(() => {
    const monthlyData: Record<string, { critical: number; high: number; medium: number; low: number }> = {};
    
    filteredAdvisories.forEach((advisory) => {
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
  }, [filteredAdvisories]);

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

  const isLoading = statsLoading || advisoriesLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Monitor your vulnerability landscape</p>
          </div>
          
          {/* CERT-In Toggle Only */}
          <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
            <Switch
              id="certin-toggle"
              checked={certInEnabled}
              onCheckedChange={handleCertInToggle}
            />
            <Label htmlFor="certin-toggle" className="text-sm font-medium cursor-pointer">
              CERT-In
            </Label>
          </div>
        </div>

        {/* Security Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="mb-6">
            <h2 className="text-xl font-display font-bold text-foreground">Security Overview</h2>
            <p className="text-sm text-muted-foreground">Monitor your organization's software vulnerabilities and security advisories.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Software/Products */}
            <div className="bg-secondary dark:bg-secondary rounded-xl p-5 border border-border/50">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-accent">Total Software</span>
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-accent" />
                </div>
              </div>
              <div className="text-4xl font-display font-bold text-foreground mb-1">{stats.totalProducts}</div>
              <span className="text-xs text-muted-foreground">Across all systems</span>
            </div>

            {/* Total Advisories */}
            <div className="bg-secondary dark:bg-secondary rounded-xl p-5 border border-border/50">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-severity-medium">Total Advisories</span>
                <div className="h-10 w-10 rounded-lg bg-severity-medium/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-severity-medium" />
                </div>
              </div>
              <div className="text-4xl font-display font-bold text-foreground mb-1">{filteredStats.totalAdvisories}</div>
              <span className="text-xs text-muted-foreground">Active vulnerabilities</span>
            </div>

            {/* Critical Risk KPI */}
            <div className="bg-secondary dark:bg-secondary rounded-xl p-5 border border-border/50">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-severity-critical">Critical Risk</span>
                <div className="h-10 w-10 rounded-lg bg-severity-critical/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-severity-critical" />
                </div>
              </div>
              
              {certInEnabled ? (
                <div className="space-y-3">
                  <div className="bg-card dark:bg-muted/50 rounded-lg p-3 border border-border/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">CVE Criticality</span>
                      <span className="text-2xl font-display font-bold text-foreground">
                        {filteredAdvisories.filter(a => a.cve_id && a.cve_id.startsWith('CVE-') && (a.Severity === 'Critical' || a.Severity === 'High')).length}
                      </span>
                    </div>
                  </div>
                  <div className="bg-card dark:bg-muted/50 rounded-lg p-3 border border-border/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">CERT-IN Criticality</span>
                      <span className="text-2xl font-display font-bold text-foreground">
                        {filteredAdvisories.filter(a => a.cvin_id && a.cvin_id.trim() !== '' && (a.Severity === 'Critical' || a.Severity === 'High')).length}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-4xl font-display font-bold text-foreground mb-1">
                    {filteredAdvisories.filter(a => a.cve_id && a.cve_id.startsWith('CVE-') && (a.Severity === 'Critical' || a.Severity === 'High')).length}
                  </div>
                  <span className="text-xs text-muted-foreground">CVE Critical/High alerts</span>
                </>
              )}
            </div>

            {/* Overall Risk Level */}
            <div className="bg-secondary dark:bg-secondary rounded-xl p-5 border border-border/50">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Overall Risk Level</span>
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", overallRiskLevel.bg)}>
                  <Activity className={cn("h-5 w-5", overallRiskLevel.color)} />
                </div>
              </div>
              <div className={cn("text-3xl font-display font-bold", overallRiskLevel.color)}>
                {overallRiskLevel.level}
              </div>
              <span className="text-xs text-muted-foreground">Based on severity distribution</span>
            </div>
          </div>
        </motion.div>

        {/* Trending Vulnerabilities - Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Trending Vulnerabilities</h2>
                <p className="text-sm text-muted-foreground">Real-time trending threats</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
              Coming Soon
            </span>
          </div>
        </motion.div>

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
              {severityChartData.length > 0 ? (
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
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  No vulnerability data available
                </div>
              )}
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
              {trendChartData.length > 0 ? (
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
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
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
              <div className="h-10 w-10 rounded-lg bg-severity-critical/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-severity-critical" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Recent Advisories</h2>
                <p className="text-sm text-muted-foreground">Latest vulnerability alerts</p>
              </div>
            </div>
            <Link to="/advisories">
              <Button variant="outline" size="sm">
                View All
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          <div className="divide-y divide-border">
            {filteredAdvisories.slice(0, 5).map((advisory, index) => (
              <div
                key={advisory.cve_id}
                className="p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    advisory.Severity === 'Critical' ? 'bg-severity-critical/10' : 
                    advisory.Severity === 'High' ? 'bg-severity-high/10' :
                    advisory.Severity === 'Medium' ? 'bg-severity-medium/10' :
                    'bg-severity-low/10'
                  )}>
                    <AlertCircle className={cn(
                      "h-5 w-5",
                      advisory.Severity === 'Critical' ? 'text-severity-critical' : 
                      advisory.Severity === 'High' ? 'text-severity-high' :
                      advisory.Severity === 'Medium' ? 'text-severity-medium' :
                      'text-severity-low'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {advisory.cve_id}
                      </span>
                      <SeverityBadge severity={advisory.Severity} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {advisory.Description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {advisory.tech_stack_product} • {formatDate(advisory.lastModified)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {filteredAdvisories.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No advisories yet. Add products to your tech stack to see vulnerability alerts.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
