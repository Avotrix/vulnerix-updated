import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Database, Home, Layout, Palette, LayoutDashboard, 
  FileText, Bell, ClipboardList, LogOut, Shield,
  Eye, EyeOff, Download, ChevronDown, ChevronRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdmin } from "@/contexts/AdminContext";
import { useToast } from "@/hooks/use-toast";
import vulnerixLogo from "@/assets/vulnerix-logo.png";

// Database schema definitions
const databaseSchemas = {
  userAccess: {
    name: 'userAccess',
    description: 'User authentication and access credentials',
    columns: [
      { name: 'userID', type: 'UUID', constraint: 'PRIMARY KEY', description: 'Unique user identifier' },
      { name: 'userEmailID', type: 'VARCHAR(255)', constraint: 'UNIQUE, NOT NULL', description: 'User email address' },
      { name: 'pass', type: 'VARCHAR(255)', constraint: 'NOT NULL', description: 'Hashed password (not visible to admin)' }
    ]
  },
  userSettings: {
    name: 'userSettings',
    description: 'User preferences and notification settings',
    columns: [
      { name: 'orgName', type: 'VARCHAR(255)', constraint: 'NOT NULL', description: 'Organization name' },
      { name: 'emailID', type: 'VARCHAR(255)', constraint: 'FOREIGN KEY', description: 'Reference to userAccess.userEmailID' },
      { name: 'notificationLevel', type: 'ENUM', constraint: 'DEFAULT "all"', description: 'Notification severity filter' }
    ]
  },
  techStack: {
    name: 'techStack',
    description: 'User-uploaded technology stack inventory',
    columns: [
      { name: 'vendor', type: 'VARCHAR(255)', constraint: 'NOT NULL', description: 'Software vendor name' },
      { name: 'productName', type: 'VARCHAR(255)', constraint: 'NOT NULL', description: 'Product or software name' },
      { name: 'version', type: 'VARCHAR(100)', constraint: 'NOT NULL', description: 'Product version' },
      { name: 'orgName', type: 'VARCHAR(255)', constraint: 'NOT NULL', description: 'Organization name (partition key)' },
      { name: 'emailID', type: 'VARCHAR(255)', constraint: 'FOREIGN KEY', description: 'User email (partition key)' }
    ]
  },
  techStackResults: {
    name: 'techStackResults',
    description: 'CVE and CERT-IN matching results for tech stack',
    columns: [
      { name: 'vendor', type: 'VARCHAR(255)', constraint: 'NOT NULL', description: 'Matched vendor name' },
      { name: 'productName', type: 'VARCHAR(255)', constraint: 'NOT NULL', description: 'Matched product name' },
      { name: 'version', type: 'VARCHAR(100)', constraint: 'NOT NULL', description: 'Matched version' },
      { name: 'orgName', type: 'VARCHAR(255)', constraint: 'PARTITION KEY', description: 'Organization partition' },
      { name: 'emailID', type: 'VARCHAR(255)', constraint: 'PARTITION KEY', description: 'User email partition' },
      { name: 'CVEMatch', type: 'VARCHAR(50)', constraint: 'NULL', description: 'Matched CVE identifier' },
      { name: 'severityCVE', type: 'ENUM', constraint: 'NULL', description: 'CVE severity level' },
      { name: 'CERTIN', type: 'VARCHAR(50)', constraint: 'NULL', description: 'Matched CERT-IN advisory' },
      { name: 'severityCERTIN', type: 'ENUM', constraint: 'NULL', description: 'CERT-IN severity level' }
    ]
  }
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { adminLogout, settings, updateSettings, auditLogs, addAuditLog } = useAdmin();
  const [activeTab, setActiveTab] = useState('schema');
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  // Local state for form edits
  const [homeContent, setHomeContent] = useState(settings.homePageContent);
  const [notificationSettings, setNotificationSettings] = useState(settings.notificationSettings);
  const [themeSettings, setThemeSettings] = useState({
    defaultDarkMode: settings.defaultDarkMode,
    buttonRadius: settings.buttonRadius,
    fontSizeScale: settings.fontSizeScale,
    cardShadowIntensity: settings.cardShadowIntensity
  });
  const [dashboardSettings, setDashboardSettings] = useState({
    visibleKPIs: settings.visibleKPIs,
    certInVisible: settings.certInVisible,
    nestedTilesEnabled: settings.nestedTilesEnabled
  });

  const handleLogout = () => {
    adminLogout();
    navigate('/');
    toast({
      title: "Logged Out",
      description: "Admin session ended.",
    });
  };

  const handleSaveHomeContent = () => {
    updateSettings({ homePageContent: homeContent });
    addAuditLog({
      adminId: 'admin-001',
      pageAffected: 'Home Page',
      actionPerformed: 'Update Content',
      previousValue: JSON.stringify(settings.homePageContent),
      newValue: JSON.stringify(homeContent)
    });
    toast({ title: "Saved", description: "Home page content updated." });
  };

  const handleSaveTheme = () => {
    updateSettings(themeSettings);
    addAuditLog({
      adminId: 'admin-001',
      pageAffected: 'Theme Settings',
      actionPerformed: 'Update Theme',
      previousValue: JSON.stringify({
        defaultDarkMode: settings.defaultDarkMode,
        buttonRadius: settings.buttonRadius
      }),
      newValue: JSON.stringify(themeSettings)
    });
    toast({ title: "Saved", description: "Theme settings updated." });
  };

  const handleSaveDashboard = () => {
    updateSettings(dashboardSettings);
    addAuditLog({
      adminId: 'admin-001',
      pageAffected: 'Dashboard',
      actionPerformed: 'Update Display Config',
      previousValue: JSON.stringify({
        visibleKPIs: settings.visibleKPIs,
        certInVisible: settings.certInVisible
      }),
      newValue: JSON.stringify(dashboardSettings)
    });
    toast({ title: "Saved", description: "Dashboard settings updated." });
  };

  const handleSaveNotifications = () => {
    updateSettings({ notificationSettings });
    addAuditLog({
      adminId: 'admin-001',
      pageAffected: 'Notifications',
      actionPerformed: 'Update Settings',
      previousValue: JSON.stringify(settings.notificationSettings),
      newValue: JSON.stringify(notificationSettings)
    });
    toast({ title: "Saved", description: "Notification settings updated." });
  };

  const exportAuditLogs = () => {
    const csvContent = [
      ['ID', 'Admin ID', 'Timestamp', 'Page', 'Action', 'Previous Value', 'New Value'],
      ...auditLogs.map(log => [
        log.id,
        log.adminId,
        new Date(log.timestamp).toISOString(),
        log.pageAffected,
        log.actionPerformed,
        log.previousValue,
        log.newValue
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const sidebarItems = [
    { id: 'schema', label: 'Database Schema', icon: Database },
    { id: 'home', label: 'Home Page Editor', icon: Home },
    { id: 'pages', label: 'Page Structure', icon: Layout },
    { id: 'theme', label: 'Theme & UI', icon: Palette },
    { id: 'dashboard', label: 'Dashboard Config', icon: LayoutDashboard },
    { id: 'content', label: 'Content (CMS)', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'audit', label: 'Audit Logs', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-display font-bold text-foreground">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">Vulnerix Control</p>
            </div>
          </div>
        </div>

        <nav className="p-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id 
                  ? 'bg-destructive/10 text-destructive' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 w-56">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground mt-1">
              <Home className="h-4 w-4 mr-2" />
              Back to Site
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Database Schema Viewer */}
          {activeTab === 'schema' && (
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">Database Schema</h1>
              <p className="text-muted-foreground mb-6">View-only access to database table structures.</p>

              <div className="space-y-4">
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
              </div>
            </div>
          )}

          {/* Home Page Editor */}
          {activeTab === 'home' && (
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">Home Page Editor</h1>
              <p className="text-muted-foreground mb-6">Edit static content on the home page.</p>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Hero Section</CardTitle>
                  <CardDescription>Main headline and subtext</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Hero Title</Label>
                    <Input 
                      value={homeContent.heroText}
                      onChange={(e) => setHomeContent(prev => ({ ...prev, heroText: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Hero Subtitle</Label>
                    <Input 
                      value={homeContent.heroSubtext}
                      onChange={(e) => setHomeContent(prev => ({ ...prev, heroSubtext: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Footer Text</Label>
                    <Input 
                      value={homeContent.footerText}
                      onChange={(e) => setHomeContent(prev => ({ ...prev, footerText: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleSaveHomeContent}>Save Changes</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Page Structure Editor */}
          {activeTab === 'pages' && (
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">Page Structure</h1>
              <p className="text-muted-foreground mb-6">Control section visibility across pages.</p>

              <div className="grid gap-4">
                {['Home', 'Dashboard', 'Advisories', 'Tech Stack', 'Contact'].map((page) => (
                  <Card key={page} className="border-border">
                    <CardHeader>
                      <CardTitle>{page}</CardTitle>
                      <CardDescription>Toggle sections on/off</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4">
                        {['Header', 'Main Content', 'Sidebar', 'Footer'].map((section) => (
                          <div key={section} className="flex items-center gap-2">
                            <Switch defaultChecked id={`${page}-${section}`} />
                            <Label htmlFor={`${page}-${section}`} className="text-foreground">{section}</Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Theme & UI Control */}
          {activeTab === 'theme' && (
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">Theme & UI Control</h1>
              <p className="text-muted-foreground mb-6">Adjust visual settings within safe boundaries.</p>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Visual Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">Default Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">Enable dark mode by default for new users</p>
                    </div>
                    <Switch 
                      checked={themeSettings.defaultDarkMode}
                      onCheckedChange={(checked) => setThemeSettings(prev => ({ ...prev, defaultDarkMode: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Button Border Radius: {themeSettings.buttonRadius}px</Label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={themeSettings.buttonRadius}
                      onChange={(e) => setThemeSettings(prev => ({ ...prev, buttonRadius: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Font Size Scale: {themeSettings.fontSizeScale}x</Label>
                    <input
                      type="range"
                      min="0.8"
                      max="1.2"
                      step="0.05"
                      value={themeSettings.fontSizeScale}
                      onChange={(e) => setThemeSettings(prev => ({ ...prev, fontSizeScale: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Card Shadow Intensity: {themeSettings.cardShadowIntensity}x</Label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={themeSettings.cardShadowIntensity}
                      onChange={(e) => setThemeSettings(prev => ({ ...prev, cardShadowIntensity: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <Button onClick={handleSaveTheme}>Save Theme Settings</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dashboard Display Config */}
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">Dashboard Configuration</h1>
              <p className="text-muted-foreground mb-6">Control KPI visibility and display options.</p>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle>KPI Display Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    {[
                      { id: 'totalProducts', label: 'Total Products' },
                      { id: 'totalAdvisories', label: 'Total Advisories' },
                      { id: 'criticalRisk', label: 'Critical Risk' },
                      { id: 'overallRisk', label: 'Overall Risk Level' }
                    ].map((kpi) => (
                      <div key={kpi.id} className="flex items-center justify-between">
                        <Label className="text-foreground">{kpi.label}</Label>
                        <Switch 
                          checked={dashboardSettings.visibleKPIs.includes(kpi.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setDashboardSettings(prev => ({
                                ...prev,
                                visibleKPIs: [...prev.visibleKPIs, kpi.id]
                              }));
                            } else {
                              setDashboardSettings(prev => ({
                                ...prev,
                                visibleKPIs: prev.visibleKPIs.filter(id => id !== kpi.id)
                              }));
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Label className="text-foreground">CERT-IN Visibility</Label>
                        <p className="text-sm text-muted-foreground">Show CERT-IN data in dashboard</p>
                      </div>
                      <Switch 
                        checked={dashboardSettings.certInVisible}
                        onCheckedChange={(checked) => setDashboardSettings(prev => ({ ...prev, certInVisible: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">Nested Tiles</Label>
                        <p className="text-sm text-muted-foreground">Show nested CVE/CERT-IN tiles when enabled</p>
                      </div>
                      <Switch 
                        checked={dashboardSettings.nestedTilesEnabled}
                        onCheckedChange={(checked) => setDashboardSettings(prev => ({ ...prev, nestedTilesEnabled: checked }))}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveDashboard}>Save Dashboard Settings</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Content Management */}
          {activeTab === 'content' && (
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">Content Management</h1>
              <p className="text-muted-foreground mb-6">Manage announcements and notices.</p>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Announcements</CardTitle>
                  <CardDescription>Create and manage site-wide announcements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <p>No active announcements</p>
                      <Button variant="outline" size="sm" className="mt-2">Add Announcement</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">Notification Settings</h1>
              <p className="text-muted-foreground mb-6">Configure email notifications and templates.</p>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Company Mail ID</Label>
                    <Input 
                      value={notificationSettings.companyMailId}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, companyMailId: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Footer Disclaimer</Label>
                    <Input 
                      value={notificationSettings.footerDisclaimer}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, footerDisclaimer: e.target.value }))}
                    />
                  </div>

                  <Button onClick={handleSaveNotifications}>Save Notification Settings</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Audit Logs */}
          {activeTab === 'audit' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-display font-bold text-foreground">Audit Logs</h1>
                  <p className="text-muted-foreground">All admin actions are logged here.</p>
                </div>
                <Button variant="outline" onClick={exportAuditLogs}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              <Card className="border-border">
                <CardContent className="p-0">
                  <div className="max-h-[600px] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-3 font-medium text-foreground">Timestamp</th>
                          <th className="text-left p-3 font-medium text-foreground">Admin</th>
                          <th className="text-left p-3 font-medium text-foreground">Page</th>
                          <th className="text-left p-3 font-medium text-foreground">Action</th>
                          <th className="text-left p-3 font-medium text-foreground">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                              No audit logs yet. Actions will be recorded here.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log, i) => (
                            <tr key={log.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                              <td className="p-3 text-muted-foreground">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="p-3 text-foreground">{log.adminId}</td>
                              <td className="p-3 text-foreground">{log.pageAffected}</td>
                              <td className="p-3 text-foreground">{log.actionPerformed}</td>
                              <td className="p-3 text-muted-foreground text-xs max-w-xs truncate">
                                {log.previousValue} → {log.newValue}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default AdminPanel;
