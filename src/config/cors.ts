import { CorsOptions } from 'cors';

/**
 * Default authorized frontend origins for Stellar Threads
 */
export const DEFAULT_ALLOWED_ORIGINS = [
  'https://stellar-threads-app.netlify.app',
  'https://stellarthreads.io',
];

/**
 * Builds environment-aware CORS configuration:
 * - Allows requests without Origin headers (curl, mobile, server-to-server)
 * - Allows localhost / 127.0.0.1 in non-production environments
 * - Enforces strict origin whitelist in production based on CORS_ALLOWED_ORIGINS
 */
export function getCorsOptions(): CorsOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const rawOrigins = process.env.CORS_ALLOWED_ORIGINS;
  const allowedOrigins = rawOrigins
    ? rawOrigins.split(',').map((o) => o.trim()).filter(Boolean)
    : DEFAULT_ALLOWED_ORIGINS;

  return {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (!isProduction) {
        if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`Origin '${origin}' not allowed by CORS whitelist policy`));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  };
}