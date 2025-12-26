import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Building, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const PROFILE_KEY = 'vulnerix_profile';

interface ProfileData {
  name: string;
  email: string;
  organization: string;
  phone: string;
  role: string;
}

const Profile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    organization: '',
    phone: '',
    role: ''
  });

  useEffect(() => {
    // Load profile from storage or use user data
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      setProfile(JSON.parse(stored));
    } else if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        organization: user.organization || '',
        phone: '',
        role: ''
      });
    }
  }, [user]);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      setIsSaving(false);
      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully.",
      });
    }, 500);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-navy">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          {/* Avatar Section */}
          <div className="p-6 border-b border-border bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="h-10 w-10 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-navy">{profile.name || 'Your Name'}</h2>
                <p className="text-muted-foreground">{profile.email || 'your@email.com'}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    className="pl-10"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    className="pl-10"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="organization"
                    placeholder="Company Inc."
                    className="pl-10"
                    value={profile.organization}
                    onChange={(e) => setProfile(prev => ({ ...prev, organization: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  placeholder="Security Engineer"
                  value={profile.role}
                  onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button variant="accent" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
