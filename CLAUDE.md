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
- **AI Generation Tables**:
  - `study_generation_requests` - Track AI study generation requests and progress
  - `generated_study_content` - Store AI-generated daily study content
  - `workflow_state` - Track multi-step AI generation workflow progress
- **Schema Evolution**: VARCHAR(255) fields expanded to TEXT for AI-generated content that exceeds traditional limits

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
  - `/studies/[id]/day/[dayNumber]` - **Daily study reader with markdown content**
  - `/studies/request-study` - Request custom study form
- **TypeScript Aliases**: `@/*` maps to `frontend/src/*`
- **UI Design System**: Comprehensive earthy glassmorphism design with nature-inspired aesthetics

### Daily Study Reading System
The platform features a comprehensive daily study reading experience built on markdown content delivery:

#### Content Architecture
- **Hybrid Storage**: PostgreSQL metadata + filesystem markdown content
- **YAML Frontmatter**: Structured metadata (title, estimatedTime, passages) in markdown files
- **Dynamic Routing**: `/studies/[id]/day/[dayNumber]` for seamless day navigation

#### Study Reader Features
- **React-Markdown Integration**: Custom styled markdown rendering with typography optimized for study content
- **Navigation System**: Previous/Next day buttons with intelligent boundary handling
- **Progress Tracking**: Visual progress indicator showing completion percentage
- **Responsive Design**: Mobile-optimized reading experience with proper typography scaling

#### Custom Markdown Styling
- **Hierarchical Typography**: Custom styled headings (h1-h3) with consistent color scheme
- **Enhanced Blockquotes**: Styled as highlight boxes with left border and background
- **Scripture Emphasis**: Strong text styled with navy color for biblical references
- **List Formatting**: Proper spacing and indentation for discussion questions and application points

#### Content Delivery Pipeline
1. **Backend API**: `/api/studies/:id/day/:dayNumber` serves markdown with parsed frontmatter
2. **Frontmatter Parsing**: Custom YAML parser extracts metadata from markdown files
3. **Content Separation**: Raw markdown content separated from metadata for optimal rendering
4. **Error Handling**: Graceful fallbacks for missing days with navigation to study overview

## Earthy Glassmorphism UI Design System

### Design Philosophy
The platform features a sophisticated **earthy glassmorphism design** that creates a calming, nature-inspired aesthetic perfect for Bible study and reflection. The design system emphasizes transparency, depth, and natural colors to foster a contemplative reading environment.

### Color Palette Architecture

#### Primary Forest/Ocean Colors
```css
--ocean-light: #81c784;      /* Light forest green for highlights */
--ocean-medium: #4caf50;     /* Primary green for main UI elements */
--ocean-dark: #388e3c;       /* Dark green for text and accents */
--navy-deep: #2e7d32;        /* Deepest green for emphasis */
--navy: #388e3c;             /* Primary navigation and headers */
```

#### Natural Earth Tones
```css
--sage-light: #f8f9f8;       /* Very light sage for backgrounds */
--sage-medium: #a5b3a5;      /* Medium sage for borders and subtle elements */
--stone-warm: #8d9e8d;       /* Warm stone gray for secondary text */
--warm-stone: #a5b3a5;       /* Complementary stone tone */
```

#### Background System
```css
--sky-light: #f1f5f0;        /* Primary light background */
--sky-medium: #e8f3e8;       /* Secondary light background */
--warm-cream: #faf8f5;       /* Warm cream for cards and content areas */
--champagne: #f3e5ab;        /* Accent background for special content */
```

#### Text Color Hierarchy
```css
--text-primary: #424242;     /* Primary body text (gray-800) */
--text-secondary: #757575;   /* Secondary text (gray-600) */
--text-light: #bdbdbd;       /* Light text for subtle elements */
--text-accent: #388e3c;      /* Accent text using ocean-dark */
```

### Glassmorphism Components

#### Primary Glass Effect (.glass-earth)
```css
.glass-earth {
  background: rgba(248, 249, 248, 0.4);          /* Translucent sage background */
  backdrop-filter: blur(20px);                    /* Glass blur effect */
  -webkit-backdrop-filter: blur(20px);           /* Safari compatibility */
  border: 1px solid rgba(102, 187, 106, 0.15);  /* Subtle green border */
  box-shadow: var(--shadow-ocean);               /* Earth-tone shadow */
  border-radius: 16px;                           /* Soft rounded corners */
}
```
**Usage**: Primary glassmorphism effect for main content cards, forms, and featured components.

#### Secondary Glass Effect (.glass-forest)
```css
.glass-forest {
  background: rgba(241, 245, 240, 0.5);          /* Slightly more opaque sage */
  backdrop-filter: blur(25px);                    /* Stronger blur effect */
  border: 1px solid rgba(56, 142, 60, 0.2);     /* More defined green border */
  box-shadow: var(--shadow-emerald);             /* Deep forest shadow */
}
```
**Usage**: Secondary glassmorphism for navigation, modals, and overlay components requiring more definition.

### Shadow System with Earth Tones

#### Green-Tinted Shadow Variants
```css
--shadow-glass: 0 8px 32px rgba(46, 125, 50, 0.15);           /* Deep green glass shadow */
--shadow-ocean: 0 4px 16px rgba(102, 187, 106, 0.2);          /* Ocean green shadow */
--shadow-emerald: 0 6px 20px rgba(27, 94, 32, 0.12);          /* Emerald accent shadow */
--shadow-blue: 0 4px 16px rgba(76, 175, 80, 0.15);            /* Legacy green shadow */
```

#### Standard Shadow Hierarchy
```css
--shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.06);               /* Minimal shadow */
--shadow-soft: 0 4px 6px -1px rgba(0, 0, 0, 0.08);            /* Soft component shadow */
--shadow-medium: 0 10px 15px -3px rgba(0, 0, 0, 0.1);         /* Medium elevation */
--shadow-large: 0 20px 25px -5px rgba(0, 0, 0, 0.1);          /* High elevation */
```

### Typography System

#### Font Stack Architecture
```css
--font-ui: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;        /* Modern UI font */
--font-scripture: 'Crimson Text', Georgia, 'Times New Roman', serif;                  /* Scripture reading */
--font-decorative: 'Crimson Text', Georgia, serif;                                    /* Decorative headings */
```

#### Gradient Text Effects
- **H1 Headers**: Linear gradient from `var(--navy)` to `var(--ocean-dark)` with background-clip text
- **H2 Headers**: Gradient from `var(--text-primary)` to `var(--navy)`
- **Enhanced Scripture Typography**: Larger, more readable serif fonts with increased line-height

#### Scripture-Optimized Typography
```css
.verse-text {
  font-family: var(--font-scripture);
  font-size: 1.1rem;
  line-height: 1.8;                    /* Enhanced readability */
  color: var(--text-primary);
}

.verse-reference {
  font-family: var(--font-decorative);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ocean-accent);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
```

### Dark Mode Implementation

The design system includes a complete earth-tone dark mode that maintains the natural aesthetic:

#### Dark Mode Color Adaptations
```css
[data-theme="dark"] {
  --sky-light: #0f140f;               /* Deep forest dark background */
  --sky-medium: #1a2a1a;             /* Secondary dark background */
  --text-primary: #f0f5f0;           /* Light text for dark backgrounds */
  --text-secondary: #b0c0b0;         /* Secondary light text */

  /* Warm earth-tone dark backgrounds */
  --warm-cream: #1e2a1e;
  --sage-light: #243024;
}
```

### Component Integration Guidelines

#### Card Components
The primary `.card` class combines glassmorphism with earth-tone styling:
- **Background**: Semi-transparent white with backdrop blur
- **Borders**: Subtle white borders with glassmorphism effect
- **Shadows**: Soft shadows with smooth transitions
- **Hover Effects**: Enhanced elevation with cubic-bezier transitions

#### Reading Experience Optimizations
Based on recent study page improvements:
- **Compact Headers**: Reduced title sizes (1.5rem instead of 2rem) for better scanning
- **Consolidated Metadata**: Single-line essential information display
- **Improved Typography Hierarchy**: Better line-heights and font-size relationships
- **Enhanced Tags**: Smaller, earth-tone badges with consistent styling

### Performance Considerations

#### Backdrop-Filter Optimization
- **Progressive Enhancement**: Fallback backgrounds for unsupported browsers
- **Webkit Prefixes**: Full Safari/iOS compatibility
- **Animation Performance**: GPU-accelerated transitions with transform3d hints

#### CSS Custom Property Benefits
- **Theme Consistency**: Centralized color management
- **Easy Customization**: Modify colors system-wide through CSS variables
- **Dark Mode Toggle**: Seamless theme switching without JavaScript complexity

### Backend Structure
- **Server**: Express server entry point at `backend/src/index.js`
- **Database**: PostgreSQL connection with connection pooling
- **Authentication**: JWT token-based auth with bcryptjs password hashing
- **API Endpoints**:
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login
  - `GET /api/studies` - Get all studies from database
  - `GET /api/studies/:id` - Get study metadata by ID
  - `GET /api/studies/:id/content` - **Get study content overview (manifest + day list)**
  - `GET /api/studies/:id/day/:dayNumber` - **Get specific day markdown content with YAML frontmatter**
  - `POST /api/ai/generate-study` - Request AI-generated study
  - `GET /api/ai/generate-study/:id/status` - Check generation status
- **Database Migrations**: Version-controlled schema in `backend/migrations/`
- **Data Seeding**: HTTP API-based seeding script for studies
- **Environment**: Configuration via `.env` (see `.env.example` for template)
- **Port**: Default 3001 (configurable via PORT env var)
- **Middleware**: CORS enabled, JSON/URL-encoded parsing, JWT auth middleware

### Node.js Layered Architecture
The backend follows a sophisticated modular architecture with clear separation of concerns and advanced data processing capabilities:

- **Services Layer** (`src/services/`):
  - `aiService.ts` - Multi-step AI study generation workflow with sophisticated JSON parsing
  - `promptTemplates.ts` - Study-style-specific prompt templates with context-aware generation
  - `studyPlanningService.ts` - Study planning business logic

- **Domain Layer** (`src/domain/`):
  - `bible.ts` - Bible book metadata, chapter counts, and canonical domain knowledge

- **Utils Layer** (`src/utils/`):
  - `aiResponseParser.ts` - **Sophisticated AI JSON parsing** with multi-layered cleaning and progressive fallback strategies
  - `idGenerator.ts` - UUID and timestamp-based identifier generation utilities

- **Generators Layer** (`src/generators/`):
  - `markdownGenerator.ts` - YAML frontmatter and markdown content generation for study files

- **Data Layer** (`src/schemas/`):
  - **Dual-Schema Validation**: Zod schemas for AI responses, enriched data, and type safety
  - **Two-Stage Validation**: AI response schemas → enrichment → final validation

- **Routes Layer** (`src/routes/`):
  - `auth.ts` - JWT authentication endpoints
  - `studies.ts` - **Study metadata and content delivery** endpoints
  - `aiWorkflow.ts` - AI generation workflow management

This architecture promotes code reusability, testability, and maintainability while handling complex AI response processing and maintaining data consistency across filesystem and database storage.

### Schema Architecture & Data Validation
The system employs a sophisticated dual-schema validation pattern to handle AI-generated content and ensure data consistency:

#### Two-Stage Validation Process
1. **AI Response Schema** (`AIStudyPlanResponseSchema`): Validates raw AI output with only fields the AI provides
2. **Enrichment Stage**: Adds system-generated fields (studyId, studyStyle, difficulty, audience)
3. **Final Validation** (`StudyPlanSchema`): Validates complete enriched data before processing

#### Key Schema Types
- **`StudyRequestSchema`**: Input validation for user study generation requests
- **`AIStudyPlanResponseSchema`**: Validates AI responses before enrichment (subset of fields)
- **`StudyPlanSchema`**: Complete validation after enrichment with all required fields
- **`DailyStudyContentSchema`**: Validation for generated daily study content
- **`StudyManifestSchema`**: File system manifest metadata validation

#### ID Consistency Pattern
- **Request ID = Study ID**: Uses UUID from initial request as study identifier throughout system
- **End-to-End Consistency**: Same ID used for request tracking, database storage, and frontend retrieval
- **No Generated IDs**: Eliminates timestamp-based ID generation to prevent ID mismatches

#### Benefits
- **Progressive Validation**: AI responses validated at appropriate stages
- **Type Safety**: Full TypeScript integration with runtime validation
- **Error Recovery**: Clear validation errors with specific field information
- **Data Consistency**: Ensures all system components use consistent identifiers

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
- `OPENAI_API_KEY`: OpenAI API key for AI study generation (required for production)
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-4)
- `OPENAI_TEMPERATURE`: AI creativity setting (default: 0.7)
- `OPENAI_MAX_TOKENS`: Maximum tokens per request (default: 2000, production: 6000 for content generation)
- `USE_MOCK_AI`: Set to 'true' to use mock data instead of OpenAI API (development only)

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
- **Scripture Display**: Formatted verse-by-verse presentation
- **Production-Ready Error Handling**: No fallback data - proper logging and exception handling only

### Current Database Content
Studies are stored in PostgreSQL database and managed via HTTP API. Sample studies include:
- **"Foundations of Faith"**: 7-day beginner study on faith fundamentals
- **"The Power of Prayer"**: 5-day intermediate prayer study

### Technical Implementation Notes
- **Hybrid Data Architecture**: PostgreSQL for study metadata + filesystem for markdown content
- **Sophisticated AI JSON Parsing**: Multi-layered cleaning with progressive fallback strategies
- **Dual-Schema Validation**: AI response schemas → enrichment → final validation pattern
- **ID Consistency**: UUID-based request/study ID consistency across all system components
- **Bible Service**: Sophisticated caching and error handling with API integration
- **Daily Study Reader**: React-markdown with custom styling and YAML frontmatter parsing
- **Frontend Components**: Support both daily study navigation and weekly study structures
- **Authentication Integration**: JWT tokens with protected routes and automatic API header injection
- **API-Driven Architecture**: RESTful endpoints with proper error handling and loading states
- **Content Delivery Pipeline**: Filesystem-based markdown delivery with database metadata queries
- **Progress Tracking Architecture**: Visual progress indicators ready for future persistence
- **Earthy Glassmorphism UI**: Nature-inspired design system with backdrop-filter effects and earth-tone color palette
- **Responsive Design**: Mobile-optimized study reading experience with comprehensive CSS theming system
- **Database Migrations**: Version-controlled schema management with PostgreSQL

## AI-Powered Study Generation

### OpenAI SDK Integration
- **Model**: GPT-4 with 8192 token context window
- **Token Management**: 6000 token safe limit for content generation (allowing ~2000 tokens for prompts)
- **Temperature**: 0.7 for balanced creativity and consistency
- **Mock Mode**: Development support without API key requirements
- **Error Handling**: Comprehensive retry logic and graceful degradation

### Multi-Step AI Workflow
1. **Planning Phase**: Generate structured study plan with metadata and daily outlines
2. **Content Generation**: Create detailed daily content (8-12 verses, 4-5 paragraphs teaching)
3. **File Creation**: Generate markdown files and manifest.json
4. **Database Storage**: Store generated content with progress tracking

### Study Style-Specific Content Generation
- **Devotional**: Personal reflection and application focused
- **Topical**: Theme-based exploration across scripture
- **Book Study**: Chapter-by-chapter exposition with duration-aware planning
  - 1-day studies focus ONLY on Chapter 1
  - Multi-day studies intelligently distribute chapters
- **Marriage**: Relationship-focused biblical principles

### AI Response Processing
The system employs sophisticated multi-layered JSON parsing to handle real-world AI response inconsistencies:

#### Progressive Parsing Strategy
- **Attempt 1**: Basic JSON cleaning (comments, formatting)
- **Attempt 2**: Moderate ellipsis pattern cleaning (`...`, `, ...`, `... remaining items`)
- **Fallback Logic**: Each attempt progressively more aggressive until successful parse

#### Advanced JSON Cleaning Patterns
- **Ellipsis Removal**: Handles `},\n...\n{` → `},{` and similar patterns
- **Comment Stripping**: Single-line (`//`), multi-line (`/* */`), and inline comments
- **Array Boundary Fixes**: Cleans `, ... ]` → `]` patterns
- **Trailing Comma Cleanup**: Removes invalid trailing commas before `}` and `]`

#### Schema-Driven Validation
- **Two-Stage Process**: Parse with `AIResponseParser.extractStructuredData()`
- **Early Validation**: AI response validated against appropriate schema before enrichment
- **Type Safety**: Full TypeScript integration with runtime Zod validation
- **Error Recovery**: Clear error messages with field-specific validation failures

#### Content Enhancement Features
- **Study-Type Aware**: 8-12 verses for book studies vs 3-5 for devotionals
- **Context Preservation**: Maintains verse references and passage structure
- **Format Consistency**: Ensures consistent JSON structure regardless of AI variations

### Bible Study Domain Knowledge
- **Book Metadata**: Chapter counts and canonical information for 48+ books
- **Duration Planning**: Intelligent content distribution based on study length
- **Audience Targeting**: Age-appropriate content and application points
- **Special Requirements**: Athletic focus, marriage, and other specialized content

## Development Best Practices

### Production-Ready Guidelines
- **NEVER use fallback data** - implement proper logging and exception handling instead
- **Token Limits**: Respect GPT-4's 8192 context window with 6000 token max for generation
- **Cache Management**: Clear `dist/` folder when TypeScript changes don't take effect: `rm -rf dist/ && npm run build`
- **Environment Variables**: All OpenAI configuration must be explicit, no defaults in production
- **Error Handling**: Comprehensive logging without exposing sensitive information

### Common Development Issues & Solutions
- **Cache Problems**: TypeScript compilation can cache outdated code - always rebuild when prompt changes don't take effect
- **Token Context Exceeded**: Reduce max_tokens to 6000 or lower, not the token limit itself
- **JSON Parsing Failures**: AI responses often contain ellipsis and abbreviations - use the aggressive cleaning approach
- **Database Field Limits**: VARCHAR(255) insufficient for AI content - use TEXT fields for generated content

### Performance Optimization
- **Request Batching**: Generate multiple study days in sequence with small delays
- **Database Efficiency**: Bulk inserts for generated content storage
- **Error Recovery**: Progressive parsing strategies before throwing exceptions
- **Mock Data**: Complete development workflow without API costs

### UI Design Best Practices

#### Glassmorphism Implementation Guidelines
- **Use .glass-earth for primary content**: Main cards, forms, and featured components
- **Use .glass-forest for overlays**: Navigation, modals, and secondary components requiring more definition
- **Backdrop-filter support**: Always include `-webkit-` prefixes for Safari compatibility
- **Progressive enhancement**: Provide fallback backgrounds for unsupported browsers

#### Reading Experience Optimization
Based on study page improvements and user experience research:
- **Compact headers**: Use 1.5rem max for titles to improve scanability
- **Essential metadata only**: Show duration, difficulty, audience in single line
- **Typography hierarchy**: Maintain consistent line-heights (1.4-1.8) and font-size relationships
- **Breathing room**: Use appropriate margins (0.75rem-1.5rem) to prevent visual clutter

#### Color System Consistency
- **Use CSS custom properties**: Always reference `var(--color-name)` instead of hardcoded hex values
- **Follow earth-tone palette**: Ocean greens for primary, sage/stone for secondary elements
- **Text contrast**: Maintain AAA contrast ratios using `--text-primary` and `--text-secondary`
- **Dark mode considerations**: Test all components in both light and earth-tone dark themes

#### Component Design Patterns
- **Card spacing**: Use 1.25rem-1.5rem padding for optimal content density
- **Button hierarchy**: Primary actions use `var(--ocean-medium)`, secondary use transparent backgrounds
- **Tag styling**: Small badges (0.7rem font, minimal padding) with earth-tone backgrounds
- **Shadow application**: Use appropriate shadow scale (subtle → soft → medium → large)

#### Accessibility & Performance
- **Backdrop-filter performance**: Limit concurrent glassmorphism elements to prevent frame drops
- **Focus states**: Ensure visible focus indicators on all interactive elements
- **Mobile optimization**: Test glassmorphism effects on lower-end devices
- **Animation performance**: Use `transform3d(0,0,0)` hints for GPU acceleration