import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL || '',
  githubToken: process.env.GITHUB_TOKEN || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  profileTtlMinutes: Number(process.env.PROFILE_TTL_MINUTES) || 60,
  contribTtlMinutes: Number(process.env.CONTRIB_TTL_MINUTES) || 360
};
