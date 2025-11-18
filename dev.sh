#!/bin/bash

echo "🚀 Starting UniDocs Development Servers"
echo "======================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Starting Docker services..."
  docker-compose up -d postgres minio
  echo "⏳ Waiting for services to be ready..."
  sleep 10
fi

# Check if services are running
if ! docker ps | grep -q unidocs_postgres; then
  echo "🐳 Starting PostgreSQL..."
  docker-compose up -d postgres
fi

if ! docker ps | grep -q unidocs_minio; then
  echo "🐳 Starting MinIO..."
  docker-compose up -d minio
fi

echo ""
echo "✅ Docker services are running"
echo ""
echo "📦 Starting Backend and Frontend..."
echo ""

# Function to cleanup on exit
cleanup() {
  echo ""
  echo "🛑 Stopping development servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

trap cleanup INT TERM

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend in background  
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Servers started!"
echo ""
echo "📍 Access points:"
echo "  - Frontend:      http://localhost:3000"
echo "  - Backend API:   http://localhost:8001"
echo "  - MinIO Console: http://localhost:9001"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
