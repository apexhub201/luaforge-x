import { Token, TokenType } from '../lexer/types';
import { ASTNode, ProgramNode, BlockNode, ExpressionNode, IdentifierNode, FunctionDeclarationNode, FunctionExpressionNode, LocalDeclarationNode, AssignmentNode, IfStatementNode, WhileStatementNode, RepeatStatementNode, NumericForStatementNode, GenericForStatementNode, ReturnStatementNode, BreakStatementNode, CallStatementNode, BinaryExpressionNode, UnaryExpressionNode, NumberLiteralNode, StringLiteralNode, BooleanLiteralNode, NilLiteralNode, TableConstructorNode, TableAccessNode, IndexExpressionNode, CallExpressionNode, GroupingExpressionNode, MethodCallNode, VarargExpressionNode } from './ast';

export interface ParserError {
  message: string;
  line: number;
  column: number;
  offset: number;
}

export class Parser {
  private tokens: Token[] = [];
  private current: number = 0;
  private errors: ParserError[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): { ast: ProgramNode | null; errors: ParserError[] } {
    const body: ASTNode[] = [];
    
    while (!this.isAtEnd()) {
      const statement = this.parseStatement();
      if (statement) {
        body.push(statement);
      }
      
      while (this.match(TokenType.Semicolon)) {}
      
      if (this.errors.length > 0) {
        break;
      }
    }
    
    if (this.errors.length > 0) {
      return { ast: null, errors: this.errors };
    }
    
    return {
      ast: { type: 'Program', body },
      errors: [],
    };
  }

  private parseStatement(): ASTNode | null {
    if (this.match(TokenType.Local)) {
      return this.parseLocalDeclaration();
    }
    
    if (this.match(TokenType.Function)) {
      return this.parseFunctionDeclaration(false);
    }
    
    if (this.match(TokenType.If)) {
      return this.parseIfStatement();
    }
    
    if (this.match(TokenType.While)) {
      return this.parseWhileStatement();
    }
    
    if (this.match(TokenType.Repeat)) {
      return this.parseRepeatStatement();
    }
    
    if (this.match(TokenType.For)) {
      return this.parseForStatement();
    }
    
    if (this.match(TokenType.Return)) {
      return this.parseReturnStatement();
    }
    
    if (this.match(TokenType.Break)) {
      const token = this.previous();
      return { 
        type: 'BreakStatement',
        pos: { line: token.line, column: token.column, offset: token.startOffset }
      } as BreakStatementNode;
    }
    
    if (this.match(TokenType.Do)) {
      const body = this.parseBlock();
      this.consume(TokenType.End, "Expected 'end' after block");
      return body;
    }
    
    return this.parseExpressionStatement();
  }

  private parseLocalDeclaration(): ASTNode {
    if (this.match(TokenType.Function)) {
      return this.parseFunctionDeclaration(true);
    }
    
    const token = this.previous();
    const names: IdentifierNode[] = [];
    
    do {
      const nameToken = this.consume(TokenType.Identifier, 'Expected identifier');
      names.push({
        type: 'Identifier',
        name: nameToken.value,
        pos: { line: nameToken.line, column: nameToken.column, offset: nameToken.startOffset }
      });
    } while (this.match(TokenType.Comma));
    
    const values: ExpressionNode[] = [];
    
    if (this.match(TokenType.Assign)) {
      do {
        values.push(this.parseExpression());
      } while (this.match(TokenType.Comma));
    }
    
    return {
      type: 'LocalDeclaration',
      names,
      values,
      pos: { line: token.line, column: token.column, offset: token.startOffset }
    } as LocalDeclarationNode;
  }

  private parseFunctionDeclaration(isLocal: boolean): ASTNode {
    const token = this.previous();
    const nameToken = this.consume(TokenType.Identifier, 'Expected function name');
    
    let target: IdentifierNode = { 
      type: 'Identifier', 
      name: nameToken.value,
      pos: { line: nameToken.line, column: nameToken.column, offset: nameToken.startOffset }
    };
    let isMethod = false;
    
    // Method definition: function obj:method()
    if (this.match(TokenType.Colon)) {
      const methodToken = this.consume(TokenType.Identifier, 'Expected method name');
      target = {
        type: 'Identifier',
        name: `${nameToken.value}:${methodToken.value}`,
        pos: { line: nameToken.line, column: nameToken.column, offset: nameToken.startOffset }
      };
      isMethod = true;
    }
    // Dot access: function obj.method()
    else if (this.match(TokenType.Dot)) {
      const propToken = this.consume(TokenType.Identifier, 'Expected property name');
      target = {
        type: 'Identifier',
        name: `${nameToken.value}.${propToken.value}`,
        pos: { line: nameToken.line, column: nameToken.column, offset: nameToken.startOffset }
      };
      isMethod = true;
    }
    
    this.consume(TokenType.LeftParen, "Expected '('");
    
    const params: IdentifierNode[] = [];
    let isVararg = false;
    
    if (!this.check(TokenType.RightParen)) {
      do {
        if (this.match(TokenType.Vararg)) {
          isVararg = true;
          break;
        }
        const paramToken = this.consume(TokenType.Identifier, 'Expected parameter name');
        params.push({
          type: 'Identifier',
          name: paramToken.value,
          pos: { line: paramToken.line, column: paramToken.column, offset: paramToken.startOffset }
        });
      } while (this.match(TokenType.Comma));
    }
    
    this.consume(TokenType.RightParen, "Expected ')'");
    
    const body = this.parseBlock();
    this.consume(TokenType.End, "Expected 'end'");
    
    return {
      type: 'FunctionDeclaration',
      name: target,
      params,
      body,
      isLocal,
      isMethod,
      isVararg,
      pos: { line: token.line, column: token.column, offset: token.startOffset }
    } as FunctionDeclarationNode;
  }

  private parseFunctionExpression(): ExpressionNode {
    const token = this.previous();
    this.consume(TokenType.LeftParen, "Expected '('");
    
    const params: IdentifierNode[] = [];
    let isVararg = false;
    
    if (!this.check(TokenType.RightParen)) {
      do {
        if (this.match(TokenType.Vararg)) {
          isVararg = true;
          break;
        }
        const paramToken = this.consume(TokenType.Identifier, 'Expected parameter name');
        params.push({
          type: 'Identifier',
          name: paramToken.value,
          pos: { line: paramToken.line, column: paramToken.column, offset: paramToken.startOffset }
        });
      } while (this.match(TokenType.Comma));
    }
    
    this.consume(TokenType.RightParen, "Expected ')'");
    
    const body = this.parseBlock();
    this.consume(TokenType.End, "Expected 'end'");
    
    return {
      type: 'FunctionExpression',
      params,
      body,
      isVararg,
      pos: { line: token.line, column: token.column, offset: token.startOffset }
    } as FunctionExpressionNode;
  }

  private parseIfStatement(): ASTNode {
    const token = this.previous();
    const clauses: { condition: ExpressionNode; body: BlockNode }[] = [];
    
    const condition = this.parseExpression();
    this.consume(TokenType.Then, "Expected 'then'");
    const body = this.parseBlock();
    clauses.push({ condition, body });
    
    let elseBody: BlockNode | undefined;
    
    while (this.match(TokenType.Elseif)) {
      const elseifCondition = this.parseExpression();
      this.consume(TokenType.Then, "Expected 'then'");
      const elseifBody = this.parseBlock();
      clauses.push({ condition: elseifCondition, body: elseifBody });
    }
    
    if (this.match(TokenType.Else)) {
      elseBody = this.parseBlock();
    }
    
    this.consume(TokenType.End, "Expected 'end'");
    
    return {
      type: 'IfStatement',
      clauses,
      elseBody,
      pos: { line: token.line, column: token.column, offset: token.startOffset }
    } as IfStatementNode;
  }

  private parseWhileStatement(): ASTNode {
    const token = this.previous();
    const condition = this.parseExpression();
    this.consume(TokenType.Do, "Expected 'do'");
    const body = this.parseBlock();
    this.consume(TokenType.End, "Expected 'end'");
    
    return {
      type: 'WhileStatement',
      condition,
      body,
      pos: { line: token.line, column: token.column, offset: token.startOffset }
    } as WhileStatementNode;
  }

  private parseRepeatStatement(): ASTNode {
    const token = this.previous();
    const body = this.parseBlock();
    this.consume(TokenType.Until, "Expected 'until'");
    const condition = this.parseExpression();
    
    return {
      type: 'RepeatStatement',
      body,
      condition,
      pos: { line: token.line, column: token.column, offset: token.startOffset }
    } as RepeatStatementNode;
  }

  private parseForStatement(): ASTNode {
    const token = this.previous();
    const varToken = this.consume(TokenType.Identifier, 'Expected variable name');
    const variable: IdentifierNode = {
      type: 'Identifier',
      name: varToken.value,
      pos: { line: varToken.line, column: varToken.column, offset: varToken.startOffset }
    };
    
    if (this.match(TokenType.Assign)) {
      // Numeric for
      const start = this.parseExpression();
      this.consume(TokenType.Comma, "Expected ','");
      const end = this.parseExpression();
      
      let step: ExpressionNode | undefined;
      if (this.match(TokenType.Comma)) {
        step = this.parseExpression();
      }
      
      this.consume(TokenType.Do, "Expected 'do'");
      const body = this.parseBlock();
      this.consume(TokenType.End, "Expected 'end'");
      
      return {
        type: 'NumericForStatement',
        variable,
        start,
        end,
        step,
        body,
        pos: { line: token.line, column: token.column, offset: token.startOffset }
      } as NumericForStatementNode;
    } else {
      // Generic for
      const variables: IdentifierNode[] = [variable];
      
      while (this.match(TokenType.Comma)) {
        const varToken = this.consume(TokenType.Identifier, 'Expected variable name');
        variables.push({
          type: 'Identifier',
          name: varToken.value,
          pos: { line: varToken.line, column: varToken.column, offset: varToken.startOffset }
        });
      }
      
      this.consume(TokenType.In, "Expected 'in'");
      
      const iterators: ExpressionNode[] = [];
      do {
        iterators.push(this.parseExpression());
      } while (this.match(TokenType.Comma));
      
      this.consume(TokenType.Do, "Expected 'do'");
      const body = this.parseBlock();
      this.consume(TokenType.End, "Expected 'end'");
      
      return {
        type: 'GenericForStatement',
        variables,
        iterators,
        body,
        pos: { line: token.line, column: token.column, offset: token.startOffset }
      } as GenericForStatementNode;
    }
  }

  private parseReturnStatement(): ASTNode {
    const token = this.previous();
    const values: ExpressionNode[] = [];
    
    if (!this.check(TokenType.End) && !this.check(TokenType.Semicolon) && !this.isAtEnd()) {
      do {
        values.push(this.parseExpression());
      } while (this.match(TokenType.Comma));
    }
    
    return {
      type: 'ReturnStatement',
      values,
      pos: { line: token.line, column: token.column, offset: token.startOffset }
    } as ReturnStatementNode;
  }

  private parseExpressionStatement(): ASTNode | null {
    const startToken = this.peek();
    const expression = this.parseExpression();
    
    // Check for assignment
    if (this.match(TokenType.Assign)) {
      const targets: ExpressionNode[] = [expression];
      
      while (this.match(TokenType.Comma)) {
        targets.push(this.parseExpression());
      }
      
      this.consume(TokenType.Assign, "Expected '='");
      
      const values: ExpressionNode[] = [];
      do {
        values.push(this.parseExpression());
      } while (this.match(TokenType.Comma));
      
      return {
        type: 'Assignment',
        targets,
        values,
        pos: { line: startToken.line, column: startToken.column, offset: startToken.startOffset }
      } as AssignmentNode;
    }
    
    if (expression.type === 'CallExpression' || expression.type === 'MethodCall') {
      return {
        type: 'CallStatement',
        expression: expression as CallExpressionNode | MethodCallNode,
        pos: { line: startToken.line, column: startToken.column, offset: startToken.startOffset }
      } as CallStatementNode;
    }
    
    this.errors.push({
      message: 'Invalid statement',
      line: startToken.line,
      column: startToken.column,
      offset: startToken.startOffset,
    });
    return null;
  }

  private parseBlock(): BlockNode {
    const statements: ASTNode[] = [];
    
    while (!this.check(TokenType.End) && !this.check(TokenType.Else) && 
           !this.check(TokenType.Elseif) && !this.check(TokenType.Until) && 
           !this.isAtEnd()) {
      const statement = this.parseStatement();
      if (statement) {
        statements.push(statement);
      }
      
      while (this.match(TokenType.Semicolon)) {}
      
      if (this.errors.length > 0) {
        break;
      }
    }
    
    return { type: 'Block', statements };
  }

  private parseExpression(): ExpressionNode {
    return this.parseBinaryExpression(0);
  }

  private parseBinaryExpression(minPrecedence: number): ExpressionNode {
    let left = this.parseUnaryExpression();
    
    while (true) {
      const operator = this.peek();
      const precedence = this.getOperatorPrecedence(operator.type);
      
      if (precedence < minPrecedence) {
        break;
      }
      
      this.advance();
      
      // Handle right-associative operators
      const nextMinPrecedence = (operator.type === TokenType.Power || operator.type === TokenType.Concat)
        ? precedence
        : precedence + 1;
      
      const right = this.parseBinaryExpression(nextMinPrecedence);
      
      left = {
        type: 'BinaryExpression',
        operator: operator.value,
        left,
        right,
        pos: { line: operator.line, column: operator.column, offset: operator.startOffset }
      } as BinaryExpressionNode;
    }
    
    return left;
  }

  private getOperatorPrecedence(type: TokenType): number {
    switch (type) {
      case TokenType.Or:
        return 1;
      case TokenType.And:
        return 2;
      case TokenType.LessThan:
      case TokenType.LessThanOrEqual:
      case TokenType.GreaterThan:
      case TokenType.GreaterThanOrEqual:
      case TokenType.NotEqual:
      case TokenType.Equal:
        return 3;
      case TokenType.Concat:
        return 4;
      case TokenType.Plus:
      case TokenType.Minus:
        return 5;
      case TokenType.Multiply:
      case TokenType.Divide:
      case TokenType.Modulo:
        return 6;
      case TokenType.Power:
        return 7;
      default:
        return -1;
    }
  }

  private parseUnaryExpression(): ExpressionNode {
    if (this.match(TokenType.Not) || this.match(TokenType.Minus) || 
        this.match(TokenType.Hash)) {
      const operator = this.previous();
      const operand = this.parseUnaryExpression();
      
      return {
        type: 'UnaryExpression',
        operator: operator.value,
        operand,
        pos: { line: operator.line, column: operator.column, offset: operator.startOffset }
      } as UnaryExpressionNode;
    }
    
    return this.parsePrimaryExpression();
  }

  private parsePrimaryExpression(): ExpressionNode {
    if (this.match(TokenType.Number)) {
      const token = this.previous();
      return {
        type: 'NumberLiteral',
        value: token.numberValue || 0,
        pos: { line: token.line, column: token.column, offset: token.startOffset }
      } as NumberLiteralNode;
    }
    
    if (this.match(TokenType.String)) {
      const token = this.previous();
      return {
        type: 'StringLiteral',
        value: this.parseStringValue(token.value),
        pos: { line: token.line, column: token.column, offset: token.startOffset }
      } as StringLiteralNode;
    }
    
    if (this.match(TokenType.True)) {
      const token = this.previous();
      return {
        type: 'BooleanLiteral',
        value: true,
        pos: { line: token.line, column: token.column, offset: token.startOffset }
      } as BooleanLiteralNode;
    }
    
    if (this.match(TokenType.False)) {
      const token = this.previous();
      return {
        type: 'BooleanLiteral',
        value: false,
        pos: { line: token.line, column: token.column, offset: token.startOffset }
      } as BooleanLiteralNode;
    }
    
    if (this.match(TokenType.Nil)) {
      const token = this.previous();
      return {
        type: 'NilLiteral',
        pos: { line: token.line, column: token.column, offset: token.startOffset }
      } as NilLiteralNode;
    }
    
    if (this.match(TokenType.Function)) {
      return this.parseFunctionExpression();
    }
    
    if (this.match(TokenType.LeftBrace)) {
      return this.parseTableConstructor();
    }
    
    if (this.match(TokenType.LeftParen)) {
      const expression = this.parseExpression();
      this.consume(TokenType.RightParen, "Expected ')'");
      return {
        type: 'GroupingExpression',
        expression
      } as GroupingExpressionNode;
    }
    
    if (this.match(TokenType.Vararg)) {
      const token = this.previous();
      return {
        type: 'VarargExpression',
        pos: { line: token.line, column: token.column, offset: token.startOffset }
      } as VarargExpressionNode;
    }
    
    if (this.match(TokenType.Identifier)) {
      const token = this.previous();
      let expression: ExpressionNode = {
        type: 'Identifier',
        name: token.value,
        pos: { line: token.line, column: token.column, offset: token.startOffset }
      } as IdentifierNode;
      
      return this.parsePostfixExpression(expression);
    }
    
    const token = this.peek();
    this.errors.push({
      message: `Unexpected token: ${token.value}`,
      line: token.line,
      column: token.column,
      offset: token.startOffset,
    });
    return { type: 'NilLiteral' } as NilLiteralNode;
  }

  private parseTableConstructor(): ExpressionNode {
    const token = this.previous();
    const entries: { key?: ExpressionNode; value: ExpressionNode }[] = [];
    
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      if (this.match(TokenType.LeftBracket)) {
        const key = this.parseExpression();
        this.consume(TokenType.RightBracket, "Expected ']'");
        this.consume(TokenType.Assign, "Expected '='");
        const value = this.parseExpression();
        entries.push({ key, value });
      } else if (this.check(TokenType.Identifier) && this.peekNext().type === TokenType.Assign) {
        const keyToken = this.advance();
        this.advance(); // Skip '='
        const value = this.parseExpression();
        entries.push({
          key: {
            type: 'Identifier',
            name: keyToken.value,
            pos: { line: keyToken.line, column: keyToken.column, offset: keyToken.startOffset }
          },
          value,
        });
      } else {
        const value = this.parseExpression();
        entries.push({ value });
      }
      
      if (!this.match(TokenType.Comma) && !this.match(TokenType.Semicolon)) {
        break;
      }
    }
    
    this.consume(TokenType.RightBrace, "Expected '}'");
    
    return {
      type: 'TableConstructor',
      entries,
      pos: { line: token.line, column: token.column, offset: token.startOffset }
    } as TableConstructorNode;
  }

  private parsePostfixExpression(expression: ExpressionNode): ExpressionNode {
    while (true) {
      if (this.match(TokenType.Dot)) {
        const propToken = this.consume(TokenType.Identifier, 'Expected property name');
        expression = {
          type: 'TableAccess',
          object: expression,
          property: propToken.value,
          pos: { line: propToken.line, column: propToken.column, offset: propToken.startOffset }
        } as TableAccessNode;
      } else if (this.match(TokenType.LeftBracket)) {
        const index = this.parseExpression();
        this.consume(TokenType.RightBracket, "Expected ']'");
        expression = {
          type: 'IndexExpression',
          object: expression,
          index
        } as IndexExpressionNode;
      } else if (this.match(TokenType.Colon)) {
        const methodToken = this.consume(TokenType.Identifier, 'Expected method name');
        expression = this.parseCallExpression(expression, methodToken.value, true);
      } else if (this.check(TokenType.LeftParen) || this.check(TokenType.String) || 
                 this.check(TokenType.LeftBrace)) {
        expression = this.parseCallExpression(expression);
      } else {
        break;
      }
    }
    
    return expression;
  }

  private parseCallExpression(callee: ExpressionNode, method?: string, isMethodCall?: boolean): ExpressionNode {
    const args: ExpressionNode[] = [];
    
    if (this.match(TokenType.LeftParen)) {
      if (!this.check(TokenType.RightParen)) {
        do {
          args.push(this.parseExpression());
        } while (this.match(TokenType.Comma));
      }
      this.consume(TokenType.RightParen, "Expected ')'");
    } else if (this.match(TokenType.String)) {
      const token = this.previous();
      args.push({
        type: 'StringLiteral',
        value: this.parseStringValue(token.value),
        pos: { line: token.line, column: token.column, offset: token.startOffset }
      } as StringLiteralNode);
    } else if (this.match(TokenType.LeftBrace)) {
      args.push(this.parseTableConstructor());
    } else {
      const token = this.peek();
      this.errors.push({
        message: 'Expected arguments',
        line: token.line,
        column: token.column,
        offset: token.startOffset,
      });
      return callee;
    }
    
    if (isMethodCall && method) {
      return {
        type: 'MethodCall',
        object: callee,
        method,
        arguments: args,
      } as MethodCallNode;
    }
    
    return {
      type: 'CallExpression',
      callee,
      arguments: args,
    } as CallExpressionNode;
  }

  private parseStringValue(raw: string): string {
    if (raw.length < 2) return '';
    
    const quote = raw[0];
    if (quote === '"' || quote === "'") {
      let result = '';
      let i = 1;
      
      while (i < raw.length - 1) {
        if (raw[i] === '\\' && i + 1 < raw.length - 1) {
          i++;
          switch (raw[i]) {
            case 'n': result += '\n'; break;
            case 't': result += '\t'; break;
            case 'r': result += '\r'; break;
            case '\\': result += '\\'; break;
            case '"': result += '"'; break;
            case "'": result += "'"; break;
            case '0': result += '\0'; break;
            case 'a': result += '\a'; break;
            case 'b': result += '\b'; break;
            case 'f': result += '\f'; break;
            case 'v': result += '\v'; break;
            default:
              if (raw[i] >= '0' && raw[i] <= '9') {
                let num = '';
                while (i < raw.length - 1 && raw[i] >= '0' && raw[i] <= '9' && num.length < 3) {
                  num += raw[i];
                  i++;
                }
                i--;
                result += String.fromCharCode(parseInt(num));
              } else {
                result += raw[i];
              }
          }
          i++;
        } else {
          result += raw[i];
          i++;
        }
      }
      
      return result;
    }
    
    // Long string - remove brackets
    let level = 0;
    let pos = 1;
    while (raw[pos] === '=') {
      level++;
      pos++;
    }
    
    return raw.slice(pos + 1, raw.length - level - 2);
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private peekNext(): Token {
    return this.tokens[this.current + 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    
    const token = this.peek();
    this.errors.push({
      message,
      line: token.line,
      column: token.column,
      offset: token.startOffset,
    });
    return token;
  }
}
