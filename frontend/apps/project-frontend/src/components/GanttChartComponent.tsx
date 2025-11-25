import { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';
import type { GanttTask as FrappeGanttTask } from 'frappe-gantt';
import '../styles/frappe-gantt-vendor.css';
import type { Milestone, Task } from '../types';
import '../styles/gantt.css';

type GanttTask = FrappeGanttTask;

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

  // Function to apply colors - can be called multiple times
  const applyCustomColors = () => {
    if (!ganttRef.current) return;

    const barWrappers = ganttRef.current.querySelectorAll('.bar-wrapper');

    barWrappers.forEach((wrapper) => {
      const bar = wrapper.querySelector('.bar') as SVGElement;
      if (!bar) return;

      const classList = Array.from(wrapper.classList);

      // Apply colors based on custom class
      if (classList.some((c) => c.includes('gantt-milestone-planned'))) {
        bar.setAttribute('fill', '#5d4037');
        bar.setAttribute('stroke', '#3e2723');
      } else if (
        classList.some((c) => c.includes('gantt-milestone-in-progress'))
      ) {
        bar.setAttribute('fill', '#6d4c41');
        bar.setAttribute('stroke', '#4e342e');
      } else if (classList.some((c) => c.includes('gantt-milestone-done'))) {
        bar.setAttribute('fill', '#8d6e63');
        bar.setAttribute('stroke', '#5d4037');
      } else if (classList.some((c) => c.includes('gantt-task-todo'))) {
        bar.setAttribute('fill', '#90caf9');
        bar.setAttribute('stroke', '#42a5f5');
      } else if (classList.some((c) => c.includes('gantt-task-in-progress'))) {
        bar.setAttribute('fill', '#4caf50');
        bar.setAttribute('stroke', '#388e3c');
      } else if (classList.some((c) => c.includes('gantt-task-done'))) {
        bar.setAttribute('fill', '#9e9e9e');
        bar.setAttribute('stroke', '#757575');
      }
    });
  };

  useEffect(() => {
    if (!ganttRef.current) return;

    // Convert milestones + tasks to Gantt format
    const ganttTasks: GanttTask[] = [];

    // Add milestones as gantt tasks
    milestones.forEach((milestone) => {
      const start = milestone.start_date
        ? new Date(milestone.start_date)
        : new Date();
      const end = milestone.end_date
        ? new Date(milestone.end_date)
        : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000); // default 7 days

      const customClass = `gantt-milestone-${milestone.status.toLowerCase().replace('_', '-')}`;

      ganttTasks.push({
        id: `milestone-${milestone.id}`,
        name: `📌 ${milestone.name}`,
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        progress:
          milestone.status === 'DONE'
            ? 100
            : milestone.status === 'IN_PROGRESS'
              ? 50
              : 0,
        custom_class: customClass,
      });
    });

    // Add tasks as gantt tasks
    tasks.forEach((task) => {
      const start = task.start_date ? new Date(task.start_date) : new Date();
      const end = task.due_date
        ? new Date(task.due_date)
        : new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000); // default 3 days

      const customClass = `gantt-task-${task.status.toLowerCase().replace('_', '-')}`;

      ganttTasks.push({
        id: `task-${task.id}`,
        name: task.name,
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        progress: task.progress || 0,
        dependencies: task.milestone_id
          ? `milestone-${task.milestone_id}`
          : undefined,
        custom_class: customClass,
      });
    });

    // If no tasks/milestones, show placeholder
    if (ganttTasks.length === 0) {
      ganttTasks.push({
        id: 'placeholder',
        name: 'No data',
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        progress: 0,
        custom_class: 'gantt-placeholder',
      });
    }

    // Destroy existing instance
    if (ganttInstanceRef.current) {
      ganttRef.current.innerHTML = '';
    }

    // Create new Gantt instance
    try {
      ganttInstanceRef.current = new Gantt(ganttRef.current, ganttTasks, {
        view_mode: viewMode,
        bar_height: 30,
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
            const foundTask = tasks.find((t) => t.id === taskId);
            if (foundTask) {
              onTaskClick?.(foundTask);
            }
          }
        },
        on_date_change: (task: GanttTask, start: Date, end: Date) => {
          if (task.id === 'placeholder') return;

          // Update backend asynchronously
          if (task.id.startsWith('milestone-')) {
            const milestoneId = task.id.replace('milestone-', '');
            if (onMilestoneDateChange) {
              onMilestoneDateChange(milestoneId, start, end);
            }
          } else if (task.id.startsWith('task-')) {
            const taskId = task.id.replace('task-', '');
            if (onDateChange) {
              onDateChange(taskId, start, end);
            }
          }

          // Reapply colors after drag
          setTimeout(() => applyCustomColors(), 100);
        },
        custom_popup_html: (task: GanttTask) => {
          if (task.id === 'placeholder') return '';

          const isMilestone = task.id.startsWith('milestone-');
          const label = isMilestone ? 'Milestone' : 'Task';

          return `
            <div class="title">${label}: ${task.name}</div>
            <div class="subtitle">${task.start} → ${task.end}</div>
            <div class="details">Progress: ${task.progress}%</div>
          `;
        },
      });

      // Apply custom colors after initial render
      setTimeout(() => applyCustomColors(), 150);
    } catch {
      // Failed to initialize
    }

    return () => {
      if (ganttRef.current) {
        ganttRef.current.innerHTML = '';
      }
    };
  }, [
    tasks,
    milestones,
    viewMode,
    onTaskClick,
    onMilestoneClick,
    onDateChange,
    onMilestoneDateChange,
  ]);

  return (
    <div className="gantt-container">
      <div ref={ganttRef} />
    </div>
  );
};

export default GanttChartComponent;
