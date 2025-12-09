import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import pool from '../database/connection';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { pdfService } from '../services/pdf.service';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * POST /api/documents/certificate-enrollment
 * Generate certificate of enrollment (student only)
 */
const enrollmentCertificateSchema = z.object({
  purpose: z.string().optional(),
});

router.post('/certificate-enrollment', authorize('student'), async (req: AuthRequest, res) => {
  try {
    enrollmentCertificateSchema.parse(req.body); // Validate request body
    const studentId = req.authUser?.student_id;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID not found' });
    }

    // Fetch student data
    const studentResult = await pool.query(
      `SELECT 
        s.id, s.student_id as sid, u.emri, u.mbiemri,
        p.emri_shqip as program_name, p.emri_anglisht, s.data_regjistrimit,
        s.viti_studimit, s.status
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN programs p ON s.program_id = p.id
      WHERE s.id = $1`,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = studentResult.rows[0];
    const documentId = uuidv4();
    const generatedDate = new Date();

    // Generate PDF
    const pdfBuffer = await pdfService.generateEnrollmentCertificate({
      documentId,
      studentName: `${student.emri} ${student.mbiemri}`,
      studentId: student.sid,
      program: student.program_name,
      faculty: 'Fakulteti i Teknologjisë së Informacionit',
      semester: student.viti_studimit || 1,
      academicYear: '2024-2025',
      enrollmentDate: new Date(student.data_regjistrimit),
      generatedDate,
    });

    // Upload to MinIO
    const filePath = await pdfService.uploadDocument(pdfBuffer, documentId, 'enrollment-certificate');

    // Save document record
    await pool.query(
      `INSERT INTO documents (
        document_id_unique, for_student_id, document_type, file_path, qr_code_data, 
        status, generated_by_user_id, generated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        documentId,
        studentId,
        'enrollment_certificate',
        filePath,
        documentId, // QR code contains document ID
        'valid',
        req.authUser?.id,
        generatedDate,
      ]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type) 
       VALUES ($1, $2, $3)`,
      [req.authUser?.id, 'document_generated', 'enrollment_certificate']
    );

    // Get download URL
    const downloadUrl = await pdfService.getDownloadUrl(filePath, 3600);

    return res.json({
      documentId,
      type: 'enrollment_certificate',
      downloadUrl,
      generatedAt: generatedDate,
    });
  } catch (error) {
    console.error('Error generating enrollment certificate:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

/**
 * POST /api/documents/transcript
 * Generate academic transcript (student only)
 */
router.post('/transcript', authorize('student'), async (req: AuthRequest, res) => {
  try {
    const studentId = req.authUser?.student_id;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID not found' });
    }

    // Fetch student data
    const studentResult = await pool.query(
      `SELECT 
        s.id, s.student_id as sid, u.emri, u.mbiemri,
        p.emri_anglisht as program_name, s.viti_studimit as current_year
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN programs p ON s.program_id = p.id
      WHERE s.id = $1`,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = studentResult.rows[0];

    // Fetch grades
    const gradesResult = await pool.query(
      `SELECT 
        sub.emri_anglisht as subject, sub.kodi as code, g.nota, sub.kredite as credits,
        g.viti_akademik, g.semestri
      FROM grades g
      JOIN subjects sub ON g.subject_id = sub.id
      WHERE g.student_id = $1 AND g.nota IS NOT NULL
      ORDER BY g.viti_akademik, g.semestri, sub.emri_anglisht`,
      [studentId]
    );

    const documentId = uuidv4();
    const generatedDate = new Date();

    // Generate PDF
    const pdfBuffer = await pdfService.generateTranscript({
      documentId,
      studentName: `${student.emri} ${student.mbiemri}`,
      studentId: student.sid,
      program: student.program_name,
      currentYear: student.current_year,
      grades: gradesResult.rows.map(row => ({
        subject: `${row.code} - ${row.subject}`,
        grade: parseFloat(row.nota),
        credits: row.credits,
        semester: `${row.semestri} - ${row.viti_akademik}`,
      })),
      generatedDate,
    });

    // Upload to MinIO
    const filePath = await pdfService.uploadDocument(pdfBuffer, documentId, 'transcript');

    // Save document record
    await pool.query(
      `INSERT INTO documents (
        document_id_unique, for_student_id, document_type, file_path, qr_code_data, 
        status, generated_by_user_id, generated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        documentId,
        studentId,
        'transcript',
        filePath,
        documentId,
        'valid',
        req.authUser?.id,
        generatedDate,
      ]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type) 
       VALUES ($1, $2, $3)`,
      [req.authUser?.id, 'document_generated', 'transcript']
    );

    // Get download URL
    const downloadUrl = await pdfService.getDownloadUrl(filePath, 3600);

    return res.json({
      documentId,
      type: 'transcript',
      downloadUrl,
      generatedAt: generatedDate,
    });
  } catch (error) {
    console.error('Error generating transcript:', error);
    return res.status(500).json({ error: 'Failed to generate transcript' });
  }
});

/**
 * POST /api/documents/verification-letter
 * Generate student verification letter (student only)
 */
const verificationLetterSchema = z.object({
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
});

router.post('/verification-letter', authorize('student'), async (req: AuthRequest, res) => {
  try {
    const data = verificationLetterSchema.parse(req.body);
    const studentId = req.authUser?.student_id;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID not found' });
    }

    // Fetch student data
    const studentResult = await pool.query(
      `SELECT 
        s.id, s.student_id as sid, u.emri, u.mbiemri,
        p.emri_anglisht as program_name, s.viti_studimit,
        s.status as enrollment_status
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN programs p ON s.program_id = p.id
      WHERE s.id = $1`,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = studentResult.rows[0];
    const documentId = uuidv4();
    const generatedDate = new Date();

    // Generate PDF
    const pdfBuffer = await pdfService.generateVerificationLetter({
      documentId,
      studentName: `${student.emri} ${student.mbiemri}`,
      studentId: student.sid,
      program: student.program_name,
      currentYear: student.viti_studimit,
      enrollmentStatus: student.enrollment_status,
      purpose: data.purpose,
      generatedDate,
    });

    // Upload to MinIO
    const filePath = await pdfService.uploadDocument(pdfBuffer, documentId, 'verification-letter');

    // Save document record
    await pool.query(
      `INSERT INTO documents (
        document_id_unique, for_student_id, document_type, file_path, qr_code_data, 
        status, generated_by_user_id, generated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        documentId,
        studentId,
        'verification_letter',
        filePath,
        documentId,
        'valid',
        req.authUser?.id,
        generatedDate,
      ]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type) 
       VALUES ($1, $2, $3)`,
      [req.authUser?.id, 'document_generated', 'verification_letter']
    );

    // Get download URL
    const downloadUrl = await pdfService.getDownloadUrl(filePath, 3600);

    return res.json({
      documentId,
      type: 'verification_letter',
      downloadUrl,
      generatedAt: generatedDate,
    });
  } catch (error) {
    console.error('Error generating verification letter:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to generate verification letter' });
  }
});

/**
 * POST /api/documents/participation-certificate
 * Generate participation certificate (pedagogue only)
 */
const participationCertificateSchema = z.object({
  studentId: z.number(),
  courseId: z.number(),
  hoursAttended: z.number().min(0),
  totalHours: z.number().min(1),
});

router.post('/participation-certificate', authorize('pedagogue'), async (req: AuthRequest, res) => {
  try {
    const data = participationCertificateSchema.parse(req.body);
    const pedagogueId = req.authUser?.pedagogue_id;

    if (!pedagogueId) {
      return res.status(400).json({ error: 'Pedagogue ID not found' });
    }

    // Verify pedagogue teaches this course
    const courseCheck = await pool.query(
      `SELECT id FROM subjects WHERE id = $1 AND pedagogue_id = $2`,
      [data.courseId, pedagogueId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not authorized to issue certificates for this course' });
    }

    // Fetch student data
    const studentResult = await pool.query(
      `SELECT s.id, s.student_id as sid, u.emri, u.mbiemri
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [data.studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = studentResult.rows[0];

    // Fetch course and pedagogue data
    const courseResult = await pool.query(
      `SELECT 
        sub.emri_anglisht as course_name, sub.kodi as course_code,
        sub.semestri_rekomandueshme,
        u.emri || ' ' || u.mbiemri as pedagogue_name
       FROM subjects sub
       JOIN pedagogues p ON sub.pedagog_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE sub.id = $1`,
      [data.courseId]
    );

    const course = courseResult.rows[0];
    
    // Get academic year from enrollment
    const enrollmentResult = await pool.query(
      `SELECT viti_akademik
       FROM enrollments
       WHERE student_id = $1 AND subject_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [data.studentId, data.courseId]
    );
    
    const academicYear = enrollmentResult.rows[0]?.viti_akademik || '2024-2025';
    const documentId = uuidv4();
    const generatedDate = new Date();

    // Generate PDF
    const pdfBuffer = await pdfService.generateParticipationCertificate({
      documentId,
      studentName: `${student.emri} ${student.mbiemri}`,
      studentId: student.sid,
      courseName: course.course_name,
      courseCode: course.course_code,
      pedagogueName: course.pedagogue_name,
      semester: course.semestri_rekomandueshme,
      academicYear: academicYear,
      hoursAttended: data.hoursAttended,
      totalHours: data.totalHours,
      generatedDate,
    });

    // Upload to MinIO
    const filePath = await pdfService.uploadDocument(pdfBuffer, documentId, 'participation-certificate');

    // Save document record
    await pool.query(
      `INSERT INTO documents (
        document_id_unique, for_student_id, document_type, file_path, qr_code_data, 
        status, generated_by_user_id, generated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        documentId,
        data.studentId,
        'participation_certificate',
        filePath,
        documentId,
        'valid',
        req.authUser?.id,
        generatedDate,
      ]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type) 
       VALUES ($1, $2, $3)`,
      [req.authUser?.id, 'document_generated', 'participation_certificate']
    );

    // Get download URL
    const downloadUrl = await pdfService.getDownloadUrl(filePath, 3600);

    return res.json({
      documentId,
      type: 'participation_certificate',
      downloadUrl,
      generatedAt: generatedDate,
    });
  } catch (error) {
    console.error('Error generating participation certificate:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to generate participation certificate' });
  }
});

/**
 * GET /api/documents
 * Get all documents for current user
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.authUser?.id;
    const role = req.authUser?.role;
    const studentId = req.authUser?.student_id;

    let query = '';
    let params: any[] = [];

    if (role === 'student') {
      query = `
        SELECT 
          d.id, d.document_type, d.status, d.generated_at,
          u.emri || ' ' || u.mbiemri as generated_by_name
        FROM documents d
        LEFT JOIN users u ON d.generated_by_user_id = u.id
        WHERE d.for_student_id = $1
        ORDER BY d.generated_at DESC
      `;
      params = [studentId];
    } else if (role === 'pedagogue') {
      query = `
        SELECT 
          d.id, d.document_type, d.status, d.generated_at,
          s.student_id as student_number,
          u.emri || ' ' || u.mbiemri as student_name
        FROM documents d
        JOIN students s ON d.for_student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE d.generated_by_user_id = $1
        ORDER BY d.generated_at DESC
      `;
      params = [userId];
    } else if (role === 'admin') {
      query = `
        SELECT 
          d.id, d.document_type, d.status, d.generated_at,
          s.student_id as student_number,
          us.emri || ' ' || us.mbiemri as student_name,
          ug.emri || ' ' || ug.mbiemri as generated_by_name
        FROM documents d
        JOIN students s ON d.for_student_id = s.id
        JOIN users us ON s.user_id = us.id
        LEFT JOIN users ug ON d.generated_by_user_id = ug.id
        ORDER BY d.generated_at DESC
        LIMIT 100
      `;
    }

    const result = await pool.query(query, params);

    return res.json({
      documents: result.rows,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

/**
 * GET /api/documents/:id
 * Get specific document details and download URL
 */
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.authUser?.id;
    const role = req.authUser?.role;
    const studentId = req.authUser?.student_id;

    // Fetch document
    const documentResult = await pool.query(
      `SELECT 
        d.*, 
        s.student_id as student_number,
        u.emri || ' ' || u.mbiemri as student_name
       FROM documents d
       JOIN students s ON d.for_student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE d.document_id_unique = $1`,
      [id]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documentResult.rows[0];

    // Check permissions
    if (role === 'student' && document.for_student_id !== studentId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (role === 'pedagogue' && document.generated_by_user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get download URL
    const downloadUrl = await pdfService.getDownloadUrl(document.file_path, 3600);

    return res.json({
      ...document,
      downloadUrl,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return res.status(500).json({ error: 'Failed to fetch document' });
  }
});

export default router;
