// TDD-015 Extended - GanttTask Final Structure
// src/types/gantt.types.ts

export interface GanttTask {
  id: string;
  project_id: string;
  name: string;
  start: string; // YYYY-MM-DD format
  end: string; // YYYY-MM-DD format
  progress: number; // 0-100
  type: 'phase' | 'activity' | 'milestone';
  dependencies?: string[]; // array of task IDs (predecessor support: FS/SS)
  custom_class?: string; // for color coding: bar-milestone, bar-red, bar-orange, bar-yellow, bar-green
  weight?: number; // weight for weighted progress calculation
  parent?: string; // parent task ID for tree hierarchy (optional)
}

export interface GanttConfig {
  header_height: number; // default: 50
  column_width: number; // default: 30
  step: number; // hours per step, default: 24
  view_modes: ('Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month')[];
  bar_height: number; // default: 20
  bar_corner_radius: number; // default: 3
  arrow_curve: number; // default: 5
  padding: number; // default: 18
  date_format: string; // default: 'YYYY-MM-DD'
  custom_popup_html?: (task: GanttTask) => string;
  on_click?: (task: GanttTask) => void;
  on_date_change?: (task: GanttTask, start: Date, end: Date) => void;
  on_progress_change?: (task: GanttTask, progress: number) => void;
  on_view_change?: (mode: string) => void;
}

export interface MilestoneDefault {
  name: string;
  start: string; // relative to project start (+days)
  end: string; // relative to project start (+days)
  type: 'milestone';
}

// 5 default milestones untuk auto-generation
export const DEFAULT_MILESTONES: MilestoneDefault[] = [
  { name: 'Project Kick-off', start: '+0', end: '+0', type: 'milestone' },
  { name: '30% Progress', start: '+60', end: '+60', type: 'milestone' },
  { name: '70% Progress', start: '+150', end: '+150', type: 'milestone' },
  { name: 'Handover', start: '+300', end: '+300', type: 'milestone' },
  { name: 'Project Closed', start: '+330', end: '+330', type: 'milestone' },
];

// Delay calculation result
export interface DelayStatus {
  status: 'ahead' | 'on-time' | 'delayed-medium' | 'delayed-severe';
  delay_days: number;
  custom_class: string; // bar-green, bar-yellow, bar-orange, bar-red
}

// WebSocket realtime message structure
export interface GanttRealtimeMessage {
  event: 'task_updated' | 'task_created' | 'task_deleted' | 'milestone_updated';
  project_id: string;
  task?: GanttTask;
  task_id?: string;
  timestamp: string;
}

// Export/PDF options
export interface GanttExportOptions {
  format: 'pdf' | 'png' | 'svg';
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  quality?: number; // 0-1 for PDF quality
}
