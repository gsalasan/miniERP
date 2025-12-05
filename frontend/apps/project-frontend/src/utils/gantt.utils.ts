// TDD-015 Extended - Gantt Utility Functions
// src/utils/gantt.utils.ts

import type { GanttTask, DelayStatus } from '../types/gantt.types';

/**
 * Calculate status-based color for Gantt chart bars
 * TDD-015 Extended Section 4: Status-based color logic
 * 
 * Logic:
 * - milestone → bar-milestone (brown/maroon)
 * - progress = 0% → bar-todo (blue)
 * - progress > 0% and < 100% → bar-in-progress (green)
 * - progress = 100% → bar-done (gray)
 * 
 * @param task - GanttTask with start, end, and progress
 * @returns DelayStatus with color class
 */
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

/**
 * Calculate luminance for dynamic text contrast (WCAG 2.0)
 * @param r - Red channel (0-255)
 * @param g - Green channel (0-255)
 * @param b - Blue channel (0-255)
 * @returns Luminance value (0-1)
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Get contrasting text color (white or black) for given background
 * @param bgColor - Background color in hex format (#RRGGBB)
 * @returns '#FFFFFF' for dark backgrounds, '#000000' for light backgrounds
 */
export function getContrastTextColor(bgColor: string): string {
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = calculateLuminance(r, g, b);

  // Threshold of 0.5 for optimal readability
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param dateString - Date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDateFormat(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Format date to YYYY-MM-DD
 * @param date - Date object or string
 * @returns Formatted date string
 */
export function formatDateYYYYMMDD(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  if (isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }

  return date.toISOString().split('T')[0];
}

/**
 * Detect circular dependencies in task graph
 * @param taskId - Task ID to check
 * @param dependencies - Array of dependent task IDs
 * @param allTasks - All tasks in the project
 * @returns true if circular dependency detected
 */
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

/**
 * Generate default milestones for a project
 * @param projectId - Project ID
 * @param projectStart - Project start date
 * @returns Array of default milestone tasks
 */
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

/**
 * Add days to date
 * @param date - Base date
 * @param days - Number of days to add
 * @returns New date with days added
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Export Gantt chart to PDF
 * @param svgElement - SVG element containing Gantt chart
 * @param filename - Output filename
 */
export async function exportGanttToPDF(svgElement: SVGElement, filename: string = 'gantt-chart.pdf'): Promise<void> {
  // This requires jsPDF and svg2pdf libraries
  // Implementation will be done in the component that uses this
  console.log('Export to PDF:', filename, svgElement);
  // TODO: Implement with jsPDF + svg2pdf.js
}
