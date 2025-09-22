# PostgreSQL Setup Instructions for Illumina Backend

## 🚀 Quick Setup Options

Choose ONE of these methods:

---

## Option 1: Postgres.app (Easiest - Recommended)

1. **Download Postgres.app**
   - Go to https://postgresapp.com/
   - Download the latest version
   - Drag to Applications folder
   - Open Postgres.app

2. **Initialize Database**
   - Click "Initialize" in Postgres.app
   - It will start PostgreSQL on port 5432 (default)

3. **Add Command Line Tools**
   - Open Terminal and run:
   ```bash
   sudo mkdir -p /etc/paths.d &&
   echo /Applications/Postgres.app/Contents/Versions/latest/bin | sudo tee /etc/paths.d/postgresapp
   ```
   - Restart Terminal

4. **Create Illumina Database**
   ```bash
   createdb illumina_dev
   ```

---

## Option 2: Homebrew Installation

1. **Install Homebrew** (if not installed)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install PostgreSQL**
   ```bash
   brew install postgresql@15
   brew services start postgresql@15
   ```

3. **Create Database**
   ```bash
   createdb illumina_dev
   ```

---

## Option 3: Docker (If you have Docker Desktop)

1. **Run PostgreSQL Container**
   ```bash
   docker run --name illumina-postgres \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=illumina_dev \
     -p 5432:5432 \
     -d postgres:15
   ```

---

## 📋 After PostgreSQL is Installed

Run these commands from the backend directory:

```bash
# 1. Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# 2. Create database (if not created)
createdb illumina_dev

# 3. Test connection
psql postgresql://postgres:password@localhost:5432/illumina_dev -c "SELECT NOW();"

# 4. Run migrations
npm run migrate:up

# 5. Seed the database
npm run seed:studies

# 6. Start the backend
npm run dev
```

## 🔧 Troubleshooting

### If "createdb" command not found:
- Make sure PostgreSQL bin directory is in your PATH
- For Postgres.app: `/Applications/Postgres.app/Contents/Versions/latest/bin`
- For Homebrew: `/usr/local/opt/postgresql@15/bin` or `/opt/homebrew/opt/postgresql@15/bin`

### If connection fails:
1. Check PostgreSQL is running:
   - Postgres.app: Check the elephant icon in menu bar
   - Homebrew: `brew services list`
   - Docker: `docker ps`

2. Verify port 5432 is available:
   ```bash
   lsof -i :5432
   ```

3. Check database exists:
   ```bash
   psql -U postgres -l
   ```

### Default Credentials
The `.env` file is configured with:
- Username: `postgres`
- Password: `password`
- Database: `illumina_dev`
- Port: `5432`

If you use different credentials, update the `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/illumina_dev
```

## ✅ Verification

Once PostgreSQL is set up, you can verify everything is working:

```bash
# From the backend directory
npm run dev
```

Then open http://localhost:3001/api/health

You should see:
```json
{
  "status": "OK",
  "database": "connected",
  ...
}
```