import React from 'react';
import { Shield, Lock, Braces, Shuffle, Key, GitBranch } from 'lucide-react';
import { ObfuscationOptions } from '../obfuscator';

interface Props {
  options: ObfuscationOptions;
  onChange: (options: ObfuscationOptions) => void;
}

export function ConfigSidebar({ options, onChange }: Props) {
  const toggle = (key: keyof ObfuscationOptions) => {
    onChange({ ...options, [key]: !options[key] });
  };
  
  const items = [
    { key: 'vm' as const, label: 'VM Virtualization', icon: Shield },
    { key: 'stringEncoding' as const, label: 'String Encoding', icon: Lock },
    { key: 'constantEncoding' as const, label: 'Constant Encoding', icon: Braces },
    { key: 'identifierMutation' as const, label: 'Identifier Mutation', icon: Shuffle },
    { key: 'opcodeRandomization' as const, label: 'Opcode Randomization', icon: Key },
    { key: 'integrity' as const, label: 'Integrity Check', icon: Shield },
    { key: 'controlFlow' as const, label: 'Control Flow', icon: GitBranch },
  ];
  
  return (
    <div className="glass-panel p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center">
        <Shield className="w-4 h-4 mr-2 text-neon-blue" />
        PROTECTION
      </h3>
      
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => toggle(item.key)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-dark-input transition-colors"
            >
              <span className="flex items-center text-sm text-gray-300">
                <Icon className="w-4 h-4 mr-2 text-gray-400" />
                {item.label}
              </span>
              <span className={`w-4 h-4 rounded border ${options[item.key] ? 'bg-neon-blue border-neon-blue' : 'border-gray-600'}`}>
                {options[item.key] && (
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>
      
      <div className="mt-6">
        <h4 className="text-xs font-medium text-gray-400 mb-2">PRESETS</h4>
        <div className="grid grid-cols-2 gap-2">
          {['Light', 'Balanced', 'Strong', 'Extreme'].map((preset) => (
            <button
              key={preset}
              className="px-3 py-2 text-xs bg-dark-input rounded-lg hover:border-neon-blue/50 border border-transparent transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
