import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../../middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleErrorSpy: any;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    mockNext = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('AppError class', () => {
    it('should create AppError with correct properties', () => {
      const message = 'Test error message';
      const statusCode = 400;

      const error = new AppError(message, statusCode);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(statusCode);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error', 400);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Error: Test error');
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError with correct status and message', () => {
      const error = new AppError('Custom error message', 404);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Custom error message',
      });
    });

    it('should handle 400 Bad Request errors', () => {
      const error = new AppError('Invalid input', 400);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid input',
      });
    });

    it('should handle 401 Unauthorized errors', () => {
      const error = new AppError('Unauthorized access', 401);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Unauthorized access',
      });
    });

    it('should handle 403 Forbidden errors', () => {
      const error = new AppError('Access forbidden', 403);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Access forbidden',
      });
    });

    it('should handle 404 Not Found errors', () => {
      const error = new AppError('Resource not found', 404);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Resource not found',
      });
    });

    it('should handle unexpected errors with 500 status', () => {
      const error = new Error('Unexpected error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Something went wrong!',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR 💥:', error);
    });

    it('should log unexpected errors to console', () => {
      const error = new Error('Database connection failed');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR 💥:', error);
    });

    it('should not log operational errors', () => {
      const error = new AppError('User not found', 404);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle TypeError', () => {
      const error = new TypeError('Cannot read property of undefined');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Something went wrong!',
      });
    });

    it('should handle ReferenceError', () => {
      const error = new ReferenceError('Variable is not defined');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Something went wrong!',
      });
    });

    it('should maintain chainable response methods', () => {
      const error = new AppError('Test error', 400);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveReturnedWith(mockResponse);
      expect(mockResponse.json).toHaveReturnedWith(mockResponse);
    });
  });
});
