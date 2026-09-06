// Constant encoding utilities
export class ConstantEncoder {
  encode(value: any): { encoded: any; decoder: string } {
    if (typeof value === 'number') {
      return this.encodeNumber(value);
    } else if (typeof value === 'string') {
      return this.encodeString(value);
    } else if (typeof value === 'boolean') {
      return this.encodeBoolean(value);
    }
    
    return { encoded: value, decoder: '' };
  }
  
  private encodeNumber(value: number): { encoded: any; decoder: string } {
    // Simple transformation: represent as addition of two numbers
    const offset = Math.floor(Math.random() * 1000) - 500;
    const encoded = {
      a: value - offset,
      b: offset,
    };
    
    return {
      encoded,
      decoder: 'local decoded = value.a + value.b',
    };
  }
  
  private encodeString(value: string): { encoded: any; decoder: string } {
    const encoder = new StringEncoder();
    const encoded = encoder.encode(value);
    
    return {
      encoded,
      decoder: encoder.generateDecoder(),
    };
  }
  
  private encodeBoolean(value: boolean): { encoded: any; decoder: string } {
    return {
      encoded: value ? 1 : 0,
      decoder: 'local decoded = value ~= 0',
    };
  }
}
