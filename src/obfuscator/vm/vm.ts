import { Opcode, Instruction, FunctionPrototype, BytecodeChunk } from '../bytecode/opcodes';

type LuaValue = any;

interface CallFrame {
  prototype: FunctionPrototype;
  pc: number;
  registers: LuaValue[];
}

export class VM {
  private globals: Map<string, LuaValue> = new Map();
  private callStack: CallFrame[] = [];
  private output: string[] = [];
  
  constructor() {
    // Set up standard globals
    this.globals.set('print', (...args: any[]) => {
      this.output.push(args.map(arg => this.toString(arg)).join('\t'));
    });
    this.globals.set('type', (value: any) => {
      if (value === null || value === undefined) return 'nil';
      if (typeof value === 'number') return 'number';
      if (typeof value === 'string') return 'string';
      if (typeof value === 'boolean') return 'boolean';
      if (typeof value === 'function') return 'function';
      if (typeof value === 'object') return 'table';
      return typeof value;
    });
    this.globals.set('tostring', (value: any) => this.toString(value));
    this.globals.set('tonumber', (value: any) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const num = Number(value);
        return isNaN(num) ? null : num;
      }
      return null;
    });
    this.globals.set('pairs', function* (table: any) {
      if (typeof table === 'object' && table !== null) {
        for (const [key, value] of Object.entries(table)) {
          yield [key, value];
        }
      }
    });
    this.globals.set('ipairs', function* (table: any) {
      if (Array.isArray(table)) {
        for (let i = 0; i < table.length; i++) {
          yield [i + 1, table[i]];
        }
      }
    });
  }
  
  execute(chunk: BytecodeChunk): { result: LuaValue[]; output: string[] } {
    this.callStack = [];
    this.output = [];
    
    const mainFrame: CallFrame = {
      prototype: chunk.mainPrototype,
      pc: 0,
      registers: new Array(chunk.mainPrototype.maxStackSize).fill(null),
    };
    
    this.callStack.push(mainFrame);
    
    while (this.callStack.length > 0) {
      const frame = this.callStack[this.callStack.length - 1];
      
      if (frame.pc >= frame.prototype.instructions.length) {
        // Function ended without return
        this.callStack.pop();
        continue;
      }
      
      const instruction = frame.prototype.instructions[frame.pc];
      frame.pc++;
      
      this.executeInstruction(instruction, frame);
    }
    
    return {
      result: [],
      output: this.output,
    };
  }
  
  private executeInstruction(instruction: Instruction, frame: CallFrame): void {
    const { opcode, a, b, c, value } = instruction;
    
    switch (opcode) {
      case Opcode.LOADK:
        frame.registers[a] = frame.prototype.constants[b];
        break;
        
      case Opcode.LOADBOOL:
        frame.registers[a] = b === 1;
        break;
        
      case Opcode.LOADNIL:
        frame.registers[a] = null;
        break;
        
      case Opcode.MOVE:
        frame.registers[a] = frame.registers[b];
        break;
        
      case Opcode.GETGLOBAL:
        frame.registers[a] = this.globals.get(frame.prototype.constants[b].toString());
        break;
        
      case Opcode.SETGLOBAL:
        this.globals.set(frame.prototype.constants[a].toString(), frame.registers[b]);
        break;
        
      case Opcode.GETTABLE:
        frame.registers[a] = this.getTable(frame.registers[b], frame.registers[c] ?? frame.prototype.constants[c]);
        break;
        
      case Opcode.SETTABLE:
        this.setTable(frame.registers[a], frame.registers[b] ?? frame.prototype.constants[b], frame.registers[c]);
        break;
        
      case Opcode.NEWTABLE:
        frame.registers[a] = {};
        break;
        
      case Opcode.ADD:
        frame.registers[a] = frame.registers[b] + frame.registers[c];
        break;
        
      case Opcode.SUB:
        frame.registers[a] = frame.registers[b] - frame.registers[c];
        break;
        
      case Opcode.MUL:
        frame.registers[a] = frame.registers[b] * frame.registers[c];
        break;
        
      case Opcode.DIV:
        frame.registers[a] = frame.registers[b] / frame.registers[c];
        break;
        
      case Opcode.MOD:
        frame.registers[a] = frame.registers[b] % frame.registers[c];
        break;
        
      case Opcode.POW:
        frame.registers[a] = Math.pow(frame.registers[b], frame.registers[c]);
        break;
        
      case Opcode.UNM:
        frame.registers[a] = -frame.registers[b];
        break;
        
      case Opcode.NOT:
        frame.registers[a] = !frame.registers[b];
        break;
        
      case Opcode.LEN:
        frame.registers[a] = this.length(frame.registers[b]);
        break;
        
      case Opcode.CONCAT:
        frame.registers[a] = this.toString(frame.registers[b]) + this.toString(frame.registers[c]);
        break;
        
      case Opcode.EQ:
        frame.registers[a] = frame.registers[b] === frame.registers[c];
        break;
        
      case Opcode.LT:
        frame.registers[a] = frame.registers[b] < frame.registers[c];
        break;
        
      case Opcode.LE:
        frame.registers[a] = frame.registers[b] <= frame.registers[c];
        break;
        
      case Opcode.JMP:
        frame.pc = a;
        break;
        
      case Opcode.JMPIF:
        if (this.isTruthy(frame.registers[a])) {
          frame.pc = b;
        }
        break;
        
      case Opcode.JMPIFNOT:
        if (!this.isTruthy(frame.registers[a])) {
          frame.pc = b;
        }
        break;
        
      case Opcode.TEST:
        // Just for clarity, no operation needed
        break;
        
      case Opcode.CALL:
        this.handleCall(instruction, frame);
        break;
        
      case Opcode.RETURN:
        if (this.callStack.length > 1) {
          const returnValues = a > 0 ? frame.registers.slice(a, a + b) : [];
          this.callStack.pop();
          
          const callerFrame = this.callStack[this.callStack.length - 1];
          const resultRegister = instruction.a;
          
          if (resultRegister > 0 && returnValues.length > 0) {
            callerFrame.registers[resultRegister] = returnValues[0];
          }
        } else {
          // Main function return
          this.callStack.pop();
        }
        break;
        
      case Opcode.CLOSURE:
        const prototypeIndex = b;
        const nestedPrototype = frame.prototype.nestedPrototypes[prototypeIndex];
        frame.registers[a] = (...args: any[]) => {
          return this.executeFunction(nestedPrototype, args);
        };
        break;
        
      default:
        throw new Error(`Unknown opcode: ${opcode}`);
    }
  }
  
  private handleCall(instruction: Instruction, frame: CallFrame): void {
    const { a, b, c } = instruction;
    const func = frame.registers[b];
    
    if (typeof func === 'function') {
      const numArgs = c > 0 ? c - 1 : 0;
      const baseArg = c > 1 ? c : 0;
      const args: any[] = [];
      
      for (let i = 0; i < numArgs; i++) {
        args.push(frame.registers[baseArg + i]);
      }
      
      const result = func(...args);
      frame.registers[a] = result;
    } else {
      throw new Error(`Attempt to call a non-function value`);
    }
  }
  
  private executeFunction(prototype: FunctionPrototype, args: any[]): any {
    const frame: CallFrame = {
      prototype,
      pc: 0,
      registers: new Array(prototype.maxStackSize).fill(null),
    };
    
    // Set up parameters
    for (let i = 0; i < prototype.numParams && i < args.length; i++) {
      frame.registers[i] = args[i];
    }
    
    this.callStack.push(frame);
    
    // Execute the function
    while (this.callStack.length > 0 && this.callStack[this.callStack.length - 1] === frame) {
      const currentFrame = this.callStack[this.callStack.length - 1];
      
      if (currentFrame.pc >= currentFrame.prototype.instructions.length) {
        this.callStack.pop();
        break;
      }
      
      const instruction = currentFrame.prototype.instructions[currentFrame.pc];
      currentFrame.pc++;
      
      this.executeInstruction(instruction, currentFrame);
    }
    
    // Return value handling would be more complex in a real implementation
    return frame.registers[0] || null;
  }
  
  private getTable(table: any, key: any): any {
    if (table === null || table === undefined) return null;
    if (typeof table === 'object' && !Array.isArray(table)) {
      return table[key];
    }
    if (Array.isArray(table) && typeof key === 'number') {
      return table[key - 1]; // Lua arrays are 1-indexed
    }
    if (typeof table === 'string' && typeof key === 'number') {
      return table[key - 1];
    }
    return null;
  }
  
  private setTable(table: any, key: any, value: any): void {
    if (table === null || table === undefined) return;
    if (typeof table === 'object' && !Array.isArray(table)) {
      table[key] = value;
    } else if (Array.isArray(table) && typeof key === 'number') {
      table[key - 1] = value; // Lua arrays are 1-indexed
    }
  }
  
  private length(value: any): number {
    if (typeof value === 'string') return value.length;
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).length;
    }
    return 0;
  }
  
  private isTruthy(value: any): boolean {
    return value !== null && value !== undefined && value !== false;
  }
  
  private toString(value: any): string {
    if (value === null || value === undefined) return 'nil';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') return value;
    if (typeof value === 'function') return 'function';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return '{' + value.map(v => this.toString(v)).join(', ') + '}';
      }
      return 'table';
    }
    return String(value);
  }
}
