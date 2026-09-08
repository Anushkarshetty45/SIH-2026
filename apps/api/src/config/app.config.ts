import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  corsOrigins: process.env['CORS_ORIGINS'] ?? '',
  database: {
    url: process.env['DATABASE_URL'] ?? '',
  },
  jwt: {
    secret: process.env['JWT_SECRET'] ?? '',
    accessExpiration: process.env['JWT_ACCESS_EXPIRATION'] ?? '15m',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] ?? '',
    refreshExpiration: process.env['JWT_REFRESH_EXPIRATION'] ?? '7d',
  },
  redis: {
    url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
  },
}));
