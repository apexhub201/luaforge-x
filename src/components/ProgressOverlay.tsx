import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader } from 'lucide-react';

interface ProgressOverlayProps {
  isVisible: boolean;
  currentStep?: string;
}

const STEPS = [
  'Initializing...',
  'Lexing source...',
  'Parsing tokens...',
  'Building AST...',
  'Compiling bytecode...',
  'Encoding strings...',
  'Encoding constants...',
  'Randomizing opcodes...',
  'Generating VM...',
  'Packing payload...',
  'Finalizing...',
];

export function ProgressOverlay({ isVisible, currentStep = '' }: ProgressOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  
  useEffect(() => {
    if (!isVisible) {
      setStepIndex(0);
      return;
    }
    
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, [isVisible]);
  
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div className="bg-dark-card border border-dark rounded-xl p-6 w-80">
            <div className="flex items-center justify-center mb-4">
              <Loader className="w-8 h-8 text-neon-blue animate-spin" />
            </div>
            
            <h3 className="text-lg font-semibold text-center text-gray-200 mb-2">
              Building VM
            </h3>
            
            <p className="text-sm text-center text-gray-400 mb-4">
              {currentStep || STEPS[stepIndex]}
            </p>
            
            <div className="w-full h-2 bg-dark-input rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-neon-blue"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            <p className="text-xs text-center text-gray-500 mt-2">
              {Math.round(progress)}%
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
