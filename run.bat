@echo off
echo Starting Digital Passport System...
start cmd /k "cd backend && npm install && node server.js"
start cmd /k "cd frontend && npm install && npm run dev"
echo Backend and Frontend have been started in separate terminals!
