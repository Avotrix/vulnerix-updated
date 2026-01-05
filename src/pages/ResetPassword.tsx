import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import vulnerixLogo from "@/assets/vulnerix-logo.png";

const USERS_KEY = 'vulnerix_users';
const RESET_TOKENS_KEY = 'vulnerix_reset_tokens';

interface ResetToken {
  email: string;
  token: string;
  expiresAt: number;
  used: boolean;
}

const getResetTokens = (): ResetToken[] => {
  const data = localStorage.getItem(RESET_TOKENS_KEY);
  return data ? JSON.parse(data) : [];
};

const validateToken = (token: string): ResetToken | null => {
  const tokens = getResetTokens();
  const found = tokens.find(t => t.token === token && !t.used && t.expiresAt > Date.now());
  return found || null;
};

const markTokenUsed = (token: string) => {
  const tokens = getResetTokens();
  const updated = tokens.map(t => t.token === token ? { ...t, used: true } : t);
  localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(updated));
};

const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
};

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenData, setTokenData] = useState<ResetToken | null>(null);
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
    const token = searchParams.get('token');
    if (token) {
      const validToken = validateToken(token);
      if (validToken) {
        setTokenValid(true);
        setTokenData(validToken);
      } else {
        setTokenValid(false);
      }
    } else {
      setTokenValid(false);
    }
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
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
    
    if (!validateForm() || !tokenData) return;
    
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update user password
    const usersData = localStorage.getItem(USERS_KEY);
    const users = usersData ? JSON.parse(usersData) : [];
    const userIndex = users.findIndex((u: any) => u.email === tokenData.email);
    
    if (userIndex !== -1) {
      users[userIndex].password = formData.password;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Mark token as used
      markTokenUsed(tokenData.token);
      
      setIsSuccess(true);
      
      toast({
        title: "Password reset successful!",
        description: "Redirecting to login page...",
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } else {
      toast({
        title: "Error",
        description: "User not found. Please try again.",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

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
          <span className="text-2xl font-display font-bold text-navy">Vulnerix</span>
        </div>

        <h1 className="text-3xl font-display font-bold text-navy mb-2">
          Reset Your Password
        </h1>
        <p className="text-muted-foreground mb-8">
          Enter your new password for <span className="font-medium text-foreground">{tokenData?.email}</span>
        </p>

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
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
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
                <span className="bg-gradient-to-r from-navy to-accent bg-clip-text text-transparent font-bold">
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
