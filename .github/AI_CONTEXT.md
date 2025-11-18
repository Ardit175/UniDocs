# AI Context - UniDocs Project

> **Purpose**: This file provides comprehensive context for AI assistants working on this project. Read this first before making any changes.

## Quick Project Overview

**UniDocs** is a document management system for FTI (Faculty of Information Technology) students and pedagogues. Students generate academic documents (certificates, transcripts), pedagogues issue participation certificates, and anyone can verify documents via QR codes.

**Status**: MVP Complete ✅  
**Stack**: Node.js + Express + PostgreSQL + React + TypeScript + Docker

---

## Essential Files to Read First

When starting a new conversation, reference these files in order:

1. **MVP.md** - Complete MVP specification, features, architecture, and current status
2. **README.md** - Setup instructions, tech stack, API endpoints
3. **PROJECT_STATUS.md** - Implementation checklist and what's done
4. **.github/copilot-instructions.md** - Development guidelines and conventions
5. **This file** - For architectural decisions and context

---

## Project Structure

```
IngSofti/
├── backend/              # Express.js API (TypeScript)
│   ├── src/
│   │   ├── server.ts    # Entry point (PORT: 3001)
│   │   ├── database/    # PostgreSQL schema & connection
│   │   ├── middleware/  # auth.ts, errorHandler.ts, rateLimiter.ts
│   │   ├── routes/      # 6 route files (auth, student, pedagogue, admin, document, verification)
│   │   ├── services/    # pdf.service.ts, minio.service.ts
│   │   └── types/       # TypeScript interfaces
│   ├── .env            # Environment config (PORT=3001, DB connection)
│   └── Dockerfile      # Node 18 Alpine + bcrypt rebuild
│
├── frontend/            # React app (TypeScript + TailwindCSS)
│   ├── src/
│   │   ├── App.tsx     # Main router
│   │   ├── pages/      # HomePage, LoginPage, RegisterPage, Dashboards (student/pedagogue/admin), VerificationPage
│   │   ├── components/ # Button, Input, Card, DashboardLayout
│   │   ├── contexts/   # AuthContext.tsx
│   │   └── services/   # api.ts (Axios client)
│   └── vite.config.ts  # Port 3000, proxy to backend 3001
│
└── docker-compose.yml   # PostgreSQL (5432), MinIO (9000/9001)
```

---

## Key Technical Decisions

### 1. **Ports Configuration**
- **Backend**: `3001` (changed from 5000 due to conflicts)
- **Frontend**: `3000`
- **PostgreSQL**: `5432`
- **MinIO**: `9000` (API), `9001` (Console)

**Why**: Port 5000 was constantly in use. Backend runs on 3001, frontend proxies `/api` requests to it.

### 2. **Authentication**
- **Method**: JWT tokens (no refresh tokens in MVP)
- **Storage**: localStorage on frontend
- **Email restriction**: Only `@fti.edu.al` emails allowed
- **Password**: bcrypt with 10 rounds
- **Middleware**: `authenticate` and `authorize(role)` in `middleware/auth.ts`

### 3. **Database Schema** (12 tables)
```
users (id, email, password_hash, role, emri, mbiemri)
  ├── students (user_id, student_id, program_id, gpa, credits)
  ├── pedagogues (user_id, pedagog_id, department, title)
  └── (role: 'student' | 'pedagogue' | 'admin')

programs (id, name, code, faculty, degree_level)
subjects (id, code, name, credits, pedagogue_id)
enrollments (student_id, subject_id)
grades (student_id, subject_id, grade)
documents (id, document_type, student_id, file_path, status, qr_code)
verification_logs (document_id, verified_by, verification_status)
activity_logs (user_id, action, details)
system_settings (allow_student_document_generation, etc.)
```

**Important**: 6 pre-loaded programs in `schema.sql` (Computer Engineering, Software Engineering, etc.)

### 4. **Document Generation**
- **Library**: PDFKit
- **Storage**: MinIO (S3-compatible)
- **QR Codes**: `qrcode` npm package
- **Types**: 
  - Enrollment Certificate (student)
  - Academic Transcript (student)
  - Verification Letter (student, custom purpose)
  - Participation Certificate (pedagogue for students)

**Flow**: Generate PDF → Upload to MinIO → Save record in DB → Return presigned URL (1 hour expiry)

### 5. **File Structure Pattern**
```typescript
// Backend route pattern
router.get('/endpoint', authenticate, authorize('role'), async (req: AuthRequest, res) => {
  try {
    // Logic here
    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ error: 'Message' });
  }
});
```

**Critical**: Always use `return` before `res.json()` to avoid TypeScript TS7030 errors.

---

## Common Issues & Solutions

### Issue 1: TypeScript TS7030 "Not all code paths return a value"
**Solution**: Add `return` before ALL `res.json()` and `res.status().json()` calls in async route handlers.

### Issue 2: bcrypt error in Docker (Exec format error)
**Solution**: Rebuild bcrypt in Dockerfile:
```dockerfile
RUN apk add --no-cache python3 make g++
RUN npm install && npm rebuild bcrypt --build-from-source
```

### Issue 3: Port 5000 already in use
**Solution**: Changed to port 3001 in:
- `backend/.env` → `PORT=3001`
- `backend/src/server.ts` → `const PORT = process.env.PORT || 3001`
- `frontend/src/services/api.ts` → `http://localhost:3001`
- `frontend/vite.config.ts` → `target: 'http://localhost:3001'`

### Issue 4: Frontend connection reset
**Solution**: Add `host: '0.0.0.0'` in `vite.config.ts` server config.

---

## API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /register` - Body: `{ email, password, emri, mbiemri, role, program_id? }`
- `POST /login` - Body: `{ email, password }`
- `GET /me` - Headers: `Authorization: Bearer <token>`
- `GET /programs` - Public, returns study programs

### Student (`/api/students`)
- `GET /me` - Get profile (GPA, credits, semester)
- `GET /grades` - Get all grades with subjects
- `GET /subjects` - Get enrolled subjects
- `GET /statistics` - Get academic stats

### Documents (`/api/documents`)
- `POST /certificate-enrollment` - Generate enrollment certificate
- `POST /transcript` - Generate transcript
- `POST /verification-letter` - Body: `{ purpose: string }`
- `GET /documents` - Get user's documents
- `GET /documents/:id` - Get document with download URL

### Verification (`/api/verification`)
- `GET /:documentId` - Public, verify document by ID or QR code

### Pedagogue (`/api/pedagogues`)
- `GET /courses` - Get taught courses
- `GET /courses/:id/students` - Get students in course
- `POST /participation-certificate` - Generate for student

### Admin (`/api/admin`)
- `GET /users` - List all users (pagination)
- `GET /statistics` - System stats
- `PUT /documents/:id/revoke` - Revoke document
- `GET /activity-logs` - View system logs

---

## Environment Variables

### Backend `.env`
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

### Frontend `.env`
```bash
VITE_API_URL=http://localhost:3001
```

---

## Development Workflow

### Starting the project
```bash
# Terminal 1: Docker services
docker-compose up -d

# Terminal 2: Backend
cd backend
npm run dev  # Runs on 3001

# Terminal 3: Frontend
cd frontend
npm run dev  # Runs on 3000
```

### Making changes
1. Edit code in `src/` folders
2. Backend: nodemon auto-restarts
3. Frontend: Vite hot-reloads
4. Check `http://localhost:3000` for frontend
5. API at `http://localhost:3001/api`

### Database access
- **DBeaver**: Host: localhost, Port: 5432, DB: unidocs_db, User: postgres, Pass: postgres
- **Direct**: `docker exec -it unidocs_postgres psql -U postgres -d unidocs_db`

### Testing documents
1. Register at `/register` with `@fti.edu.al` email
2. Login at `/login`
3. Go to dashboard
4. Click "Generate Certificate" buttons
5. Test verification at `/verify` with document ID

---

## Code Conventions

### TypeScript
- Strict mode enabled
- Use `AuthRequest` interface for authenticated routes (has `authUser` property)
- All route handlers must return responses explicitly
- Validate inputs with Zod schemas

### React
- Functional components with hooks
- Context API for auth state
- TailwindCSS for styling (no inline styles)
- Axios for API calls (configured in `services/api.ts`)

### Database
- Use parameterized queries: `pool.query(sql, [params])`
- Never string concatenation (SQL injection risk)
- Foreign keys enforced in schema

### Error Handling
```typescript
// Backend
try {
  // logic
  return res.json({ data });
} catch (error) {
  console.error('Error message:', error);
  return res.status(500).json({ error: 'User-friendly message' });
}

// Frontend
try {
  const response = await api.get('/endpoint');
  // use response.data
} catch (error) {
  console.error('Error:', error);
  // show user error
}
```

---

## Testing Checklist

When making changes, verify:
- [ ] Backend compiles without TypeScript errors
- [ ] Frontend builds without errors
- [ ] Login/Register works with `@fti.edu.al` email
- [ ] Dashboard loads profile data
- [ ] Document generation returns PDF download
- [ ] QR code verification works on `/verify`
- [ ] Admin can see all users
- [ ] Pedagogue can see their courses

---

## Git Workflow

```bash
# Check status
git status

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature" # or "fix:", "docs:", "refactor:"

# Push to GitHub
git push origin main
```

**Commit Convention**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code restructuring
- `style:` - Formatting
- `test:` - Tests

---

## Future Enhancements (Post-MVP)

See `MVP.md` for full list. Priority items:
1. Email notifications (SMTP not configured yet)
2. Multi-language support (Albanian + English)
3. Digital signatures on PDFs
4. Document expiration dates
5. Batch document generation for admins

---

## Questions to Ask in New Conversations

To get good context quickly:

**"I'm working on the UniDocs project. Please read:**
- **.github/AI_CONTEXT.md** (this file)
- **MVP.md** for features
- **README.md** for setup

**Then [describe what you want to do]"**

This ensures the AI understands:
- Tech stack and architecture
- Ports and configuration
- Known issues and solutions
- Code conventions
- File structure

---

## Key Files That Change Frequently

- `backend/src/routes/*.routes.ts` - API endpoints
- `frontend/src/pages/**/*.tsx` - UI pages
- `backend/src/services/pdf.service.ts` - PDF generation logic
- `frontend/src/contexts/AuthContext.tsx` - Auth state
- `docker-compose.yml` - Service configuration

---

## Contact & Documentation

- **GitHub**: https://github.com/Ardit175/UniDocs
- **Backend API**: http://localhost:3001/api
- **Frontend**: http://localhost:3000
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123)

---

*Last Updated: November 2025*
*This file should be updated when major architectural decisions are made*
