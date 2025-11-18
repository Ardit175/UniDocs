#!/bin/bash

echo "🚀 UniDocs Setup Script"
echo "======================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop first."
  exit 1
fi

echo "✅ Docker is running"
echo ""

# Create .env file for backend if it doesn't exist
if [ ! -f backend/.env ]; then
  echo "📝 Creating backend .env file..."
  cp backend/.env.example backend/.env
  echo "✅ Backend .env created"
else
  echo "✅ Backend .env already exists"
fi

echo ""
echo "🐳 Starting Docker services (PostgreSQL and MinIO)..."
docker-compose up -d postgres minio

echo ""
echo "⏳ Waiting for services to be ready (15 seconds)..."
sleep 15

echo ""
echo "✅ Docker services started!"
echo ""
echo "📦 Services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - MinIO API: localhost:9000"
echo "  - MinIO Console: http://localhost:9001"
echo "    Login: minioadmin / minioadmin123"
echo ""

# Check if node_modules exist, if not install
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend && npm install && cd ..
  echo "✅ Backend dependencies installed"
else
  echo "✅ Backend dependencies already installed"
fi

echo ""

if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install && cd ..
  echo "✅ Frontend dependencies installed"
else
  echo "✅ Frontend dependencies already installed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Start the backend:  cd backend && npm run dev"
echo "2. Start the frontend: cd frontend && npm run dev"
echo "3. Access the app at:  http://localhost:3000"
echo ""
echo "🔍 To verify documents, scan QR codes or visit: http://localhost:3000/verify"
echo ""
