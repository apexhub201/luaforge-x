import React, { useState, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Zap, Copy, Download, Trash2, Settings, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { ConfigSidebar } from '../components/ConfigSidebar';
import { StatsBar } from '../components/StatsBar';
import { obfuscate, ObfuscationOptions } from '../obfuscator';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_SOURCE = `-- Paste your Lua/Luau source here
print("Hello World")

local player = game.Players.LocalPlayer
local speed = 50
print(player.Name, speed)
`;

export function Obfuscator() {
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'ready' | 'processing' | 'complete' | 'error'>('ready');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [options, setOptions] = useState<ObfuscationOptions>({
    vm: true,
    stringEncoding: true,
    constantEncoding: true,
    identifierMutation: true,
    opcodeRandomization: true,
    integrity: true,
    controlFlow: false,
  });
  
  const editorRef = useRef<any>(null);
  const outputRef = useRef<any>(null);
  
  const handleObfuscate = useCallback(async () => {
    if (!source.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setStatus('processing');
    setError(null);
    setOutput('');
    
    try {
      // Simulate progress
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = obfuscate(source, options);
      
      if (result.success && result.output) {
        setOutput(result.output);
        setStats(result.stats);
        setStatus('complete');
      } else if (result.error) {
        setError(`${result.error.message}${result.error.line ? ` (Line ${result.error.line}, Column ${result.error.column})` : ''}`);
        setStatus('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Obfuscation failed');
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  }, [source, options, isProcessing]);
  
  const handleCopy = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output);
    }
  }, [output]);
  
  const handleDownload = useCallback(() => {
    if (output) {
      const blob = new Blob([output], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'obfuscated.lua';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [output]);
  
  const handleClear = useCallback(() => {
    setSource('');
    setOutput('');
    setError(null);
    setStatus('ready');
    setStats(null);
  }, []);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleObfuscate();
    }
  }, [handleObfuscate]);
  
  return (
    <div className="space-y-4" onKeyDown={handleKeyDown}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <ConfigSidebar options={options} onChange={setOptions} />
        </div>
        
        <div className="lg:col-span-2">
          <div className="glass-panel overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-dark">
              <span className="text-sm font-medium text-gray-300">SOURCE CODE</span>
              <span className="text-xs text-gray-500">Lua/Luau</span>
            </div>
            
            <Editor
              height="500px"
              language="lua"
              theme="vs-dark"
              value={source}
              onChange={(value) => setSource(value || '')}
              onMount={(editor) => {
                editorRef.current = editor;
                editor.addCommand(
                  monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                  () => handleObfuscate()
                );
              }}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'off',
                automaticLayout: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="glass-panel overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-dark">
              <span className="text-sm font-medium text-gray-300">OUTPUT</span>
              <div className="flex space-x-2">
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-dark-input rounded transition-colors"
                  title="Copy output"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1 hover:bg-dark-input rounded transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            
            <Editor
              height="500px"
              language="lua"
              theme="vs-dark"
              value={output}
              onMount={(editor) => {
                outputRef.current = editor;
              }}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'off',
                automaticLayout: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleObfuscate}
            disabled={isProcessing || !source.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader className="w-4 h-4 inline mr-2 animate-spin" />
                BUILDING VM...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 inline mr-2" />
                OBFUSCATE
              </>
            )}
          </button>
          
          <button
            onClick={handleClear}
            className="btn-secondary"
          >
            <Trash2 className="w-4 h-4 inline mr-2" />
            Clear
          </button>
        </div>
        
        <AnimatePresence>
          {status === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center text-neon-green"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              OBFUSCATION COMPLETE
            </motion.div>
          )}
          
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center text-neon-red"
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              {error || 'Obfuscation failed'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {stats && <StatsBar stats={stats} />}
    </div>
  );
}
