import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/mockData';
import { getUser, setUser as saveUser, removeUser, setHasVisited } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, organization: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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

// Mock user database in localStorage
const USERS_KEY = 'vulnerix_users';

const getUsers = (): Array<User & { password: string }> => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveUsers = (users: Array<User & { password: string }>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const existingUser = getUser();
    if (existingUser) {
      setUser(existingUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const users = getUsers();
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      userWithoutPassword.isNewUser = false;
      setUser(userWithoutPassword);
      saveUser(userWithoutPassword);
      setHasVisited();
      return { success: true };
    }
    
    return { success: false, error: 'Invalid email or password' };
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    organization: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const users = getUsers();
    
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }
    
    const newUser: User & { password: string } = {
      id: crypto.randomUUID(),
      email,
      password,
      name,
      organization,
      createdAt: new Date().toISOString(),
      isNewUser: true
    };
    
    users.push(newUser);
    saveUsers(users);
    
    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    saveUser(userWithoutPassword);
    setHasVisited();
    
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    removeUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
