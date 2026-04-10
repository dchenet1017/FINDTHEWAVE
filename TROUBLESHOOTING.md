# Troubleshooting Guide

## Common Issues and Solutions

### 1. Missing Package: @fastify/multipart

**Error:** `Cannot find package '@fastify/multipart'`

**Solution:**
```powershell
npm install @fastify/multipart --workspace=server
```

### 2. Database Connection Error

**Error:** `Authentication failed against database server`

**Solutions:**

1. **Check Docker is running:**
   ```powershell
   docker ps
   ```

2. **Check database container:**
   ```powershell
   docker ps | Select-String "wavefinder-db"
   ```

3. **Start database if stopped:**
   ```powershell
   docker-compose up -d postgres
   ```

4. **Verify DATABASE_URL in server/.env:**
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5433/wavefinder?schema=public"
   ```
   Note: Port is **5433**, not 5432

### 3. Port Already in Use

**Error:** `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Solution:**
- Database is configured to use port **5433** in docker-compose.yml
- Make sure server/.env uses port **5433**

### 4. Node.js Version Warning (Vite)

**Warning:** `Vite requires Node.js version 20.19+ or 22.12+`

**Current:** Node.js v20.18.0

**Solutions:**

**Option A: Ignore (Recommended)**
- This is just a warning, Vite will still work
- The app should run fine on Node.js 20.18.0

**Option B: Upgrade Node.js**
- Download Node.js 20.19+ or 22.12+ from nodejs.org
- Or use nvm to switch versions

### 5. PowerShell Command Syntax

**Error:** `The token '&&' is not a valid statement separator`

**Solution:**
PowerShell uses `;` instead of `&&`:

```powershell
# Wrong (bash syntax)
cd server && npx prisma db push

# Correct (PowerShell syntax)
cd server; npx prisma db push

# Or use separate commands
cd server
npx prisma db push
```

### 6. Prisma Client Out of Date

**Error:** Prisma client errors or type mismatches

**Solution:**
```powershell
cd server
npx prisma generate
```

### 7. Schema Changes Not Applied

**Error:** Database schema doesn't match Prisma schema

**Solution:**
```powershell
cd server
npx prisma db push
```

### 8. Seed Data Not Loading

**Error:** No data in database after seeding

**Solutions:**

1. **Check if seed ran successfully:**
   ```powershell
   cd server
   npm run db:seed
   ```

2. **Verify data in Prisma Studio:**
   ```powershell
   npx prisma studio
   ```

3. **Check for errors in seed output**

### 9. Server Won't Start

**Common causes:**

1. **Missing dependencies:**
   ```powershell
   npm install --workspace=server
   ```

2. **Database not running:**
   ```powershell
   docker-compose up -d postgres
   ```

3. **Port already in use:**
   - Check if port 3001 is available
   - Change PORT in server/.env if needed

4. **Syntax errors in code:**
   - Check terminal for error messages
   - Fix any TypeScript/JavaScript errors

### 10. Client Won't Start

**Common causes:**

1. **Missing dependencies:**
   ```powershell
   npm install --workspace=client
   ```

2. **Port already in use:**
   - Check if port 5173 is available
   - Vite will automatically use next available port

3. **Node.js version:**
   - Warning about Node.js version is usually safe to ignore
   - Vite should still work on 20.18.0

## Quick Fixes

### Reset Everything

```powershell
# Stop all containers
docker-compose down

# Remove volumes (WARNING: Deletes all data)
docker-compose down -v

# Restart containers
docker-compose up -d

# Reinstall dependencies
npm install

# Push schema
cd server
npx prisma db push

# Seed database
npm run db:seed
```

### Verify Setup

```powershell
# Check Docker
docker ps

# Check database connection
cd server
npx prisma studio

# Check server
npm run dev:server

# Check client
npm run dev:client
```

## Getting Help

1. Check error messages in terminal
2. Verify all environment variables are set
3. Check Docker containers are running
4. Verify database connection
5. Check package.json for all dependencies
6. Review SETUP_GUIDE.md and QUICK_START.md

