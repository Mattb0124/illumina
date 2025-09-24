# Illumina - Useful Commands Reference

## 🚀 Quick Start Commands

```bash
# Start everything (frontend + backend)
npm run dev

# Start frontend only (port 3000)
cd frontend && npm run dev

# Start backend only (port 3001)
cd backend && npm run dev

# Build everything
npm run build

# Start in production mode
npm start
```

## 📦 Development Commands

### Frontend Commands
```bash
# Navigate to frontend
cd frontend

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type checking (TypeScript)
npx tsc --noEmit
```

### Backend Commands
```bash
# Navigate to backend
cd backend

# Start development server with auto-reload (port 3001)
npm run dev

# Start production server
npm start

# Watch for file changes (development)
nodemon src/index.js
```

### Monorepo Commands (from root)
```bash
# Install all dependencies (frontend + backend)
npm install

# Start both frontend and backend
npm run dev

# Start frontend only
npm run dev:frontend

# Start backend only
npm run dev:backend

# Build both applications
npm run build

# Start both in production
npm start
```

## 🗄️ Database Commands

### PostgreSQL Setup
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
createdb illumina_dev

# Connect to database
psql -U postgres -d illumina_dev

# With password
PGPASSWORD='Rockyb!234w1' psql -h localhost -p 5432 -U postgres -d illumina_dev
```

### Migration Commands
```bash
# Navigate to backend first
cd backend

# Run all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate:create -- migration-name

# Setup database (migrations + seed)
npm run db:setup

# Reset database (drop, recreate, seed)
npm run db:reset

# Seed sample studies
npm run seed:studies
```

## 🔧 Process Management

### Kill Processes by Port
```bash
# Kill process on specific port
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend

# Kill multiple ports at once
lsof -ti:3000,3001,3002 | xargs kill -9

# Find what's running on a port
lsof -i:3000
```

### Kill Processes by Name
```bash
# Kill all npm processes
pkill -f "npm"

# Kill all node processes
pkill -f "node"

# Kill all nodemon processes
pkill -f "nodemon"

# Kill specific npm script
pkill -f "npm run dev"
```

### Check Running Processes
```bash
# See all node processes
ps aux | grep node

# See all npm processes
ps aux | grep npm

# See what's using ports
netstat -vanp tcp | grep 3000
```

## 🌿 Git Commands

### Basic Operations
```bash
# Check status
git status

# Add all changes
git add -A
# or
git add .

# Commit with message
git commit -m "Your message here"

# Push to remote
git push origin main

# Pull latest changes
git pull origin main
```

### Branching
```bash
# Create and switch to new branch
git checkout -b feature/branch-name

# Switch branches
git checkout main

# List branches
git branch -a

# Delete local branch
git branch -d branch-name

# Delete remote branch
git push origin --delete branch-name
```

### History and Diffs
```bash
# View commit history
git log --oneline -10

# View file changes
git diff
git diff --staged  # for staged changes

# View specific commit
git show commit-hash

# Reset changes
git reset --hard HEAD  # Discard all changes
git reset HEAD~1      # Undo last commit
```

## 🔐 Authentication & Environment

### Environment Variables
```bash
# Copy example env file
cp backend/.env.example backend/.env

# Edit environment variables
nano backend/.env
# or
code backend/.env

# Required variables:
# DATABASE_URL=postgresql://user:password@localhost:5432/illumina_dev
# JWT_SECRET=your-secret-key
# OPENAI_API_KEY=sk-...
# NODE_ENV=development
# PORT=3001
```

### JWT Testing
```bash
# Generate a random JWT secret
openssl rand -base64 32

# Test authentication endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Test protected endpoint with token
curl http://localhost:3001/api/ai/generate-study \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🤖 AI Workflow Commands

### Testing AI Generation
```bash
# Test AI workflow endpoint (requires auth)
curl -X POST http://localhost:3001/api/ai/generate-study \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userRequest": "Create a 7-day study on faith",
    "title": "Foundations of Faith",
    "topic": "Faith",
    "duration": "7 days",
    "studyStyle": "devotional",
    "difficulty": "beginner",
    "audience": "individual"
  }'

# Check generation status
curl http://localhost:3001/api/ai/generation-status/REQUEST_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get generated study
curl http://localhost:3001/api/ai/generated-study/REQUEST_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Managing AI Dependencies
```bash
# Install AI packages (if needed)
cd backend
npm install @langchain/openai @langchain/langgraph @langchain/core

# Check if AI is enabled
grep AI_WORKFLOW_ENABLED backend/.env

# Enable/disable AI workflow
# Edit backend/.env and set:
# AI_WORKFLOW_ENABLED=true  # or false
```

## 🐛 Troubleshooting

### Common Fixes
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset database
cd backend && npm run db:reset

# Fix port already in use
lsof -ti:3000,3001 | xargs kill -9

# Fix nodemon crashes
pkill -f nodemon
cd backend && npm run dev

# Fix TypeScript errors
cd frontend && npx tsc --noEmit
```

### Debug Commands
```bash
# Check Node version
node --version  # Should be >= 18.0.0

# Check npm version
npm --version   # Should be >= 9.0.0

# Check PostgreSQL connection
psql -U postgres -c "SELECT 1"

# Test API health
curl http://localhost:3001/api/health

# Check frontend build
cd frontend && npm run build

# View logs
# Backend logs appear in terminal running npm run dev
# Frontend logs appear in browser console (F12)
```

### ES Module Issues
```bash
# If you see ES module errors in backend:
# 1. Check that all imports use require() not import
# 2. Ensure package.json doesn't have "type": "module"
# 3. Clear node cache:
rm -rf node_modules/.cache
npm run dev
```

## 📊 Monitoring & Logs

### View Logs
```bash
# Follow backend logs
cd backend && npm run dev

# View PostgreSQL logs (Mac)
tail -f /usr/local/var/log/postgresql@14.log

# View npm debug logs
cat ~/.npm/_logs/latest-debug.log
```

### API Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Test studies endpoint
curl http://localhost:3001/api/studies

# Test with pretty JSON
curl http://localhost:3001/api/health | python3 -m json.tool
```

## 🎯 Most Used Commands

```bash
# Start development
npm run dev

# Kill all servers
lsof -ti:3000,3001 | xargs kill -9

# Restart backend after changes
cd backend && npm run dev

# Check git status
git status

# Run database migrations
cd backend && npm run migrate:up

# View backend logs (when running)
# Logs appear in the terminal where npm run dev is running

# Quick commit and push
git add -A && git commit -m "Update" && git push origin main
```

## 📝 Notes

- Frontend runs on port 3000 by default
- Backend API runs on port 3001 by default
- Database should be PostgreSQL on port 5432
- All API endpoints are prefixed with `/api`
- Authentication uses JWT tokens in Authorization header
- Environment variables are in `backend/.env`
- Frontend accesses backend at `http://localhost:3001/api`