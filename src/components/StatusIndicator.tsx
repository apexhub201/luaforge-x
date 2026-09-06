import React from 'react';
import { CheckCircle, XCircle, Loader, Circle } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'ready' | 'processing' | 'complete' | 'error';
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const config = {
    ready: {
      icon: Circle,
      color: 'text-gray-400',
      label: 'READY',
      bg: 'bg-gray-400/10',
      border: 'border-gray-400/30',
    },
    processing: {
      icon: Loader,
      color: 'text-neon-blue',
      label: 'OBFUSCATING',
      bg: 'bg-neon-blue/10',
      border: 'border-neon-blue/30',
    },
    complete: {
      icon: CheckCircle,
      color: 'text-neon-green',
      label: 'COMPLETE',
      bg: 'bg-neon-green/10',
      border: 'border-neon-green/30',
    },
    error: {
      icon: XCircle,
      color: 'text-neon-red',
      label: 'ERROR',
      bg: 'bg-neon-red/10',
      border: 'border-neon-red/30',
    },
  };
  
  const { icon: Icon, color, label, bg, border } = config[status];
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${bg} ${border}`}>
      <Icon className={`w-4 h-4 ${color} ${status === 'processing' ? 'animate-spin' : ''}`} />
      <span className={`text-xs font-medium ${color}`}>{label}</span>
    </div>
  );
}
