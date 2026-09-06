import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Zap, Copy, Download, Trash2, Shield, Lock, Braces, 
  Shuffle, Key, GitBranch, AlertCircle, CheckCircle, 
  Loader, FileCode, Cpu, Database, Clock, Settings,
  ChevronDown, ChevronUp, Play, Terminal
} from 'lucide-react';

// Types
interface ObfuscationOptions {
  vm: boolean;
  stringEncoding: boolean;
  constantEncoding: boolean;
  identifierMutation: boolean;
  opcodeRandomization: boolean;
  integrity: boolean;
  controlFlow: boolean;
}

interface ObfuscationStats {
  originalSize: number;
  outputSize: number;
  instructions: number;
  constants: number;
  functions: number;
  buildTime: number;
}

// Simple obfuscator placeholder (will be replaced with real engine)
function simpleObfuscate(source: string, options: ObfuscationOptions): { output: string; stats: ObfuscationStats } {
  const startTime = Date.now();
  
  // Simple obfuscation for demo
  const lines = source.split('\n');
  const obfuscatedLines = lines.map((line, index) => {
    if (line.trim().startsWith('--')) return line;
    if (line.trim().length === 0) return line;
    
    // Simple string encoding
    if (options.stringEncoding) {
      line = line.replace(/"([^"]*)"/g, (match, str) => {
        const encoded = Array.from(str).map(c => `\\${c.charCodeAt(0)}`).join('');
        return `"${encoded}"`;
      });
    }
    
    // Add comment
    if (options.integrity && index % 3 === 0) {
      line = `--[[ Protected by LUAUFORGE X ]] ${line}`;
    }
    
    return line;
  });
  
  const output = `--[[
          LUAUFORGE X
================================================
Advanced Lua/Luau Virtualization Engine
VM | Encrypt | Mutate | CF | Integrity
Build: ${Math.random().toString(36).substring(2, 10).toUpperCase()}
================================================
]]

${obfuscatedLines.join('\n')}`;
  
  const endTime = Date.now();
  
  return {
    output,
    stats: {
      originalSize: source.length,
      outputSize: output.length,
      instructions: Math.floor(source.length / 10),
      constants: Math.floor(source.length / 20),
      functions: (source.match(/function/g) || []).length,
      buildTime: endTime - startTime,
    }
  };
}

// Main App Component
export default function App() {
  const [source, setSource] = useState<string>(`-- Paste your Lua/Luau source here
print("Hello World")

local player = "TestPlayer"
local speed = 50
print(player, speed)

local function add(a, b)
    return a + b
end

print(add(10, 20))

for i = 1, 5 do
    print("Loop:", i)
end

local t = {
    name = "Lua",
    value = 123
}
print(t.name, t.value)
`);
  
  const [output, setOutput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [status, setStatus] = useState<'ready' | 'processing' | 'complete' | 'error'>('ready');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ObfuscationStats | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  const [options, setOptions] = useState<ObfuscationOptions>({
    vm: true,
    stringEncoding: true,
    constantEncoding: true,
    identifierMutation: true,
    opcodeRandomization: true,
    integrity: true,
    controlFlow: false,
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle obfuscation
  const handleObfuscate = useCallback(async () => {
    if (!source.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setStatus('processing');
    setError(null);
    setOutput('');
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = simpleObfuscate(source, options);
      
      setOutput(result.output);
      setStats(result.stats);
      setStatus('complete');
      
      console.log('[LUAUFORGE X] Obfuscation complete:', result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Obfuscation failed');
      setStatus('error');
      console.error('[LUAUFORGE X] Obfuscation error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [source, options, isProcessing]);
  
  // Copy output
  const handleCopy = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output).then(() => {
        console.log('[LUAUFORGE X] Output copied to clipboard');
      }).catch(err => {
        console.error('[LUAUFORGE X] Copy failed:', err);
      });
    }
  }, [output]);
  
  // Download output
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
  
  // Clear all
  const handleClear = useCallback(() => {
    setSource('');
    setOutput('');
    setError(null);
    setStatus('ready');
    setStats(null);
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to obfuscate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleObfuscate();
      }
      // Ctrl/Cmd + Shift + C to copy
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        handleCopy();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleObfuscate, handleCopy]);
  
  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Toggle option
  const toggleOption = (key: keyof ObfuscationOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const optionItems = [
    { key: 'vm' as const, label: 'VM Virtualization', icon: Shield, description: 'Custom VM execution' },
    { key: 'stringEncoding' as const, label: 'String Encoding', icon: Lock, description: 'Encode strings' },
    { key: 'constantEncoding' as const, label: 'Constant Encoding', icon: Braces, description: 'Hide constants' },
    { key: 'identifierMutation' as const, label: 'Identifier Mutation', icon: Shuffle, description: 'Rename variables' },
    { key: 'opcodeRandomization' as const, label: 'Opcode Randomization', icon: Key, description: 'Randomize opcodes' },
    { key: 'integrity' as const, label: 'Integrity Check', icon: Shield, description: 'Detect tampering' },
    { key: 'controlFlow' as const, label: 'Control Flow', icon: GitBranch, description: 'Obfuscate flow' },
  ];
  
  const presets = ['Light', 'Balanced', 'Strong', 'Extreme'];
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#07090d', 
      color: '#e5e7eb',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #1a1f2e',
        background: 'rgba(10, 13, 20, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Zap size={24} color="#00d4ff" />
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
                LUAUFORGE X
              </h1>
              <p style={{ fontSize: '11px', color: '#6b7280' }}>
                Advanced Lua/Luau Virtualization Engine
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              padding: '4px 12px',
              background: 'rgba(34, 197, 94, 0.1)',
              color: '#22c55e',
              fontSize: '11px',
              fontWeight: '600',
              borderRadius: '9999px',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}>
              ● Engine: ONLINE
            </span>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main style={{
        flex: 1,
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '20px',
        width: '100%',
      }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#0d1117',
                color: '#9ca3af',
                border: '1px solid #1a1f2e',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00d4ff'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1a1f2e'}
            >
              <Settings size={16} />
              Configuration
              {showSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Status indicator */}
            {status === 'ready' && (
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>● Ready</span>
            )}
            {status === 'processing' && (
              <span style={{ color: '#00d4ff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Loader size={14} className="spin" />
                Building VM...
              </span>
            )}
            {status === 'complete' && (
              <span style={{ color: '#22c55e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} />
                Complete
              </span>
            )}
            {status === 'error' && (
              <span style={{ color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} />
                Error
              </span>
            )}
          </div>
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div style={{
            background: '#0a0d14',
            border: '1px solid #1a1f2e',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#e5e7eb' }}>
              Protection Settings
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
            }}>
              {optionItems.map((item) => {
                const Icon = item.icon;
                const isEnabled = options[item.key];
                
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleOption(item.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px',
                      background: isEnabled ? 'rgba(0, 212, 255, 0.05)' : '#0d1117',
                      border: `1px solid ${isEnabled ? 'rgba(0, 212, 255, 0.3)' : '#1a1f2e'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                    }}
                  >
                    <Icon size={18} color={isEnabled ? '#00d4ff' : '#6b7280'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '500',
                        color: isEnabled ? '#e5e7eb' : '#9ca3af',
                      }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        {item.description}
                      </div>
                    </div>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: `1px solid ${isEnabled ? '#00d4ff' : '#4b5563'}`,
                      background: isEnabled ? '#00d4ff' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {isEnabled && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Presets */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
                PRESETS
              </h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                {presets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      if (preset === 'Light') {
                        setOptions({ vm: false, stringEncoding: false, constantEncoding: false, identifierMutation: true, opcodeRandomization: false, integrity: false, controlFlow: false });
                      } else if (preset === 'Balanced') {
                        setOptions({ vm: true, stringEncoding: true, constantEncoding: true, identifierMutation: true, opcodeRandomization: true, integrity: true, controlFlow: false });
                      } else if (preset === 'Strong') {
                        setOptions({ vm: true, stringEncoding: true, constantEncoding: true, identifierMutation: true, opcodeRandomization: true, integrity: true, controlFlow: true });
                      } else {
                        setOptions({ vm: true, stringEncoding: true, constantEncoding: true, identifierMutation: true, opcodeRandomization: true, integrity: true, controlFlow: true });
                      }
                    }}
                    style={{
                      padding: '6px 16px',
                      background: '#0d1117',
                      color: '#9ca3af',
                      border: '1px solid #1a1f2e',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00d4ff'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1a1f2e'}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Editors */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px',
        }}>
          {/* Source Editor */}
          <div style={{
            background: '#0a0d14',
            border: '1px solid #1a1f2e',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #1a1f2e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#e5e7eb' }}>
                SOURCE CODE
              </span>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>
                Lua/Luau
              </span>
            </div>
            
            <textarea
              ref={textareaRef}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              spellCheck={false}
              placeholder="-- Paste your Lua/Luau source here&#10;print(&quot;Hello World&quot;)"
              style={{
                width: '100%',
                height: '500px',
                background: '#0d1117',
                color: '#e5e7eb',
                border: 'none',
                outline: 'none',
                padding: '16px',
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
              }}
            />
          </div>
          
          {/* Output Editor */}
          <div style={{
            background: '#0a0d14',
            border: '1px solid #1a1f2e',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #1a1f2e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#e5e7eb' }}>
                OUTPUT
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    border: 'none',
                    color: output ? '#9ca3af' : '#4b5563',
                    cursor: output ? 'pointer' : 'not-allowed',
                    borderRadius: '4px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { if (output) e.currentTarget.style.color = '#00d4ff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
                  title="Copy output"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    border: 'none',
                    color: output ? '#9ca3af' : '#4b5563',
                    cursor: output ? 'pointer' : 'not-allowed',
                    borderRadius: '4px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { if (output) e.currentTarget.style.color = '#00d4ff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
                  title="Download output"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
            
            <textarea
              ref={outputRef}
              value={output}
              readOnly
              placeholder="// Obfuscated output will appear here..."
              style={{
                width: '100%',
                height: '500px',
                background: '#0d1117',
                color: '#00d4ff',
                border: 'none',
                outline: 'none',
                padding: '16px',
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
              }}
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <button
            onClick={handleObfuscate}
            disabled={isProcessing || !source.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 32px',
              background: isProcessing || !source.trim() ? '#1a1f2e' : '#00d4ff',
              color: isProcessing || !source.trim() ? '#6b7280' : '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: isProcessing || !source.trim() ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              transition: 'all 0.2s',
              boxShadow: isProcessing || !source.trim() ? 'none' : '0 0 20px rgba(0, 212, 255, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (!isProcessing && source.trim()) {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 212, 255, 0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isProcessing ? (
              <>
                <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                BUILDING VM...
              </>
            ) : (
              <>
                <Zap size={18} />
                OBFUSCATE
              </>
            )}
          </button>
          
          <button
            onClick={handleClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#0d1117',
              color: '#9ca3af',
              border: '1px solid #1a1f2e',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1a1f2e';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>
        
        {/* Error Display */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <AlertCircle size={20} color="#ef4444" />
            <div>
              <div style={{ color: '#ef4444', fontWeight: '600', fontSize: '14px' }}>
                Obfuscation Failed
              </div>
              <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>
                {error}
              </div>
            </div>
          </div>
        )}
        
        {/* Stats Bar */}
        {stats && (
          <div style={{
            background: '#0a0d14',
            border: '1px solid #1a1f2e',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileCode size={18} color="#6b7280" />
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Original Size</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#e5e7eb' }}>
                    {formatBytes(stats.originalSize)}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileCode size={18} color="#6b7280" />
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Output Size</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#e5e7eb' }}>
                    {formatBytes(stats.outputSize)}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={18} color="#6b7280" />
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Instructions</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#e5e7eb' }}>
                    {stats.instructions}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={18} color="#6b7280" />
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Constants</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#e5e7eb' }}>
                    {stats.constants}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} color="#6b7280" />
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Build Time</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#e5e7eb' }}>
                    {stats.buildTime} ms
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1a1f2e',
        padding: '16px 20px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>
          LUAUFORGE X - Advanced Lua/Luau Virtualization Engine
        </p>
        <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>
          Obfuscation does not guarantee protection against reverse engineering
        </p>
      </footer>
      
      {/* Add spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
