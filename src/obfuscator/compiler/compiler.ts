import { ASTNode, ProgramNode, BlockNode, LocalDeclarationNode, AssignmentNode, FunctionDeclarationNode, FunctionExpressionNode, IfStatementNode, WhileStatementNode, RepeatStatementNode, NumericForStatementNode, ReturnStatementNode, CallStatementNode, BinaryExpressionNode, UnaryExpressionNode, NumberLiteralNode, StringLiteralNode, BooleanLiteralNode, NilLiteralNode, IdentifierNode, TableConstructorNode, TableAccessNode, CallExpressionNode, IndexExpressionNode, GroupingExpressionNode, MethodCallNode, ExpressionNode } from '../parser/ast';
import { Opcode, Instruction, FunctionPrototype, BytecodeChunk } from '../bytecode/opcodes';

export class Compiler {
  private instructions: Instruction[] = [];
  private constants: any[] = [];
  private registerCount: number = 0;
  private scopeStack: Map<string, number>[] = [new Map()];
  private nestedPrototypes: FunctionPrototype[] = [];
  private loopStack: { start: number; end: number; breakJumps: number[] }[] = [];

  compile(ast: ProgramNode): BytecodeChunk {
    this.compileBlock(ast);
    
    // Add final return
    this.emit(Opcode.RETURN, 0, 0);
    
    const mainPrototype: FunctionPrototype = {
      instructions: this.instructions,
      constants: this.constants,
      numParams: 0,
      isVararg: false,
      maxStackSize: this.registerCount,
      nestedPrototypes: this.nestedPrototypes,
    };
    
    return {
      mainPrototype,
      version: 1,
    };
  }

  private compileBlock(block: BlockNode | ProgramNode): void {
    const statements = block.type === 'Program' ? block.body : block.statements;
    
    this.scopeStack.push(new Map());
    
    for (const statement of statements) {
      this.compileStatement(statement);
    }
    
    this.scopeStack.pop();
  }

  private compileStatement(node: ASTNode): void {
    switch (node.type) {
      case 'LocalDeclaration':
        this.compileLocalDeclaration(node as LocalDeclarationNode);
        break;
      case 'Assignment':
        this.compileAssignment(node as AssignmentNode);
        break;
      case 'FunctionDeclaration':
        this.compileFunctionDeclaration(node as FunctionDeclarationNode);
        break;
      case 'IfStatement':
        this.compileIfStatement(node as IfStatementNode);
        break;
      case 'WhileStatement':
        this.compileWhileStatement(node as WhileStatementNode);
        break;
      case 'RepeatStatement':
        this.compileRepeatStatement(node as RepeatStatementNode);
        break;
      case 'NumericForStatement':
        this.compileNumericForStatement(node as NumericForStatementNode);
        break;
      case 'ReturnStatement':
        this.compileReturnStatement(node as ReturnStatementNode);
        break;
      case 'CallStatement':
        this.compileCallStatement(node as CallStatementNode);
        break;
      case 'Block':
        this.compileBlock(node as BlockNode);
        break;
      default:
        // Expression statement (not common in Lua)
        this.compileExpression(node as ExpressionNode);
        this.releaseRegister();
        break;
    }
  }

  private compileLocalDeclaration(node: LocalDeclarationNode): void {
    for (let i = 0; i < node.names.length; i++) {
      let valueRegister = -1;
      
      if (i < node.values.length) {
        valueRegister = this.compileExpression(node.values[i]);
      }
      
      const register = this.allocateRegister();
      
      if (valueRegister >= 0) {
        this.emit(Opcode.MOVE, register, valueRegister);
        this.releaseRegister();
      } else {
        this.emit(Opcode.LOADNIL, register);
      }
      
      // Store in current scope
      this.scopeStack[this.scopeStack.length - 1].set(node.names[i].name, register);
    }
  }

  private compileAssignment(node: AssignmentNode): void {
    const valueRegisters: number[] = [];
    
    // Compile all values first
    for (const value of node.values) {
      valueRegisters.push(this.compileExpression(value));
    }
    
    // Assign to targets
    for (let i = 0; i < node.targets.length; i++) {
      const target = node.targets[i];
      const valueRegister = i < valueRegisters.length ? valueRegisters[i] : valueRegisters[valueRegisters.length - 1];
      
      if (target.type === 'Identifier') {
        const localRegister = this.getLocalRegister(target.name);
        if (localRegister !== undefined) {
          this.emit(Opcode.MOVE, localRegister, valueRegister);
        } else {
          const constIndex = this.getConstant(target.name);
          this.emit(Opcode.SETGLOBAL, constIndex, valueRegister);
        }
      } else if (target.type === 'TableAccess') {
        const objectRegister = this.compileExpression(target.object);
        const constIndex = this.getConstant(target.property);
        this.emit(Opcode.SETTABLE, objectRegister, constIndex, valueRegister);
        this.releaseRegister();
      } else if (target.type === 'IndexExpression') {
        const objectRegister = this.compileExpression(target.object);
        const indexRegister = this.compileExpression(target.index);
        this.emit(Opcode.SETTABLE, objectRegister, indexRegister, valueRegister);
        this.releaseRegister();
        this.releaseRegister();
      }
    }
    
    // Release value registers
    for (let i = 0; i < valueRegisters.length; i++) {
      this.releaseRegister();
    }
  }

  private compileFunctionDeclaration(node: FunctionDeclarationNode): void {
    const funcRegister = this.compileFunctionExpression(node as any);
    
    if (node.isLocal) {
      this.scopeStack[this.scopeStack.length - 1].set(node.name.name, funcRegister);
    } else {
      const constIndex = this.getConstant(node.name.name);
      this.emit(Opcode.SETGLOBAL, constIndex, funcRegister);
    }
  }

  private compileFunctionExpression(node: FunctionExpressionNode | FunctionDeclarationNode): number {
    // Create nested prototype
    const childCompiler = new Compiler();
    const childBlock: BlockNode = node.body;
    childCompiler.compileBlock(childBlock);
    childCompiler.emit(Opcode.RETURN, 0, 0);
    
    const childPrototype: FunctionPrototype = {
      instructions: childCompiler.instructions,
      constants: childCompiler.constants,
      numParams: node.params.length,
      isVararg: node.isVararg || false,
      maxStackSize: childCompiler.registerCount,
      nestedPrototypes: childCompiler.nestedPrototypes,
    };
    
    const nestedIndex = this.nestedPrototypes.length;
    this.nestedPrototypes.push(childPrototype);
    
    const funcRegister = this.allocateRegister();
    this.emit(Opcode.CLOSURE, funcRegister, nestedIndex);
    
    return funcRegister;
  }

  private compileIfStatement(node: IfStatementNode): void {
    const jumpToEnd: number[] = [];
    
    for (const clause of node.clauses) {
      const conditionRegister = this.compileExpression(clause.condition);
      this.emit(Opcode.TEST, conditionRegister, 0);
      
      const jumpPastBody = this.emit(Opcode.JMPIFNOT, conditionRegister, 0);
      this.releaseRegister();
      
      this.compileBlock(clause.body);
      
      const jumpToEndInstr = this.emit(Opcode.JMP, 0, 0);
      jumpToEnd.push(jumpToEndInstr);
      
      // Patch jump past body
      this.instructions[jumpPastBody].b = this.instructions.length;
    }
    
    if (node.elseBody) {
      this.compileBlock(node.elseBody);
    }
    
    // Patch jumps to end
    const endPosition = this.instructions.length;
    for (const jumpInstr of jumpToEnd) {
      this.instructions[jumpInstr].a = endPosition;
    }
  }

  private compileWhileStatement(node: WhileStatementNode): void {
    const loopStart = this.instructions.length;
    
    this.loopStack.push({ start: loopStart, end: 0, breakJumps: [] });
    
    const conditionRegister = this.compileExpression(node.condition);
    this.emit(Opcode.TEST, conditionRegister, 0);
    
    const jumpPastLoop = this.emit(Opcode.JMPIFNOT, conditionRegister, 0);
    this.releaseRegister();
    
    this.compileBlock(node.body);
    
    this.emit(Opcode.JMP, loopStart, 0);
    
    const loopEnd = this.instructions.length;
    this.instructions[jumpPastLoop].b = loopEnd;
    
    const loopInfo = this.loopStack.pop()!;
    loopInfo.end = loopEnd;
    
    // Patch break jumps
    for (const breakJump of loopInfo.breakJumps) {
      this.instructions[breakJump].a = loopEnd;
    }
  }

  private compileRepeatStatement(node: RepeatStatementNode): void {
    const loopStart = this.instructions.length;
    
    this.loopStack.push({ start: loopStart, end: 0, breakJumps: [] });
    
    this.compileBlock(node.body);
    
    const conditionRegister = this.compileExpression(node.condition);
    this.emit(Opcode.TEST, conditionRegister, 0);
    this.emit(Opcode.JMPIFNOT, conditionRegister, loopStart);
    this.releaseRegister();
    
    const loopEnd = this.instructions.length;
    const loopInfo = this.loopStack.pop()!;
    loopInfo.end = loopEnd;
    
    // Patch break jumps
    for (const breakJump of loopInfo.breakJumps) {
      this.instructions[breakJump].a = loopEnd;
    }
  }

  private compileNumericForStatement(node: NumericForStatementNode): void {
    const startRegister = this.compileExpression(node.start);
    const endRegister = this.compileExpression(node.end);
    
    const varRegister = this.allocateRegister();
    this.emit(Opcode.MOVE, varRegister, startRegister);
    
    let stepRegister = -1;
    if (node.step) {
      stepRegister = this.compileExpression(node.step);
    } else {
      const oneConst = this.getConstant(1);
      stepRegister = this.allocateRegister();
      this.emit(Opcode.LOADK, stepRegister, oneConst);
    }
    
    this.scopeStack.push(new Map());
    this.scopeStack[this.scopeStack.length - 1].set(node.variable.name, varRegister);
    
    const loopStart = this.instructions.length;
    this.loopStack.push({ start: loopStart, end: 0, breakJumps: [] });
    
    // Check condition
    const tempRegister = this.allocateRegister();
    this.emit(Opcode.LT, tempRegister, varRegister, endRegister);
    this.emit(Opcode.TEST, tempRegister, 0);
    
    const jumpPastLoop = this.emit(Opcode.JMPIFNOT, tempRegister, 0);
    this.releaseRegister();
    
    this.compileBlock(node.body);
    
    // Increment
    this.emit(Opcode.ADD, varRegister, varRegister, stepRegister);
    this.emit(Opcode.JMP, loopStart, 0);
    
    const loopEnd = this.instructions.length;
    this.instructions[jumpPastLoop].b = loopEnd;
    
    this.scopeStack.pop();
    this.releaseRegister(); // varRegister
    this.releaseRegister(); // stepRegister
    this.releaseRegister(); // endRegister
    this.releaseRegister(); // startRegister
    
    const loopInfo = this.loopStack.pop()!;
    loopInfo.end = loopEnd;
    
    for (const breakJump of loopInfo.breakJumps) {
      this.instructions[breakJump].a = loopEnd;
    }
  }

  private compileReturnStatement(node: ReturnStatementNode): void {
    if (node.values.length === 0) {
      this.emit(Opcode.RETURN, 0, 0);
    } else if (node.values.length === 1) {
      const register = this.compileExpression(node.values[0]);
      this.emit(Opcode.RETURN, register, 1);
      this.releaseRegister();
    } else {
      const registers: number[] = [];
      for (const value of node.values) {
        registers.push(this.compileExpression(value));
      }
      this.emit(Opcode.RETURN, registers[0], registers.length);
      for (let i = 0; i < registers.length; i++) {
        this.releaseRegister();
      }
    }
  }

  private compileCallStatement(node: CallStatementNode): void {
    const resultRegister = this.compileExpression(node.expression);
    this.releaseRegister();
  }

  private compileExpression(node: ExpressionNode): number {
    switch (node.type) {
      case 'NumberLiteral':
        return this.compileNumberLiteral(node as NumberLiteralNode);
      case 'StringLiteral':
        return this.compileStringLiteral(node as StringLiteralNode);
      case 'BooleanLiteral':
        return this.compileBooleanLiteral(node as BooleanLiteralNode);
      case 'NilLiteral':
        return this.compileNilLiteral();
      case 'Identifier':
        return this.compileIdentifier(node as IdentifierNode);
      case 'BinaryExpression':
        return this.compileBinaryExpression(node as BinaryExpressionNode);
      case 'UnaryExpression':
        return this.compileUnaryExpression(node as UnaryExpressionNode);
      case 'TableConstructor':
        return this.compileTableConstructor(node as TableConstructorNode);
      case 'TableAccess':
        return this.compileTableAccess(node as TableAccessNode);
      case 'IndexExpression':
        return this.compileIndexExpression(node as IndexExpressionNode);
      case 'CallExpression':
        return this.compileCallExpression(node as CallExpressionNode);
      case 'MethodCall':
        return this.compileMethodCall(node as MethodCallNode);
      case 'GroupingExpression':
        return this.compileExpression((node as GroupingExpressionNode).expression);
      case 'FunctionExpression':
        return this.compileFunctionExpression(node as FunctionExpressionNode);
      default:
        throw new Error(`Unsupported expression type: ${node.type}`);
    }
  }

  private compileNumberLiteral(node: NumberLiteralNode): number {
    const register = this.allocateRegister();
    const constIndex = this.getConstant(node.value);
    this.emit(Opcode.LOADK, register, constIndex);
    return register;
  }

  private compileStringLiteral(node: StringLiteralNode): number {
    const register = this.allocateRegister();
    const constIndex = this.getConstant(node.value);
    this.emit(Opcode.LOADK, register, constIndex);
    return register;
  }

  private compileBooleanLiteral(node: BooleanLiteralNode): number {
    const register = this.allocateRegister();
    this.emit(Opcode.LOADBOOL, register, node.value ? 1 : 0);
    return register;
  }

  private compileNilLiteral(): number {
    const register = this.allocateRegister();
    this.emit(Opcode.LOADNIL, register);
    return register;
  }

  private compileIdentifier(node: IdentifierNode): number {
    const localRegister = this.getLocalRegister(node.name);
    const register = this.allocateRegister();
    
    if (localRegister !== undefined) {
      this.emit(Opcode.MOVE, register, localRegister);
    } else {
      const constIndex = this.getConstant(node.name);
      this.emit(Opcode.GETGLOBAL, register, constIndex);
    }
    
    return register;
  }

  private compileBinaryExpression(node: BinaryExpressionNode): number {
    const leftRegister = this.compileExpression(node.left);
    const rightRegister = this.compileExpression(node.right);
    const resultRegister = this.allocateRegister();
    
    let opcode: Opcode;
    switch (node.operator) {
      case '+': opcode = Opcode.ADD; break;
      case '-': opcode = Opcode.SUB; break;
      case '*': opcode = Opcode.MUL; break;
      case '/': opcode = Opcode.DIV; break;
      case '%': opcode = Opcode.MOD; break;
      case '^': opcode = Opcode.POW; break;
      case '..': opcode = Opcode.CONCAT; break;
      case '==': opcode = Opcode.EQ; break;
      case '~=':
        // Implement as not equal using EQ and NOT
        this.emit(Opcode.EQ, resultRegister, leftRegister, rightRegister);
        this.emit(Opcode.NOT, resultRegister, resultRegister);
        this.releaseRegister();
        this.releaseRegister();
        return resultRegister;
      case '<': opcode = Opcode.LT; break;
      case '<=': opcode = Opcode.LE; break;
      case '>':
        // Implement as right < left
        this.emit(Opcode.LT, resultRegister, rightRegister, leftRegister);
        this.releaseRegister();
        this.releaseRegister();
        return resultRegister;
      case '>=':
        // Implement as right <= left
        this.emit(Opcode.LE, resultRegister, rightRegister, leftRegister);
        this.releaseRegister();
        this.releaseRegister();
        return resultRegister;
      case 'and':
        // Logical AND
        this.emit(Opcode.TEST, leftRegister, 0);
        this.emit(Opcode.JMPIFNOT, leftRegister, this.instructions.length + 2);
        this.emit(Opcode.MOVE, resultRegister, rightRegister);
        this.emit(Opcode.JMP, this.instructions.length + 1, 0);
        this.emit(Opcode.MOVE, resultRegister, leftRegister);
        this.releaseRegister();
        this.releaseRegister();
        return resultRegister;
      case 'or':
        // Logical OR
        this.emit(Opcode.TEST, leftRegister, 0);
        this.emit(Opcode.JMPIF, leftRegister, this.instructions.length + 2);
        this.emit(Opcode.MOVE, resultRegister, rightRegister);
        this.emit(Opcode.JMP, this.instructions.length + 1, 0);
        this.emit(Opcode.MOVE, resultRegister, leftRegister);
        this.releaseRegister();
        this.releaseRegister();
        return resultRegister;
      default:
        throw new Error(`Unsupported operator: ${node.operator}`);
    }
    
    this.emit(opcode, resultRegister, leftRegister, rightRegister);
    this.releaseRegister();
    this.releaseRegister();
    
    return resultRegister;
  }

  private compileUnaryExpression(node: UnaryExpressionNode): number {
    const operandRegister = this.compileExpression(node.operand);
    const resultRegister = this.allocateRegister();
    
    let opcode: Opcode;
    switch (node.operator) {
      case '-': opcode = Opcode.UNM; break;
      case 'not': opcode = Opcode.NOT; break;
      case '#': opcode = Opcode.LEN; break;
      default:
        throw new Error(`Unsupported unary operator: ${node.operator}`);
    }
    
    this.emit(opcode, resultRegister, operandRegister);
    this.releaseRegister();
    
    return resultRegister;
  }

  private compileTableConstructor(node: TableConstructorNode): number {
    const tableRegister = this.allocateRegister();
    this.emit(Opcode.NEWTABLE, tableRegister, 0, node.entries.length);
    
    let arrayIndex = 0;
    for (const entry of node.entries) {
      const valueRegister = this.compileExpression(entry.value);
      
      if (entry.key) {
        const keyRegister = this.compileExpression(entry.key);
        this.emit(Opcode.SETTABLE, tableRegister, keyRegister, valueRegister);
        this.releaseRegister(); // key
      } else {
        arrayIndex++;
        const keyConst = this.getConstant(arrayIndex);
        this.emit(Opcode.SETTABLE, tableRegister, keyConst, valueRegister);
      }
      
      this.releaseRegister(); // value
    }
    
    return tableRegister;
  }

  private compileTableAccess(node: TableAccessNode): number {
    const objectRegister = this.compileExpression(node.object);
    const resultRegister = this.allocateRegister();
    const keyConst = this.getConstant(node.property);
    
    this.emit(Opcode.GETTABLE, resultRegister, objectRegister, keyConst);
    this.releaseRegister();
    
    return resultRegister;
  }

  private compileIndexExpression(node: IndexExpressionNode): number {
    const objectRegister = this.compileExpression(node.object);
    const indexRegister = this.compileExpression(node.index);
    const resultRegister = this.allocateRegister();
    
    this.emit(Opcode.GETTABLE, resultRegister, objectRegister, indexRegister);
    this.releaseRegister();
    this.releaseRegister();
    
    return resultRegister;
  }

  private compileCallExpression(node: CallExpressionNode): number {
    const calleeRegister = this.compileExpression(node.callee);
    const argRegisters: number[] = [];
    
    for (const arg of node.arguments) {
      argRegisters.push(this.compileExpression(arg));
    }
    
    const resultRegister = this.allocateRegister();
    
    if (argRegisters.length > 0) {
      this.emit(Opcode.CALL, resultRegister, calleeRegister, argRegisters.length + 1, argRegisters[0]);
    } else {
      this.emit(Opcode.CALL, resultRegister, calleeRegister, 1);
    }
    
    for (let i = 0; i < argRegisters.length; i++) {
      this.releaseRegister();
    }
    this.releaseRegister(); // callee
    
    return resultRegister;
  }

  private compileMethodCall(node: MethodCallNode): number {
    const objectRegister = this.compileExpression(node.object);
    const methodConst = this.getConstant(node.method);
    const methodRegister = this.allocateRegister();
    
    this.emit(Opcode.GETTABLE, methodRegister, objectRegister, methodConst);
    
    const argRegisters: number[] = [];
    for (const arg of node.arguments) {
      argRegisters.push(this.compileExpression(arg));
    }
    
    const resultRegister = this.allocateRegister();
    
    // Pass self as first argument
    const totalArgs = argRegisters.length + 2; // self + args
    const baseArg = objectRegister;
    
    this.emit(Opcode.CALL, resultRegister, methodRegister, totalArgs, baseArg);
    
    for (let i = 0; i < argRegisters.length; i++) {
      this.releaseRegister();
    }
    this.releaseRegister(); // method
    this.releaseRegister(); // object
    
    return resultRegister;
  }

  private emit(opcode: Opcode, a: number = 0, b: number = 0, c: number = 0): number {
    this.instructions.push({ opcode, a, b, c });
    return this.instructions.length - 1;
  }

  private getConstant(value: any): number {
    let index = this.constants.indexOf(value);
    if (index === -1) {
      index = this.constants.length;
      this.constants.push(value);
    }
    return index;
  }

  private allocateRegister(): number {
    return this.registerCount++;
  }

  private releaseRegister(): void {
    this.registerCount--;
  }

  private getLocalRegister(name: string): number | undefined {
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      if (this.scopeStack[i].has(name)) {
        return this.scopeStack[i].get(name);
      }
    }
    return undefined;
  }
}
