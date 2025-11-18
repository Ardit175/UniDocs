# UniDocs - University Document Management System

UniDocs is a full-stack document management system for university students and pedagogues at FTI (Faculty of Information Technology), University Polytechnic of Tirana.

## 🚀 Features

### For Students
- 📄 Generate certificates (enrollment, completion, participation)
- 📊 View and download unofficial transcripts
- 📈 Monitor GPA and academic progress
- 🔍 View document history
- ✅ Verify documents via QR code

### For Pedagogues
- 👥 View student lists for courses
- 📜 Generate participation certificates
- 📊 Export grade reports
- 📈 View course statistics

### For Administrators
- 👤 Manage users (students, pedagogues)
- 📊 System monitoring and reports
- ⚙️ Configure system settings

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Storage**: MinIO (S3-compatible)
- **Authentication**: JWT
- **PDF Generation**: PDFKit
- **QR Codes**: qrcode
- **Validation**: Zod

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: Context API
- **Form Handling**: React Hook Form
- **Validation**: Zod

## 📁 Project Structure

```
IngSofti/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── server.ts    # Entry point
│   │   ├── database/    # Database schema and migrations
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   ├── controllers/ # Request handlers
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utilities
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/            # React application
│   ├── src/
│   │   ├── App.tsx     # Main app component
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   ├── contexts/   # React contexts
│   │   ├── hooks/      # Custom hooks
│   │   ├── services/   # API services
│   │   └── utils/      # Utilities
│   ├── package.json
│   └── tsconfig.json
│
├── shared/             # Shared types and utilities
│   └── types/
│
└── docker-compose.yml  # Docker services configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd IngSofti
```

### 2. Setup Environment Variables

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and update the values as needed.

**Frontend** (`frontend/.env`):
```bash
# Create frontend/.env
VITE_API_URL=http://localhost:8001
```

### 3. Start Docker Services
```bash
# Start PostgreSQL and MinIO
docker-compose up -d postgres minio

# Wait for services to be ready (about 10 seconds)
```

### 4. Access MinIO Console
- Open http://localhost:9001
- Login: `minioadmin` / `minioadmin123`
- Create bucket named `unidocs-documents` (if not auto-created)

### 5. Install Dependencies

**Backend**:
```bash
cd backend
npm install
```

**Frontend**:
```bash
cd frontend
npm install
```

### 6. Run the Application

**Backend** (in backend folder):
```bash
npm run dev
```
The backend will run on http://localhost:8001

**Frontend** (in frontend folder):
```bash
npm run dev
```
The frontend will run on http://localhost:3000

## 📊 Database Setup

The database schema is automatically created when PostgreSQL starts via Docker. The schema file is located at:
```
backend/src/database/schema.sql
```

To manually run migrations:
```bash
cd backend
npm run migrate
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Students
- `GET /api/students/me` - Get student profile
- `PUT /api/students/me` - Update profile
- `GET /api/students/:id/grades` - Get grades

### Documents
- `POST /api/documents/certificate-enrollment` - Generate enrollment certificate
- `POST /api/documents/transcript` - Generate transcript
- `GET /api/documents/history` - Get document history
- `GET /api/documents/:id/download` - Download document

### Verification
- `GET /api/verification/:documentId` - Verify document

### Pedagogues
- `GET /api/pedagogues/courses` - Get courses
- `GET /api/pedagogues/courses/:id/students` - Get student list
- `POST /api/pedagogues/certificates` - Generate certificates

### Admin
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `GET /api/admin/stats` - System statistics

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🏗️ Building for Production

**Backend**:
```bash
cd backend
npm run build
npm start
```

**Frontend**:
```bash
cd frontend
npm run build
npm run preview
```

## 📝 Development Guidelines

1. **TypeScript Strict Mode**: Always enabled
2. **Code Style**: Use ESLint and Prettier
3. **Commits**: Use conventional commits
4. **API Design**: Follow RESTful conventions
5. **Validation**: Always validate inputs with Zod
6. **Error Handling**: Use try-catch and proper error responses
7. **Documentation**: Add JSDoc comments for complex functions

## 🔒 Security

- All passwords are hashed with bcrypt (10 rounds)
- JWT tokens with 24h expiry
- Rate limiting on auth endpoints
- CORS properly configured
- Input validation with Zod
- SQL injection prevention with parameterized queries

## 📦 Docker Services

- **PostgreSQL**: Port 5432
- **MinIO**: Port 9000 (API), 9001 (Console)
- **Backend**: Port 8001
- **Frontend**: Port 3000

To stop all services:
```bash
docker-compose down
```

To reset database:
```bash
docker-compose down -v
docker-compose up -d
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## 📄 License

MIT License

## 👥 Team

Faculty of Information Technology
University Polytechnic of Tirana

---

For more information, visit the project documentation or contact the development team.
