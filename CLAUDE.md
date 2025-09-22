# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

**Illumina** is a comprehensive Bible study platform built as a monorepo containing:
- **Frontend**: Next.js 14 with App Router and TypeScript (`frontend/`)
- **Backend**: Node.js with Express API server (`backend/`)
- **Shared**: Common TypeScript types and constants (`shared/`)

The platform enables users to browse, start, and track progress through structured Bible study series with daily devotionals, weekly studies, topical studies, and marriage-focused content. The project uses npm workspaces for dependency management.

## Development Commands

### Starting Development Environment
```bash
npm run dev                 # Start both frontend (port 3000) and backend (port 3001)
npm run dev:frontend        # Start only Next.js frontend
npm run dev:backend         # Start only Express backend
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

### Bible Study Domain Model
- **Study Series**: Complete study programs with metadata (theme, difficulty, audience, duration)
- **Study Structure**: Support for both daily and weekly study formats
- **Study Content**: Rich content including passages, discussion questions, prayer focuses, application points
- **Progress Tracking**: User progress tracking with completion status and notes
- **Bible Integration**: Bible API service with caching and fallback data

### Shared Code Architecture
- **Types**: `shared/types/index.ts` contains interfaces for API responses and pagination
- **Constants**: `shared/constants/index.ts` contains API endpoints and HTTP status codes
- **Import Path**: Frontend can import shared code using `@/shared/*` alias (configured in `frontend/tsconfig.json`)

### Frontend Structure
- **App Router**: Uses Next.js 14 App Router pattern (`frontend/src/app/`)
- **Study Components**: `StudyCard`, `StudiesTable`, `StudyRequestForm`, `Navigation`
- **Data Layer**: `studySeries.ts` contains comprehensive study data with sample series
- **Bible Service**: `BibleService.ts` handles scripture retrieval with API integration and caching
- **Routes**:
  - `/` - Home page with platform introduction
  - `/studies` - Browse study library
  - `/studies/[id]` - Individual study pages
  - `/studies/request-study` - Request custom study form
- **TypeScript Aliases**: `@/*` maps to `frontend/src/*`
- **Styling**: Global CSS with custom CSS variables for theming

### Backend Structure
- **Server**: Express server entry point at `backend/src/index.js`
- **API Endpoints**: Health check and basic API structure ready for extension
- **Environment**: Configuration via `.env` (see `.env.example` for template)
- **Port**: Default 3001 (configurable via PORT env var)
- **Middleware**: CORS enabled, JSON/URL-encoded parsing

## Environment Setup

### Required Node.js Version
- Node.js >=18.0.0
- npm >=9.0.0

### Environment Variables
Backend uses dotenv for environment configuration. Copy `backend/.env.example` to `backend/.env` and configure as needed:
- `PORT`: Backend server port (default: 3001)
- `NODE_ENV`: Environment mode
- `DATABASE_URL`: Database connection string (for future database integration)
- `JWT_SECRET`: JWT signing secret (for future authentication)
- `API_BASE_URL`: Base URL for API calls (default: http://localhost:3001)

## Bible Study Platform Features

### Study Management
- **Study Library**: Browse available study series with filtering and search
- **Study Types**: Daily devotionals, weekly studies, topical studies, marriage studies
- **Study Metadata**: Difficulty levels (beginner/intermediate/advanced), audience targeting, estimated time per session
- **Progress Tracking**: Track current day/week, completion percentage, notes per day

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

### Current Sample Content
- **"Foundations of Faith"**: 7-day beginner study on faith fundamentals
- **"Marriage Foundations"**: 8-week intermediate couples study
- **"The Power of Prayer"**: 5-day intermediate prayer study
- **"From Anxiety to Peace"**: 14-day beginner mental health study
- **"Biblical Parenting Wisdom"**: 21-day family-focused study
- **"The Armor of God"**: 7-day advanced spiritual warfare study

### Technical Implementation Notes
- Study data is currently stored in TypeScript files for development
- Bible service includes sophisticated caching and fallback mechanisms
- Frontend components support both daily and weekly study structures
- Progress tracking architecture ready for user authentication integration
- Responsive design with custom CSS theming system