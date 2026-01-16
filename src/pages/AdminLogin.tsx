import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/contexts/AdminContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import vulnerixLogo from "@/assets/vulnerix-logo.png";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin, isAdminAuthenticated, isCheckingAdmin } = useAdmin();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already admin
  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate('/admin/panel');
    }
  }, [isAdminAuthenticated, navigate]);

  const handleAccessAdmin = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in first to access the admin panel.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    setIsLoading(true);

    try {
      const success = await adminLogin();
      
      if (success) {
        toast({
          title: "Admin Access Granted",
          description: "Welcome to the Admin Control Panel.",
        });
        navigate('/admin/panel');
      } else {
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges. Contact your administrator if you believe this is an error.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify admin access. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">Admin Access</h1>
              <p className="text-sm text-muted-foreground">Vulnerix Control Panel</p>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-700">Authentication Required</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    You must be logged in with an account that has admin privileges to access this panel.
                  </p>
                </div>
              </div>
              
              <Button 
                variant="navy" 
                size="lg" 
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                Sign In to Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  Signed in as: <strong className="text-foreground">{user?.email}</strong>
                </p>
              </div>

              <Button 
                variant="destructive" 
                size="lg" 
                className="w-full"
                onClick={handleAccessAdmin}
                disabled={isLoading}
              >
                {isLoading ? 'Verifying Access...' : 'Access Admin Panel'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Admin access is verified server-side based on your assigned role.
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-start gap-3">
              <img src={vulnerixLogo} alt="Vulnerix" className="h-8 w-8" />
              <div>
                <p className="text-xs text-muted-foreground">
                  This area is restricted to authorized administrators only. 
                  All access attempts are logged and monitored.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
