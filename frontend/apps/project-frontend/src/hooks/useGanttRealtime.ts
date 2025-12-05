// TDD-015 Extended - Supabase Realtime Hook untuk Gantt
// src/hooks/useGanttRealtime.ts

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGanttStore } from '../store/ganttStore';
import type { GanttTask, GanttRealtimeMessage } from '../types/gantt.types';

// Supabase client would be initialized here
// import { supabase } from '../lib/supabase';

export interface UseGanttRealtimeOptions {
  projectId: string;
  enabled?: boolean;
}

export function useGanttRealtime({ projectId, enabled = true }: UseGanttRealtimeOptions) {
  const queryClient = useQueryClient();
  const { updateTask, addTask, removeTask } = useGanttStore();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || !projectId) return;

    // Initialize Supabase realtime channel
    const channel = `project:${projectId}`;

    // TODO: Replace with actual Supabase implementation
    // Example WebSocket connection
    const setupRealtimeConnection = () => {
      console.log(`[Gantt Realtime] Subscribing to channel: ${channel}`);

      // Supabase Realtime subscription
      // channelRef.current = supabase
      //   .channel(channel)
      //   .on('postgres_changes', 
      //     { 
      //       event: '*', 
      //       schema: 'public', 
      //       table: 'project_tasks',
      //       filter: `project_id=eq.${projectId}`
      //     },
      //     handleRealtimeMessage
      //   )
      //   .subscribe();

      // Temporary: Simulate with custom WebSocket
      const ws = new WebSocket(`ws://localhost:4007/gantt/${projectId}`);
      
      ws.onopen = () => {
        console.log('[Gantt Realtime] Connected');
      };

      ws.onmessage = (event) => {
        try {
          const message: GanttRealtimeMessage = JSON.parse(event.data);
          handleRealtimeMessage(message);
        } catch (error) {
          console.error('[Gantt Realtime] Parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[Gantt Realtime] WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('[Gantt Realtime] Disconnected');
        // Auto-reconnect after 3 seconds
        setTimeout(setupRealtimeConnection, 3000);
      };

      channelRef.current = ws;
    };

    const handleRealtimeMessage = (message: GanttRealtimeMessage) => {
      console.log('[Gantt Realtime] Message received:', message.event);

      switch (message.event) {
        case 'task_updated':
          if (message.task) {
            updateTask(message.task.id, message.task);
            // Invalidate React Query cache
            queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
          }
          break;

        case 'task_created':
          if (message.task) {
            addTask(message.task);
            queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
          }
          break;

        case 'task_deleted':
          if (message.task_id) {
            removeTask(message.task_id);
            queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
          }
          break;

        case 'milestone_updated':
          // Refresh entire gantt view
          queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
          break;

        default:
          console.warn('[Gantt Realtime] Unknown event:', message.event);
      }
    };

    setupRealtimeConnection();

    // Cleanup
    return () => {
      console.log('[Gantt Realtime] Unsubscribing');
      if (channelRef.current) {
        // Supabase cleanup
        // channelRef.current.unsubscribe();
        
        // WebSocket cleanup
        if (channelRef.current instanceof WebSocket) {
          channelRef.current.close();
        }
      }
    };
  }, [projectId, enabled, updateTask, addTask, removeTask, queryClient]);

  return {
    isConnected: channelRef.current !== null,
  };
}
