import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Gantt from 'frappe-gantt';
import type { GanttTask as FrappeGanttTask } from 'frappe-gantt';
import '../styles/frappe-gantt-vendor.css';
import type { Milestone, Task } from '../types';
import '../styles/gantt.css';
import { calculateDelay } from '../utils/gantt.utils';
import { exportGanttToPDF } from '../utils/ganttExport';

type GanttTask = FrappeGanttTask;

// Helper: Calculate luminance from RGB color
const calculateLuminance = (r: number, g: number, b: number): number => {
  // Using relative luminance formula (ITU-R BT.709)
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

// Helper: Get text color based on background color (WCAG 2.0 compliant)
const getContrastTextColor = (bgColor: string): string => {
  // Parse hex color
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = calculateLuminance(r, g, b);

  // Return white for dark backgrounds, black for light backgrounds
  // Threshold of 0.5 gives good results for most cases
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Helper: Validate and format date
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return new Date().toISOString().split('T')[0];
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
};

// Helper: Build gantt tasks array (pure function for performance)
const buildGanttTasks = (
  tasks: Task[],
  milestones: Milestone[],
  calculateProgress: (milestoneId: string) => number
): GanttTask[] => {
  const ganttTasks: GanttTask[] = [];

  // Add milestones
  milestones.forEach((milestone) => {
    const start = formatDate(milestone.start_date);
    const end = formatDate(
      milestone.end_date || new Date(new Date(start).getTime() + 7 * 24 * 60 * 60 * 1000)
    );

    const progress = calculateProgress(milestone.id);

    // TDD-015 Extended: Apply delay-based color class
    const { custom_class } = calculateDelay({
      start,
      end,
      progress,
      type: 'milestone',
    });

    ganttTasks.push({
      id: `milestone-${milestone.id}`,
      name: `📌 ${milestone.name}`,
      start,
      end,
      progress,
      custom_class, // bar-milestone
    });
  });

  // Add tasks
  tasks.forEach((task) => {
    const start = formatDate(task.start_date);
    const end = formatDate(
      task.due_date || new Date(new Date(start).getTime() + 3 * 24 * 60 * 60 * 1000)
    );

    // TDD-015 Extended: Apply status-based color class
    const { custom_class } = calculateDelay({
      start,
      end,
      progress: task.progress || 0,
      type: task.type || 'activity',
    });

    // Build dependencies
    const dependencies: string[] = [];
    if (task.milestone_id) {
      dependencies.push(`milestone-${task.milestone_id}`);
    }
    if (task.dependencies && Array.isArray(task.dependencies)) {
      task.dependencies.forEach((depId: string) => {
        dependencies.push(`task-${depId}`);
      });
    }

    ganttTasks.push({
      id: `task-${task.id}`,
      name: task.name,
      start,
      end,
      progress: task.progress || 0,
      dependencies: dependencies.length > 0 ? dependencies.join(',') : undefined,
      custom_class, // bar-milestone, bar-todo, bar-in-progress, bar-done
    });
  });

  // Placeholder if empty
  if (ganttTasks.length === 0) {
    ganttTasks.push({
      id: 'placeholder',
      name: 'No data',
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      custom_class: 'gantt-placeholder',
    });
  }

  return ganttTasks;
};

// Helper: Detect circular dependencies (prevent infinite loops)
const hasCircularDependency = (
  taskId: string,
  dependencies: string[],
  allTasks: Task[]
): boolean => {
  const visited = new Set<string>();
  const recStack = new Set<string>();

  const dfs = (id: string): boolean => {
    if (recStack.has(id)) return true; // Cycle detected
    if (visited.has(id)) return false;

    visited.add(id);
    recStack.add(id);

    const task = allTasks.find((t) => t.id === id);
    if (task?.dependencies && Array.isArray(task.dependencies)) {
      for (const depId of task.dependencies) {
        if (dfs(depId)) return true;
      }
    }

    recStack.delete(id);
    return false;
  };

  // Check if adding dependencies would create cycle
  for (const depId of dependencies) {
    if (dfs(depId)) return true;
  }

  return false;
};

// Helper: Auto-adjust dependent tasks on date change (FS/SS logic)
const adjustDependentTasks = (
  changedTaskId: string,
  newEndDate: Date,
  allTasks: Task[]
): Task[] => {
  const updatedTasks = [...allTasks];
  const visited = new Set<string>();

  const adjustRecursive = (taskId: string, parentEndDate: Date) => {
    if (visited.has(taskId)) return; // Prevent circular processing
    visited.add(taskId);

    // Find tasks that depend on this task
    const dependentTasks = updatedTasks.filter((t) =>
      t.dependencies && Array.isArray(t.dependencies) && t.dependencies.includes(taskId)
    );

    dependentTasks.forEach((task) => {
      const taskStart = new Date(task.start_date || Date.now());
      const taskEnd = new Date(task.due_date || Date.now());
      const duration = taskEnd.getTime() - taskStart.getTime();

      // Finish-to-Start (FS): dependent task starts after parent ends
      const newStart = new Date(parentEndDate.getTime() + 24 * 60 * 60 * 1000); // +1 day
      const newEnd = new Date(newStart.getTime() + duration);

      // Update task dates
      const index = updatedTasks.findIndex((t) => t.id === task.id);
      if (index !== -1) {
        updatedTasks[index] = {
          ...updatedTasks[index],
          start_date: newStart.toISOString(),
          due_date: newEnd.toISOString(),
        };
      }

      // Recursively adjust tasks that depend on this one
      adjustRecursive(task.id, newEnd);
    });
  };

  adjustRecursive(changedTaskId, newEndDate);
  return updatedTasks;
};

interface GanttChartComponentProps {
  tasks: Task[];
  milestones: Milestone[];
  onTaskClick?: (task: Task) => void;
  onMilestoneClick?: (milestoneId: string) => void;
  viewMode?: 'Day' | 'Week' | 'Month';
  onDateChange?: (taskId: string, start: Date, end: Date) => void;
  onMilestoneDateChange?: (milestoneId: string, start: Date, end: Date) => void;
}

const GanttChartComponent = ({
  tasks,
  milestones,
  onTaskClick,
  onMilestoneClick,
  viewMode = 'Week',
  onDateChange,
  onMilestoneDateChange,
}: GanttChartComponentProps) => {
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstanceRef = useRef<Gantt | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  
  // Local state for smooth dragging (optimistic updates)
  const [tasksView, setTasksView] = useState<Task[]>(tasks);
  const [milestonesView, setMilestonesView] = useState<Milestone[]>(milestones);
  
  // TDD-015 Extended: Mobile responsive view mode
  const [currentViewMode, setCurrentViewMode] = useState<'Day' | 'Week' | 'Month'>(viewMode);
  
  // RAF handler for throttling
  const rafIdRef = useRef<number | null>(null);
  
  // Pending updates queue (commit on drag end)
  const pendingUpdatesRef = useRef<Map<string, { start: Date; end: Date }>>(new Map());

  // Sync external props to local state
  useEffect(() => {
    setTasksView(tasks);
  }, [tasks]);

  useEffect(() => {
    setMilestonesView(milestones);
  }, [milestones]);

  // TDD-015 Extended: Mobile responsive - auto-switch to Month mode on <768px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        if (currentViewMode !== 'Month') {
          setCurrentViewMode('Month');
        }
      } else {
        // Restore original viewMode when back to desktop
        if (currentViewMode !== viewMode) {
          setCurrentViewMode(viewMode);
        }
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode, currentViewMode]);

  // Memoized color application (stable reference)
  const applyCustomColors = useCallback(() => {
    if (!ganttRef.current) return;

    const barWrappers = ganttRef.current.querySelectorAll('.bar-wrapper');

    barWrappers.forEach((wrapper) => {
      const bar = wrapper.querySelector('.bar') as SVGElement;
      if (!bar) return;

      const classList = Array.from(wrapper.classList);
      let fillColor = '';
      let strokeColor = '';

      // TDD-015 Extended: Status-based color system
      // Priority: bar-milestone > bar-done > bar-in-progress > bar-todo
      if (classList.some((c) => c.includes('bar-milestone'))) {
        // Milestone - BROWN/MAROON
        fillColor = '#6d4c41';
        strokeColor = '#5d4037';
      } else if (classList.some((c) => c.includes('bar-done'))) {
        // Done - GRAY
        fillColor = '#9e9e9e';
        strokeColor = '#757575';
      } else if (classList.some((c) => c.includes('bar-in-progress'))) {
        // In Progress - GREEN
        fillColor = '#4caf50';
        strokeColor = '#388e3c';
      } else if (classList.some((c) => c.includes('bar-todo'))) {
        // TODO - BLUE
        fillColor = '#2196f3';
        strokeColor = '#1976d2';
      } else if (classList.some((c) => c.includes('bar-red'))) {
        // Backwards compatibility - map to TODO
        fillColor = '#2196f3';
        strokeColor = '#1976d2';
      } else if (classList.some((c) => c.includes('bar-orange'))) {
        // Backwards compatibility - map to In Progress
        fillColor = '#4caf50';
        strokeColor = '#388e3c';
      } else if (classList.some((c) => c.includes('bar-yellow'))) {
        // Backwards compatibility - map to TODO
        fillColor = '#2196f3';
        strokeColor = '#1976d2';
      } else if (classList.some((c) => c.includes('bar-green'))) {
        // Backwards compatibility - map to Done
        fillColor = '#9e9e9e';
        strokeColor = '#757575';
      }
      
      // Fallback to old class names (backwards compatibility)
      if (!fillColor) {
        if (classList.some((c) => c.includes('gantt-milestone-ahead'))) {
          fillColor = '#4caf50';
          strokeColor = '#2e7d32';
        } else if (classList.some((c) => c.includes('gantt-milestone-on-time'))) {
          fillColor = '#ffeb3b';
          strokeColor = '#f9a825';
        } else if (classList.some((c) => c.includes('gantt-milestone-delayed-medium'))) {
          fillColor = '#ff9800';
          strokeColor = '#ef6c00';
        } else if (classList.some((c) => c.includes('gantt-milestone-delayed-severe'))) {
          fillColor = '#e53935';
          strokeColor = '#c62828';
        } else if (classList.some((c) => c.includes('gantt-milestone-planned'))) {
          fillColor = '#5d4037';
          strokeColor = '#3e2723';
        } else if (classList.some((c) => c.includes('gantt-milestone-in-progress'))) {
          fillColor = '#6d4c41';
          strokeColor = '#4e342e';
        } else if (classList.some((c) => c.includes('gantt-milestone-done'))) {
          fillColor = '#8d6e63';
          strokeColor = '#5d4037';
        } else if (classList.some((c) => c.includes('gantt-task-todo'))) {
          fillColor = '#90caf9';
          strokeColor = '#42a5f5';
        } else if (classList.some((c) => c.includes('gantt-task-in-progress'))) {
          fillColor = '#4caf50';
          strokeColor = '#388e3c';
        } else if (classList.some((c) => c.includes('gantt-task-done'))) {
          fillColor = '#9e9e9e';
          strokeColor = '#757575';
        }
      }

      // Apply bar colors
      if (fillColor) {
        bar.setAttribute('fill', fillColor);
        bar.setAttribute('stroke', strokeColor);

        // Calculate and apply text color for contrast
        const textColor = getContrastTextColor(fillColor);

        // Apply text color to all text elements in this bar wrapper
        const barLabel = wrapper.querySelector('.bar-label') as SVGTextElement;
        if (barLabel) {
          barLabel.setAttribute('fill', textColor);
          barLabel.style.fill = textColor;
        }

        // Apply to progress text
        const barProgress = wrapper.querySelector('.bar-progress') as SVGTextElement;
        if (barProgress) {
          barProgress.setAttribute('fill', textColor);
          barProgress.style.fill = textColor;
        }

        // Apply to all text children in the wrapper
        const allTexts = wrapper.querySelectorAll('text');
        allTexts.forEach((text) => {
          text.setAttribute('fill', textColor);
          text.style.fill = textColor;
        });

        // Store text color as data attribute for hover/drag states
        wrapper.setAttribute('data-text-color', textColor);
      }
    });
  }, []);

  // Setup MutationObserver with debouncing to reduce overhead
  const setupObserver = useCallback(() => {
    if (!ganttRef.current) return;

    // Cleanup existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer with RAF throttling
    let rafId: number | null = null;
    observerRef.current = new MutationObserver(() => {
      if (rafId !== null) return; // Already scheduled
      rafId = requestAnimationFrame(() => {
        applyCustomColors();
        rafId = null;
      });
    });

    // Start observing
    observerRef.current.observe(ganttRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  }, [applyCustomColors]);

  // Throttled drag handler with RAF (smooth dragging)
  const handleDragChange = useCallback(
    (taskGanttId: string, start: Date, end: Date) => {
      // Cancel pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Schedule update in next frame
      rafIdRef.current = requestAnimationFrame(() => {
        const isMilestone = taskGanttId.startsWith('milestone-');
        const id = isMilestone
          ? taskGanttId.replace('milestone-', '')
          : taskGanttId.replace('task-', '');

        // Store pending update
        pendingUpdatesRef.current.set(id, { start, end });

        // Optimistic UI update (local state only)
        if (isMilestone) {
          setMilestonesView((prev) =>
            prev.map((m) =>
              m.id === id
                ? { ...m, start_date: start.toISOString(), end_date: end.toISOString() }
                : m
            )
          );
        } else {
          setTasksView((prev) => {
            const updated = prev.map((t) =>
              t.id === id
                ? { ...t, start_date: start.toISOString(), due_date: end.toISOString() }
                : t
            );
            
            // Auto-adjust dependent tasks (FS logic)
            return adjustDependentTasks(id, end, updated);
          });
        }

        rafIdRef.current = null;
      });
    },
    []
  );

  // Commit changes to backend on drag end
  const commitPendingUpdates = useCallback(async () => {
    const updates = Array.from(pendingUpdatesRef.current.entries());
    pendingUpdatesRef.current.clear();

    for (const [id, { start, end }] of updates) {
      try {
        // Determine if task or milestone
        const isTask = tasksView.some((t) => t.id === id);
        const isMilestone = milestonesView.some((m) => m.id === id);

        if (isTask && onDateChange) {
          await onDateChange(id, start, end);
        } else if (isMilestone && onMilestoneDateChange) {
          await onMilestoneDateChange(id, start, end);
        }
      } catch (error) {
        console.error('Failed to update date:', error);
        // Revert to original state on error
        setTasksView(tasks);
        setMilestonesView(milestones);
      }
    }
  }, [tasksView, milestonesView, tasks, milestones, onDateChange, onMilestoneDateChange]);

  // Main Gantt rendering effect
  useEffect(() => {
    if (!ganttRef.current) return;

    // Helper: Calculate milestone progress based on tasksView
    const calculateMilestoneProgress = (milestoneId: string): number => {
      const milestoneTasks = tasksView.filter((t) => t.milestone_id === milestoneId);
      if (milestoneTasks.length === 0) {
        // Fallback to status-based progress
        const milestone = milestonesView.find((m) => m.id === milestoneId);
        if (milestone?.status === 'DONE') return 100;
        if (milestone?.status === 'IN_PROGRESS') return 50;
        return 0;
      }
      const totalProgress = milestoneTasks.reduce((sum, t) => sum + (t.progress || 0), 0);
      return Math.round(totalProgress / milestoneTasks.length);
    };

    // Build gantt tasks array
    const ganttTasks = buildGanttTasks(tasksView, milestonesView, calculateMilestoneProgress);

    // Destroy existing instance
    if (ganttInstanceRef.current) {
      ganttRef.current.innerHTML = '';
    }

    // Calculate optimal column width based on view mode
    const getColumnWidth = (mode: string) => {
      switch (mode) {
        case 'Day': return 38;
        case 'Week': return 120;
        case 'Month': return 120;
        default: return 120;
      }
    };

    // Create new Gantt instance
    try {
      ganttInstanceRef.current = new Gantt(ganttRef.current, ganttTasks, {
        view_mode: currentViewMode,
        header_height: 50,
        column_width: getColumnWidth(currentViewMode),
        step: 24,
        bar_height: 20,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        date_format: 'YYYY-MM-DD',
        on_click: (task: GanttTask) => {
          if (task.id === 'placeholder') return;

          if (task.id.startsWith('milestone-')) {
            const milestoneId = task.id.replace('milestone-', '');
            onMilestoneClick?.(milestoneId);
          } else if (task.id.startsWith('task-')) {
            const taskId = task.id.replace('task-', '');
            const foundTask = tasksView.find((t) => t.id === taskId);
            if (foundTask) {
              onTaskClick?.(foundTask);
            }
          }
        },
        on_date_change: (task: GanttTask, start: Date, end: Date) => {
          if (task.id === 'placeholder') return;

          // Use throttled handler for smooth dragging
          handleDragChange(task.id, start, end);
        },
        on_progress_change: () => {
          // Commit all pending updates when drag completes
          commitPendingUpdates();
        },
        custom_popup_html: (task: GanttTask) => {
          if (task.id === 'placeholder') return '';

          const isMilestone = task.id.startsWith('milestone-');
          
          if (isMilestone) {
            const milestoneId = task.id.replace('milestone-', '');
            const milestone = milestonesView.find((m) => m.id === milestoneId);
            const milestoneTasks = tasksView.filter((t) => t.milestone_id === milestoneId);
            const completedTasks = milestoneTasks.filter((t) => t.status === 'DONE').length;
            
            // Format dates to DD MMM YYYY
            const startDate = new Date(task.start);
            const endDate = new Date(task.end);
            const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            
            return `
              <div class="title">📌 ${task.name.replace('📌 ', '')}</div>
              <div class="subtitle">
                <strong>Progress:</strong> ${task.progress}%<br/>
                <strong>Start:</strong> ${formatDate(startDate)}<br/>
                <strong>End:</strong> ${formatDate(endDate)}<br/>
                <strong>Tasks:</strong> ${completedTasks}/${milestoneTasks.length} completed<br/>
                <strong>Status:</strong> ${milestone?.status || 'N/A'}
              </div>
            `;
          } else {
            const taskId = task.id.replace('task-', '');
            const foundTask = tasksView.find((t) => t.id === taskId);
            const assigneeName = foundTask?.assignee?.employees?.[0]?.full_name || foundTask?.assignee?.username || 'Unassigned';
            
            // Format dates to DD MMM YYYY
            const startDate = new Date(task.start);
            const endDate = new Date(task.end);
            const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            
            // Calculate delay status
            const now = new Date();
            const daysUntilDue = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            let delayStatus = 'On Track';
            if (task.progress >= 100) {
              delayStatus = 'Completed';
            } else if (daysUntilDue < 0) {
              delayStatus = `Delayed (${Math.abs(daysUntilDue)} days)`;
            } else if (daysUntilDue <= 7) {
              delayStatus = `Due Soon (${daysUntilDue} days)`;
            }
            
            // Get dependencies
            const depText = task.dependencies && task.dependencies.length > 0 
              ? task.dependencies.join(', ') 
              : 'None';
            
            return `
              <div class="title">${task.name}</div>
              <div class="subtitle">
                <strong>Progress:</strong> ${task.progress}%<br/>
                <strong>Start:</strong> ${formatDate(startDate)}<br/>
                <strong>End:</strong> ${formatDate(endDate)}<br/>
                <strong>Weight:</strong> ${foundTask?.weight_pct || 0}%<br/>
                <strong>Delay Status:</strong> ${delayStatus}<br/>
                <strong>Dependencies:</strong> ${depText}<br/>
                <strong>Assignee:</strong> ${assigneeName}<br/>
                <strong>Status:</strong> ${foundTask?.status || 'N/A'}
              </div>
            `;
          }
        },
      });

      // Apply custom colors and setup observer
      applyCustomColors();
      setupObserver();

      // Force re-render to ensure correct width calculation
      setTimeout(() => {
        if (ganttInstanceRef.current) {
          try {
            ganttInstanceRef.current.refresh();
          } catch (e) {
            // Gantt might not have refresh method in all versions
            console.debug('Gantt refresh not available');
          }
        }
      }, 100);

      // Add global mouseup listener to commit pending updates
      const handleMouseUp = () => {
        if (pendingUpdatesRef.current.size > 0) {
          commitPendingUpdates();
        }
      };
      document.addEventListener('mouseup', handleMouseUp);

      // Add event listeners to maintain text contrast on hover/drag
      const handleHoverMaintainContrast = (e: Event) => {
        const wrapper = (e.target as Element).closest('.bar-wrapper');
        if (wrapper) {
          const textColor = wrapper.getAttribute('data-text-color');
          if (textColor) {
            const allTexts = wrapper.querySelectorAll('text');
            allTexts.forEach((text) => {
              text.setAttribute('fill', textColor);
              text.style.fill = textColor;
            });
          }
        }
      };

      ganttRef.current.addEventListener('mouseover', handleHoverMaintainContrast, true);
      ganttRef.current.addEventListener('mousedown', handleHoverMaintainContrast, true);

      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        if (ganttRef.current) {
          ganttRef.current.removeEventListener('mouseover', handleHoverMaintainContrast, true);
          ganttRef.current.removeEventListener('mousedown', handleHoverMaintainContrast, true);
        }
      };
    } catch (error) {
      console.error('Failed to initialize Gantt chart:', error);
    }

    return () => {
      // Cleanup RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      // Cleanup observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (ganttRef.current) {
        ganttRef.current.innerHTML = '';
      }
    };
  }, [
    tasksView,
    milestonesView,
    currentViewMode,
    onTaskClick,
    onMilestoneClick,
    handleDragChange,
    commitPendingUpdates,
    applyCustomColors,
    setupObserver,
  ]);

  // Handle PDF Export
  const handleExportPDF = useCallback(() => {
    if (!ganttRef.current) {
      console.error('Gantt container not found');
      return;
    }

    const projectId = tasksView[0]?.project_id || milestonesView[0]?.project_id || 'unknown';
    
    exportGanttToPDF(ganttRef.current.parentElement as HTMLElement, {
      filename: `project-gantt-${projectId}.pdf`,
      format: 'pdf',
      orientation: 'landscape',
      quality: 0.95,
    });
  }, [tasksView, milestonesView]);

  // Expose export function for parent component
  useEffect(() => {
    if (ganttRef.current) {
      (ganttRef.current as any).__exportPDF = handleExportPDF;
    }
  }, [handleExportPDF]);

  return (
    <div className="gantt-container">
      <div ref={ganttRef} />
    </div>
  );
};

export default GanttChartComponent;
