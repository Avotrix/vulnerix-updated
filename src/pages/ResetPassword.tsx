import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import vulnerixLogo from "@/assets/vulnerix-logo.png";

const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
};

// Password strength indicator
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  if (score < 3) return { score, label: 'Weak', color: 'bg-destructive' };
  if (score < 5) return { score, label: 'Medium', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updatePassword } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
    captcha: ''
  });

  useEffect(() => {
    // Handle the password reset token from Supabase
    const handlePasswordReset = async () => {
      // Supabase sends recovery tokens in the URL hash fragment
      // Format: #access_token=...&refresh_token=...&type=recovery
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      const errorCode = hashParams.get('error_code');
      const errorDescription = hashParams.get('error_description');

      // Check for error in URL (expired or invalid token)
      if (errorCode || errorDescription) {
        console.error('Reset password error:', errorCode, errorDescription);
        setTokenValid(false);
        return;
      }

      // If we have a recovery token in the hash
      if (type === 'recovery' && accessToken) {
        try {
          // Set the session using the recovery token
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (error) {
            console.error('Error setting session:', error);
            setTokenValid(false);
            return;
          }

          if (data.session) {
            setTokenValid(true);
            // Clear the hash from URL for security (without reload)
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        } catch (error) {
          console.error('Error handling recovery token:', error);
          setTokenValid(false);
          return;
        }
      }

      // Also check query params (some email clients may convert # to ?)
      const tokenFromQuery = searchParams.get('access_token');
      const typeFromQuery = searchParams.get('type');
      const refreshFromQuery = searchParams.get('refresh_token');

      if (typeFromQuery === 'recovery' && tokenFromQuery) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: tokenFromQuery,
            refresh_token: refreshFromQuery || ''
          });

          if (error) {
            console.error('Error setting session from query:', error);
            setTokenValid(false);
            return;
          }

          if (data.session) {
            setTokenValid(true);
            return;
          }
        } catch (error) {
          console.error('Error handling query token:', error);
          setTokenValid(false);
          return;
        }
      }

      // Check if there's an existing valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User has a valid session (might be from clicking the link)
        setTokenValid(true);
      } else {
        // No token and no session - invalid
        setTokenValid(false);
      }
    };

    handlePasswordReset();
  }, [searchParams]);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setErrors(prev => ({ ...prev, captcha: '' }));
  };

  const validateForm = () => {
    const newErrors = {
      password: '',
      confirmPassword: '',
      captcha: ''
    };
    
    // Strong password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!captchaInput) {
      newErrors.captcha = 'Please enter the captcha';
    } else if (captchaInput !== captcha) {
      newErrors.captcha = 'Captcha does not match';
    }
    
    setErrors(newErrors);
    return !newErrors.password && !newErrors.confirmPassword && !newErrors.captcha;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    const result = await updatePassword(formData.password);
    
    if (result.success) {
      setIsSuccess(true);
      
      toast({
        title: "Password reset successful!",
        description: "Redirecting to login page...",
      });
      
      // Sign out and redirect to login after 2 seconds
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to reset password. Please try again.",
        variant: "destructive"
      });
      refreshCaptcha();
    }
    
    setIsLoading(false);
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-destructive/10 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Invalid or Expired Link
          </h1>
          <p className="text-muted-foreground mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link to="/auth">
            <Button variant="accent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-accent/10 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Password Reset Successful!
          </h1>
          <p className="text-muted-foreground mb-6">
            Your password has been updated. Redirecting to login...
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Link 
          to="/auth" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="flex items-center gap-2 mb-8">
          <img src={vulnerixLogo} alt="Vulnerix Logo" className="h-10 w-10" />
          <span className="text-2xl font-display font-bold text-foreground">Vulnerix</span>
        </div>

        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Reset Your Password
        </h1>
        <p className="text-muted-foreground mb-8">
          Enter your new password below
        </p>

        {/* Password Requirements */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6 border border-border">
          <p className="text-sm font-medium text-foreground mb-2">Password Requirements:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>
              • At least 8 characters
            </li>
            <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
              • At least one uppercase letter
            </li>
            <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : ''}>
              • At least one lowercase letter
            </li>
            <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
              • At least one number
            </li>
            <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : ''}>
              • At least one special character (!@#$%^&*(),.?":{}|&lt;&gt;)
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formData.password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${i <= passwordStrength.score ? passwordStrength.color : 'bg-muted'}`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${passwordStrength.score < 3 ? 'text-destructive' : passwordStrength.score < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                  Password strength: {passwordStrength.label}
                </p>
              </div>
            )}
            {errors.password && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.password}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Captcha */}
          <div className="space-y-2">
            <Label>Captcha Verification</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg tracking-widest select-none text-center border border-border">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
                  {captcha}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={refreshCaptcha}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Enter captcha"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
            />
            {errors.captcha && (
              <p className="text-sm text-destructive">{errors.captcha}</p>
            )}
          </div>

          <Button 
            type="submit" 
            variant="navy" 
            size="lg" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;