# Illumina Backend

The backend API for the Illumina Bible study platform, built with Node.js, Express, and PostgreSQL.

## 🏗️ Architecture Overview

- **Authentication**: JWT-based user authentication with secure password hashing
- **Database**: PostgreSQL with migration system for schema management
- **Content Storage**: Hybrid approach - metadata in database, content in structured markdown files
- **Study Management**: Complete study enrollment, progress tracking, and content delivery
- **API Design**: RESTful endpoints with comprehensive validation and error handling

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database connection and utilities
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication endpoints
│   │   └── studies.js           # Study management endpoints
│   ├── services/
│   │   ├── userService.js       # User management operations
│   │   ├── studyService.js      # Study database operations
│   │   └── studyContentService.js # File-based content management
│   ├── utils/
│   │   └── validation.js        # Input validation schemas
│   └── index.js                 # Main server application
├── migrations/
│   └── 1695000000001_initial-schema.js  # Database schema
├── scripts/
│   └── seedStudies.js           # Database seeding script
├── studies/                     # Study content storage
│   ├── faith-foundations-7/
│   │   ├── manifest.json        # Study metadata
│   │   ├── day-1.md            # Daily content
│   │   └── day-2.md
│   └── marriage-foundations-8w/
│       ├── manifest.json
│       ├── week-1/
│       │   ├── overview.md     # Week overview
│       │   ├── day-1.md        # Daily content within week
│       │   └── day-2.md
│       └── week-2/
├── .env.example                 # Environment variables template
├── .pgmigrate.json             # Migration configuration
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js >=18.0.0
- npm >=9.0.0
- PostgreSQL database

### 1. Environment Setup

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/illumina_dev

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Study Content
STUDIES_PATH=./studies
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Run migrations and seed data
npm run db:setup

# Or manually:
npm run migrate:up
npm run seed:studies
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## 🗄️ Database Schema

### Users
- User accounts and authentication
- Profile information

### Studies
- Study metadata (title, description, difficulty, etc.)
- Does NOT contain actual content (stored in files)

### User Studies
- User enrollments in studies
- Current progress tracking

### Study Progress
- Daily completion tracking
- Notes and reflection answers
- Progress timestamps

## 📚 Study Content Architecture

### File Structure Strategy

Studies are stored in a hybrid approach:

**Database**: Metadata only (title, description, difficulty, tags, etc.)
**Files**: Actual content in structured markdown files

#### Daily Studies
```
studies/study-id/
  manifest.json     # Metadata
  day-1.md         # Day 1 content
  day-2.md         # Day 2 content
  ...
```

#### Weekly Studies
```
studies/study-id/
  manifest.json     # Metadata
  week-1/
    overview.md     # Week overview
    day-1.md       # Day 1 content
    day-2.md       # Day 2 content
    ...
  week-2/
    ...
```

### Content Format

Each markdown file has YAML frontmatter with metadata:

```yaml
---
day: 1
title: "Faith Defined"
estimatedTime: "10-15 minutes"
passages:
  - reference: "Hebrews 11:1"
    verses:
      - verse: 1
        content: "Now faith is confidence..."
---

# Day 1: Faith Defined

## Study Focus
Understanding the biblical definition of faith

## Teaching Point
Faith is not wishful thinking...

## Discussion Questions
1. How would you define faith?
2. What's the difference between faith and hope?

## Application Points
- Identify one area where you need to trust God more
- Write down three of God's promises

## Prayer Focus
Ask God to strengthen your faith...
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)

```
POST   /register         # Register new user
POST   /login           # Login user
POST   /logout          # Logout user
GET    /me              # Get current user
PUT    /profile         # Update user profile
PUT    /password        # Change password
DELETE /account         # Delete user account
POST   /refresh         # Refresh JWT token
```

### Studies (`/api/studies`)

```
# Public endpoints
GET    /                           # List all studies
GET    /:id                       # Get study metadata + structure
GET    /:id/day/:dayNum           # Get day content (daily studies)
GET    /:id/week/:weekNum         # Get week overview
GET    /:id/week/:weekNum/day/:dayNum  # Get day content (weekly studies)

# Authenticated endpoints
GET    /user/enrolled             # Get user's enrolled studies
POST   /:id/enroll               # Enroll in study
GET    /:id/progress             # Get user's progress for study
PUT    /:id/progress/day/:dayNum  # Update day progress
GET    /:id/complete             # Get complete study export
```

### Health Check
```
GET    /api/health              # API and database health
```

## 🛠️ Database Management

### Migrations

```bash
# Create new migration
npm run migrate:create migration-name

# Run migrations
npm run migrate:up

# Rollback migration
npm run migrate:down
```

### Seeding

```bash
# Seed studies (checks for existing data)
npm run seed:studies

# Force reseed (clears existing data)
npm run seed:studies:force

# Full database reset
npm run db:reset
```

## 🔐 Authentication

Uses JWT tokens with the following features:

- Secure password hashing with bcrypt (12 rounds)
- Token expiration and refresh
- User profile management
- Account deletion with password verification

### Example Authentication Flow

```javascript
// Register
POST /api/auth/register
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123!"
}

// Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Use token in subsequent requests
Authorization: Bearer <jwt-token>
```

## 📊 Study Management

### Enrollment Flow

1. User browses available studies (`GET /api/studies`)
2. User enrolls in study (`POST /api/studies/:id/enroll`)
3. User accesses study content day by day
4. User updates progress (`PUT /api/studies/:id/progress/day/:dayNum`)
5. System tracks completion automatically

### Progress Tracking

- **Current Day/Week**: Where user is in the study
- **Completion Status**: Which days have been completed
- **Notes**: User's personal notes per day
- **Reflection Answers**: Responses to study questions
- **Timestamps**: When each day was completed

## 🔧 Development

### Available Scripts

```bash
npm run dev              # Start development server with auto-reload
npm start               # Start production server
npm run migrate:up      # Run database migrations
npm run migrate:down    # Rollback migrations
npm run db:setup        # Full database setup (migrate + seed)
npm run db:reset        # Reset database (rollback + migrate + seed)
npm run seed:studies    # Seed study data
```

### Adding New Studies

1. Create study folder in `studies/` directory
2. Add `manifest.json` with study metadata
3. Create content files (daily or weekly structure)
4. Add study to database via seed script or API

### Content Service API

The `studyContentService` provides methods for:

- Loading study manifests
- Getting study structure (available days/weeks)
- Loading individual day/week content
- Parsing markdown with frontmatter
- Converting to frontend-compatible format

## 🌐 Production Considerations

### Environment Variables

Ensure these are set in production:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Strong, random secret key
- `NODE_ENV=production`

### Security

- JWT tokens expire (configurable)
- Passwords are hashed with bcrypt
- Input validation on all endpoints
- SQL injection prevention with parameterized queries
- CORS enabled for frontend integration

### Performance

- Database connection pooling
- Efficient query design with indexes
- Content caching capabilities in content service
- Graceful error handling and logging

## 🤝 Integration with Frontend

The backend is designed to work seamlessly with the Next.js frontend:

- Maintains compatibility with existing frontend data structures
- Provides granular content loading for optimal performance
- Supports both authenticated and public endpoints
- Comprehensive error responses for proper frontend handling

## 📝 Notes

- Study content is designed to be easily portable to S3 later
- Database schema supports future features like study sharing, ratings, etc.
- API is versioned and follows REST conventions
- All responses use consistent JSON format with `success` boolean and `data`/`error` fields