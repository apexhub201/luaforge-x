// String encoding utilities
import { randomBytes, randomInt } from './random';

export class StringEncoder {
  private key: number;
  
  constructor() {
    this.key = randomInt(1, 255);
  }
  
  encode(str: string): string {
    const bytes = new TextEncoder().encode(str);
    const encoded = new Uint8Array(bytes.length);
    
    for (let i = 0; i < bytes.length; i++) {
      encoded[i] = bytes[i] ^ this.key;
    }
    
    return this.toLuaArray(encoded);
  }
  
  private toLuaArray(bytes: Uint8Array): string {
    return '{' + Array.from(bytes).join(', ') + '}';
  }
  
  generateDecoder(): string {
    return `
local function decode_string(bytes, key)
  local result = {}
  for i = 1, #bytes do
    result[i] = string.char(bit32.bxor(bytes[i], key))
  end
  return table.concat(result)
end`;
  }
}
