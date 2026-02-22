import dotenv from 'dotenv';

dotenv.config();

export const env = {
  BOT_API_KEY: process.env.BOT_API_KEY || '',
  BACKEND_API_URL: process.env.BACKEND_API_URL || 'http://localhost:3000/api',
  ADMIN_USER_ID: process.env.ADMIN_USER_ID || '',
  API_SECRET_TOKEN: process.env.API_SECRET_TOKEN || 'admin-secret-token',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Validate required environment variables
if (!env.BOT_API_KEY) {
  throw new Error('BOT_TOKEN is required in environment variables');
}

if (!env.ADMIN_USER_ID) {
  throw new Error('ADMIN_USER_ID is required in environment variables');
}
