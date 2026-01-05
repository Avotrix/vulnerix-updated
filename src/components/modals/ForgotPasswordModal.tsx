import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const USERS_KEY = 'vulnerix_users';
const RESET_TOKENS_KEY = 'vulnerix_reset_tokens';

interface ResetToken {
  email: string;
  token: string;
  expiresAt: number;
  used: boolean;
}

const getUsers = (): Array<{ email: string; password: string }> => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveResetToken = (token: ResetToken) => {
  const data = localStorage.getItem(RESET_TOKENS_KEY);
  const tokens: ResetToken[] = data ? JSON.parse(data) : [];
  // Remove old tokens for same email
  const filtered = tokens.filter(t => t.email !== token.email);
  filtered.push(token);
  localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(filtered));
};

const generateToken = () => {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
};

const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleClose = () => {
    setEmail('');
    setError('');
    setIsSuccess(false);
    setResetLink('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if email exists in registered users
    const users = getUsers();
    const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!userExists) {
      setError('This email is not registered. Please sign up first.');
      setIsLoading(false);
      return;
    }
    
    // Generate reset token
    const token = generateToken();
    const resetToken: ResetToken = {
      email: email.toLowerCase(),
      token,
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
      used: false
    };
    
    saveResetToken(resetToken);
    
    // Generate reset link (in real app, this would be sent via email)
    const link = `${window.location.origin}/reset-password?token=${token}`;
    setResetLink(link);
    setIsSuccess(true);
    
    toast({
      title: "Reset link generated!",
      description: "In production, this would be sent to your email.",
    });
    
    setIsLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(resetLink);
    toast({
      title: "Link copied!",
      description: "The reset link has been copied to your clipboard.",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-display font-bold text-foreground">
                {isSuccess ? 'Check Your Email' : 'Forgot Password'}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isSuccess ? (
                <div className="text-center">
                  <div className="bg-accent/10 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Reset Link Generated</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    In a production environment, a reset link would be sent to <strong>{email}</strong>.
                    For demo purposes, use the link below:
                  </p>
                  <div className="bg-muted rounded-lg p-3 text-xs font-mono break-all text-left mb-4">
                    {resetLink}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleClose} className="flex-1">
                      Close
                    </Button>
                    <Button variant="accent" onClick={copyLink} className="flex-1">
                      Copy Link
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    This link expires in 30 minutes and can only be used once.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <p className="text-sm text-muted-foreground mb-6">
                    Enter the email address associated with your account and we'll send you a link to reset your password.
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    <Label htmlFor="reset-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@company.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        autoFocus
                      />
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" variant="navy" className="flex-1" disabled={isLoading}>
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ForgotPasswordModal;
