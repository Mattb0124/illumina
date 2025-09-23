# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

**Illumina** is a comprehensive Bible study platform built as a monorepo containing:
- **Frontend**: Next.js 14 with App Router and TypeScript (`frontend/`)
- **Backend**: Node.js with Express API server and PostgreSQL database (`backend/`)
- **Shared**: Common TypeScript types and constants (`shared/`)

The platform enables users to create accounts, browse, start, and track progress through structured Bible study series with daily devotionals, weekly studies, topical studies, and marriage-focused content. Features include JWT authentication, user management, and persistent study data storage. The project uses npm workspaces for dependency management.

## Development Commands

### Starting Development Environment
```bash
npm run dev                 # Start both frontend (port 3000) and backend (port 3001)
npm run dev:frontend        # Start only Next.js frontend
npm run dev:backend         # Start only Express backend
```

### Database Management
```bash
cd backend && npm run migrate:up      # Run database migrations
cd backend && npm run migrate:down    # Rollback database migrations
cd backend && npm run seed:studies    # Seed studies data via API
cd backend && npm run db:setup        # Run migrations and seed data
cd backend && npm run db:reset        # Reset database and reseed
```

### Building
```bash
npm run build              # Build both applications
npm run build:frontend     # Build Next.js application
npm run build:backend      # No-op for Node.js (no build step)
```

### Linting
```bash
cd frontend && npm run lint   # Lint frontend code with Next.js ESLint config
```

### Production
```bash
npm start                  # Start both applications in production mode
```

## Key Architectural Patterns

### Authentication System
- **JWT Authentication**: Secure token-based authentication with bcryptjs password hashing
- **User Registration**: Account creation with email validation and secure password requirements
- **Protected Routes**: Frontend route protection with automatic redirects
- **Token Management**: Local storage token persistence with automatic API header injection

### Database Architecture
- **PostgreSQL Database**: Primary data store with `illumina_dev` database
- **Database Migrations**: Version-controlled schema management using node-pg-migrate
- **User Management**: Users table with UUID primary keys, email uniqueness, and secure password storage
- **Study Management**: Studies table with comprehensive metadata and tagging system

### Bible Study Domain Model
- **Study Series**: Complete study programs with metadata (theme, difficulty, audience, duration)
- **Study Structure**: Support for both daily and weekly study formats
- **Study Content**: Rich content including passages, discussion questions, prayer focuses, application points
- **Progress Tracking**: User progress tracking with completion status and notes (planned)
- **Bible Integration**: Bible API service with caching and fallback data

### Shared Code Architecture
- **Types**: `shared/types/index.ts` contains interfaces for API responses and pagination
- **Constants**: `shared/constants/index.ts` contains API endpoints and HTTP status codes
- **Import Path**: Frontend can import shared code using `@/shared/*` alias (configured in `frontend/tsconfig.json`)

### Frontend Structure
- **App Router**: Uses Next.js 14 App Router pattern (`frontend/src/app/`)
- **Authentication Components**: `AuthForm`, `Navigation` with login/logout states
- **Study Components**: `StudiesTable`, `StudyRequestForm` (StudyCard removed)
- **API Services**: `authService.ts` for authentication, `studiesService.ts` for study data
- **Data Layer**: Type definitions in `studySeries.ts` (hardcoded data removed, now uses backend API)
- **Bible Service**: `BibleService.ts` handles scripture retrieval with API integration and caching
- **Routes**:
  - `/` - Home page with platform introduction
  - `/login` - Authentication page with login/register toggle
  - `/studies` - Browse study library (protected route)
  - `/studies/[id]` - Individual study pages (simplified metadata view)
  - `/studies/request-study` - Request custom study form
- **TypeScript Aliases**: `@/*` maps to `frontend/src/*`
- **Styling**: Global CSS with custom CSS variables for theming

### Backend Structure
- **Server**: Express server entry point at `backend/src/index.js`
- **Database**: PostgreSQL connection with connection pooling
- **Authentication**: JWT token-based auth with bcryptjs password hashing
- **API Endpoints**:
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login
  - `GET /api/studies` - Get all studies
  - `GET /api/studies/:id` - Get study by ID
- **Database Migrations**: Version-controlled schema in `backend/migrations/`
- **Data Seeding**: HTTP API-based seeding script for studies
- **Environment**: Configuration via `.env` (see `.env.example` for template)
- **Port**: Default 3001 (configurable via PORT env var)
- **Middleware**: CORS enabled, JSON/URL-encoded parsing, JWT auth middleware

## Environment Setup

### Required Dependencies
- Node.js >=18.0.0
- npm >=9.0.0
- PostgreSQL >=13.0.0

### Environment Variables
Backend uses dotenv for environment configuration. Copy `backend/.env.example` to `backend/.env` and configure as needed:
- `PORT`: Backend server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://postgres:password@localhost:5432/illumina_dev`)
- `JWT_SECRET`: JWT signing secret (use strong random string in production)
- `JWT_EXPIRES_IN`: Token expiration time (default: 7d)
- `API_BASE_URL`: Base URL for API calls (default: http://localhost:3001)

### Database Setup
1. Install PostgreSQL locally or use a cloud service
2. Create a database named `illumina_dev`
3. Update `DATABASE_URL` in `.env` with your database credentials
4. Run migrations: `cd backend && npm run migrate:up`
5. Seed initial data: `cd backend && npm run seed:studies`

## Bible Study Platform Features

### User Authentication
- **Account Creation**: Secure user registration with email and password validation
- **Login System**: JWT token-based authentication with persistent sessions
- **Password Security**: bcryptjs hashing with minimum security requirements
- **Protected Routes**: Automatic authentication checks for study access

### Study Management
- **Study Library**: Browse available study series with filtering and search (database-driven)
- **Study Types**: Daily devotionals, weekly studies, topical studies, marriage studies
- **Study Metadata**: Difficulty levels (beginner/intermediate/advanced), audience targeting, estimated time per session
- **Progress Tracking**: Track current day/week, completion percentage, notes per day (planned for future implementation)

### Study Content Structure
- **Study Series**: Container for complete study programs
- **Study Days**: Individual study sessions with structured content
- **Bible Passages**: Scripture references with integrated Bible API
- **Study Elements**: Opening prayers, study focus, teaching points, discussion questions, reflection questions, application points, prayer focus

### Bible Integration
- **Bible API**: Integration with bible-api.com for scripture retrieval
- **Caching**: Local storage caching for offline access and performance
- **Fallback Data**: Embedded scripture for common passages when API is unavailable
- **Scripture Display**: Formatted verse-by-verse presentation

### Current Database Content
Studies are stored in PostgreSQL database and managed via HTTP API. Sample studies include:
- **"Foundations of Faith"**: 7-day beginner study on faith fundamentals
- **"The Power of Prayer"**: 5-day intermediate prayer study

### Technical Implementation Notes
- Study data is stored in PostgreSQL database with comprehensive metadata
- Bible service includes sophisticated caching and fallback mechanisms
- Frontend components support both daily and weekly study structures
- User authentication system integrated with JWT tokens
- API-driven architecture with proper error handling and loading states
- Progress tracking architecture ready for future implementation
- Responsive design with custom CSS theming system
- Database migrations for version-controlled schema management