# WaveFinder Setup Guide

## Quick Setup for Milestone 4

### Step 1: Start Docker Services

Make sure Docker Desktop is running, then start PostgreSQL and Redis:

```powershell
# In PowerShell (use semicolon instead of &&)
docker-compose up -d
```

Or use separate commands:
```powershell
docker-compose up -d postgres
docker-compose up -d redis
```

Verify containers are running:
```powershell
docker ps
```

You should see `wavefinder-db` and `wavefinder-redis` containers.

### Step 2: Configure Server Environment

1. Navigate to server directory:
```powershell
cd server
```

2. Create `.env` file (copy from example if needed):
```powershell
# If .env doesn't exist, create it with these values:
```

**server/.env** should contain:
```env
PORT=3001
NODE_ENV=development

# Database URL for Docker Compose
DATABASE_URL="postgresql://postgres:password@localhost:5432/wavefinder?schema=public"

# JWT Secret (must be at least 32 characters)
JWT_SECRET=wavefinder-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Step 3: Push Database Schema

```powershell
# In server directory
npx prisma db push
```

This will create all tables including the new `Favorite` model.

### Step 4: Generate Prisma Client

```powershell
npx prisma generate
```

### Step 5: Seed Database

```powershell
npm run db:seed
```

This will create:
- Test users (including user@wavefinder.com)
- Sample businesses
- 6 check-ins for test user
- 5 favorites for test user
- UserReward record (120 points, Silver level)

### Step 6: Start Development Servers

From the root directory:

```powershell
# Start both client and server
npm run dev
```

Or separately:

```powershell
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client
```

## Troubleshooting

### Database Connection Error

**Error:** `Authentication failed against database server`

**Solutions:**

1. **Check Docker is running:**
   ```powershell
   docker ps
   ```

2. **Check database container:**
   ```powershell
   docker ps -a | findstr wavefinder-db
   ```

3. **Restart database:**
   ```powershell
   docker-compose restart postgres
   ```

4. **Verify DATABASE_URL in server/.env:**
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/wavefinder?schema=public"
   ```

5. **Test connection:**
   ```powershell
   # In server directory
   npx prisma db pull
   ```

### PowerShell Command Syntax

PowerShell doesn't support `&&`. Use:

**Instead of:**
```powershell
cd server && npx prisma db push
```

**Use:**
```powershell
cd server; npx prisma db push
```

**Or separate commands:**
```powershell
cd server
npx prisma db push
```

### Database Already Exists

If you get "database already exists" error:

```powershell
# Option 1: Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Option 2: Just push schema changes
npx prisma db push
```

## Verification

After setup, verify everything works:

1. **Check database connection:**
   ```powershell
   cd server
   npx prisma studio
   ```
   This opens Prisma Studio in your browser where you can view data.

2. **Test API:**
   - Server should start on http://localhost:3001
   - Health check: http://localhost:3001/api/health

3. **Test Frontend:**
   - Client should start on http://localhost:5173
   - Login with: user@wavefinder.com / User123!

## Common Issues

### Port Already in Use

If port 5432 is already in use:

1. Check what's using it:
   ```powershell
   netstat -ano | findstr :5432
   ```

2. Change Docker Compose port mapping in `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # Use 5433 instead
   ```

3. Update DATABASE_URL:
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5433/wavefinder?schema=public"
   ```

### Prisma Client Out of Date

If you get Prisma client errors:

```powershell
cd server
npx prisma generate
```

### Schema Changes Not Applied

```powershell
cd server
npx prisma db push --force-reset  # WARNING: Deletes all data
```

Or use migrations:
```powershell
npx prisma migrate dev --name add_favorites
```

