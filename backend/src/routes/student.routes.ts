import { Router } from 'express';
import pool from '../database/connection';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);
router.use(authorize('student'));

/**
 * GET /api/students/me
 * Get current student's profile
 */
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const studentId = req.authUser?.student_id;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID not found' });
    }

    const result = await pool.query(
      `SELECT 
        s.id, s.student_id, s.enrollment_date, s.current_semester,
        s.gpa, s.total_credits, s.completed_credits, s.is_active,
        u.email, u.first_name, u.last_name, u.created_at,
        p.id as program_id, p.name as program_name, p.faculty,
        p.degree_level, p.duration_years, p.academic_year
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN programs p ON s.program_id = p.id
      WHERE s.id = $1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    return res.json({
      student: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * GET /api/students/grades
 * Get current student's grades
 */
router.get('/grades', async (req: AuthRequest, res) => {
  try {
    const studentId = req.authUser?.student_id;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID not found' });
    }

    const result = await pool.query(
      `SELECT 
        g.id, g.grade, g.graded_at,
        sub.id as subject_id, sub.code as subject_code, sub.name as subject_name,
        sub.credits, sub.semester, sub.academic_year,
        p.first_name || ' ' || p.last_name as professor_name
      FROM grades g
      JOIN subjects sub ON g.subject_id = sub.id
      LEFT JOIN pedagogues ped ON sub.pedagogue_id = ped.id
      LEFT JOIN users p ON ped.user_id = p.id
      WHERE g.student_id = $1
      ORDER BY sub.academic_year DESC, sub.semester DESC, sub.name`,
      [studentId]
    );

    return res.json({
      grades: result.rows,
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    return res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

/**
 * GET /api/students/subjects
 * Get current student's enrolled subjects
 */
router.get('/subjects', async (req: AuthRequest, res) => {
  try {
    const studentId = req.authUser?.student_id;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID not found' });
    }

    const result = await pool.query(
      `SELECT 
        sub.id, sub.code, sub.name, sub.credits, sub.semester,
        sub.academic_year, sub.description,
        p.first_name || ' ' || p.last_name as professor_name,
        e.enrollment_date, e.status,
        g.grade
      FROM enrollments e
      JOIN subjects sub ON e.subject_id = sub.id
      LEFT JOIN pedagogues ped ON sub.pedagogue_id = ped.id
      LEFT JOIN users p ON ped.user_id = p.id
      LEFT JOIN grades g ON g.student_id = e.student_id AND g.subject_id = sub.id
      WHERE e.student_id = $1
      ORDER BY sub.academic_year DESC, sub.semester DESC, sub.name`,
      [studentId]
    );

    return res.json({
      subjects: result.rows,
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

/**
 * GET /api/students/statistics
 * Get current student's statistics
 */
router.get('/statistics', async (req: AuthRequest, res) => {
  try {
    const studentId = req.authUser?.student_id;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID not found' });
    }

    // Get student basic stats
    const studentStats = await pool.query(
      `SELECT gpa, total_credits, completed_credits, current_semester
       FROM students WHERE id = $1`,
      [studentId]
    );

    // Get grade distribution
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
       FROM grades
       WHERE student_id = $1 AND grade IS NOT NULL
       GROUP BY grade_range
       ORDER BY grade_range`,
      [studentId]
    );

    // Get documents count
    const documentsCount = await pool.query(
      `SELECT 
        document_type,
        COUNT(*) as count
       FROM documents
       WHERE student_id = $1
       GROUP BY document_type`,
      [studentId]
    );

    // Get recent activity
    const recentActivity = await pool.query(
      `SELECT action, details, created_at
       FROM activity_logs
       WHERE user_id = (SELECT user_id FROM students WHERE id = $1)
       ORDER BY created_at DESC
       LIMIT 10`,
      [studentId]
    );

    return res.json({
      statistics: {
        ...studentStats.rows[0],
        gradeDistribution: gradeDistribution.rows,
        documentsCounts: documentsCount.rows,
        recentActivity: recentActivity.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
