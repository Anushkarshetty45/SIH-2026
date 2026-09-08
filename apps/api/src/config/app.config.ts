import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  corsOrigins: process.env['CORS_ORIGINS'] ?? '',
  database: {
    url: process.env['DATABASE_URL'] ?? '',
  },
  jwt: {
    secret: process.env['JWT_SECRET'] || 'caregrid-jwt-secret-key-2026',
    accessExpiration: process.env['JWT_ACCESS_EXPIRATION'] || '15m',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] || 'caregrid-jwt-refresh-secret-2026',
    refreshExpiration: process.env['JWT_REFRESH_EXPIRATION'] || '7d',
  },
  redis: {
    url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
  },
  staleThresholds: {
    bedsMinutes: parseInt(
      process.env['BED_STALE_THRESHOLD_MINUTES'] ||
        process.env['AVAILABILITY_STALE_THRESHOLD_MINUTES'] ||
        '120',
      10,
    ),
    equipmentMinutes: parseInt(process.env['EQUIPMENT_STALE_THRESHOLD_MINUTES'] || '120', 10),
    inventoryMinutes: parseInt(process.env['INVENTORY_STALE_THRESHOLD_MINUTES'] || '120', 10),
    facilityMs: parseInt(process.env['FACILITY_STALE_THRESHOLD_MS'] || '7200000', 10),
  },
}));
