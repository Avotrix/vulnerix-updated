import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TechStack, mapDbTechStack, mapTechStackResultToAdvisory, Advisory } from '@/lib/mockData';

// Hook to fetch tech stack data
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

// Hook to fetch tech stack results (advisories)
export const useTechStackResults = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<Advisory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    if (!user?.email) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('tech_stack_results')
        .select('*')
        .eq('email_id', user.email)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setResults((data || []).map(mapTechStackResultToAdvisory));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return {
    results,
    isLoading,
    error,
    refetch: fetchResults
  };
};

// Hook to fetch dashboard stats from tech_stack_results
export const useDashboardStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalAdvisories: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user?.email) {
      setStats({
        totalProducts: 0,
        totalAdvisories: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get total products from tech_stack
      const { count: productsCount } = await supabase
        .from('tech_stack')
        .select('*', { count: 'exact', head: true })
        .eq('email_id', user.email);

      // Get results with severity counts
      const { data: resultsData } = await supabase
        .from('tech_stack_results')
        .select('severity_cve, cve_match')
        .eq('email_id', user.email);

      const results = resultsData || [];
      const advisoriesWithCVE = results.filter(r => r.cve_match);

      setStats({
        totalProducts: productsCount || 0,
        totalAdvisories: advisoriesWithCVE.length,
        critical: results.filter(r => r.severity_cve === 'Critical').length,
        high: results.filter(r => r.severity_cve === 'High').length,
        medium: results.filter(r => r.severity_cve === 'Medium').length,
        low: results.filter(r => r.severity_cve === 'Low').length
      });
    } catch {
      // Silent failure - stats will remain at defaults
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, refetch: fetchStats };
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
