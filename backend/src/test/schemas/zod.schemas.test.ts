import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

// Define the schemas as they are in the route files
// This tests them in isolation

const registerSchema = z.object({
  email: z.string().email().refine((email: string) => email.endsWith('@fti.edu.al'), {
    message: 'Email must be from @fti.edu.al domain',
  }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  emri: z.string().min(2, 'First name is required'),
  mbiemri: z.string().min(2, 'Last name is required'),
  role: z.enum(['student', 'pedagogue']),
  student_id: z.string().optional(),
  pedagog_id: z.string().optional(),
  program_id: z.number().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const updateUserSchema = z.object({
  emri: z.string().optional(),
  mbiemri: z.string().optional(),
});

const enrollmentCertificateSchema = z.object({
  purpose: z.string().optional(),
});

const verificationLetterSchema = z.object({
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
});

const updateSettingsSchema = z.object({
  max_documents_per_day: z.number().min(1).optional(),
});

describe('Zod Schemas', () => {
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'student@fti.edu.al',
        password: 'password123',
        emri: 'John',
        mbiemri: 'Doe',
        role: 'student',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept student role', () => {
      const data = {
        email: 'test@fti.edu.al',
        password: 'password123',
        emri: 'Test',
        mbiemri: 'User',
        role: 'student',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept pedagogue role', () => {
      const data = {
        email: 'test@fti.edu.al',
        password: 'password123',
        emri: 'Test',
        mbiemri: 'User',
        role: 'pedagogue',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const data = {
        email: 'test@fti.edu.al',
        password: 'password123',
        emri: 'Test',
        mbiemri: 'User',
        role: 'admin',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject non-fti.edu.al email', () => {
      const data = {
        email: 'test@gmail.com',
        password: 'password123',
        emri: 'Test',
        mbiemri: 'User',
        role: 'student',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email must be from @fti.edu.al domain');
      }
    });

    it('should reject invalid email format', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123',
        emri: 'Test',
        mbiemri: 'User',
        role: 'student',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const data = {
        email: 'test@fti.edu.al',
        password: '123',
        emri: 'Test',
        mbiemri: 'User',
        role: 'student',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must be at least 8 characters');
      }
    });

    it('should reject short first name', () => {
      const data = {
        email: 'test@fti.edu.al',
        password: 'password123',
        emri: 'J',
        mbiemri: 'Doe',
        role: 'student',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('First name is required');
      }
    });

    it('should reject short last name', () => {
      const data = {
        email: 'test@fti.edu.al',
        password: 'password123',
        emri: 'John',
        mbiemri: 'D',
        role: 'student',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Last name is required');
      }
    });

    it('should accept optional student_id', () => {
      const data = {
        email: 'test@fti.edu.al',
        password: 'password123',
        emri: 'Test',
        mbiemri: 'User',
        role: 'student',
        student_id: 'STU001',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.student_id).toBe('STU001');
      }
    });

    it('should accept optional pedagog_id', () => {
      const data = {
        email: 'test@fti.edu.al',
        password: 'password123',
        emri: 'Test',
        mbiemri: 'User',
        role: 'pedagogue',
        pedagog_id: 'PED001',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept optional program_id', () => {
      const data = {
        email: 'test@fti.edu.al',
        password: 'password123',
        emri: 'Test',
        mbiemri: 'User',
        role: 'student',
        program_id: 1,
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject non-number program_id', () => {
      const data = {
        email: 'test@fti.edu.al',
        password: 'password123',
        emri: 'Test',
        mbiemri: 'User',
        role: 'student',
        program_id: 'one',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@fti.edu.al',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept any email domain for login', () => {
      const data = {
        email: 'test@gmail.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept any password length for login', () => {
      const data = {
        email: 'test@fti.edu.al',
        password: '1',
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const data = {
        password: 'password123',
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const data = {
        email: 'test@fti.edu.al',
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserSchema', () => {
    it('should validate valid update data', () => {
      const validData = {
        emri: 'John',
        mbiemri: 'Doe',
      };

      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept only first name', () => {
      const data = {
        emri: 'John',
      };

      const result = updateUserSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept only last name', () => {
      const data = {
        mbiemri: 'Doe',
      };

      const result = updateUserSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('enrollmentCertificateSchema', () => {
    it('should validate with purpose', () => {
      const data = {
        purpose: 'Employment verification',
      };

      const result = enrollmentCertificateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate without purpose', () => {
      const result = enrollmentCertificateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept empty purpose', () => {
      const data = {
        purpose: '',
      };

      const result = enrollmentCertificateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('verificationLetterSchema', () => {
    it('should validate valid verification letter request', () => {
      const data = {
        purpose: 'Employment verification for company XYZ',
      };

      const result = verificationLetterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject short purpose', () => {
      const data = {
        purpose: 'Short',
      };

      const result = verificationLetterSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Purpose must be at least 10 characters');
      }
    });

    it('should reject missing purpose', () => {
      const result = verificationLetterSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept exactly 10 character purpose', () => {
      const data = {
        purpose: '1234567890',
      };

      const result = verificationLetterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('updateSettingsSchema', () => {
    it('should validate valid settings update', () => {
      const data = {
        max_documents_per_day: 10,
      };

      const result = updateSettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject zero max_documents_per_day', () => {
      const data = {
        max_documents_per_day: 0,
      };

      const result = updateSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative max_documents_per_day', () => {
      const data = {
        max_documents_per_day: -5,
      };

      const result = updateSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept 1 as minimum max_documents_per_day', () => {
      const data = {
        max_documents_per_day: 1,
      };

      const result = updateSettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject non-number max_documents_per_day', () => {
      const data = {
        max_documents_per_day: 'ten',
      };

      const result = updateSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Schema Error Messages', () => {
    it('should provide helpful error message for invalid email domain', () => {
      const data = {
        email: 'test@other.com',
        password: 'password123',
        emri: 'Test',
        mbiemri: 'User',
        role: 'student',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.errors.find((e: { path: (string | number)[]; message: string }) => e.path.includes('email'));
        expect(emailError?.message).toBe('Email must be from @fti.edu.al domain');
      }
    });

    it('should provide helpful error message for short password', () => {
      const data = {
        email: 'test@fti.edu.al',
        password: 'short',
        emri: 'Test',
        mbiemri: 'User',
        role: 'student',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.errors.find((e: { path: (string | number)[]; message: string }) => e.path.includes('password'));
        expect(passwordError?.message).toBe('Password must be at least 8 characters');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle unicode characters in names', () => {
      const data = {
        email: 'test@fti.edu.al',
        password: 'password123',
        emri: 'Ángel',
        mbiemri: 'García',
        role: 'student',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle email with special characters before @', () => {
      const data = {
        email: 'test.user+tag@fti.edu.al',
        password: 'password123',
        emri: 'Test',
        mbiemri: 'User',
        role: 'student',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle very long valid data', () => {
      const data = {
        email: 'verylongemailaddress@fti.edu.al',
        password: 'a'.repeat(100),
        emri: 'A'.repeat(50),
        mbiemri: 'B'.repeat(50),
        role: 'student',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle whitespace in password', () => {
      const data = {
        email: 'test@fti.edu.al',
        password: 'password with spaces',
        emri: 'Test',
        mbiemri: 'User',
        role: 'student',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
