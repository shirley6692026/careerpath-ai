#!/bin/bash
# CareerPath AI v3.1 Production Server
# Serves frontend build + backend API on localhost

echo "🚀 CareerPath AI v3.1 Production Mode"

# Start backend
cd /Users/samuel/.openclaw/workspace/careerpath-ai/backend
echo "Starting backend on :8000..."
python3 main.py &
BACKEND_PID=$!

# Start frontend preview (serves built dist/)
cd /Users/samuel/.openclaw/workspace/careerpath-ai/frontend
echo "Starting frontend on :4173..."
npx vite preview --port 4173 --host 0.0.0.0 &
FRONTEND_PID=$!

echo "✅ Backend: http://localhost:8000"
echo "✅ Frontend: http://localhost:4173"
echo "✅ API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
