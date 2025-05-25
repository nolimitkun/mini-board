#!/bin/bash

# Cloud VM Comparison - Development Startup Script
# This script starts both the backend API and frontend development server

echo "🚀 Starting Cloud VM Comparison Development Environment"
echo "=================================================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "   ✅ Backend API stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "   ✅ Frontend server stopped"
    fi
    echo "👋 Goodbye!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo ""
echo "📦 Installing/checking backend dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
cd ..

echo ""
echo "🔧 Starting backend API server..."
echo "   URL: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"


source backend/venv/bin/activate && python3 backend/main.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

echo ""
echo "📦 Installing/checking frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "   Installing npm packages..."
    npm install > /dev/null 2>&1
fi

echo ""
echo "🎨 Starting frontend development server..."
echo "   URL: http://localhost:3000"
npm start &
FRONTEND_PID=$!

cd ..

echo ""
echo "✅ Both services are starting up!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/docs"
echo ""
echo "📝 Logs will appear below. Press Ctrl+C to stop all services."
echo "=================================================="
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
