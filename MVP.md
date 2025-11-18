# UniDocs MVP - Minimum Viable Product

## 📋 Overview

UniDocs MVP is a document management system for FTI (Faculty of Information Technology) students and pedagogues. The system enables automated generation, storage, and verification of academic documents.

**Version**: 1.0.0  
**Status**: MVP Complete  
**Date**: November 2025

---

## 🎯 MVP Scope

### Core Features Implemented

#### 1. **User Authentication & Authorization**
- ✅ Registration for students and pedagogues (email must be @fti.edu.al)
- ✅ Login with JWT token authentication
- ✅ Role-based access control (Student, Pedagogue, Admin)
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on authentication endpoints

#### 2. **Document Generation**
Students can generate:
- ✅ **Enrollment Certificate** - Confirms active student status
- ✅ **Academic Transcript** - Shows all grades, courses, and GPA
- ✅ **Verification Letter** - Custom purpose verification document

Pedagogues can generate:
- ✅ **Participation Certificate** - For students in their courses

All documents include:
- FTI branding and official header
- QR code for verification
- Unique document ID
- Generation timestamp
- Stored securely in MinIO S3-compatible storage

#### 3. **Document Verification**
- ✅ Public verification page (no login required)
- ✅ QR code scanning support
- ✅ Document ID manual entry
- ✅ Shows document authenticity, student info, and generation details
- ✅ Verification logging for audit trail

#### 4. **User Dashboards**

**Student Dashboard:**
- ✅ Profile information (GPA, credits, semester)
- ✅ Quick document generation buttons
- ✅ Document history with download links
- ✅ Statistics overview

**Pedagogue Dashboard:**
- ✅ List of courses taught
- ✅ Student list per course
- ✅ Certificate generation for students
- ✅ Teaching statistics

**Admin Dashboard:**
- ✅ User management (view, edit, deactivate)
- ✅ System statistics (users, documents, verifications)
- ✅ Document management and revocation
- ✅ Activity logs monitoring
- ✅ System settings configuration

#### 5. **Database & Storage**
- ✅ PostgreSQL database with 12 tables
- ✅ MinIO for PDF file storage
- ✅ Proper foreign keys and relationships
- ✅ 6 pre-loaded study programs

---

## 🏗️ System Architecture

### Technology Stack

**Backend:**
- Node.js 18+ with Express.js
- TypeScript 5.3
- PostgreSQL 15
- MinIO (S3-compatible storage)
- JWT authentication
- PDFKit for PDF generation
- QRCode library
- Zod for validation

**Frontend:**
- React 18 with TypeScript
- Vite build tool
- TailwindCSS for styling
- React Router v6
- Axios for API calls
- Context API for state management

**Infrastructure:**
- Docker Compose for services
- PostgreSQL container
- MinIO container

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│              (React + TailwindCSS)                       │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP/HTTPS
                  │
┌─────────────────▼───────────────────────────────────────┐
│              Express.js Backend                          │
│  ┌─────────────┬──────────────┬──────────────────┐     │
│  │   Routes    │  Middleware  │    Services      │     │
│  │  (REST API) │  (Auth, CORS)│  (PDF, MinIO)    │     │
│  └─────────────┴──────────────┴──────────────────┘     │
└─────────────┬───────────────────┬────────────────────────┘
              │                   │
     ┌────────▼────────┐   ┌─────▼──────────┐
     │   PostgreSQL    │   │     MinIO      │
     │   (Database)    │   │  (File Storage)│
     └─────────────────┘   └────────────────┘
```

---

## 📊 Database Schema

### Core Tables (12 Total)

1. **users** - All system users (students, pedagogues, admins)
2. **students** - Student-specific data (student_id, GPA, credits)
3. **pedagogues** - Pedagogue-specific data (department, title)
4. **programs** - Study programs (6 pre-loaded)
5. **subjects** - Courses/subjects
6. **enrollments** - Student course enrollments
7. **grades** - Student grades
8. **documents** - Generated document records
9. **verification_logs** - Document verification audit trail
10. **activity_logs** - System activity logging
11. **system_settings** - Configuration settings
12. **sessions** - User session management

---

## 🔐 Security Features

- **Password Security**: bcrypt hashing (10 rounds)
- **Authentication**: JWT tokens with 24h expiry
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Zod schema validation on all endpoints
- **SQL Injection Prevention**: Parameterized queries
- **CORS**: Configured for frontend origin only
- **XSS Protection**: Helmet.js middleware

---

## 📄 Document Types

### 1. Enrollment Certificate (Certifikata e Regjistrimit)
**Generated by**: Student  
**Contains**:
- Student name and ID
- Program and faculty
- Enrollment date
- Current semester
- Academic year
- QR code for verification

**Use cases**: Bank applications, visa applications, student discounts

### 2. Academic Transcript (Transkripta Akademike)
**Generated by**: Student  
**Contains**:
- Complete grade history
- Course codes and names
- Credits per course
- Semester and academic year
- Overall GPA
- Total and completed credits
- Professor names

**Use cases**: Job applications, master's applications, university transfers

### 3. Verification Letter (Letër Verifikimi)
**Generated by**: Student  
**Contains**:
- Student verification
- Custom purpose (specified by student)
- Student details
- Program information
- Valid date

**Use cases**: Internship applications, competitions, custom verifications

### 4. Participation Certificate (Certifikata e Pjesëmarrjes)
**Generated by**: Pedagogue  
**Contains**:
- Student name and ID
- Course/activity name
- Pedagogue name
- Participation period
- Optional assessment/comments

**Use cases**: Course completion, seminar participation, project involvement

---

## 🔄 User Workflows

### Student Workflow
```
1. Register with @fti.edu.al email → Select program
2. Login to system
3. View dashboard (profile, GPA, credits)
4. Generate documents:
   - Click "Generate Enrollment Certificate"
   - Click "Generate Transcript"
   - Click "Generate Verification Letter" (specify purpose)
5. Download PDF documents
6. Share QR code for verification
```

### Pedagogue Workflow
```
1. Login to system
2. View courses taught
3. View students in each course
4. Generate participation certificate:
   - Select student
   - Select course
   - Add optional notes
5. Download certificate
```

### Admin Workflow
```
1. Login to system
2. Monitor system statistics
3. Manage users (activate/deactivate)
4. View all documents
5. Revoke documents if needed
6. Check activity logs
7. Configure system settings
```

### Public Verification Workflow
```
1. Navigate to /verify page
2. Scan QR code OR enter document ID
3. View verification result:
   - ✅ Valid: Shows document details
   - ❌ Invalid: Shows error message
```

---

## 🚀 Deployment Configuration

### Ports
- **Backend API**: 3001
- **Frontend**: 3000
- **PostgreSQL**: 5432
- **MinIO API**: 9000
- **MinIO Console**: 9001

### Environment Variables

**Backend** (`.env`):
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/unidocs_db
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=unidocs-documents
```

**Frontend** (`.env`):
```bash
VITE_API_URL=http://localhost:3001
```

---

## 📈 Current Limitations & Known Issues

### MVP Limitations
1. **Single Language**: Only English (Albanian translations needed)
2. **Email System**: Not implemented (email notifications planned)
3. **Document Templates**: Fixed templates (customization planned)
4. **Batch Operations**: No bulk document generation
5. **Advanced Search**: Basic filtering only
6. **Mobile Optimization**: Responsive but not native mobile app

### Known Issues
1. Document generation takes 2-3 seconds (PDF rendering)
2. No document expiration dates
3. No digital signatures on PDFs
4. Limited analytics on admin dashboard

---

## 🔮 Future Enhancements (Post-MVP)

### Phase 2 Features
- [ ] Email notifications for document generation
- [ ] Multi-language support (Albanian/English)
- [ ] Document templates customization
- [ ] Digital signatures for documents
- [ ] Document expiration dates
- [ ] Advanced analytics dashboard
- [ ] Batch document generation for admins
- [ ] Mobile app (React Native)

### Phase 3 Features
- [ ] Integration with university ERP system
- [ ] Automated grade import
- [ ] Payment integration for document fees
- [ ] API for external integrations
- [ ] Advanced reporting tools
- [ ] Student self-service grade requests

---

## 🧪 Testing Status

### Backend Tests
- ✅ Authentication routes
- ✅ Document generation
- ✅ Database connections
- ⏳ Integration tests (in progress)

### Frontend Tests
- ✅ Component rendering
- ✅ User interactions
- ⏳ E2E tests (planned)

---

## 📊 Success Metrics

### Target Metrics (3 months post-launch)
- **Users**: 500+ registered students
- **Documents Generated**: 1,000+ documents
- **Verification Rate**: 80% of documents verified at least once
- **Uptime**: 99.5%
- **Response Time**: < 2s for document generation

### Current Status
- **Backend**: ✅ Fully functional
- **Frontend**: ✅ Fully functional
- **Database**: ✅ Schema deployed
- **Storage**: ✅ MinIO configured
- **Testing**: ⏳ In progress
- **Documentation**: ✅ Complete

---

## 🛠️ Development & Deployment

### Development Setup
```bash
# Clone repository
git clone <repository-url>
cd IngSofti

# Start Docker services
docker-compose up -d

# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Production Deployment
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Serve dist folder with nginx or similar
```

---

## 📞 Support & Contact

For issues, questions, or feature requests:
- **GitHub Issues**: [Repository Issues]
- **Email**: support@fti.edu.al
- **Documentation**: See README.md

---

## ✅ MVP Completion Checklist

- [x] User authentication and authorization
- [x] Student document generation (3 types)
- [x] Pedagogue certificate generation
- [x] Document verification system
- [x] User dashboards (Student, Pedagogue, Admin)
- [x] Database schema and migrations
- [x] File storage with MinIO
- [x] PDF generation with QR codes
- [x] Modern responsive UI
- [x] API documentation
- [x] Security implementation
- [x] Docker containerization
- [x] Error handling and logging

**MVP Status**: ✅ **COMPLETE AND READY FOR TESTING**

---

*Last Updated: November 2025*
