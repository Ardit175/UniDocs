import { Router } from 'express';
import pool from '../database/connection';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/verification/:documentId
 * Verify document authenticity (public endpoint with optional auth)
 */
router.get('/:documentId', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { documentId } = req.params;

    // Fetch document details
    const documentResult = await pool.query(
      `SELECT 
        d.id, d.document_type, d.status, d.generated_at,
        d.qr_code, d.metadata,
        s.student_id as student_number,
        u.first_name || ' ' || u.last_name as student_name,
        p.name as program_name, p.faculty,
        ug.first_name || ' ' || ug.last_name as generated_by_name
      FROM documents d
      JOIN students s ON d.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN programs p ON s.program_id = p.id
      LEFT JOIN users ug ON d.generated_by = ug.id
      WHERE d.id = $1`,
      [documentId]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        valid: false,
        message: 'Document not found',
      });
    }

    const document = documentResult.rows[0];

    // Check if document is revoked or invalid
    if (document.status !== 'active') {
      // Log verification attempt
      await pool.query(
        `INSERT INTO verification_logs (
          document_id, verified_by, verification_status, ip_address
        ) VALUES ($1, $2, $3, $4)`,
        [
          documentId,
          req.authUser?.id || null,
          'invalid',
          req.ip || 'unknown',
        ]
      );

      return res.json({
        valid: false,
        message: 'Document has been revoked or is no longer valid',
        document: {
          id: document.id,
          type: document.document_type,
          status: document.status,
        },
      });
    }

    // Log successful verification
    await pool.query(
      `INSERT INTO verification_logs (
        document_id, verified_by, verification_status, ip_address
      ) VALUES ($1, $2, $3, $4)`,
      [
        documentId,
        req.authUser?.id || null,
        'valid',
        req.ip || 'unknown',
      ]
    );

    // Return document details
    return res.json({
      valid: true,
      message: 'Document is authentic and valid',
      document: {
        id: document.id,
        type: document.document_type,
        status: document.status,
        generatedAt: document.generated_at,
        student: {
          name: document.student_name,
          studentId: document.student_number,
          program: document.program_name,
          faculty: document.faculty,
        },
        generatedBy: document.generated_by_name,
        metadata: document.metadata,
      },
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    return res.status(500).json({
      valid: false,
      message: 'Verification failed due to server error',
    });
  }
});

/**
 * GET /api/verification/:documentId/history
 * Get verification history for a document (authenticated)
 */
router.get('/:documentId/history', async (req: AuthRequest, res) => {
  try {
    const { documentId } = req.params;

    const result = await pool.query(
      `SELECT 
        vl.id, vl.verification_status, vl.verified_at, vl.ip_address,
        u.first_name || ' ' || u.last_name as verified_by_name
      FROM verification_logs vl
      LEFT JOIN users u ON vl.verified_by = u.id
      WHERE vl.document_id = $1
      ORDER BY vl.verified_at DESC
      LIMIT 50`,
      [documentId]
    );

    return res.json({
      documentId,
      verifications: result.rows,
    });
  } catch (error) {
    console.error('Error fetching verification history:', error);
    return res.status(500).json({ error: 'Failed to fetch verification history' });
  }
});

export default router;
