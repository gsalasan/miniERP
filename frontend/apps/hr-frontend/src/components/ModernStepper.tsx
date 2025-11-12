import React from 'react';

interface Step {
  label: string;
  active: boolean;
  completed: boolean;
}

interface ModernStepperProps {
  steps: Step[];
  onStepClick?: (idx: number) => void;
}

export default function ModernStepper({ steps, onStepClick }: ModernStepperProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <button
            type="button"
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-200
              ${step.active ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-110' : step.completed ? 'bg-blue-200 text-blue-700 border-blue-400' : 'bg-gray-100 text-gray-400 border-gray-200'}
            `}
            onClick={() => onStepClick && onStepClick(idx)}
            aria-label={step.label}
          >
            {idx + 1}
          </button>
          <span className={`text-sm font-semibold transition-colors duration-200 ${step.active ? 'text-blue-700' : 'text-gray-400'}`}>{step.label}</span>
          {idx < steps.length - 1 && (
            <span className={`w-8 h-1 rounded-full ${step.completed ? 'bg-blue-400' : 'bg-gray-200'} transition-all`}></span>
          )}
        </div>
      ))}
    </div>
  );
}
