import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Production mode check - suppress verbose logging
const isDev = import.meta.env.DEV;

/**
 * Hook to subscribe to real-time updates on tech_stack_results
 * Triggers a refetch callback whenever new results are inserted
 */
export const useRealtimeResults = (onUpdate: () => void) => {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const subscribeToResults = useCallback(() => {
    if (!user?.email) return null;

    // Cleanup existing channel before creating new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

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
        () => {
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
        () => {
          onUpdate();
        }
      )
      .subscribe((status) => {
        // Only log in development mode
        if (isDev && status !== 'SUBSCRIBED') {
          // Silently handle subscription status changes
        }
      });

    channelRef.current = channel;
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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const subscribeToTechStack = useCallback(() => {
    if (!user?.email) return null;

    // Cleanup existing channel before creating new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

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
        () => {
          onUpdate();
        }
      )
      .subscribe(); // Silent subscription - no logging

    channelRef.current = channel;
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
