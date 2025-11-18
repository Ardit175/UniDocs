import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { uploadFile, getPresignedUrl } from './minio.service';

interface DocumentMetadata {
  documentId: string;
  studentName: string;
  studentId: string;
  generatedDate: Date;
  expiryDate?: Date;
}

interface EnrollmentCertificateData extends DocumentMetadata {
  program: string;
  faculty: string;
  semester: number;
  academicYear: string;
  enrollmentDate: Date;
}

interface TranscriptData extends DocumentMetadata {
  program: string;
  faculty: string;
  gpa: number;
  totalCredits: number;
  completedCredits: number;
  grades: Array<{
    subject: string;
    grade: number;
    credits: number;
    semester: string;
  }>;
}

interface ParticipationCertificateData extends DocumentMetadata {
  courseName: string;
  courseCode: string;
  pedagogueName: string;
  semester: string;
  academicYear: string;
  hoursAttended: number;
  totalHours: number;
}

interface VerificationLetterData extends DocumentMetadata {
  program: string;
  faculty: string;
  enrollmentStatus: string;
  academicYear: string;
  purpose: string;
}

class PDFService {
  private readonly VERIFICATION_BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  /**
   * Generate QR code as base64 data URL
   */
  private async generateQRCode(documentId: string): Promise<string> {
    const verificationUrl = `${this.VERIFICATION_BASE_URL}/verify/${documentId}`;
    return await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 200,
      margin: 1,
    });
  }

  /**
   * Add FTI header to document
   */
  private addHeader(doc: PDFKit.PDFDocument) {
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('UNIVERSITETI POLITEKNIK I TIRANËS', 50, 50, { align: 'center' })
      .fontSize(16)
      .text('FAKULTETI I TEKNOLOGJISË SË INFORMACIONIT', 50, 75, { align: 'center' })
      .fontSize(12)
      .font('Helvetica')
      .text('Sheshi "Nënë Tereza", Nr.4, Tiranë, Albania', 50, 100, { align: 'center' })
      .text('Tel: +355 4 2222 222 | Email: info@fti.edu.al', 50, 115, { align: 'center' })
      .moveTo(50, 135)
      .lineTo(550, 135)
      .stroke();
  }

  /**
   * Add FTI footer with QR code
   */
  private async addFooter(doc: PDFKit.PDFDocument, documentId: string, pageNumber: number = 1) {
    const qrCode = await this.generateQRCode(documentId);
    
    // Add footer line
    doc
      .moveTo(50, 720)
      .lineTo(550, 720)
      .stroke();

    // Add QR code
    doc.image(qrCode, 50, 730, { width: 60, height: 60 });

    // Add document info
    doc
      .fontSize(8)
      .font('Helvetica')
      .text('Document ID:', 120, 735)
      .font('Helvetica-Bold')
      .text(documentId, 120, 747)
      .font('Helvetica')
      .text('Scan QR code to verify authenticity', 120, 759)
      .text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 120, 771)
      .text(`Page ${pageNumber}`, 500, 750, { align: 'right' });
  }

  /**
   * Add signature section
   */
  private addSignatureSection(doc: PDFKit.PDFDocument, yPosition: number) {
    const leftX = 100;
    const rightX = 350;

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('_____________________', leftX, yPosition)
      .text('Dean Signature', leftX, yPosition + 20, { width: 150, align: 'center' })
      .text('_____________________', rightX, yPosition)
      .text('Faculty Seal', rightX, yPosition + 20, { width: 150, align: 'center' });
  }

  /**
   * Generate Certificate of Enrollment
   */
  async generateEnrollmentCertificate(data: EnrollmentCertificateData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc);

        // Title
        doc
          .moveDown(3)
          .fontSize(18)
          .font('Helvetica-Bold')
          .text('CERTIFICATE OF ENROLLMENT', { align: 'center' })
          .moveDown(2);

        // Content
        doc
          .fontSize(12)
          .font('Helvetica')
          .text('This is to certify that:', { align: 'center' })
          .moveDown(1)
          .fontSize(16)
          .font('Helvetica-Bold')
          .text(data.studentName.toUpperCase(), { align: 'center' })
          .moveDown(0.5)
          .fontSize(12)
          .font('Helvetica')
          .text(`Student ID: ${data.studentId}`, { align: 'center' })
          .moveDown(2)
          .text('is currently enrolled as a full-time student in:', { align: 'center' })
          .moveDown(1)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(data.program, { align: 'center' })
          .moveDown(0.5)
          .fontSize(12)
          .font('Helvetica')
          .text(data.faculty, { align: 'center' })
          .moveDown(2)
          .text(`Academic Year: ${data.academicYear}`, { align: 'center' })
          .text(`Current Semester: ${data.semester}`, { align: 'center' })
          .text(`Enrollment Date: ${data.enrollmentDate.toLocaleDateString('en-GB')}`, { align: 'center' })
          .moveDown(2)
          .text('This certificate is issued for official purposes.', { align: 'center' })
          .moveDown(1)
          .fontSize(10)
          .text(`Issue Date: ${data.generatedDate.toLocaleDateString('en-GB')}`, { align: 'center' });

        // Signature section
        this.addSignatureSection(doc, 580);

        // Footer with QR code
        await this.addFooter(doc, data.documentId);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Transcript
   */
  async generateTranscript(data: TranscriptData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc);

        // Title
        doc
          .moveDown(2)
          .fontSize(18)
          .font('Helvetica-Bold')
          .text('OFFICIAL TRANSCRIPT', { align: 'center' })
          .moveDown(1);

        // Student Info
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Student Information', 50, 180)
          .font('Helvetica')
          .fontSize(11)
          .text(`Name: ${data.studentName}`, 50, 200)
          .text(`Student ID: ${data.studentId}`, 50, 215)
          .text(`Program: ${data.program}`, 50, 230)
          .text(`Faculty: ${data.faculty}`, 50, 245)
          .moveDown(1);

        // Academic Performance
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Academic Performance', 50, 275)
          .font('Helvetica')
          .fontSize(11)
          .text(`GPA: ${data.gpa.toFixed(2)}`, 50, 295)
          .text(`Total Credits: ${data.totalCredits}`, 200, 295)
          .text(`Completed Credits: ${data.completedCredits}`, 350, 295)
          .moveDown(1);

        // Grades Table
        const tableTop = 330;
        const tableLeft = 50;
        
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Subject', tableLeft, tableTop)
          .text('Grade', tableLeft + 250, tableTop)
          .text('Credits', tableLeft + 320, tableTop)
          .text('Semester', tableLeft + 400, tableTop);

        doc
          .moveTo(tableLeft, tableTop + 15)
          .lineTo(550, tableTop + 15)
          .stroke();

        let yPosition = tableTop + 25;
        doc.font('Helvetica').fontSize(9);

        data.grades.forEach((grade) => {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }

          doc
            .text(grade.subject, tableLeft, yPosition, { width: 240 })
            .text(grade.grade.toString(), tableLeft + 250, yPosition)
            .text(grade.credits.toString(), tableLeft + 320, yPosition)
            .text(grade.semester, tableLeft + 400, yPosition);

          yPosition += 20;
        });

        // Summary
        doc
          .moveDown(2)
          .fontSize(10)
          .font('Helvetica')
          .text(`Issue Date: ${data.generatedDate.toLocaleDateString('en-GB')}`, 50, yPosition + 30, { align: 'center' });

        // Signature section
        this.addSignatureSection(doc, yPosition + 70);

        // Footer with QR code
        await this.addFooter(doc, data.documentId);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Participation Certificate
   */
  async generateParticipationCertificate(data: ParticipationCertificateData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc);

        // Title
        doc
          .moveDown(3)
          .fontSize(18)
          .font('Helvetica-Bold')
          .text('CERTIFICATE OF PARTICIPATION', { align: 'center' })
          .moveDown(2);

        // Content
        const attendancePercentage = ((data.hoursAttended / data.totalHours) * 100).toFixed(1);

        doc
          .fontSize(12)
          .font('Helvetica')
          .text('This is to certify that:', { align: 'center' })
          .moveDown(1)
          .fontSize(16)
          .font('Helvetica-Bold')
          .text(data.studentName.toUpperCase(), { align: 'center' })
          .moveDown(0.5)
          .fontSize(12)
          .font('Helvetica')
          .text(`Student ID: ${data.studentId}`, { align: 'center' })
          .moveDown(2)
          .text('has successfully participated in:', { align: 'center' })
          .moveDown(1)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(data.courseName, { align: 'center' })
          .moveDown(0.5)
          .fontSize(12)
          .font('Helvetica')
          .text(`Course Code: ${data.courseCode}`, { align: 'center' })
          .moveDown(2)
          .text(`Instructor: ${data.pedagogueName}`, { align: 'center' })
          .text(`Semester: ${data.semester}`, { align: 'center' })
          .text(`Academic Year: ${data.academicYear}`, { align: 'center' })
          .moveDown(2)
          .text(`Attendance: ${data.hoursAttended}/${data.totalHours} hours (${attendancePercentage}%)`, { align: 'center' })
          .moveDown(2)
          .fontSize(10)
          .text(`Issue Date: ${data.generatedDate.toLocaleDateString('en-GB')}`, { align: 'center' });

        // Signature section
        this.addSignatureSection(doc, 580);

        // Footer with QR code
        await this.addFooter(doc, data.documentId);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Student Verification Letter
   */
  async generateVerificationLetter(data: VerificationLetterData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc);

        // Title
        doc
          .moveDown(3)
          .fontSize(18)
          .font('Helvetica-Bold')
          .text('STUDENT VERIFICATION LETTER', { align: 'center' })
          .moveDown(2);

        // Content
        doc
          .fontSize(12)
          .font('Helvetica')
          .text('To Whom It May Concern,', 50, 220)
          .moveDown(2)
          .text(`This is to verify that ${data.studentName} (Student ID: ${data.studentId}) is a registered student at the Faculty of Information Technology, Polytechnic University of Tirana.`, 50, undefined, { align: 'justify', width: 500 })
          .moveDown(1)
          .text(`Program: ${data.program}`, 50)
          .text(`Faculty: ${data.faculty}`, 50)
          .text(`Enrollment Status: ${data.enrollmentStatus}`, 50)
          .text(`Academic Year: ${data.academicYear}`, 50)
          .moveDown(2)
          .text(`Purpose: ${data.purpose}`, 50, undefined, { align: 'justify', width: 500 })
          .moveDown(2)
          .text('This letter is issued upon the student\'s request for official purposes.', 50, undefined, { align: 'justify', width: 500 })
          .moveDown(2)
          .text(`Should you require any further information, please do not hesitate to contact our office.`, 50, undefined, { align: 'justify', width: 500 })
          .moveDown(2)
          .text('Sincerely,', 50)
          .moveDown(3)
          .fontSize(10)
          .text(`Issue Date: ${data.generatedDate.toLocaleDateString('en-GB')}`, 50);

        // Signature section
        this.addSignatureSection(doc, 580);

        // Footer with QR code
        await this.addFooter(doc, data.documentId);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Upload PDF to MinIO and return file path
   */
  async uploadDocument(buffer: Buffer, documentId: string, documentType: string): Promise<string> {
    const fileName = `documents/${documentType}/${documentId}.pdf`;
    await uploadFile(fileName, buffer, 'application/pdf');
    return fileName;
  }

  /**
   * Get presigned download URL for document
   */
  async getDownloadUrl(filePath: string, expirySeconds: number = 3600): Promise<string> {
    return await getPresignedUrl(filePath, expirySeconds);
  }
}

export const pdfService = new PDFService();
