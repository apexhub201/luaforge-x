import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { obfuscate } from '../obfuscator';
import { ObfuscationOptions } from '../obfuscator';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.',
    },
  },
});

app.use('/api/obfuscate', limiter);

// Routes
app.post('/api/obfuscate', (req, res) => {
  try {
    const { source, options } = req.body as {
      source: string;
      options?: Partial<ObfuscationOptions>;
    };
    
    if (!source || typeof source !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Source code is required',
        },
      });
    }
    
    if (source.length > 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Source code too large (max 1MB)',
        },
      });
    }
    
    const result = obfuscate(source, options);
    
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Obfuscation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
      },
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`LUAUFORGE X API server running on port ${PORT}`);
  });
}

export default app;
