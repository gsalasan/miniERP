import React from "react";

interface ModuleCardProps {
  name: string;
  url: string;
  color: string;
}

export default function ModuleCard({ name, url, color }: ModuleCardProps) {
  return (
    <div
      onClick={() => (window.location.href = url)}
      className="cursor-pointer rounded-2xl shadow-md p-8 text-center font-semibold text-white transition-transform hover:scale-105"
      style={{ backgroundColor: color }}
    >
      <h2 className="text-2xl">{name}</h2>
    </div>
  );
}
