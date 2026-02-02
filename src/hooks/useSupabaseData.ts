import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TechStack, mapDbTechStack, Advisory } from '@/lib/mockData';
import { useSplunkAdvisories, useSplunkDashboard, getHighestSeverity } from './useSplunkData';

// Hook to fetch tech stack data (still from Supabase - user's inventory)
export const useTechStacks = () => {
  const { user } = useAuth();
  const [techStacks, setTechStacks] = useState<TechStack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTechStacks = useCallback(async () => {
    if (!user?.email) {
      setTechStacks([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('tech_stack')
        .select('*')
        .eq('email_id', user.email)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTechStacks((data || []).map((row, index) => mapDbTechStack(row, index)));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setTechStacks([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchTechStacks();
  }, [fetchTechStacks]);

  const addTechStack = async (stack: {
    vendor: string;
    product_name: string;
    version: string;
    org_name: string;
    email_id: string;
  }) => {
    const { data, error } = await supabase
      .from('tech_stack')
      .insert(stack)
      .select()
      .single();

    if (error) throw error;
    await fetchTechStacks();
    return data;
  };

  const addMultipleTechStacks = async (stacks: Array<{
    vendor: string;
    product_name: string;
    version: string;
    org_name: string;
    email_id: string;
  }>) => {
    const { error } = await supabase
      .from('tech_stack')
      .insert(stacks);

    if (error) throw error;
    await fetchTechStacks();
  };

  const updateTechStack = async (id: string, updates: Partial<{
    vendor: string;
    product_name: string;
    version: string;
  }>) => {
    const { error } = await supabase
      .from('tech_stack')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await fetchTechStacks();
  };

  const deleteTechStack = async (id: string) => {
    const { error } = await supabase
      .from('tech_stack')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchTechStacks();
  };

  return {
    techStacks,
    isLoading,
    error,
    refetch: fetchTechStacks,
    addTechStack,
    addMultipleTechStacks,
    updateTechStack,
    deleteTechStack
  };
};

// Hook to fetch tech stack results (advisories) - NOW FROM SPLUNK
export const useTechStackResults = () => {
  const { advisories, isLoading, error, refetch } = useSplunkAdvisories();

  return {
    results: advisories,
    isLoading,
    error,
    refetch
  };
};

// Hook to fetch dashboard stats - NOW FROM SPLUNK
export const useDashboardStats = () => {
  const { user } = useAuth();
  const { stats: splunkStats, isLoading: splunkLoading, refetch } = useSplunkDashboard();
  const [productCount, setProductCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Still fetch product count from Supabase (user's tech stack)
  useEffect(() => {
    const fetchProductCount = async () => {
      if (!user?.email) {
        setProductCount(0);
        setIsLoading(false);
        return;
      }

      try {
        const { count } = await supabase
          .from('tech_stack')
          .select('*', { count: 'exact', head: true })
          .eq('email_id', user.email);

        setProductCount(count || 0);
      } catch {
        // Silent failure
      } finally {
        setIsLoading(splunkLoading);
      }
    };

    fetchProductCount();
  }, [user?.email, splunkLoading]);

  const stats = {
    totalProducts: productCount,
    totalAdvisories: splunkStats.totalAdvisories,
    totalCVEs: splunkStats.totalCVEs,
    totalCERTIN: splunkStats.totalCERTIN,
    critical: splunkStats.criticalCount,
    high: splunkStats.highCount,
    medium: splunkStats.mediumCount,
    low: splunkStats.lowCount,
    globalRisk: splunkStats.globalRisk,
  };

  return { stats, isLoading, refetch };
};

// Hook to get user settings
export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<{
    org_name: string;
    notification_level: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.email) {
        setSettings(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_settings')
          .select('org_name, notification_level')
          .eq('email_id', user.email)
          .maybeSingle();

        setSettings(data);
      } catch {
        // Silent failure - settings will remain null
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user?.email]);

  return { settings, isLoading };
};

// Re-export Splunk utilities for direct use
export { getHighestSeverity } from './useSplunkData';
