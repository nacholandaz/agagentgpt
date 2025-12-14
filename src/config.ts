import { config } from 'dotenv';

config();

export const CONFIG = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/cocentrica',
  },
  
  email: {
    from: process.env.EMAIL_FROM || 'core@cocentrica.org',
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    },
  },
  
  app: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  },
  
  governance: {
    defaultRequiredVotes: parseInt(process.env.DEFAULT_REQUIRED_VOTES || '2', 10),
    coreRequiredVotes: parseInt(process.env.CORE_REQUIRED_VOTES || '3', 10),
  },
} as const;

