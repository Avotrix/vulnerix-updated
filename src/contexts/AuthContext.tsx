import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name?: string;
  organization?: string;
  createdAt: string;
  isNewUser?: boolean;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, organization: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Password validation helper
const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)' };
  }
  return { valid: true };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        
        if (session?.user) {
          // Map Supabase user to our User interface
          const mappedUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
            organization: session.user.user_metadata?.organization,
            createdAt: session.user.created_at,
            isNewUser: event === 'SIGNED_IN' && !session.user.last_sign_in_at
          };
          setUser(mappedUser);

          // Ensure user_access record exists (for RLS compatibility)
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            try {
              const { error } = await supabase
                .from('user_access')
                .upsert({
                  user_id: session.user.id,
                  user_email_id: session.user.email || ''
                }, { 
                  onConflict: 'user_id',
                  ignoreDuplicates: true 
                });
              
              if (error && !error.message.includes('duplicate')) {
                console.error('Error upserting user_access:', error);
              }
            } catch (e) {
              // Ignore errors - user might not have permission yet
            }
          }
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setSupabaseUser(session.user);
        const mappedUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
          organization: session.user.user_metadata?.organization,
          createdAt: session.user.created_at,
        };
        setUser(mappedUser);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        // Generic error message to prevent user enumeration
        return { success: false, error: 'Invalid email or password' };
      }

      if (!data.user) {
        return { success: false, error: 'Login failed. Please try again.' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    organization: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name,
            organization,
            full_name: name
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { success: false, error: 'This email is already registered. Please sign in.' };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Registration failed. Please try again.' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
  };

  // Rate limiting state for password reset (prevents email flooding)
  const resetCooldownRef = React.useRef<number>(0);
  const RESET_COOLDOWN_MS = 60000; // 1 minute cooldown

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    // Client-side rate limiting to prevent email flooding
    const now = Date.now();
    if (now - resetCooldownRef.current < RESET_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESET_COOLDOWN_MS - (now - resetCooldownRef.current)) / 1000);
      return { 
        success: false, 
        error: `Please wait ${remainingSeconds} seconds before requesting another reset` 
      };
    }
    
    try {
      // Normalize response time to prevent timing attacks
      const startTime = Date.now();
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`
      });

      // Set cooldown after successful request
      resetCooldownRef.current = Date.now();

      // Normalize response time (min 200ms) to prevent timing-based account enumeration
      const elapsed = Date.now() - startTime;
      const minTime = 200;
      if (elapsed < minTime) {
        await new Promise(resolve => setTimeout(resolve, minTime - elapsed));
      }

      if (error) {
        // Don't reveal if email exists or not - always return success
        return { success: true };
      }

      return { success: true };
    } catch (error) {
      // Always return success to prevent email enumeration
      return { success: true };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        isAuthenticated: !!user && !!session,
        isLoading,
        login,
        register,
        logout,
        resetPassword,
        updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
