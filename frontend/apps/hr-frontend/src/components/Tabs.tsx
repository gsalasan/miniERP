import { motion } from "framer-motion";
export function Tabs({ steps, current, onChange }: { steps: string[]; current: number; onChange: (idx: number) => void }) {
  return (
    <div className="flex items-center mb-6">
      {steps.map((step, idx) => (
        <div key={step} className="flex items-center">
          <button
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${current === idx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
            onClick={() => onChange(idx)}
            type="button"
          >{idx + 1}</button>
          {idx < steps.length - 1 && <div className="w-8 h-1 bg-gray-200 mx-2 rounded" />}
        </div>
      ))}
    </div>
  );
}
