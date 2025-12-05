// TDD-015 Extended - Gantt Store dengan Zustand
// src/store/ganttStore.ts

import { create } from 'zustand';
import type { GanttTask } from '../types/gantt.types';

interface GanttState {
  // Data
  tasks: GanttTask[];
  selectedTaskId: string | null;
  viewMode: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month';
  isLoading: boolean;
  error: string | null;

  // Actions
  setTasks: (tasks: GanttTask[]) => void;
  updateTask: (taskId: string, updates: Partial<GanttTask>) => void;
  addTask: (task: GanttTask) => void;
  removeTask: (taskId: string) => void;
  selectTask: (taskId: string | null) => void;
  setViewMode: (mode: GanttState['viewMode']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGanttStore = create<GanttState>((set) => ({
  // Initial state
  tasks: [],
  selectedTaskId: null,
  viewMode: 'Week',
  isLoading: false,
  error: null,

  // Actions
  setTasks: (tasks) => set({ tasks }),

  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    })),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),

  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
      selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId,
    })),

  selectTask: (taskId) => set({ selectedTaskId: taskId }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      tasks: [],
      selectedTaskId: null,
      viewMode: 'Week',
      isLoading: false,
      error: null,
    }),
}));
