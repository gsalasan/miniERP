// TDD-015 Extended - Gantt Custom Hook dengan React Query
// src/hooks/useGantt.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGanttStore } from '../store/ganttStore';
import { projectApi } from '../api/projectApi';
import type { GanttTask } from '../types/gantt.types';
import { calculateDelay } from '../utils/gantt.utils';

export interface UseGanttOptions {
  projectId: string;
  enabled?: boolean;
}

export interface UseGanttResult {
  tasks: GanttTask[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  updateTask: (taskId: string, updates: Partial<GanttTask>) => Promise<void>;
  updateTaskProgress: (taskId: string, progress: number) => Promise<void>;
  createTask: (task: Omit<GanttTask, 'id'>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export function useGantt({ projectId, enabled = true }: UseGanttOptions): UseGanttResult {
  const queryClient = useQueryClient();
  const { setTasks, setLoading, setError } = useGanttStore();

  // Fetch Gantt data
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['gantt', projectId],
    queryFn: async () => {
      const response = await projectApi.getGanttData(projectId);
      
      // Apply delay calculation and custom_class
      const tasksWithDelay = response.map((task: GanttTask) => {
        const delay = calculateDelay(task);
        return {
          ...task,
          custom_class: delay.custom_class,
        };
      });
      
      setTasks(tasksWithDelay);
      return tasksWithDelay;
    },
    enabled,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<GanttTask> }) => {
      return await projectApi.updateTaskGantt(projectId, taskId, updates);
    },
    onMutate: async ({ taskId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['gantt', projectId] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<GanttTask[]>(['gantt', projectId]);

      // Optimistically update
      queryClient.setQueryData<GanttTask[]>(['gantt', projectId], (old) =>
        old?.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
      );

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['gantt', projectId], context.previousTasks);
      }
      setError(err instanceof Error ? err.message : 'Failed to update task');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
    },
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ taskId, progress }: { taskId: string; progress: number }) => {
      return await projectApi.updateTaskProgress(projectId, taskId, progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (task: Omit<GanttTask, 'id'>) => {
      return await projectApi.createTaskGantt(projectId, task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await projectApi.deleteTask(projectId, taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gantt', projectId] });
    },
  });

  return {
    tasks,
    isLoading,
    error: error as Error | null,
    refetch,
    updateTask: (taskId, updates) => updateTaskMutation.mutateAsync({ taskId, updates }),
    updateTaskProgress: (taskId, progress) =>
      updateProgressMutation.mutateAsync({ taskId, progress }),
    createTask: (task) => createTaskMutation.mutateAsync(task),
    deleteTask: (taskId) => deleteTaskMutation.mutateAsync(taskId),
  };
}
