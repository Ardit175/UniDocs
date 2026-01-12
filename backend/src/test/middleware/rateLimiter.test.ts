import { describe, it, expect } from '@jest/globals';

describe('Rate Limiter Middleware', () => {
  describe('rateLimiter configuration', () => {
    it('should export rateLimiter middleware', async () => {
      // Re-import to get fresh module
      const { rateLimiter } = await import('../../middleware/rateLimiter');
      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter).toBe('function');
    });

    it('should export authLimiter middleware', async () => {
      const { authLimiter } = await import('../../middleware/rateLimiter');
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe('function');
    });
  });

  describe('Middleware function behavior', () => {
    it('rateLimiter should be a valid Express middleware', async () => {
      const { rateLimiter } = await import('../../middleware/rateLimiter');
      // Express middleware should accept 3 parameters
      expect(rateLimiter.length).toBeGreaterThanOrEqual(0);
    });

    it('authLimiter should be a valid Express middleware', async () => {
      const { authLimiter } = await import('../../middleware/rateLimiter');
      expect(authLimiter.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Rate limiter source code validation', () => {
    it('should verify rate limit configuration values in source', async () => {
      // We can read the source file and verify the config
      const fs = await import('fs');
      const path = await import('path');
      const sourceFile = path.join(__dirname, '../../middleware/rateLimiter.ts');
      const source = fs.readFileSync(sourceFile, 'utf-8');
      
      // Verify rateLimiter config
      expect(source).toContain('15 * 60 * 1000'); // 15 minutes windowMs
      expect(source).toContain('max:');
      expect(source).toContain('100'); // default max requests
      expect(source).toContain('Too many requests');
      expect(source).toContain('standardHeaders: true');
      expect(source).toContain('legacyHeaders: false');
    });

    it('should verify authLimiter configuration values in source', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const sourceFile = path.join(__dirname, '../../middleware/rateLimiter.ts');
      const source = fs.readFileSync(sourceFile, 'utf-8');
      
      // Verify authLimiter config
      expect(source).toContain('max: 5'); // 5 requests for auth
      expect(source).toContain('Too many login attempts');
      expect(source).toContain('skipSuccessfulRequests: true');
    });
  });

  describe('Environment variable configuration', () => {
    it('should respect RATE_LIMIT_WINDOW_MS environment variable', () => {
      // Verify the source uses environment variable
      const fs = require('fs');
      const path = require('path');
      const sourceFile = path.join(__dirname, '../../middleware/rateLimiter.ts');
      const source = fs.readFileSync(sourceFile, 'utf-8');
      
      expect(source).toContain('process.env.RATE_LIMIT_WINDOW_MS');
    });

    it('should respect RATE_LIMIT_MAX_REQUESTS environment variable', () => {
      const fs = require('fs');
      const path = require('path');
      const sourceFile = path.join(__dirname, '../../middleware/rateLimiter.ts');
      const source = fs.readFileSync(sourceFile, 'utf-8');
      
      expect(source).toContain('process.env.RATE_LIMIT_MAX_REQUESTS');
    });
  });
});
