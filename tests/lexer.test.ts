import { describe, it, expect } from 'vitest';
import { Tokenizer } from '../src/obfuscator/lexer/tokenizer';
import { TokenType } from '../src/obfuscator/lexer/types';

describe('Lexer', () => {
  it('should tokenize basic code', () => {
    const tokenizer = new Tokenizer('local x = 10');
    const { tokens, errors } = tokenizer.tokenize();
    
    expect(errors).toHaveLength(0);
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.Local,
      TokenType.Identifier,
      TokenType.Assign,
      TokenType.Number,
      TokenType.EOF
    ]);
  });
  
  it('should handle strings', () => {
    const tokenizer = new Tokenizer('print("Hello")');
    const { tokens, errors } = tokenizer.tokenize();
    
    expect(errors).toHaveLength(0);
    expect(tokens.some(t => t.type === TokenType.String)).toBe(true);
  });
  
  it('should handle operators', () => {
    const tokenizer = new Tokenizer('a = b + c');
    const { tokens, errors } = tokenizer.tokenize();
    
    expect(errors).toHaveLength(0);
    expect(tokens.map(t => t.type)).toContain(TokenType.Plus);
    expect(tokens.map(t => t.type)).toContain(TokenType.Assign);
  });
  
  it('should track positions', () => {
    const tokenizer = new Tokenizer('local a = 1\nlocal b = 2');
    const { tokens } = tokenizer.tokenize();
    
    const secondLocal = tokens.find(t => t.value === 'local' && t.line === 2);
    expect(secondLocal).toBeDefined();
    expect(secondLocal!.column).toBe(1);
  });
  
  it('should handle vararg', () => {
    const tokenizer = new Tokenizer('local function f(...) return ... end');
    const { tokens, errors } = tokenizer.tokenize();
    
    expect(errors).toHaveLength(0);
    expect(tokens.map(t => t.type)).toContain(TokenType.Vararg);
  });
});
