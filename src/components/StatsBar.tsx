import React from 'react';
import { FileCode, Cpu, Database, Clock } from 'lucide-react';

interface Props {
  stats: {
    originalSize: number;
    outputSize: number;
    instructions: number;
    constants: number;
    functions: number;
    buildTime: number;
  };
}

export function StatsBar({ stats }: Props) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const items = [
    { icon: FileCode, label: 'Original', value: formatSize(stats.originalSize) },
    { icon: FileCode, label: 'Output', value: formatSize(stats.outputSize) },
    { icon: Cpu, label: 'Instructions', value: stats.instructions.toString() },
    { icon: Database, label: 'Constants', value: stats.constants.toString() },
    { icon: Clock, label: 'Build Time', value: `${stats.buildTime} ms` },
  ];
  
  return (
    <div className="glass-panel p-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center space-x-2">
              <Icon className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-sm font-medium text-gray-200">{item.value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
