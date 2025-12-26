import { ReactNode, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, FileText, Package, Settings, 
  LogOut, User, ChevronDown, Bell, Phone, Shield, X
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getAdvisories } from "@/lib/storage";
import { Advisory } from "@/lib/mockData";
import { SeverityBadge } from "@/components/ui/severity-badge";
import vulnerixLogo from "@/assets/vulnerix-logo.png";

interface DashboardLayoutProps {
  children: ReactNode;
}

const READ_NOTIFICATIONS_KEY = 'vulnerix_read_notifications';

const getReadNotifications = (): string[] => {
  const data = localStorage.getItem(READ_NOTIFICATIONS_KEY);
  return data ? JSON.parse(data) : [];
};

const markNotificationAsRead = (cveId: string) => {
  const readIds = getReadNotifications();
  if (!readIds.includes(cveId)) {
    readIds.push(cveId);
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(readIds));
  }
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Advisory[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    const advisories = getAdvisories();
    const readIds = getReadNotifications();
    // Get critical and high severity advisories that are unread
    const unreadAdvisories = advisories.filter(
      (a) => (a.Severity === 'Critical' || a.Severity === 'High') && !readIds.includes(a.cve_id)
    ).slice(0, 10);
    setNotifications(unreadAdvisories);
  }, [location.pathname]);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Advisories', path: '/advisories' },
    { icon: Package, label: 'Tech Stack', path: '/tech-stack' },
    { icon: Phone, label: 'Contact', path: '/contact' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src={vulnerixLogo} alt="Vulnerix Logo" className="h-10 w-10" />
              <span className="text-xl font-display font-bold text-navy">Vulnerix</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-severity-critical rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 bg-card">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  <span className="text-xs text-muted-foreground">{notifications.length} alerts</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No critical alerts
                    </div>
                  ) : (
                    notifications.map((advisory) => (
                      <div
                        key={advisory.cve_id}
                        className="p-3 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          // Mark as read
                          markNotificationAsRead(advisory.cve_id);
                          // Remove from local state
                          setNotifications(prev => prev.filter(n => n.cve_id !== advisory.cve_id));
                          setIsNotificationOpen(false);
                          // Navigate to advisories with the CVE ID as search param
                          navigate(`/advisories?cve=${advisory.cve_id}`);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            advisory.Severity === 'Critical' ? 'bg-severity-critical/10' : 'bg-severity-high/10'
                          )}>
                            <Shield className={cn(
                              "h-4 w-4",
                              advisory.Severity === 'Critical' ? 'text-severity-critical' : 'text-severity-high'
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-semibold text-foreground">
                                {advisory.cve_id}
                              </span>
                              <SeverityBadge severity={advisory.Severity} />
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {advisory.tech_stack_product}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setIsNotificationOpen(false);
                      navigate('/advisories');
                    }}
                  >
                    View All Advisories
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-accent" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium">{user?.name || 'User'}</div>
                    <div className="text-xs text-muted-foreground">{user?.organization || 'Organization'}</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-6 py-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;
