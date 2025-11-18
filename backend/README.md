# Backend API

This is the Express.js backend for UniDocs.

## Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Install dependencies:
```bash
npm install
```

3. Start PostgreSQL and MinIO (from root):
```bash
docker-compose up -d postgres minio
```

4. Run in development mode:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8001/api-docs
- Health check: http://localhost:8001/health

## Project Structure

```
src/
├── server.ts          # Entry point
├── database/          # Database schema and migrations
├── middleware/        # Express middleware (auth, error handling, etc.)
├── routes/            # API route definitions
├── controllers/       # Request handlers
├── services/          # Business logic
├── utils/             # Helper functions
└── types/             # TypeScript type definitions
```

## Environment Variables

See `.env.example` for required environment variables.

## Database

The database schema is automatically created when PostgreSQL container starts. The schema file is in `src/database/schema.sql`.
