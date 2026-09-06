// Identifier transformation utilities
import { ASTNode, ProgramNode, BlockNode, LocalDeclarationNode, FunctionDeclarationNode, IdentifierNode } from '../parser/ast';
import { randomIdentifier } from '../encoding/random';

export class IdentifierTransformer {
  private scopeStack: Map<string, string>[] = [];
  private nameMap: Map<string, string> = new Map();
  
  transform(ast: ProgramNode): ProgramNode {
    this.transformBlock(ast);
    return ast;
  }
  
  private transformBlock(block: ProgramNode | BlockNode): void {
    this.scopeStack.push(new Map());
    
    const statements = block.type === 'Program' ? block.body : block.statements;
    
    for (const statement of statements) {
      this.transformStatement(statement);
    }
    
    this.scopeStack.pop();
  }
  
  private transformStatement(node: ASTNode): void {
    switch (node.type) {
      case 'LocalDeclaration':
        this.transformLocalDeclaration(node as LocalDeclarationNode);
        break;
      case 'FunctionDeclaration':
        this.transformFunctionDeclaration(node as FunctionDeclarationNode);
        break;
      case 'Block':
        this.transformBlock(node as BlockNode);
        break;
      default:
        // Recursively transform other nodes if needed
        break;
    }
  }
  
  private transformLocalDeclaration(node: LocalDeclarationNode): void {
    for (const name of node.names) {
      if (this.shouldTransform(name.name)) {
        const newName = randomIdentifier();
        this.scopeStack[this.scopeStack.length - 1].set(name.name, newName);
        this.nameMap.set(name.name, newName);
        name.name = newName;
      }
    }
    
    // Transform values
    for (const value of node.values) {
      this.transformExpression(value);
    }
  }
  
  private transformFunctionDeclaration(node: FunctionDeclarationNode): void {
    if (node.isLocal && this.shouldTransform(node.name.name)) {
      const newName = randomIdentifier();
      this.scopeStack[this.scopeStack.length - 1].set(node.name.name, newName);
      this.nameMap.set(node.name.name, newName);
      node.name.name = newName;
    }
    
    // Transform parameters
    this.scopeStack.push(new Map());
    for (const param of node.params) {
      if (this.shouldTransform(param.name)) {
        const newName = randomIdentifier();
        this.scopeStack[this.scopeStack.length - 1].set(param.name, newName);
        param.name = newName;
      }
    }
    
    // Transform body
    this.transformBlock(node.body);
    this.scopeStack.pop();
  }
  
  private transformExpression(node: any): void {
    // Transform identifiers in expressions
    if (node.type === 'Identifier') {
      const mappedName = this.getMappedName(node.name);
      if (mappedName) {
        node.name = mappedName;
      }
    }
    
    // Recursively transform child nodes
    if (node.left) this.transformExpression(node.left);
    if (node.right) this.transformExpression(node.right);
    if (node.object) this.transformExpression(node.object);
    if (node.callee) this.transformExpression(node.callee);
    if (node.arguments) {
      for (const arg of node.arguments) {
        this.transformExpression(arg);
      }
    }
    if (node.values) {
      for (const value of node.values) {
        this.transformExpression(value);
      }
    }
  }
  
  private shouldTransform(name: string): boolean {
    // Don't transform global or API names
    const reservedNames = [
      'print', 'game', 'workspace', 'Players', 'LocalPlayer',
      'Vector3', 'CFrame', 'Instance', 'script', 'string', 'math',
      'table', 'pairs', 'ipairs', 'next', 'select', 'tostring', 'tonumber',
      'type', 'error', 'assert', 'pcall', 'xpcall', 'require',
    ];
    
    return !reservedNames.includes(name);
  }
  
  private getMappedName(name: string): string | null {
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      if (this.scopeStack[i].has(name)) {
        return this.scopeStack[i].get(name)!;
      }
    }
    return null;
  }
}
