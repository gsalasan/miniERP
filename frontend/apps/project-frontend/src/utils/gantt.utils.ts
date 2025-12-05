// TDD-015 Extended - Gantt Utility Functions
// src/utils/gantt.utils.ts

import type { GanttTask, DelayStatus } from '../types/gantt.types';

export function calculateDelay(task: GanttTask): DelayStatus {
  // Milestones always get brown/maroon (highest priority)
  if (task.type === 'milestone') {
    return {
      status: 'on-time',
      delay_days: 0,
      custom_class: 'bar-milestone',
    };
  }

  // Status-based color logic matching the legend:
  // - TODO: blue
  // - In Progress: green  
  // - Done: gray
  let status: DelayStatus['status'];
  let custom_class: string;

  if (task.progress >= 100) {
    // Done - Gray
    status = 'on-time';
    custom_class = 'bar-done';
  } else if (task.progress > 0) {
    // In Progress - Green
    status = 'on-time';
    custom_class = 'bar-in-progress';
  } else {
    // TODO - Blue
    status = 'on-time';
    custom_class = 'bar-todo';
  }

  return {
    status,
    delay_days: 0,
    custom_class,
  };
}

export function calculateLuminance(r: number, g: number, b: number): number {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

export function getContrastTextColor(bgColor: string): string {
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = calculateLuminance(r, g, b);

  // Threshold of 0.5 for optimal readability
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export function isValidDateFormat(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function formatDateYYYYMMDD(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  if (isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }

  return date.toISOString().split('T')[0];
}


export function hasCircularDependency(
  taskId: string,
  dependencies: string[],
  allTasks: GanttTask[]
): boolean {
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(id: string): boolean {
    if (recStack.has(id)) return true; // Cycle detected
    if (visited.has(id)) return false;

    visited.add(id);
    recStack.add(id);

    const task = allTasks.find((t) => t.id === id);
    if (task?.dependencies) {
      for (const depId of task.dependencies) {
        if (dfs(depId)) return true;
      }
    }

    recStack.delete(id);
    return false;
  }

  for (const depId of dependencies) {
    if (dfs(depId)) return true;
  }

  return false;
}


export function generateDefaultMilestones(
  projectId: string,
  projectStart: Date
): GanttTask[] {
  const milestones: GanttTask[] = [
    {
      id: `ms_kickoff_${projectId}`,
      project_id: projectId,
      name: 'Project Kick-off',
      start: formatDateYYYYMMDD(projectStart),
      end: formatDateYYYYMMDD(projectStart),
      progress: 0,
      type: 'milestone',
      custom_class: 'bar-milestone',
      weight: 0,
    },
    {
      id: `ms_30_${projectId}`,
      project_id: projectId,
      name: '30% Progress',
      start: formatDateYYYYMMDD(addDays(projectStart, 60)),
      end: formatDateYYYYMMDD(addDays(projectStart, 60)),
      progress: 0,
      type: 'milestone',
      custom_class: 'bar-milestone',
      weight: 0,
    },
    {
      id: `ms_70_${projectId}`,
      project_id: projectId,
      name: '70% Progress',
      start: formatDateYYYYMMDD(addDays(projectStart, 150)),
      end: formatDateYYYYMMDD(addDays(projectStart, 150)),
      progress: 0,
      type: 'milestone',
      custom_class: 'bar-milestone',
      weight: 0,
    },
    {
      id: `ms_handover_${projectId}`,
      project_id: projectId,
      name: 'Handover',
      start: formatDateYYYYMMDD(addDays(projectStart, 300)),
      end: formatDateYYYYMMDD(addDays(projectStart, 300)),
      progress: 0,
      type: 'milestone',
      custom_class: 'bar-milestone',
      weight: 0,
    },
    {
      id: `ms_closed_${projectId}`,
      project_id: projectId,
      name: 'Project Closed',
      start: formatDateYYYYMMDD(addDays(projectStart, 330)),
      end: formatDateYYYYMMDD(addDays(projectStart, 330)),
      progress: 0,
      type: 'milestone',
      custom_class: 'bar-milestone',
      weight: 0,
    },
  ];

  return milestones;
}


function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}


export async function exportGanttToPDF(svgElement: SVGElement, filename: string = 'gantt-chart.pdf'): Promise<void> {

  console.log('Export to PDF:', filename, svgElement);

}
