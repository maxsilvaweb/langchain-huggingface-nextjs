#!/bin/bash

# Start Convex dev server in the background
echo "Starting Convex..."
npx convex dev &
CONVEX_PID=$!

# Start Python FastAPI service
echo "Starting Python Service..."
cd python-service
export PYTHONPATH=$PYTHONPATH:.
./venv/bin/uvicorn main:app --port 8000 --reload --reload-dir . &
PYTHON_PID=$!

# Keep the script running to monitor processes
echo "Services started (Convex PID: $CONVEX_PID, Python PID: $PYTHON_PID)"
echo "Press CTRL+C to stop both services."
trap "kill $CONVEX_PID $PYTHON_PID" EXIT
wait
