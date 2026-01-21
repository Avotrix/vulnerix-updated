import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AdminAuditLog {
  id: string;
  adminId: string;
  timestamp: Date;
  pageAffected: string;
  actionPerformed: string;
  previousValue: string;
  newValue: string;
}

interface AdminSettings {
  defaultDarkMode: boolean;
  primaryAccent: string;
  secondaryAccent: string;
  buttonRadius: number;
  fontSizeScale: number;
  cardShadowIntensity: number;
  visibleKPIs: string[];
  kpiOrder: string[];
  certInVisible: boolean;
  nestedTilesEnabled: boolean;
  announcements: Announcement[];
  notificationSettings: {
    companyMailId: string;
    templates: { [key: string]: string };
    severityWording: { [key: string]: string };
    footerDisclaimer: string;
  };
  pageVisibility: { [page: string]: { [section: string]: boolean } };
  homePageContent: {
    heroText: string;
    heroSubtext: string;
    footerText: string;
  };
}

interface Announcement {
  id: string;
  message: string;
  startDate: Date;
  endDate: Date;
  priority: 'low' | 'medium' | 'high';
  scope: 'all' | 'dashboard' | 'home';
  active: boolean;
}

interface AdminContextType {
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  settings: AdminSettings;
  updateSettings: (newSettings: Partial<AdminSettings>) => void;
  auditLogs: AdminAuditLog[];
  addAuditLog: (log: Omit<AdminAuditLog, 'id' | 'timestamp'>) => void;
}

const ADMIN_KEY = 'vulnerix_admin';
const ADMIN_SETTINGS_KEY = 'vulnerix_admin_settings';
const ADMIN_AUDIT_KEY = 'vulnerix_admin_audit';

const defaultSettings: AdminSettings = {
  defaultDarkMode: false,
  primaryAccent: '#0ea5e9',
  secondaryAccent: '#1e3a5f',
  buttonRadius: 8,
  fontSizeScale: 1,
  cardShadowIntensity: 1,
  visibleKPIs: ['totalProducts', 'totalAdvisories', 'criticalRisk', 'overallRisk'],
  kpiOrder: ['totalProducts', 'totalAdvisories', 'criticalRisk', 'overallRisk'],
  certInVisible: true,
  nestedTilesEnabled: true,
  announcements: [],
  notificationSettings: {
    companyMailId: 'security@vulnerix.com',
    templates: {
      critical: 'Critical vulnerability detected in your tech stack',
      high: 'High severity vulnerability found',
      medium: 'Medium severity advisory',
      low: 'Low severity information'
    },
    severityWording: {
      critical: 'CRITICAL',
      high: 'HIGH',
      medium: 'MEDIUM',
      low: 'LOW'
    },
    footerDisclaimer: 'This is an automated notification from Vulnerix Security Platform.'
  },
  pageVisibility: {
    dashboard: { kpis: true, charts: true, recentAdvisories: true },
    home: { hero: true, clients: true, features: true, testimonials: true, cta: true },
    advisories: { search: true, table: true, filters: true },
    techstack: { upload: true, manual: true, list: true }
  },
  homePageContent: {
    heroText: 'Protect Your Business Before It\'s Too Late.',
    heroSubtext: 'Real-time vulnerability monitoring and advisory intelligence for your entire technology stack.',
    footerText: '© 2024 Vulnerix. All rights reserved.'
  }
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  useEffect(() => {
    // Load admin session
    const adminSession = localStorage.getItem(ADMIN_KEY);
    if (adminSession) {
      const session = JSON.parse(adminSession);
      if (session.authenticated && new Date(session.expiry) > new Date()) {
        setIsAdminAuthenticated(true);
      }
    }

    // Load settings
    const savedSettings = localStorage.getItem(ADMIN_SETTINGS_KEY);
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
    }

    // Load audit logs
    const savedLogs = localStorage.getItem(ADMIN_AUDIT_KEY);
    if (savedLogs) {
      setAuditLogs(JSON.parse(savedLogs));
    }
  }, []);

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    // Hardcoded admin credentials (in production, this would be secure backend auth)
    if (email === 'admin@vulnerix.com' && password === 'admin123') {
      const session = {
        authenticated: true,
        adminId: 'admin-001',
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
      localStorage.setItem(ADMIN_KEY, JSON.stringify(session));
      setIsAdminAuthenticated(true);
      
      addAuditLog({
        adminId: 'admin-001',
        pageAffected: 'Admin Auth',
        actionPerformed: 'Login',
        previousValue: 'N/A',
        newValue: 'Session started'
      });
      
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    addAuditLog({
      adminId: 'admin-001',
      pageAffected: 'Admin Auth',
      actionPerformed: 'Logout',
      previousValue: 'Session active',
      newValue: 'Session ended'
    });
    
    localStorage.removeItem(ADMIN_KEY);
    setIsAdminAuthenticated(false);
  };

  const updateSettings = (newSettings: Partial<AdminSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(updated));
  };

  const addAuditLog = (log: Omit<AdminAuditLog, 'id' | 'timestamp'>) => {
    const newLog: AdminAuditLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date()
    };
    
    const updatedLogs = [newLog, ...auditLogs].slice(0, 1000); // Keep last 1000 logs
    setAuditLogs(updatedLogs);
    localStorage.setItem(ADMIN_AUDIT_KEY, JSON.stringify(updatedLogs));
  };

  return (
    <AdminContext.Provider value={{
      isAdminAuthenticated,
      adminLogin,
      adminLogout,
      settings,
      updateSettings,
      auditLogs,
      addAuditLog
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
