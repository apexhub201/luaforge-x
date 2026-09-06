// src/obfuscator/compatibility/executor-mode.ts

export type ExecutorType = 'roblox' | 'luau' | 'lua51' | 'krnl' | 'delta';

export interface ExecutorConfig {
  type: ExecutorType;
  allowLoadstring: boolean;
  allowMetatables: boolean;
  maxInstructions: number;
  maxNestedDepth: number;
  allowedGlobals: string[];
}

export class ExecutorCompatibility {
  private config: ExecutorConfig;
  
  constructor(config: ExecutorConfig) {
    this.config = config;
  }
  
  isCompatible(code: string): boolean {
    // Check for forbidden patterns
    if (!this.config.allowLoadstring && /loadstring|load\(/.test(code)) {
      return false;
    }
    
    // Check for debug library
    if (/debug\./.test(code)) {
      return false;
    }
    
    // Check instruction count (ước lượng)
    const estimatedInstructions = this.estimateInstructions(code);
    if (estimatedInstructions > this.config.maxInstructions) {
      return false;
    }
    
    return true;
  }
  
  private estimateInstructions(code: string): number {
    // Ước tính số instructions dựa trên tokens
    const tokens = code.split(/[\s,;]+/).length;
    return tokens * 3; // Mỗi token trung bình 3 instructions
  }
  
  generateCompatibleOutput(obfuscatedCode: string): string {
    // Transform để tương thích executor
    let output = obfuscatedCode;
    
    // 1. Loại bỏ loadstring
    output = this.removeLoadstring(output);
    
    // 2. Giảm nested depth
    output = this.reduceNesting(output);
    
    // 3. Thêm wrappers an toàn
    output = this.addSafeWrappers(output);
    
    return output;
  }
  
  private removeLoadstring(code: string): string {
    // Thay thế loadstring bằng function constructor
    return code.replace(
      /loadstring\((.+?)\)/g,
      '(function() local chunk = $1; return assert(chunk) end)()'
    );
  }
  
  private reduceNesting(code: string): string {
    // Flatten quá nhiều nested functions
    // (Implementation phức tạp - cần AST transform)
    return code;
  }
  
  private addSafeWrappers(code: string): string {
    // Thêm wrapper để tránh detection
    return `
local function __safe_execute()
  ${code}
end

-- Execute với protection
local success, err = pcall(__safe_execute)
if not success then
  warn("Execution error:", err)
end
`;
  }
}
