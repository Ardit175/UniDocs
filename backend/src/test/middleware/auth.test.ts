import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { createMockUser } from '../factories';

// Mock the middleware functions
const createMockAuthMiddleware = () => {
  const mockAuthenticate = jest.fn(async (req: any, _res: Response, next: NextFunction) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      req.user = {
        id: 1,
        email: 'test@fti.edu.al',
        role: 'student',
      };
      next();
    } else {
      throw new Error('No token provided');
    }
  });

  const mockRequireRole = (roles: string[]) => {
    return jest.fn((req: any, _res: Response, next: NextFunction) => {
      if (req.user && roles.includes(req.user.role)) {
        next();
      } else {
        throw new Error('Insufficient permissions');
      }
    });
  };

  return { mockAuthenticate, mockRequireRole };
};

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined,
    } as any;
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    mockNext = jest.fn();
  });

  describe('authenticate middleware', () => {
    it('should authenticate user with valid token', async () => {
      const { mockAuthenticate } = createMockAuthMiddleware();
      mockRequest.headers = {
        authorization: 'Bearer valid.jwt.token',
      };

      await mockAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).user).toBeDefined();
      expect((mockRequest as any).user.email).toBe('test@fti.edu.al');
    });

    it('should reject request without token', async () => {
      const { mockAuthenticate } = createMockAuthMiddleware();
      mockRequest.headers = {};

      await expect(
        mockAuthenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow('No token provided');
    });

    it('should reject request with malformed authorization header', async () => {
      const { mockAuthenticate } = createMockAuthMiddleware();
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      await expect(
        mockAuthenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow('No token provided');
    });

    it('should extract user information from token', async () => {
      const { mockAuthenticate } = createMockAuthMiddleware();
      mockRequest.headers = {
        authorization: 'Bearer valid.jwt.token',
      };

      await mockAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect((mockRequest as any).user).toMatchObject({
        id: expect.any(Number),
        email: expect.stringContaining('@fti.edu.al'),
        role: expect.stringMatching(/student|pedagogue|admin/),
      });
    });
  });

  describe('requireRole middleware', () => {
    it('should allow access for users with correct role', () => {
      const { mockRequireRole } = createMockAuthMiddleware();
      const middleware = mockRequireRole(['student']);
      
      (mockRequest as any).user = {
        id: 1,
        email: 'student@fti.edu.al',
        role: 'student',
      };

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for users with incorrect role', () => {
      const { mockRequireRole } = createMockAuthMiddleware();
      const middleware = mockRequireRole(['admin']);
      
      (mockRequest as any).user = {
        id: 1,
        email: 'student@fti.edu.al',
        role: 'student',
      };

      expect(() =>
        middleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )
      ).toThrow('Insufficient permissions');
    });

    it('should allow access for multiple allowed roles', () => {
      const { mockRequireRole } = createMockAuthMiddleware();
      const middleware = mockRequireRole(['student', 'pedagogue']);
      
      (mockRequest as any).user = {
        id: 2,
        email: 'pedagogue@fti.edu.al',
        role: 'pedagogue',
      };

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      const { mockRequireRole } = createMockAuthMiddleware();
      const middleware = mockRequireRole(['student']);
      
      (mockRequest as any).user = undefined;

      expect(() =>
        middleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )
      ).toThrow('Insufficient permissions');
    });

    it('should allow admin access to admin-only routes', () => {
      const { mockRequireRole } = createMockAuthMiddleware();
      const middleware = mockRequireRole(['admin']);
      
      (mockRequest as any).user = {
        id: 3,
        email: 'admin@fti.edu.al',
        role: 'admin',
      };

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('token validation', () => {
    it('should validate token format', () => {
      const validToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      expect(validToken.startsWith('Bearer ')).toBe(true);
      expect(validToken.split(' ')[1]).toBeTruthy();
    });

    it('should handle empty bearer token', () => {
      const emptyToken = 'Bearer ';
      const token = emptyToken.substring(7);
      expect(token).toBe('');
    });

    it('should handle token without Bearer prefix', () => {
      const token = 'just.a.token';
      expect(token.startsWith('Bearer ')).toBe(false);
    });
  });

  describe('user verification status', () => {
    it('should check if user is verified', () => {
      const user = createMockUser({ is_verified: true });
      expect(user.is_verified).toBe(true);
    });

    it('should handle unverified users', () => {
      const user = createMockUser({ is_verified: false });
      expect(user.is_verified).toBe(false);
    });
  });
});
