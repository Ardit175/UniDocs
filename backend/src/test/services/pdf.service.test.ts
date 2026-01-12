import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock dependencies before importing the service
const mockUploadFile = jest.fn();
const mockGetPresignedUrl = jest.fn();

jest.mock('../../services/minio.service', () => ({
  uploadFile: mockUploadFile,
  getPresignedUrl: mockGetPresignedUrl,
}));

const mockToDataURL = jest.fn();
jest.mock('qrcode', () => ({
  toDataURL: mockToDataURL,
}));

// Mock PDFDocument
const mockOn = jest.fn();
const mockEnd = jest.fn();
const mockFontSize = jest.fn();
const mockFont = jest.fn();
const mockText = jest.fn();
const mockMoveDown = jest.fn();
const mockMoveTo = jest.fn();
const mockLineTo = jest.fn();
const mockStroke = jest.fn();
const mockImage = jest.fn();

const mockDocInstance = {
  on: mockOn,
  end: mockEnd,
  fontSize: mockFontSize,
  font: mockFont,
  text: mockText,
  moveDown: mockMoveDown,
  moveTo: mockMoveTo,
  lineTo: mockLineTo,
  stroke: mockStroke,
  image: mockImage,
};

// Chain all methods to return the mock instance
mockFontSize.mockReturnValue(mockDocInstance);
mockFont.mockReturnValue(mockDocInstance);
mockText.mockReturnValue(mockDocInstance);
mockMoveDown.mockReturnValue(mockDocInstance);
mockMoveTo.mockReturnValue(mockDocInstance);
mockLineTo.mockReturnValue(mockDocInstance);
mockStroke.mockReturnValue(mockDocInstance);
mockImage.mockReturnValue(mockDocInstance);

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => mockDocInstance);
});

// Import after mocking
import { pdfService } from '../../services/pdf.service';

describe('PDF Service', () => {
  const mockPdfBuffer = Buffer.from('mock pdf content');
  const mockQRCode = 'data:image/png;base64,mockqrcode';

  beforeEach(() => {
    jest.clearAllMocks();
    mockToDataURL.mockResolvedValue(mockQRCode);
    mockUploadFile.mockResolvedValue('documents/test.pdf');
    mockGetPresignedUrl.mockResolvedValue('https://presigned-url.com/doc.pdf');

    // Setup the on handler to simulate PDF generation
    mockOn.mockImplementation((event: string, handler: (chunk?: Buffer) => void) => {
      if (event === 'data') {
        setImmediate(() => handler(mockPdfBuffer));
      }
      if (event === 'end') {
        setImmediate(() => handler());
      }
      return mockDocInstance;
    });
  });

  describe('generateEnrollmentCertificate', () => {
    const enrollmentData = {
      documentId: 'doc-123',
      studentName: 'John Doe',
      studentId: 'STU001',
      generatedDate: new Date('2024-01-15'),
      program: 'Computer Science',
      faculty: 'Faculty of Information Technology',
      semester: 2,
      academicYear: '2023-2024',
      enrollmentDate: new Date('2023-09-01'),
    };

    it('should generate enrollment certificate PDF', async () => {
      const result = await pdfService.generateEnrollmentCertificate(enrollmentData);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockEnd).toHaveBeenCalled();
    });

    it('should include student name in uppercase', async () => {
      await pdfService.generateEnrollmentCertificate(enrollmentData);

      expect(mockText).toHaveBeenCalledWith('JOHN DOE', expect.anything());
    });

    it('should include student ID', async () => {
      await pdfService.generateEnrollmentCertificate(enrollmentData);

      expect(mockText).toHaveBeenCalledWith(`Student ID: ${enrollmentData.studentId}`, expect.anything());
    });

    it('should include program name', async () => {
      await pdfService.generateEnrollmentCertificate(enrollmentData);

      expect(mockText).toHaveBeenCalledWith(enrollmentData.program, expect.anything());
    });

    it('should generate QR code for verification', async () => {
      await pdfService.generateEnrollmentCertificate(enrollmentData);

      expect(mockToDataURL).toHaveBeenCalledWith(
        expect.stringContaining(enrollmentData.documentId),
        expect.any(Object)
      );
    });

    it('should add header with university name', async () => {
      await pdfService.generateEnrollmentCertificate(enrollmentData);

      expect(mockText).toHaveBeenCalledWith(
        'UNIVERSITETI POLITEKNIK I TIRANËS',
        expect.any(Number),
        expect.any(Number),
        expect.anything()
      );
    });
  });

  describe('generateTranscript', () => {
    const transcriptData = {
      documentId: 'doc-456',
      studentName: 'Jane Smith',
      studentId: 'STU002',
      generatedDate: new Date('2024-01-15'),
      program: 'Software Engineering',
      currentYear: 3,
      grades: [
        { subject: 'Data Structures', grade: 9, credits: 6, semester: 'Fall 2023' },
        { subject: 'Algorithms', grade: 10, credits: 6, semester: 'Fall 2023' },
        { subject: 'Databases', grade: 8, credits: 5, semester: 'Spring 2024' },
      ],
    };

    it('should generate transcript PDF', async () => {
      const result = await pdfService.generateTranscript(transcriptData);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockEnd).toHaveBeenCalled();
    });

    it('should include title "OFFICIAL TRANSCRIPT"', async () => {
      await pdfService.generateTranscript(transcriptData);

      expect(mockText).toHaveBeenCalledWith('OFFICIAL TRANSCRIPT', expect.anything());
    });

    it('should call text method multiple times for transcript', async () => {
      await pdfService.generateTranscript(transcriptData);

      // Verify text method was called multiple times during generation
      expect(mockText).toHaveBeenCalled();
      expect(mockText.mock.calls.length).toBeGreaterThan(10);
    });
  });

  describe('generateParticipationCertificate', () => {
    const participationData = {
      documentId: 'doc-789',
      studentName: 'Alice Johnson',
      studentId: 'STU003',
      generatedDate: new Date('2024-01-15'),
      courseName: 'Advanced Programming',
      courseCode: 'CS301',
      pedagogueName: 'Dr. Smith',
      semester: 1,
      academicYear: '2023-2024',
      hoursAttended: 45,
      totalHours: 48,
    };

    it('should generate participation certificate PDF', async () => {
      const result = await pdfService.generateParticipationCertificate(participationData);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockEnd).toHaveBeenCalled();
    });

    it('should include course name', async () => {
      await pdfService.generateParticipationCertificate(participationData);

      expect(mockText).toHaveBeenCalledWith(
        participationData.courseName,
        expect.anything()
      );
    });

    it('should include attendance information', async () => {
      await pdfService.generateParticipationCertificate(participationData);

      expect(mockText).toHaveBeenCalledWith(
        expect.stringContaining(`${participationData.hoursAttended}`),
        expect.anything()
      );
    });
  });

  describe('generateVerificationLetter', () => {
    const verificationData = {
      documentId: 'doc-101',
      studentName: 'Bob Williams',
      studentId: 'STU004',
      generatedDate: new Date('2024-01-15'),
      program: 'Information Systems',
      currentYear: 2,
      enrollmentStatus: 'Active',
      purpose: 'Employment Verification',
    };

    it('should generate verification letter PDF', async () => {
      const result = await pdfService.generateVerificationLetter(verificationData);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockEnd).toHaveBeenCalled();
    });

    it('should call text method for document generation', async () => {
      await pdfService.generateVerificationLetter(verificationData);

      // Verify that text method was called multiple times during generation
      expect(mockText).toHaveBeenCalled();
      expect(mockText.mock.calls.length).toBeGreaterThan(5);
    });

    it('should include enrollment status', async () => {
      await pdfService.generateVerificationLetter(verificationData);

      expect(mockText).toHaveBeenCalledWith(
        expect.stringContaining(verificationData.enrollmentStatus),
        expect.anything()
      );
    });
  });

  describe('QR Code Generation', () => {
    it('should generate QR code with correct verification URL', async () => {
      const enrollmentData = {
        documentId: 'test-doc-id',
        studentName: 'Test Student',
        studentId: 'STU999',
        generatedDate: new Date(),
        program: 'Test Program',
        faculty: 'Test Faculty',
        semester: 1,
        academicYear: '2023-2024',
        enrollmentDate: new Date(),
      };

      await pdfService.generateEnrollmentCertificate(enrollmentData);

      expect(mockToDataURL).toHaveBeenCalledWith(
        expect.stringContaining('/verify/test-doc-id'),
        expect.objectContaining({
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 200,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle PDF generation error', async () => {
      mockOn.mockImplementation((event: string, handler: (error?: Error) => void) => {
        if (event === 'error') {
          setImmediate(() => handler(new Error('PDF generation failed')));
        }
        return mockDocInstance;
      });

      const enrollmentData = {
        documentId: 'doc-123',
        studentName: 'John Doe',
        studentId: 'STU001',
        generatedDate: new Date(),
        program: 'Computer Science',
        faculty: 'FTI',
        semester: 1,
        academicYear: '2023-2024',
        enrollmentDate: new Date(),
      };

      await expect(pdfService.generateEnrollmentCertificate(enrollmentData)).rejects.toThrow(
        'PDF generation failed'
      );
    });

    it('should handle QR code generation error', async () => {
      mockToDataURL.mockRejectedValue(new Error('QR code generation failed'));

      const enrollmentData = {
        documentId: 'doc-123',
        studentName: 'John Doe',
        studentId: 'STU001',
        generatedDate: new Date(),
        program: 'Computer Science',
        faculty: 'FTI',
        semester: 1,
        academicYear: '2023-2024',
        enrollmentDate: new Date(),
      };

      await expect(pdfService.generateEnrollmentCertificate(enrollmentData)).rejects.toThrow(
        'QR code generation failed'
      );
    });
  });
});
