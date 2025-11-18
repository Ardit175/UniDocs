import { Router } from 'express';
import pool from '../database/connection';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('admin'));

/**
 * GET /api/admin/users
 * Get all users with pagination
 */
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const role = req.query.role as string;

    let query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role,
        u.is_active, u.created_at, u.last_login,
        CASE 
          WHEN u.role = 'student' THEN s.student_id
          ELSE NULL
        END as student_number
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id AND u.role = 'student'
    `;

    const params: any[] = [];
    if (role && ['student', 'pedagogue', 'admin'].includes(role)) {
      query += ' WHERE u.role = $1';
      params.push(role);
    }

    query += ' ORDER BY u.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users';
    const countParams: any[] = [];
    if (role && ['student', 'pedagogue', 'admin'].includes(role)) {
      countQuery += ' WHERE role = $1';
      countParams.push(role);
    }
    const countResult = await pool.query(countQuery, countParams);

    return res.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/users/:id
 * Get specific user details
 */
router.get('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role,
        u.is_active, u.created_at, u.last_login
      FROM users u
      WHERE u.id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get role-specific data
    let roleData = null;
    if (user.role === 'student') {
      const studentResult = await pool.query(
        `SELECT s.*, p.name as program_name, p.faculty
         FROM students s
         JOIN programs p ON s.program_id = p.id
         WHERE s.user_id = $1`,
        [id]
      );
      roleData = studentResult.rows[0];
    } else if (user.role === 'pedagogue') {
      const pedagogueResult = await pool.query(
        `SELECT * FROM pedagogues WHERE user_id = $1`,
        [id]
      );
      roleData = pedagogueResult.rows[0];
    }

    return res.json({
      user: {
        ...user,
        roleData,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user details
 */
const updateUserSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  is_active: z.boolean().optional(),
});

router.put('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.first_name !== undefined) {
      updates.push(`first_name = $${paramCount}`);
      values.push(data.first_name);
      paramCount++;
    }
    if (data.last_name !== undefined) {
      updates.push(`last_name = $${paramCount}`);
      values.push(data.last_name);
      paramCount++;
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(data.is_active);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES ($1, $2, $3)`,
      [req.authUser?.id, 'user_updated', `Updated user ${id}: ${JSON.stringify(data)}`]
    );

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete (deactivate) a user
 */
router.delete('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting the current admin
    if (parseInt(id) === req.authUser?.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES ($1, $2, $3)`,
      [req.authUser?.id, 'user_deleted', `Deactivated user ${id}`]
    );

    return res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/admin/statistics
 * Get system statistics
 */
router.get('/statistics', async (_req: AuthRequest, res) => {
  try {
    // User counts by role
    const userStats = await pool.query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE is_active = true) as active_count
      FROM users
      GROUP BY role
    `);

    // Document statistics
    const documentStats = await pool.query(`
      SELECT 
        document_type,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'active') as active_count
      FROM documents
      GROUP BY document_type
    `);

    // Recent activity
    const recentActivity = await pool.query(`
      SELECT 
        al.action, al.details, al.created_at,
        u.first_name || ' ' || u.last_name as user_name,
        u.role
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 20
    `);

    // Verification statistics
    const verificationStats = await pool.query(`
      SELECT 
        verification_status,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE verified_at > NOW() - INTERVAL '24 hours') as last_24h
      FROM verification_logs
      GROUP BY verification_status
    `);

    // Programs and enrollments
    const programStats = await pool.query(`
      SELECT 
        p.name as program_name,
        p.faculty,
        COUNT(s.id) as student_count
      FROM programs p
      LEFT JOIN students s ON p.id = s.program_id AND s.is_active = true
      GROUP BY p.id, p.name, p.faculty
      ORDER BY student_count DESC
    `);

    return res.json({
      statistics: {
        users: userStats.rows,
        documents: documentStats.rows,
        verifications: verificationStats.rows,
        programs: programStats.rows,
        recentActivity: recentActivity.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/admin/documents
 * Get all documents with filters
 */
router.get('/documents', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const documentType = req.query.type as string;
    const status = req.query.status as string;

    let query = `
      SELECT 
        d.id, d.document_type, d.status, d.generated_at,
        s.student_id as student_number,
        u.first_name || ' ' || u.last_name as student_name,
        ug.first_name || ' ' || ug.last_name as generated_by_name
      FROM documents d
      JOIN students s ON d.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users ug ON d.generated_by = ug.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (documentType) {
      query += ` AND d.document_type = $${paramCount}`;
      params.push(documentType);
      paramCount++;
    }

    if (status) {
      query += ` AND d.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY d.generated_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM documents WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 1;

    if (documentType) {
      countQuery += ` AND document_type = $${countParamCount}`;
      countParams.push(documentType);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);

    return res.json({
      documents: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

/**
 * PUT /api/admin/documents/:id/revoke
 * Revoke a document
 */
router.put('/documents/:id/revoke', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE documents SET status = $1 WHERE id = $2 RETURNING *',
      ['revoked', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES ($1, $2, $3)`,
      [req.authUser?.id, 'document_revoked', `Revoked document ${id}`]
    );

    return res.json({ message: 'Document revoked successfully', document: result.rows[0] });
  } catch (error) {
    console.error('Error revoking document:', error);
    return res.status(500).json({ error: 'Failed to revoke document' });
  }
});

/**
 * GET /api/admin/activity-logs
 * Get system activity logs
 */
router.get('/activity-logs', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT 
        al.id, al.action, al.details, al.created_at,
        u.id as user_id,
        u.first_name || ' ' || u.last_name as user_name,
        u.email, u.role
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM activity_logs');

    return res.json({
      logs: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

/**
 * GET /api/admin/settings
 * Get system settings
 */
router.get('/settings', async (_req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM system_settings ORDER BY created_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'System settings not found' });
    }

    return res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/admin/settings
 * Update system settings
 */
const updateSettingsSchema = z.object({
  allow_student_document_generation: z.boolean().optional(),
  require_admin_approval: z.boolean().optional(),
  max_documents_per_day: z.number().min(1).optional(),
  maintenance_mode: z.boolean().optional(),
});

router.put('/settings', async (req: AuthRequest, res) => {
  try {
    const data = updateSettingsSchema.parse(req.body);

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.allow_student_document_generation !== undefined) {
      updates.push(`allow_student_document_generation = $${paramCount}`);
      values.push(data.allow_student_document_generation);
      paramCount++;
    }
    if (data.require_admin_approval !== undefined) {
      updates.push(`require_admin_approval = $${paramCount}`);
      values.push(data.require_admin_approval);
      paramCount++;
    }
    if (data.max_documents_per_day !== undefined) {
      updates.push(`max_documents_per_day = $${paramCount}`);
      values.push(data.max_documents_per_day);
      paramCount++;
    }
    if (data.maintenance_mode !== undefined) {
      updates.push(`maintenance_mode = $${paramCount}`);
      values.push(data.maintenance_mode);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);

    const query = `UPDATE system_settings SET ${updates.join(', ')} RETURNING *`;
    const result = await pool.query(query, values);

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES ($1, $2, $3)`,
      [req.authUser?.id, 'settings_updated', `Updated system settings: ${JSON.stringify(data)}`]
    );

    return res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Error updating settings:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
