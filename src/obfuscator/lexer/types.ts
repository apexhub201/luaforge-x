export enum TokenType {
  // Keywords
  Local = 'local',
  Function = 'function',
  If = 'if',
  Elseif = 'elseif',
  Else = 'else',
  While = 'while',
  Do = 'do',
  Repeat = 'repeat',
  Until = 'until',
  For = 'for',
  In = 'in',
  Return = 'return',
  Break = 'break',
  End = 'end',
  Then = 'then',
  And = 'and',
  Or = 'or',
  Not = 'not',
  Nil = 'nil',
  True = 'true',
  False = 'false',
  
  // Literals
  Identifier = 'identifier',
  Number = 'number',
  String = 'string',
  
  // Operators
  Plus = '+',
  Minus = '-',
  Multiply = '*',
  Divide = '/',
  Modulo = '%',
  Power = '^',
  Concat = '..',
  Equal = '==',
  NotEqual = '~=',
  LessThan = '<',
  LessThanOrEqual = '<=',
  GreaterThan = '>',
  GreaterThanOrEqual = '>=',
  Assign = '=',
  LeftParen = '(',
  RightParen = ')',
  LeftBrace = '{',
  RightBrace = '}',
  LeftBracket = '[',
  RightBracket = ']',
  Comma = ',',
  Semicolon = ';',
  Colon = ':',
  Dot = '.',
  Hash = '#',
  Vararg = '...',
  
  // Special
  EOF = 'eof',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  startOffset: number;
  endOffset: number;
  numberValue?: number;
}

export interface LexerError {
  message: string;
  line: number;
  column: number;
  offset: number;
}
