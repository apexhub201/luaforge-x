// Bytecode encoding utilities
import { BytecodeChunk } from '../bytecode/opcodes';
import { StringEncoder } from './string-encoder';

export class BytecodeEncoder {
  encode(chunk: BytecodeChunk): string {
    const serialized = JSON.stringify(chunk);
    const encoder = new StringEncoder();
    return encoder.encode(serialized);
  }
  
  decode(encoded: string, key: number): BytecodeChunk {
    // Decode the bytecode from encoded format
    const decoded = JSON.parse(encoded);
    return decoded as BytecodeChunk;
  }
}
