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
        s.id, s.student_id, s.data_regjistrimit, s.viti_studimit,
        s.status, u.email, u.emri, u.mbiemri, u.created_at, u.foto_profili_url,
        p.id as program_id, p.emri_shqip as program_name, p.emri_anglisht,
        p.lloji, p.kohezgjatja_vite, p.total_kredite
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
        g.id, g.nota as grade, g.vlerësimi as assessment, g.data_provimit as exam_date,
        g.viti_akademik, g.semestri,
        sub.id as subject_id, sub.kodi as subject_code, sub.emri_shqip as subject_name,
        sub.emri_anglisht as subject_name_en, sub.kredite as credits,
        sub.semestri_rekomandueshme as recommended_semester,
        u.emri || ' ' || u.mbiemri as pedagogue_name
      FROM grades g
      JOIN subjects sub ON g.subject_id = sub.id
      LEFT JOIN pedagogues ped ON sub.pedagog_id = ped.id
      LEFT JOIN users u ON ped.user_id = u.id
      WHERE g.student_id = $1
      ORDER BY g.viti_akademik DESC, g.semestri DESC, sub.emri_shqip`,
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
        sub.id, sub.kodi as code, sub.emri_shqip as name, sub.emri_anglisht as name_en,
        sub.kredite as credits, sub.semestri_rekomandueshme as semester,
        sub.pershkrimi as description,
        e.viti_akademik as academic_year, e.semestri, e.prezenca_perqindje as attendance,
        u.emri || ' ' || u.mbiemri as pedagogue_name,
        e.created_at as enrollment_date,
        g.nota as grade, g.vlerësimi as assessment
      FROM enrollments e
      JOIN subjects sub ON e.subject_id = sub.id
      LEFT JOIN pedagogues ped ON sub.pedagog_id = ped.id
      LEFT JOIN users u ON ped.user_id = u.id
      LEFT JOIN grades g ON g.student_id = e.student_id AND g.subject_id = sub.id 
        AND g.viti_akademik = e.viti_akademik AND g.semestri = e.semestri
      WHERE e.student_id = $1
      ORDER BY e.viti_akademik DESC, e.semestri DESC, sub.emri_shqip`,
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

    // Calculate GPA and credits from grades
    const studentStats = await pool.query(
      `SELECT 
        s.viti_studimit as current_year,
        COALESCE(AVG(g.nota), 0) as gpa,
        COALESCE(SUM(CASE WHEN g.nota >= 5 THEN sub.kredite ELSE 0 END), 0) as completed_credits,
        COALESCE(SUM(sub.kredite), 0) as total_enrolled_credits
       FROM students s
       LEFT JOIN grades g ON g.student_id = s.id
       LEFT JOIN subjects sub ON g.subject_id = sub.id
       WHERE s.id = $1
       GROUP BY s.id, s.viti_studimit`,
      [studentId]
    );

    // Get grade distribution
    const gradeDistribution = await pool.query(
      `SELECT 
        CASE 
          WHEN nota >= 9 THEN 'A (9-10)'
          WHEN nota >= 8 THEN 'B (8-9)'
          WHEN nota >= 7 THEN 'C (7-8)'
          WHEN nota >= 6 THEN 'D (6-7)'
          WHEN nota >= 5 THEN 'E (5-6)'
          ELSE 'F (<5)'
        END as grade_range,
        COUNT(*) as count
       FROM grades
       WHERE student_id = $1 AND nota IS NOT NULL
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
       WHERE for_student_id = $1
       GROUP BY document_type`,
      [studentId]
    );

    // Get recent activity
    const recentActivity = await pool.query(
      `SELECT action, entity_type, entity_id, created_at
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
