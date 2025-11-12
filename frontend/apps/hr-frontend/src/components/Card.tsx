import { cn } from "../utils/cn";
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-white rounded-xl shadow-sm border border-gray-200 p-6", className)} {...props} />;
}
