// API client for frontend
import { ObfuscationOptions } from '../obfuscator';

interface ObfuscationResponse {
  success: boolean;
  output?: string;
  stats?: {
    originalSize: number;
    outputSize: number;
    instructions: number;
    constants: number;
    functions: number;
    buildTime: number;
  };
  error?: {
    message: string;
    line?: number;
    column?: number;
  };
}

export async function obfuscateViaAPI(
  source: string,
  options: Partial<ObfuscationOptions>
): Promise<ObfuscationResponse> {
  try {
    const response = await fetch('/api/obfuscate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ source, options }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error,
      };
    }
    
    return await response.json();
  } catch (error) {
    // Fallback to local obfuscation if API is unavailable
    console.warn('API unavailable, using local obfuscation engine');
    const { obfuscate } = await import('../obfuscator');
    return obfuscate(source, options);
  }
}

export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/health');
    return response.ok;
  } catch {
    return false;
  }
}
