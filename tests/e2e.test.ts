import { describe, it, expect } from 'vitest';
import { LuaForgeX, obfuscate } from '../src/obfuscator';

describe('End-to-End Tests', () => {
  const engine = new LuaForgeX();
  
  it('should execute print("Hello")', () => {
    const result = engine.execute('print("Hello")');
    expect(result.error).toBeUndefined();
    expect(result.output).toEqual(['Hello']);
  });
  
  it('should execute basic arithmetic', () => {
    const result = engine.execute('local a = 10\nlocal b = 20\nprint(a + b)');
    expect(result.error).toBeUndefined();
    expect(result.output).toEqual(['30']);
  });
  
  it('should execute function calls', () => {
    const result = engine.execute(`
      local function add(a, b)
        return a + b
      end
      print(add(10, 20))
    `);
    expect(result.error).toBeUndefined();
    expect(result.output).toEqual(['30']);
  });
  
  it('should execute loops', () => {
    const result = engine.execute(`
      local sum = 0
      for i = 1, 10 do
        sum = sum + i
      end
      print(sum)
    `);
    expect(result.error).toBeUndefined();
    expect(result.output).toEqual(['55']);
  });
  
  it('should execute table operations', () => {
    const result = engine.execute(`
      local t = {
        name = "Lua",
        value = 123
      }
      print(t.name)
      print(t.value)
    `);
    expect(result.error).toBeUndefined();
    expect(result.output).toEqual(['Lua', '123']);
  });
  
  it('should obfuscate code successfully', () => {
    const source = 'print("Hello World")';
    const result = obfuscate(source);
    
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
    expect(result.output!.length).toBeGreaterThan(source.length);
    expect(result.stats).toBeDefined();
    expect(result.stats!.instructions).toBeGreaterThan(0);
  });
  
  it('should handle syntax errors', () => {
    const result = obfuscate('local x = ');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
