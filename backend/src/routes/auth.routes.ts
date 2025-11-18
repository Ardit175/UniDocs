import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../database/connection';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @route   GET /api/auth/programs
 * @desc    Get available programs for registration
 * @access  Public
 */
router.get('/programs', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, code, faculty, degree_level, duration_years 
       FROM programs 
       ORDER BY degree_level, name`
    );
    
    res.json({
      programs: result.rows,
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Validation schemas
const registerSchema = z.object({
  email: z.string().email().refine(email => email.endsWith('@fti.edu.al'), {
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

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user exists
    const userExists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [validatedData.email]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists',
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);
    
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, role, emri, mbiemri) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, email, role, emri, mbiemri, created_at`,
        [validatedData.email, passwordHash, validatedData.role, validatedData.emri, validatedData.mbiemri]
      );
      
      const user = userResult.rows[0];
      
      // Create role-specific record
      if (validatedData.role === 'student') {
        // Default to first program if not specified
        const programId = validatedData.program_id || 1;
        
        await client.query(
          `INSERT INTO students (user_id, student_id, program_id, status) 
           VALUES ($1, $2, $3, 'aktiv')`,
          [user.id, validatedData.student_id || `ST-${Date.now()}`, programId]
        );
      } else if (validatedData.role === 'pedagogue') {
        await client.query(
          `INSERT INTO pedagogues (user_id, pedagog_id) 
           VALUES ($1, $2)`,
          [user.id, validatedData.pedagog_id || `PD-${Date.now()}`]
        );
      }
      
      await client.query('COMMIT');
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key'
      );
      
      // Log activity
      await pool.query(
        `INSERT INTO activity_logs (user_id, action, ip_address) 
         VALUES ($1, $2, $3)`,
        [user.id, 'register', req.ip]
      );
      
      return res.status(201).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            emri: user.emri,
            mbiemri: user.mbiemri,
          },
          token,
        },
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    console.error('Registration error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Get user
    const result = await pool.query(
      `SELECT id, email, password_hash, role, emri, mbiemri 
       FROM users 
       WHERE email = $1`,
      [validatedData.email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(
      validatedData.password,
      user.password_hash
    );
    
    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }
    
    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, ip_address) 
       VALUES ($1, $2, $3)`,
      [user.id, 'login', req.ip]
    );
    
    return res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emri: user.emri,
          mbiemri: user.mbiemri,
        },
        token,
      },
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided',
      });
    }
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: number; email: string; role: string };
    
    const result = await pool.query(
      `SELECT id, email, role, emri, mbiemri, created_at 
       FROM users 
       WHERE id = $1`,
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }
    
    return res.json({
      status: 'success',
      data: {
        user: result.rows[0],
      },
    });
    
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // But we can log the activity
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { userId: number };
      
      await pool.query(
        `INSERT INTO activity_logs (user_id, action, ip_address) 
         VALUES ($1, $2, $3)`,
        [decoded.userId, 'logout', req.ip]
      );
    }
  } catch (error) {
    // Ignore errors on logout
  }
  
  res.json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

export default router;
