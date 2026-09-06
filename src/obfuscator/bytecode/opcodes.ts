export enum Opcode {
  LOADK = 'LOADK',
  LOADBOOL = 'LOADBOOL',
  LOADNIL = 'LOADNIL',
  MOVE = 'MOVE',
  GETGLOBAL = 'GETGLOBAL',
  SETGLOBAL = 'SETGLOBAL',
  GETLOCAL = 'GETLOCAL',
  SETLOCAL = 'SETLOCAL',
  GETTABLE = 'GETTABLE',
  SETTABLE = 'SETTABLE',
  NEWTABLE = 'NEWTABLE',
  ADD = 'ADD',
  SUB = 'SUB',
  MUL = 'MUL',
  DIV = 'DIV',
  MOD = 'MOD',
  POW = 'POW',
  UNM = 'UNM',
  NOT = 'NOT',
  LEN = 'LEN',
  CONCAT = 'CONCAT',
  EQ = 'EQ',
  LT = 'LT',
  LE = 'LE',
  JMP = 'JMP',
  JMPIF = 'JMPIF',
  JMPIFNOT = 'JMPIFNOT',
  TEST = 'TEST',
  CALL = 'CALL',
  RETURN = 'RETURN',
  CLOSURE = 'CLOSURE',
  FORPREP = 'FORPREP',
  FORLOOP = 'FORLOOP',
}

export interface Instruction {
  opcode: Opcode;
  a: number;
  b: number;
  c: number;
  value?: any;
}

export interface FunctionPrototype {
  instructions: Instruction[];
  constants: any[];
  numParams: number;
  isVararg: boolean;
  maxStackSize: number;
  nestedPrototypes: FunctionPrototype[];
}

export interface BytecodeChunk {
  mainPrototype: FunctionPrototype;
  version: number;
}
