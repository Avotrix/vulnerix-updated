import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to subscribe to real-time updates on tech_stack_results
 * Triggers a refetch callback whenever new results are inserted
 */
export const useRealtimeResults = (onUpdate: () => void) => {
  const { user } = useAuth();

  const subscribeToResults = useCallback(() => {
    if (!user?.email) return null;

    const channel = supabase
      .channel('tech_stack_results_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tech_stack_results',
          filter: `email_id=eq.${user.email}`
        },
        (payload) => {
          console.log('[Realtime] New result inserted:', payload);
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tech_stack_results',
          filter: `email_id=eq.${user.email}`
        },
        (payload) => {
          console.log('[Realtime] Result updated:', payload);
          onUpdate();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    return channel;
  }, [user?.email, onUpdate]);

  useEffect(() => {
    const channel = subscribeToResults();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [subscribeToResults]);
};

/**
 * Hook to subscribe to real-time updates on tech_stack
 * Triggers callback when tech stack entries change
 */
export const useRealtimeTechStack = (onUpdate: () => void) => {
  const { user } = useAuth();

  const subscribeToTechStack = useCallback(() => {
    if (!user?.email) return null;

    const channel = supabase
      .channel('tech_stack_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tech_stack',
          filter: `email_id=eq.${user.email}`
        },
        (payload) => {
          console.log('[Realtime] Tech stack changed:', payload);
          onUpdate();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Tech stack subscription status:', status);
      });

    return channel;
  }, [user?.email, onUpdate]);

  useEffect(() => {
    const channel = subscribeToTechStack();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [subscribeToTechStack]);
};
