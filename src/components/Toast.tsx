import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ type, message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-neon-green" />,
    error: <XCircle className="w-5 h-5 text-neon-red" />,
    info: <Info className="w-5 h-5 text-neon-blue" />,
  };
  
  const colors = {
    success: 'border-neon-green/30',
    error: 'border-neon-red/30',
    info: 'border-neon-blue/30',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 
                 bg-dark-card border ${colors[type]} rounded-lg shadow-lg`}
    >
      {icons[type]}
      <span className="text-sm text-gray-200">{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-dark-input rounded transition-colors"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </motion.div>
  );
}
