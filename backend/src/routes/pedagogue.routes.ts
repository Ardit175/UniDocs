import { Router } from 'express';
import pool from '../database/connection';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);
router.use(authorize('pedagogue'));

/**
 * GET /api/pedagogues/me
 * Get current pedagogue's profile
 */
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const pedagogueId = req.authUser?.pedagogue_id;

    if (!pedagogueId) {
      return res.status(400).json({ error: 'Pedagogue ID not found' });
    }

    const result = await pool.query(
      `SELECT 
        p.id, p.department, p.title, p.office_location,
        p.office_hours, p.bio,
        u.email, u.first_name, u.last_name, u.created_at
      FROM pedagogues p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1`,
      [pedagogueId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedagogue not found' });
    }

    return res.json({
      pedagogue: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching pedagogue profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * GET /api/pedagogues/courses
 * Get all courses taught by current pedagogue
 */
router.get('/courses', async (req: AuthRequest, res) => {
  try {
    const pedagogueId = req.authUser?.pedagogue_id;

    if (!pedagogueId) {
      return res.status(400).json({ error: 'Pedagogue ID not found' });
    }

    const result = await pool.query(
      `SELECT 
        sub.id, sub.code, sub.name, sub.credits, sub.semester,
        sub.academic_year, sub.description,
        COUNT(DISTINCT e.student_id) as enrolled_students,
        COUNT(DISTINCT g.student_id) as graded_students
      FROM subjects sub
      LEFT JOIN enrollments e ON sub.id = e.subject_id AND e.status = 'active'
      LEFT JOIN grades g ON sub.id = g.subject_id AND g.grade IS NOT NULL
      WHERE sub.pedagogue_id = $1
      GROUP BY sub.id
      ORDER BY sub.academic_year DESC, sub.semester DESC, sub.name`,
      [pedagogueId]
    );

    return res.json({
      courses: result.rows,
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * GET /api/pedagogues/courses/:courseId/students
 * Get all students enrolled in a specific course
 */
router.get('/courses/:courseId/students', async (req: AuthRequest, res) => {
  try {
    const pedagogueId = req.authUser?.pedagogue_id;
    const { courseId } = req.params;

    if (!pedagogueId) {
      return res.status(400).json({ error: 'Pedagogue ID not found' });
    }

    // Verify pedagogue teaches this course
    const courseCheck = await pool.query(
      'SELECT id FROM subjects WHERE id = $1 AND pedagogue_id = $2',
      [courseId, pedagogueId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this course' });
    }

    const result = await pool.query(
      `SELECT 
        s.id, s.student_id, s.gpa,
        u.first_name, u.last_name, u.email,
        p.name as program_name,
        e.enrollment_date, e.status,
        g.grade, g.graded_at
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN programs p ON s.program_id = p.id
      LEFT JOIN grades g ON g.student_id = s.id AND g.subject_id = e.subject_id
      WHERE e.subject_id = $1
      ORDER BY u.last_name, u.first_name`,
      [courseId]
    );

    return res.json({
      students: result.rows,
    });
  } catch (error) {
    console.error('Error fetching course students:', error);
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
});

/**
 * GET /api/pedagogues/statistics
 * Get pedagogue's teaching statistics
 */
router.get('/statistics', async (req: AuthRequest, res) => {
  try {
    const pedagogueId = req.authUser?.pedagogue_id;

    if (!pedagogueId) {
      return res.status(400).json({ error: 'Pedagogue ID not found' });
    }

    // Get course counts
    const courseStats = await pool.query(
      `SELECT 
        COUNT(DISTINCT sub.id) as total_courses,
        COUNT(DISTINCT e.student_id) as total_students,
        COUNT(DISTINCT CASE WHEN sub.academic_year = '2024-2025' THEN sub.id END) as current_courses
      FROM subjects sub
      LEFT JOIN enrollments e ON sub.id = e.subject_id AND e.status = 'active'
      WHERE sub.pedagogue_id = $1`,
      [pedagogueId]
    );

    // Get documents generated
    const documentsCount = await pool.query(
      `SELECT COUNT(*) as count
       FROM documents
       WHERE generated_by = (SELECT user_id FROM pedagogues WHERE id = $1)`,
      [pedagogueId]
    );

    // Get recent activity
    const recentActivity = await pool.query(
      `SELECT action, details, created_at
       FROM activity_logs
       WHERE user_id = (SELECT user_id FROM pedagogues WHERE id = $1)
       ORDER BY created_at DESC
       LIMIT 10`,
      [pedagogueId]
    );

    // Get grade distribution across all courses
    const gradeDistribution = await pool.query(
      `SELECT 
        CASE 
          WHEN grade >= 9 THEN 'A (9-10)'
          WHEN grade >= 8 THEN 'B (8-9)'
          WHEN grade >= 7 THEN 'C (7-8)'
          WHEN grade >= 6 THEN 'D (6-7)'
          ELSE 'F (<6)'
        END as grade_range,
        COUNT(*) as count
       FROM grades g
       JOIN subjects sub ON g.subject_id = sub.id
       WHERE sub.pedagogue_id = $1 AND g.grade IS NOT NULL
       GROUP BY grade_range
       ORDER BY grade_range`,
      [pedagogueId]
    );

    return res.json({
      statistics: {
        ...courseStats.rows[0],
        documentsGenerated: documentsCount.rows[0].count,
        gradeDistribution: gradeDistribution.rows,
        recentActivity: recentActivity.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
