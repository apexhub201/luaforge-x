// Semantic analysis for AST validation
import { ASTNode, ProgramNode, BlockNode, FunctionDeclarationNode, ReturnStatementNode, BreakStatementNode } from '../parser/ast';

export interface SemanticError {
  message: string;
  line?: number;
  column?: number;
}

export class SemanticAnalyzer {
  private errors: SemanticError[] = [];
  private loopDepth: number = 0;
  private functionDepth: number = 0;
  
  analyze(ast: ProgramNode): { valid: boolean; errors: SemanticError[] } {
    this.errors = [];
    this.analyzeBlock(ast);
    
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
    };
  }
  
  private analyzeBlock(block: ProgramNode | BlockNode): void {
    const statements = block.type === 'Program' ? block.body : block.statements;
    
    for (const statement of statements) {
      this.analyzeStatement(statement);
    }
  }
  
  private analyzeStatement(node: ASTNode): void {
    switch (node.type) {
      case 'BreakStatement':
        if (this.loopDepth === 0) {
          this.errors.push({
            message: 'break statement outside of loop',
            line: node.pos?.line,
            column: node.pos?.column,
          });
        }
        break;
        
      case 'ReturnStatement':
        // Return is always valid at statement level
        break;
        
      case 'FunctionDeclaration':
        this.functionDepth++;
        this.analyzeBlock((node as FunctionDeclarationNode).body);
        this.functionDepth--;
        break;
        
      case 'Block':
        this.analyzeBlock(node as BlockNode);
        break;
        
      case 'WhileStatement':
      case 'RepeatStatement':
      case 'NumericForStatement':
      case 'GenericForStatement':
        this.loopDepth++;
        this.analyzeBlock((node as any).body);
        this.loopDepth--;
        break;
        
      case 'IfStatement':
        for (const clause of (node as any).clauses) {
          this.analyzeBlock(clause.body);
        }
        if ((node as any).elseBody) {
          this.analyzeBlock((node as any).elseBody);
        }
        break;
        
      default:
        // No special semantic checks for other statement types
        break;
    }
  }
}
