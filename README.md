# Illumina Bible Study Platform

A comprehensive full-stack Bible study platform built with Next.js, Node.js, and PostgreSQL. Illumina enables users to create accounts, browse study series, and engage with structured Bible study content including daily devotionals, weekly studies, topical studies, and marriage-focused content.

## Features

### 🔐 User Authentication
- Secure user registration and login
- JWT token-based authentication
- Password encryption with bcryptjs
- Protected routes and session management

### 📚 Study Management
- Browse comprehensive study library
- Advanced filtering and search capabilities
- Multiple study types (devotional, topical, book-study, couples, marriage)
- Difficulty levels (beginner, intermediate, advanced)
- Audience targeting (individual, couples, group, family)

### 💾 Database Integration
- PostgreSQL database with comprehensive metadata
- Version-controlled database migrations
- Automated data seeding
- Robust API layer with error handling

### 🎨 Modern Frontend
- Next.js 14 with App Router
- TypeScript for type safety
- Responsive design with custom CSS theming
- Real-time loading states and error handling

## Prerequisites

Before setting up the project locally, ensure you have the following installed:

- **Node.js** ≥18.0.0
- **npm** ≥9.0.0
- **PostgreSQL** ≥13.0.0

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd illumina
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for both frontend and backend using npm workspaces.

### 3. PostgreSQL Database Setup

#### Option A: Install PostgreSQL Locally

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

#### Option B: Use PostgreSQL Cloud Service

You can use services like:
- [Neon](https://neon.tech/)
- [Supabase](https://supabase.com/)
- [AWS RDS](https://aws.amazon.com/rds/)
- [Google Cloud SQL](https://cloud.google.com/sql)

### 4. Create Database

Connect to PostgreSQL and create the database:

```bash
# Connect as postgres user
psql -U postgres

# Create database
CREATE DATABASE illumina_dev;

# Exit psql
\q
```

### 5. Environment Configuration

Copy the environment template and configure your settings:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:

```env
PORT=3001
NODE_ENV=development

# Database - Update with your PostgreSQL credentials
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/illumina_dev

# JWT Configuration - Use a strong secret in production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# API Configuration
API_BASE_URL=http://localhost:3001
```

#### Important Notes:
- **Password with special characters**: If your PostgreSQL password contains special characters (like `!`, `@`, `#`), you need to URL-encode them:
  - `!` becomes `%21`
  - `@` becomes `%40`
  - `#` becomes `%23`
  - Example: `password!` becomes `password%21`

### 6. Database Migration and Seeding

Run the database migrations to create the required tables:

```bash
cd backend
npm run migrate:up
```

Seed the database with initial study data:

```bash
npm run seed:studies
```

### 7. Start Development Servers

From the root directory, start both frontend and backend servers:

```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

You can also start them individually:

```bash
# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend
```

## Project Structure

```
illumina/
├── frontend/           # Next.js 14 application
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/ # React components
│   │   ├── services/  # API services
│   │   └── data/      # Type definitions
├── backend/           # Node.js Express API
│   ├── src/          # Server source code
│   ├── migrations/   # Database migrations
│   └── scripts/      # Utility scripts
├── shared/           # Shared TypeScript types
└── package.json      # Workspace configuration
```

## Available Scripts

### Root Level Commands

```bash
npm run dev          # Start both frontend and backend
npm run build        # Build both applications
npm start           # Start both applications in production
```

### Backend Commands

```bash
cd backend

# Development
npm run dev         # Start with nodemon
npm start          # Start in production

# Database
npm run migrate:up    # Run migrations
npm run migrate:down  # Rollback migrations
npm run migrate:create <name>  # Create new migration
npm run seed:studies  # Seed study data
npm run db:setup     # Run migrations and seed
npm run db:reset     # Reset database and reseed
```

### Frontend Commands

```bash
cd frontend

npm run dev         # Start development server
npm run build       # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Studies
- `GET /api/studies` - Get all studies
- `GET /api/studies/:id` - Get study by ID

## First Time Usage

1. **Access the application**: Navigate to http://localhost:3000
2. **Create an account**: Click "Login" and use the "Create Account" option
3. **Password requirements**: Use at least 8 characters with special characters (e.g., `Password123!`)
4. **Browse studies**: Once logged in, browse the study library
5. **View study details**: Click "Start" on any study to view its details

## Database Management

### Viewing Database Content

**Using psql command line:**
```bash
psql -U postgres -d illumina_dev

# View all users
SELECT id, email, first_name, last_name, created_at FROM users;

# View all studies
SELECT id, title, theme, duration_days, study_style FROM studies;

# Exit
\q
```

**Using pgAdmin:**
1. Install pgAdmin from [pgadmin.org](https://www.pgadmin.org/)
2. Connect using your PostgreSQL credentials
3. Navigate to illumina_dev database

### Database Schema

**Users Table:**
- `id` (UUID primary key)
- `email` (unique)
- `password_hash`
- `first_name`, `last_name`
- `created_at`, `updated_at`

**Studies Table:**
- `id` (UUID primary key)
- `title`, `theme`, `description`
- `duration_days`, `study_style`, `difficulty`
- `audience`, `pastor_message`
- `tags` (JSON array)
- `status`, `popularity`
- `created_at`, `updated_at`

## Troubleshooting

### Common Issues

**1. Database Connection Errors**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Verify database exists: `psql -U postgres -l`

**2. Password Authentication Failed**
```
Error: password authentication failed for user "postgres"
```
- Check your PostgreSQL password
- URL-encode special characters in DATABASE_URL
- Reset PostgreSQL password if needed

**3. Migration Errors**
```
Error: relation "users" does not exist
```
- Run migrations: `cd backend && npm run migrate:up`
- Check migration status: `npm run migrate status`

**4. Port Already in Use**
```
Error: listen EADDRINUSE :::3000
```
- Change PORT in .env file
- Kill existing process: `lsof -ti:3000 | xargs kill -9`

**5. Frontend Build Errors**
- Clear Next.js cache: `cd frontend && rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Development Tips

- **Hot reload**: Both frontend and backend support hot reload during development
- **API testing**: Use tools like Postman or curl to test API endpoints
- **Database inspection**: Use pgAdmin or command line tools to inspect data
- **Logs**: Check terminal output for detailed error messages

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in environment
2. Use strong JWT_SECRET (generate with `openssl rand -base64 32`)
3. Use secure PostgreSQL credentials
4. Enable HTTPS
5. Set up proper CORS configuration
6. Consider using connection pooling for database

## Contributing

1. Create feature branches from main
2. Follow TypeScript best practices
3. Test authentication flows thoroughly
4. Update documentation for API changes
5. Run linting before commits: `cd frontend && npm run lint`

## Support

For issues and questions:
- Check troubleshooting section above
- Review error logs in terminal
- Ensure all prerequisites are properly installed
- Verify environment configuration

## License

This project is licensed under the MIT License.