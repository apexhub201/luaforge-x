import React from 'react';
import { Zap, Settings, FileCode, Github } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-dark bg-dark-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Zap className="w-6 h-6 text-neon-blue" />
          <div>
            <h1 className="text-lg font-bold tracking-tight">LUAUFORGE X</h1>
            <p className="text-xs text-gray-400">Advanced Lua/Luau Virtualization Engine</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <button className="text-sm text-gray-300 hover:text-neon-blue transition-colors">
            Obfuscator
          </button>
          <button className="text-sm text-gray-300 hover:text-neon-blue transition-colors">
            Documentation
          </button>
          <button className="text-sm text-gray-300 hover:text-neon-blue transition-colors">
            <Github className="w-4 h-4 inline mr-1" />
            GitHub
          </button>
        </nav>
        
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-neon-green/10 text-neon-green text-xs font-medium rounded-full border border-neon-green/30">
            Engine: ONLINE
          </span>
        </div>
      </div>
    </header>
  );
}
