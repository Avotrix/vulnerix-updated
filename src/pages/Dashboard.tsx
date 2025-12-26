import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, Package, AlertTriangle, AlertCircle, Info,
  TrendingUp, Bell, ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { getStats, getAdvisories } from "@/lib/storage";
import { Advisory } from "@/lib/mockData";
import DashboardLayout from "@/components/layout/DashboardLayout";

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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-navy">Dashboard</h1>
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

        {/* Recent Advisories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-navy">Recent Advisories</h2>
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
                      <span className="font-mono text-sm font-semibold text-navy">
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
