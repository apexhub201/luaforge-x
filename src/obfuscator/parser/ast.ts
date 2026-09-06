export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface BaseNode {
  type: string;
  pos?: Position;
}

export interface ProgramNode extends BaseNode {
  type: 'Program';
  body: ASTNode[];
}

export interface BlockNode extends BaseNode {
  type: 'Block';
  statements: ASTNode[];
}

export interface LocalDeclarationNode extends BaseNode {
  type: 'LocalDeclaration';
  names: IdentifierNode[];
  values: ASTNode[];
}

export interface AssignmentNode extends BaseNode {
  type: 'Assignment';
  targets: ExpressionNode[];
  values: ExpressionNode[];
}

export interface FunctionDeclarationNode extends BaseNode {
  type: 'FunctionDeclaration';
  name: IdentifierNode;
  params: IdentifierNode[];
  body: BlockNode;
  isLocal: boolean;
  isMethod: boolean;
  isVararg: boolean;
}

export interface FunctionExpressionNode extends BaseNode {
  type: 'FunctionExpression';
  params: IdentifierNode[];
  body: BlockNode;
  isVararg: boolean;
}

export interface IfStatementNode extends BaseNode {
  type: 'IfStatement';
  clauses: {
    condition: ExpressionNode;
    body: BlockNode;
  }[];
  elseBody?: BlockNode;
}

export interface WhileStatementNode extends BaseNode {
  type: 'WhileStatement';
  condition: ExpressionNode;
  body: BlockNode;
}

export interface RepeatStatementNode extends BaseNode {
  type: 'RepeatStatement';
  body: BlockNode;
  condition: ExpressionNode;
}

export interface NumericForStatementNode extends BaseNode {
  type: 'NumericForStatement';
  variable: IdentifierNode;
  start: ExpressionNode;
  end: ExpressionNode;
  step?: ExpressionNode;
  body: BlockNode;
}

export interface GenericForStatementNode extends BaseNode {
  type: 'GenericForStatement';
  variables: IdentifierNode[];
  iterators: ExpressionNode[];
  body: BlockNode;
}

export interface ReturnStatementNode extends BaseNode {
  type: 'ReturnStatement';
  values: ExpressionNode[];
}

export interface BreakStatementNode extends BaseNode {
  type: 'BreakStatement';
}

export interface CallStatementNode extends BaseNode {
  type: 'CallStatement';
  expression: CallExpressionNode | MethodCallNode;
}

export interface BinaryExpressionNode extends BaseNode {
  type: 'BinaryExpression';
  operator: string;
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface UnaryExpressionNode extends BaseNode {
  type: 'UnaryExpression';
  operator: string;
  operand: ExpressionNode;
}

export interface NumberLiteralNode extends BaseNode {
  type: 'NumberLiteral';
  value: number;
}

export interface StringLiteralNode extends BaseNode {
  type: 'StringLiteral';
  value: string;
}

export interface BooleanLiteralNode extends BaseNode {
  type: 'BooleanLiteral';
  value: boolean;
}

export interface NilLiteralNode extends BaseNode {
  type: 'NilLiteral';
}

export interface IdentifierNode extends BaseNode {
  type: 'Identifier';
  name: string;
}

export interface TableConstructorNode extends BaseNode {
  type: 'TableConstructor';
  entries: {
    key?: ExpressionNode;
    value: ExpressionNode;
  }[];
}

export interface TableAccessNode extends BaseNode {
  type: 'TableAccess';
  object: ExpressionNode;
  property: string;
}

export interface IndexExpressionNode extends BaseNode {
  type: 'IndexExpression';
  object: ExpressionNode;
  index: ExpressionNode;
}

export interface CallExpressionNode extends BaseNode {
  type: 'CallExpression';
  callee: ExpressionNode;
  arguments: ExpressionNode[];
}

export interface GroupingExpressionNode extends BaseNode {
  type: 'GroupingExpression';
  expression: ExpressionNode;
}

export interface MethodCallNode extends BaseNode {
  type: 'MethodCall';
  object: ExpressionNode;
  method: string;
  arguments: ExpressionNode[];
}

export interface VarargExpressionNode extends BaseNode {
  type: 'VarargExpression';
}

export type ExpressionNode = 
  | BinaryExpressionNode
  | UnaryExpressionNode
  | NumberLiteralNode
  | StringLiteralNode
  | BooleanLiteralNode
  | NilLiteralNode
  | IdentifierNode
  | TableConstructorNode
  | TableAccessNode
  | IndexExpressionNode
  | CallExpressionNode
  | GroupingExpressionNode
  | MethodCallNode
  | FunctionExpressionNode
  | VarargExpressionNode;

export type ASTNode =
  | ProgramNode
  | BlockNode
  | LocalDeclarationNode
  | AssignmentNode
  | FunctionDeclarationNode
  | IfStatementNode
  | WhileStatementNode
  | RepeatStatementNode
  | NumericForStatementNode
  | GenericForStatementNode
  | ReturnStatementNode
  | BreakStatementNode
  | CallStatementNode
  | ExpressionNode;
