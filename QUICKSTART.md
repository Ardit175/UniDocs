# 🚀 Quick Start Guide - UniDocs

## Prerequisites
- ✅ Node.js 18+ installed
- ✅ Docker Desktop installed and running
- ✅ Git installed

## Initial Setup (First Time Only)

### Option 1: Automated Setup (Recommended)
```bash
# Make sure Docker Desktop is running first!
./setup.sh
```

### Option 2: Manual Setup

**1. Start Docker Services**
```bash
# Make sure Docker Desktop is running
docker-compose up -d postgres minio
```

**2. Setup Backend**
```bash
cd backend
cp .env.example .env
npm install
```

**3. Setup Frontend**
```bash
cd frontend
npm install
```

## Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend will run on http://localhost:8001

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm run dev
```
✅ Frontend will run on http://localhost:3000

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001/api
- **API Health**: http://localhost:8001/health
- **MinIO Console**: http://localhost:9001 (Login: minioadmin / minioadmin123)

## Default Test Users (After Seeding)

### Student
- Email: student@fti.edu.al
- Password: Test123!

### Pedagogue
- Email: pedagogue@fti.edu.al
- Password: Test123!

### Admin
- Email: admin@fti.edu.al
- Password: Test123!

## Stopping the Application

**Stop Backend & Frontend:**
- Press `Ctrl + C` in each terminal

**Stop Docker Services:**
```bash
docker-compose down
```

**Stop and Remove All Data:**
```bash
docker-compose down -v
```

## Troubleshooting

### Docker not starting?
- Make sure Docker Desktop is running
- Check if ports 5432, 9000, 9001 are not in use

### Backend errors?
- Make sure PostgreSQL is running: `docker ps`
- Check .env file exists in backend folder
- Verify DATABASE_URL in .env

### Frontend can't connect to backend?
- Make sure backend is running on port 8001
- Check browser console for errors
- Verify VITE_API_URL in frontend/.env

### Database connection issues?
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres minio
```

### MinIO not working?
- Access MinIO Console at http://localhost:9001
- Login with minioadmin / minioadmin123
- Check if bucket "unidocs-documents" exists

## Useful Commands

```bash
# View Docker logs
docker-compose logs -f postgres
docker-compose logs -f minio

# Access PostgreSQL
docker exec -it unidocs_postgres psql -U postgres -d unidocs_db

# Run database migrations
cd backend && npm run migrate

# Seed database with sample data
cd backend && npm run seed

# Build for production
cd backend && npm run build
cd frontend && npm run build
```

## Next Steps

1. ✅ Complete authentication implementation
2. ✅ Create API routes for students, pedagogues, admin
3. ✅ Implement PDF generation with PDFKit
4. ✅ Add QR code generation and verification
5. ✅ Build dashboard UIs
6. ✅ Add form validation with Zod
7. ✅ Implement file upload/download with MinIO

## Development Workflow

1. Create a new branch for your feature
2. Make changes
3. Test locally
4. Commit and push
5. Create pull request

## Getting Help

- Check README.md for detailed documentation
- Review backend/README.md for API details
- Review frontend/README.md for UI components
- Check docker-compose.yml for service configuration

---

**Happy Coding! 🎉**
