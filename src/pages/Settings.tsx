import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Bell, Moon, Sun, Shield, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

const SETTINGS_KEY = 'vulnerix_settings';

interface SettingsData {
  emailNotifications: boolean;
  criticalAlerts: boolean;
  weeklyDigest: boolean;
  theme: 'light' | 'dark' | 'system';
  autoRefresh: boolean;
  refreshInterval: string;
}

const defaultSettings: SettingsData = {
  emailNotifications: true,
  criticalAlerts: true,
  weeklyDigest: false,
  theme: 'light',
  autoRefresh: false,
  refreshInterval: '5'
};

const Settings = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setIsSaving(false);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    }, 500);
  };

  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-navy">Settings</h1>
          <p className="text-muted-foreground">Configure your preferences</p>
        </div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy">Notifications</h2>
                <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email updates for new advisories</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Critical Alerts</Label>
                <p className="text-sm text-muted-foreground">Immediate alerts for critical vulnerabilities</p>
              </div>
              <Switch
                checked={settings.criticalAlerts}
                onCheckedChange={(checked) => updateSetting('criticalAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Weekly Digest</Label>
                <p className="text-sm text-muted-foreground">Weekly summary of all vulnerabilities</p>
              </div>
              <Switch
                checked={settings.weeklyDigest}
                onCheckedChange={(checked) => updateSetting('weeklyDigest', checked)}
              />
            </div>
          </div>
        </motion.div>

        {/* Display Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Sun className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy">Display</h2>
                <p className="text-sm text-muted-foreground">Customize your display preferences</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Theme</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              <Select
                value={settings.theme}
                onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Auto Refresh</Label>
                <p className="text-sm text-muted-foreground">Automatically refresh advisory data</p>
              </div>
              <Switch
                checked={settings.autoRefresh}
                onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
              />
            </div>

            {settings.autoRefresh && (
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Refresh Interval</Label>
                  <p className="text-sm text-muted-foreground">How often to refresh data</p>
                </div>
                <Select
                  value={settings.refreshInterval}
                  onValueChange={(value) => updateSetting('refreshInterval', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 minute</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </motion.div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button variant="accent" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
