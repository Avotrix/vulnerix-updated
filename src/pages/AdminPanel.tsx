import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, LogOut, Database, Activity, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdmin } from "@/contexts/AdminContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import vulnerixLogo from "@/assets/vulnerix-logo.png";

interface AuditLog {
  id: string;
  admin_id: string;
  page_affected: string;
  action_performed: string;
  previous_value: string | null;
  new_value: string | null;
  created_at: string;
}

// Database schema definitions for display
const databaseSchemas = {
  userAccess: {
    name: 'user_access',
    description: 'User authentication and access records',
    columns: [
      { name: 'user_id', type: 'UUID', constraint: 'PRIMARY KEY', description: 'Unique user identifier' },
      { name: 'user_email_id', type: 'TEXT', constraint: 'UNIQUE, NOT NULL', description: 'User email address' },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraint: 'DEFAULT NOW()', description: 'Account creation timestamp' }
    ]
  },
  userSettings: {
    name: 'user_settings',
    description: 'User preferences and notification settings',
    columns: [
      { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY', description: 'Settings record ID' },
      { name: 'org_name', type: 'TEXT', constraint: 'NOT NULL', description: 'Organization name' },
      { name: 'email_id', type: 'TEXT', constraint: 'NOT NULL', description: 'User email' },
      { name: 'notification_level', type: 'TEXT', constraint: 'DEFAULT "all"', description: 'Notification preference' }
    ]
  },
  techStack: {
    name: 'tech_stack',
    description: 'User-uploaded technology stack inventory',
    columns: [
      { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY', description: 'Record ID' },
      { name: 'vendor', type: 'TEXT', constraint: 'NOT NULL', description: 'Software vendor name' },
      { name: 'product_name', type: 'TEXT', constraint: 'NOT NULL', description: 'Product or software name' },
      { name: 'version', type: 'TEXT', constraint: 'NULLABLE', description: 'Product version' },
      { name: 'org_name', type: 'TEXT', constraint: 'NOT NULL', description: 'Organization name' },
      { name: 'email_id', type: 'TEXT', constraint: 'NOT NULL', description: 'User email' }
    ]
  },
  techStackResults: {
    name: 'tech_stack_results',
    description: 'CVE and CERT-IN matching results',
    columns: [
      { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY', description: 'Record ID' },
      { name: 'vendor', type: 'TEXT', constraint: 'NOT NULL', description: 'Matched vendor' },
      { name: 'product_name', type: 'TEXT', constraint: 'NOT NULL', description: 'Matched product' },
      { name: 'cve_match', type: 'TEXT', constraint: 'NULLABLE', description: 'CVE identifier' },
      { name: 'severity_cve', type: 'TEXT', constraint: 'NULLABLE', description: 'CVE severity' },
      { name: 'cert_in', type: 'TEXT', constraint: 'NULLABLE', description: 'CERT-IN advisory' },
      { name: 'severity_cert_in', type: 'TEXT', constraint: 'NULLABLE', description: 'CERT-IN severity' }
    ]
  },
  userRoles: {
    name: 'user_roles',
    description: 'Role-based access control',
    columns: [
      { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY', description: 'Role record ID' },
      { name: 'user_id', type: 'UUID', constraint: 'NOT NULL', description: 'User ID reference' },
      { name: 'role', type: 'app_role', constraint: 'NOT NULL', description: 'Role: admin or user' }
    ]
  }
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { isAdminAuthenticated, isAdminLoading } = useAdmin();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'schema' | 'audit'>('schema');

  // Redirect if not admin
  useEffect(() => {
    if (!isAdminLoading && !isAdminAuthenticated) {
      toast({
        title: "Access Denied",
        description: "You must be an admin to access this page.",
        variant: "destructive"
      });
      navigate('/admin');
    }
  }, [isAdminAuthenticated, isAdminLoading, navigate, toast]);

  // Fetch audit logs from database
  useEffect(() => {
    const fetchAuditLogs = async () => {
      if (!isAdminAuthenticated) return;

      try {
        const { data, error } = await supabase
          .from('admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error fetching audit logs:', error);
        } else {
          setAuditLogs(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchAuditLogs();
  }, [isAdminAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={vulnerixLogo} alt="Vulnerix" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Server-Verified RBAC Access</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <span className="text-sm text-accent font-medium">Admin</span>
            </div>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Admin Status</h2>
            </div>
            <p className="text-2xl font-bold text-accent">Verified</p>
            <p className="text-sm text-muted-foreground">Server-side RBAC</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Database</h2>
            </div>
            <p className="text-2xl font-bold text-accent">Connected</p>
            <p className="text-sm text-muted-foreground">Supabase Cloud</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Audit Logs</h2>
            </div>
            <p className="text-2xl font-bold text-accent">{auditLogs.length}</p>
            <p className="text-sm text-muted-foreground">Read-only records</p>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={activeTab === 'schema' ? 'default' : 'outline'}
            onClick={() => setActiveTab('schema')}
          >
            <Database className="h-4 w-4 mr-2" />
            Database Schema
          </Button>
          <Button 
            variant={activeTab === 'audit' ? 'default' : 'outline'}
            onClick={() => setActiveTab('audit')}
          >
            <Activity className="h-4 w-4 mr-2" />
            Audit Logs
          </Button>
        </div>

        {/* Schema Viewer */}
        {activeTab === 'schema' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">Database Schema Viewer</h2>
              <p className="text-sm text-muted-foreground">Read-only view of database structure</p>
            </div>

            {Object.entries(databaseSchemas).map(([key, table]) => (
              <Card key={key} className="border-border">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setExpandedTable(expandedTable === key ? null : key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-accent" />
                      <div>
                        <CardTitle className="text-lg">{table.name}</CardTitle>
                        <CardDescription>{table.description}</CardDescription>
                      </div>
                    </div>
                    {expandedTable === key ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                
                {expandedTable === key && (
                  <CardContent>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-medium text-foreground">Column</th>
                            <th className="text-left p-3 font-medium text-foreground">Type</th>
                            <th className="text-left p-3 font-medium text-foreground">Constraint</th>
                            <th className="text-left p-3 font-medium text-foreground">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map((col, i) => (
                            <tr key={col.name} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                              <td className="p-3 font-mono text-accent">{col.name}</td>
                              <td className="p-3 text-muted-foreground">{col.type}</td>
                              <td className="p-3 text-muted-foreground">{col.constraint}</td>
                              <td className="p-3 text-foreground">{col.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </motion.div>
        )}

        {/* Audit Logs */}
        {activeTab === 'audit' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Audit Log</h2>
              <p className="text-sm text-muted-foreground">Immutable, read-only record of admin actions</p>
            </div>

            {isLoadingLogs ? (
              <div className="p-6 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto mb-2"></div>
                Loading audit logs...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No audit logs recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Page
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Previous
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        New
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {log.page_affected}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {log.action_performed}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate">
                          {log.previous_value || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate">
                          {log.new_value || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-6 text-center">
          <Link 
            to="/dashboard" 
            className="text-sm text-accent hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
