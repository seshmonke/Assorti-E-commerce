import dotenv from 'dotenv';

dotenv.config();

export const env = {
  BOT_API_KEY: process.env.BOT_API_KEY || '',
  BACKEND_API_URL: process.env.BACKEND_API_URL || 'http://localhost:3000/api',
  ALLOWED_USER_IDS: process.env.ALLOWED_USER_IDS || '',
  API_SECRET_TOKEN: process.env.API_SECRET_TOKEN || 'admin-secret-token',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Validate required environment variables
if (!env.BOT_API_KEY) {
  throw new Error('BOT_TOKEN is required in environment variables');
}

if (!env.ALLOWED_USER_IDS) {
  throw new Error('ALLOWED_USER_IDS is required in environment variables');
}
