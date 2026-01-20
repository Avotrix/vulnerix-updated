import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface AdminAuditLog {
  id: string;
  admin_id: string;
  page_affected: string;
  action_performed: string;
  previous_value: string | null;
  new_value: string | null;
  created_at: string;
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
  isCheckingAdmin: boolean;
  adminLogin: () => Promise<boolean>;
  adminLogout: () => void;
  settings: AdminSettings;
  updateSettings: (newSettings: Partial<AdminSettings>) => Promise<void>;
  auditLogs: AdminAuditLog[];
  addAuditLog: (log: Omit<AdminAuditLog, 'id' | 'created_at'>) => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

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
  const { user, session } = useAuth();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Check if user has admin role
  const checkAdminRole = async (): Promise<boolean> => {
    if (!user?.id || !session) {
      return false;
    }

    try {
      // Query user_roles to check if user has admin role
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        // Error logged server-side via Supabase, no client-side logging
        return false;
      }

      return !!data;
    } catch (e) {
      // Error logged server-side via Supabase, no client-side logging
      return false;
    }
  };

  // Load admin settings from database
  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('settings')
        .limit(1)
        .maybeSingle();

      if (error) {
        // Error logged server-side, no client-side logging
        return;
      }

      if (data?.settings) {
        setSettings({ ...defaultSettings, ...(data.settings as unknown as AdminSettings) });
      }
    } catch (e) {
      // Error logged server-side, no client-side logging
    }
  };

  // Load audit logs (admin only)
  const loadAuditLogs = async () => {
    if (!isAdminAuthenticated) return;

    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        // Error logged server-side, no client-side logging
        return;
      }

      setAuditLogs(data || []);
    } catch (e) {
      // Error logged server-side, no client-side logging
    }
  };

  // Check admin status when user changes
  useEffect(() => {
    const checkAdmin = async () => {
      setIsCheckingAdmin(true);
      if (user && session) {
        const isAdmin = await checkAdminRole();
        setIsAdminAuthenticated(isAdmin);
      } else {
        setIsAdminAuthenticated(false);
      }
      setIsCheckingAdmin(false);
    };

    checkAdmin();
    loadSettings();
  }, [user, session]);

  // Load audit logs when admin authenticates
  useEffect(() => {
    if (isAdminAuthenticated) {
      loadAuditLogs();
    }
  }, [isAdminAuthenticated]);

  const refreshAdminStatus = async () => {
    const isAdmin = await checkAdminRole();
    setIsAdminAuthenticated(isAdmin);
  };

  const adminLogin = async (): Promise<boolean> => {
    // Admin login now just checks if the current authenticated user has admin role
    // The user must already be logged in via the regular auth flow
    if (!user || !session) {
      return false;
    }

    const isAdmin = await checkAdminRole();
    setIsAdminAuthenticated(isAdmin);

    if (isAdmin) {
      await addAuditLog({
        admin_id: user.id,
        page_affected: 'Admin Auth',
        action_performed: 'Login',
        previous_value: null,
        new_value: 'Session started'
      });
    }

    return isAdmin;
  };

  const adminLogout = () => {
    if (isAdminAuthenticated && user) {
      addAuditLog({
        admin_id: user.id,
        page_affected: 'Admin Auth',
        action_performed: 'Logout',
        previous_value: 'Session active',
        new_value: 'Session ended'
      });
    }
    setIsAdminAuthenticated(false);
  };

  const updateSettings = async (newSettings: Partial<AdminSettings>) => {
    if (!isAdminAuthenticated || !user) return;

    const updated = { ...settings, ...newSettings };
    
    try {
      const { data: existingSettings } = await supabase.from('admin_settings').select('id').limit(1).single();
      const { error } = await supabase
        .from('admin_settings')
        .update({ 
          settings: JSON.parse(JSON.stringify(updated)),
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', existingSettings?.id);

      if (error) {
        // Error logged server-side, no client-side logging
        return;
      }

      setSettings(updated);
    } catch (e) {
      // Error logged server-side, no client-side logging
    }
  };

  const addAuditLog = async (log: Omit<AdminAuditLog, 'id' | 'created_at'>) => {
    if (!isAdminAuthenticated) return;

    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .insert({
          admin_id: log.admin_id,
          page_affected: log.page_affected,
          action_performed: log.action_performed,
          previous_value: log.previous_value,
          new_value: log.new_value
        })
        .select()
        .single();

      if (error) {
        // Error logged server-side, no client-side logging
        return;
      }

      if (data) {
        setAuditLogs(prev => [data, ...prev].slice(0, 1000));
      }
    } catch (e) {
      // Error logged server-side, no client-side logging
    }
  };

  return (
    <AdminContext.Provider value={{
      isAdminAuthenticated,
      isCheckingAdmin,
      adminLogin,
      adminLogout,
      settings,
      updateSettings,
      auditLogs,
      addAuditLog,
      refreshAdminStatus
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
