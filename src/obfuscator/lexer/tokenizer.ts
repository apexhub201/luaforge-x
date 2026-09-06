import { Token, TokenType, LexerError } from './types';

const KEYWORDS: Record<string, TokenType> = {
  'local': TokenType.Local,
  'function': TokenType.Function,
  'if': TokenType.If,
  'elseif': TokenType.Elseif,
  'else': TokenType.Else,
  'while': TokenType.While,
  'do': TokenType.Do,
  'repeat': TokenType.Repeat,
  'until': TokenType.Until,
  'for': TokenType.For,
  'in': TokenType.In,
  'return': TokenType.Return,
  'break': TokenType.Break,
  'end': TokenType.End,
  'then': TokenType.Then,
  'and': TokenType.And,
  'or': TokenType.Or,
  'not': TokenType.Not,
  'nil': TokenType.Nil,
  'true': TokenType.True,
  'false': TokenType.False,
};

export class Tokenizer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  private errors: LexerError[] = [];

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): { tokens: Token[]; errors: LexerError[] } {
    while (!this.isAtEnd()) {
      this.skipWhitespace();
      
      if (this.isAtEnd()) break;
      
      const startOffset = this.position;
      const startLine = this.line;
      const startColumn = this.column;
      const char = this.peek();
      
      // Comments
      if (char === '-' && this.peekNext() === '-') {
        this.skipComment();
        continue;
      }
      
      // Strings
      if (char === '"' || char === "'") {
        this.tokenizeString(char, startOffset, startLine, startColumn);
        continue;
      }
      
      // Long strings
      if (char === '[' && (this.peekNext() === '[' || this.peekNext() === '=')) {
        if (this.tryTokenizeLongString(startOffset, startLine, startColumn)) {
          continue;
        }
      }
      
      // Numbers
      if (this.isDigit(char) || (char === '.' && this.isDigit(this.peekNext()))) {
        this.tokenizeNumber(startOffset, startLine, startColumn);
        continue;
      }
      
      // Identifiers and keywords
      if (this.isAlpha(char) || char === '_') {
        this.tokenizeIdentifier(startOffset, startLine, startColumn);
        continue;
      }
      
      // Operators
      this.tokenizeOperator(startOffset, startLine, startColumn);
    }
    
    this.tokens.push({
      type: TokenType.EOF,
      value: 'eof',
      line: this.line,
      column: this.column,
      startOffset: this.position,
      endOffset: this.position,
    });
    
    return { tokens: this.tokens, errors: this.errors };
  }

  private isAtEnd(): boolean {
    return this.position >= this.source.length;
  }

  private peek(): string {
    return this.source[this.position] || '';
  }

  private peekNext(): string {
    return this.source[this.position + 1] || '';
  }

  private advance(): string {
    const char = this.source[this.position++];
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private skipWhitespace(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private skipComment(): void {
    this.advance(); // -
    this.advance(); // -
    
    // Long comment
    if (this.peek() === '[' && (this.peekNext() === '[' || this.peekNext() === '=')) {
      this.skipLongBracket();
    } else {
      while (!this.isAtEnd() && this.peek() !== '\n') {
        this.advance();
      }
    }
  }

  private skipLongBracket(): void {
    let level = 0;
    this.advance(); // [
    while (this.peek() === '=') {
      level++;
      this.advance();
    }
    this.advance(); // [
    
    while (!this.isAtEnd()) {
      const char = this.advance();
      if (char === ']') {
        let closeLevel = 0;
        let tempPos = this.position;
        while (this.source[tempPos] === '=') {
          closeLevel++;
          tempPos++;
        }
        if (this.source[tempPos] === ']' && closeLevel === level) {
          for (let i = 0; i < closeLevel; i++) this.advance();
          this.advance(); // ]
          break;
        }
      }
    }
  }

  private tryTokenizeLongString(startOffset: number, line: number, column: number): boolean {
    let level = 0;
    let tempPos = this.position + 1;
    
    while (this.source[tempPos] === '=') {
      level++;
      tempPos++;
    }
    
    if (this.source[tempPos] === '[') {
      this.advance(); // [
      for (let i = 0; i < level; i++) this.advance();
      this.advance(); // [
      
      let value = '[' + '='.repeat(level) + '[';
      
      while (!this.isAtEnd()) {
        const char = this.advance();
        value += char;
        
        if (char === ']') {
          let closeLevel = 0;
          let tempPos = this.position;
          while (this.source[tempPos] === '=') {
            closeLevel++;
            tempPos++;
          }
          
          if (this.source[tempPos] === ']' && closeLevel === level) {
            for (let i = 0; i < closeLevel; i++) {
              value += this.advance();
            }
            value += this.advance(); // ]
            break;
          }
        }
      }
      
      this.tokens.push({
        type: TokenType.String,
        value,
        line,
        column,
        startOffset,
        endOffset: this.position,
      });
      
      return true;
    }
    
    return false;
  }

  private tokenizeString(quote: string, startOffset: number, line: number, column: number): void {
    this.advance(); // Skip opening quote
    let value = quote;
    
    while (!this.isAtEnd()) {
      const char = this.advance();
      value += char;
      
      if (char === '\\' && !this.isAtEnd()) {
        value += this.advance();
        continue;
      }
      
      if (char === quote) {
        break;
      }
      
      if (char === '\n') {
        this.errors.push({
          message: 'Unterminated string',
          line,
          column,
          offset: startOffset,
        });
        break;
      }
    }
    
    this.tokens.push({
      type: TokenType.String,
      value,
      line,
      column,
      startOffset,
      endOffset: this.position,
    });
  }

  private tokenizeNumber(startOffset: number, line: number, column: number): void {
    let value = '';
    
    if (this.peek() === '0' && (this.peekNext() === 'x' || this.peekNext() === 'X')) {
      value += this.advance();
      value += this.advance();
      
      while (this.isHexDigit(this.peek())) {
        value += this.advance();
      }
    } else {
      while (this.isDigit(this.peek())) {
        value += this.advance();
      }
      
      if (this.peek() === '.') {
        value += this.advance();
        while (this.isDigit(this.peek())) {
          value += this.advance();
        }
      }
      
      if (this.peek() === 'e' || this.peek() === 'E') {
        value += this.advance();
        if (this.peek() === '+' || this.peek() === '-') {
          value += this.advance();
        }
        while (this.isDigit(this.peek())) {
          value += this.advance();
        }
      }
    }
    
    const numberValue = Number(value);
    
    this.tokens.push({
      type: TokenType.Number,
      value,
      line,
      column,
      startOffset,
      endOffset: this.position,
      numberValue,
    });
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isHexDigit(char: string): boolean {
    return this.isDigit(char) || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F');
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char) || char === '_';
  }

  private tokenizeIdentifier(startOffset: number, line: number, column: number): void {
    let value = '';
    
    while (this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }
    
    const type = KEYWORDS[value] || TokenType.Identifier;
    
    this.tokens.push({
      type,
      value,
      line,
      column,
      startOffset,
      endOffset: this.position,
    });
  }

  private tokenizeOperator(startOffset: number, line: number, column: number): void {
    const char = this.advance();
    let value = char;
    let type: TokenType;
    
    switch (char) {
      case '+':
        type = TokenType.Plus;
        break;
      case '-':
        type = TokenType.Minus;
        break;
      case '*':
        type = TokenType.Multiply;
        break;
      case '/':
        type = TokenType.Divide;
        break;
      case '%':
        type = TokenType.Modulo;
        break;
      case '^':
        type = TokenType.Power;
        break;
      case '#':
        type = TokenType.Hash;
        break;
      case '=':
        if (this.peek() === '=') {
          this.advance();
          value += '=';
          type = TokenType.Equal;
        } else {
          type = TokenType.Assign;
        }
        break;
      case '~':
        if (this.peek() === '=') {
          this.advance();
          value += '=';
          type = TokenType.NotEqual;
        } else {
          this.errors.push({
            message: 'Unexpected character ~',
            line,
            column,
            offset: startOffset,
          });
          return;
        }
        break;
      case '<':
        if (this.peek() === '=') {
          this.advance();
          value += '=';
          type = TokenType.LessThanOrEqual;
        } else {
          type = TokenType.LessThan;
        }
        break;
      case '>':
        if (this.peek() === '=') {
          this.advance();
          value += '=';
          type = TokenType.GreaterThanOrEqual;
        } else {
          type = TokenType.GreaterThan;
        }
        break;
      case '.':
        if (this.peek() === '.') {
          this.advance();
          value += '.';
          if (this.peek() === '.') {
            this.advance();
            value += '.';
            type = TokenType.Vararg;
          } else {
            type = TokenType.Concat;
          }
        } else {
          type = TokenType.Dot;
        }
        break;
      case '(':
        type = TokenType.LeftParen;
        break;
      case ')':
        type = TokenType.RightParen;
        break;
      case '{':
        type = TokenType.LeftBrace;
        break;
      case '}':
        type = TokenType.RightBrace;
        break;
      case '[':
        type = TokenType.LeftBracket;
        break;
      case ']':
        type = TokenType.RightBracket;
        break;
      case ',':
        type = TokenType.Comma;
        break;
      case ';':
        type = TokenType.Semicolon;
        break;
      case ':':
        type = TokenType.Colon;
        break;
      default:
        this.errors.push({
          message: `Unexpected character: ${char}`,
          line,
          column,
          offset: startOffset,
        });
        return;
    }
    
    this.tokens.push({
      type,
      value,
      line,
      column,
      startOffset,
      endOffset: this.position,
    });
  }
}
