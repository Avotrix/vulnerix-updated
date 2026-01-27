import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings, Play, Pause, RefreshCw, Shield, AlertTriangle,
  Bell, Gauge, Save, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Json } from "@/integrations/supabase/types";

interface SystemSettings {
  engineEnabled: boolean;
  cveSourceEnabled: boolean;
  certInSourceEnabled: boolean;
  notificationsEnabled: boolean;
  criticalThreshold: number;
  highThreshold: number;
  mediumThreshold: number;
  engineSchedule: string;
}

const defaultSettings: SystemSettings = {
  engineEnabled: true,
  cveSourceEnabled: true,
  certInSourceEnabled: true,
  notificationsEnabled: true,
  criticalThreshold: 9.0,
  highThreshold: 7.0,
  mediumThreshold: 4.0,
  engineSchedule: 'daily'
};

const SystemConfig = () => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('settings')
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data?.settings) {
          const savedSettings = data.settings as Record<string, Json>;
          setSettings({
            engineEnabled: (savedSettings.engineEnabled as boolean) ?? defaultSettings.engineEnabled,
            cveSourceEnabled: (savedSettings.cveSourceEnabled as boolean) ?? defaultSettings.cveSourceEnabled,
            certInSourceEnabled: (savedSettings.certInSourceEnabled as boolean) ?? defaultSettings.certInSourceEnabled,
            notificationsEnabled: (savedSettings.notificationsEnabled as boolean) ?? defaultSettings.notificationsEnabled,
            criticalThreshold: (savedSettings.criticalThreshold as number) ?? defaultSettings.criticalThreshold,
            highThreshold: (savedSettings.highThreshold as number) ?? defaultSettings.highThreshold,
            mediumThreshold: (savedSettings.mediumThreshold as number) ?? defaultSettings.mediumThreshold,
            engineSchedule: (savedSettings.engineSchedule as string) ?? defaultSettings.engineSchedule
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('admin_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      const settingsPayload = {
        settings: settings as unknown as Json,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        const { error } = await supabase
          .from('admin_settings')
          .update(settingsPayload)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_settings')
          .insert(settingsPayload);

        if (error) throw error;
      }

      // Log audit
      await supabase.from('admin_audit_logs').insert({
        admin_id: user?.id,
        page_affected: 'system_config',
        action_performed: 'update_settings',
        previous_value: null,
        new_value: JSON.stringify(settings)
      });

      toast({
        title: "Settings saved",
        description: "System configuration has been updated"
      });

      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleTriggerEngine = async () => {
    try {
      const { error } = await supabase.functions.invoke('cve-engine', {
        body: { trigger: 'manual' }
      });

      if (error) throw error;

      // Log audit
      await supabase.from('admin_audit_logs').insert({
        admin_id: user?.id,
        page_affected: 'system_config',
        action_performed: 'trigger_engine',
        previous_value: null,
        new_value: 'manual_trigger'
      });

      toast({
        title: "Engine triggered",
        description: "CVE engine has been manually triggered"
      });
    } catch (error) {
      console.error('Error triggering engine:', error);
      toast({
        title: "Engine trigger failed",
        description: "Could not trigger the CVE engine",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">System Configuration</h1>
          <p className="text-muted-foreground">Manage engine settings, sources, and thresholds</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={!hasChanges || isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Engine Controls */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Engine Controls
          </CardTitle>
          <CardDescription>Manage the CVE matching engine</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.engineEnabled ? (
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Play className="h-5 w-5 text-green-500" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Pause className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <Label className="text-base">CVE Engine</Label>
                <p className="text-sm text-muted-foreground">
                  {settings.engineEnabled ? 'Engine is active and processing' : 'Engine is paused'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.engineEnabled}
              onCheckedChange={(checked) => updateSetting('engineEnabled', checked)}
            />
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={handleTriggerEngine}
              disabled={!settings.engineEnabled}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Trigger Engine Manually
            </Button>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Select 
                value={settings.engineSchedule} 
                onValueChange={(value) => updateSetting('engineSchedule', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Sources
          </CardTitle>
          <CardDescription>Enable or disable vulnerability data sources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <Label className="text-base">CVE / NVD Source</Label>
              <p className="text-sm text-muted-foreground">
                National Vulnerability Database (NVD) CVE data
              </p>
            </div>
            <Switch
              checked={settings.cveSourceEnabled}
              onCheckedChange={(checked) => updateSetting('cveSourceEnabled', checked)}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <Label className="text-base">CERT-IN Source</Label>
              <p className="text-sm text-muted-foreground">
                Indian Computer Emergency Response Team advisories
              </p>
            </div>
            <Switch
              checked={settings.certInSourceEnabled}
              onCheckedChange={(checked) => updateSetting('certInSourceEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification System
          </CardTitle>
          <CardDescription>Global notification settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <Label className="text-base">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send alerts to users for new vulnerabilities
              </p>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) => updateSetting('notificationsEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Severity Thresholds */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Severity Thresholds (CVSS)
          </CardTitle>
          <CardDescription>Define severity classification boundaries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-severity-critical">Critical Threshold (≥)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={settings.criticalThreshold}
                onChange={(e) => updateSetting('criticalThreshold', parseFloat(e.target.value))}
                className="border-severity-critical/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-severity-high">High Threshold (≥)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={settings.highThreshold}
                onChange={(e) => updateSetting('highThreshold', parseFloat(e.target.value))}
                className="border-severity-high/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-severity-medium">Medium Threshold (≥)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={settings.mediumThreshold}
                onChange={(e) => updateSetting('mediumThreshold', parseFloat(e.target.value))}
                className="border-severity-medium/30"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            * Scores below the Medium threshold are classified as Low severity
          </p>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Configuration Changes</h4>
              <p className="text-sm text-muted-foreground">
                All configuration changes are logged in the audit trail. Changes to severity 
                thresholds will affect how vulnerabilities are classified going forward but 
                will not retroactively update existing records.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemConfig;
