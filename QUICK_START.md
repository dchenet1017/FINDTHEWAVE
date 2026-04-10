# Quick Start Guide - Milestone 4

## ✅ Database Setup Complete!

Your database has been successfully set up with:
- ✅ All tables created (including Favorite model)
- ✅ Test user with 120 points (Silver level)
- ✅ 6 check-ins for test user
- ✅ 5 favorites for test user
- ✅ Sample businesses and communities

## Next Steps

### 1. Start Development Servers

**Option A: Run both together (from root directory)**
```powershell
npm run dev
```

**Option B: Run separately**

Terminal 1 - Server:
```powershell
npm run dev:server
```

Terminal 2 - Client:
```powershell
npm run dev:client
```

### 2. Test the Application

1. **Open browser:** http://localhost:5173
2. **Login with:**
   - Email: `user@wavefinder.com`
   - Password: `User123!`

3. **Test the demo flow:**
   - ✅ Dashboard shows stats and map widget
   - ✅ Click "Explore Map" to see full map
   - ✅ Find a business and add to favorites
   - ✅ Go to "My Places" to see favorites
   - ✅ Check in at a business (allow location)
   - ✅ View "Digital Passport" to see stamps
   - ✅ Check updated stats on dashboard

### 3. Verify Data

Open Prisma Studio to view database:
```powershell
cd server
npx prisma studio
```

This opens at http://localhost:5555 where you can:
- View all users
- See check-ins for test user
- See favorites for test user
- Check UserReward record

## Database Connection

**Current Setup:**
- Database: PostgreSQL (Docker)
- Port: **5433** (changed from 5432 to avoid conflict)
- Connection: `postgresql://postgres:password@localhost:5433/wavefinder`

**To restart database:**
```powershell
docker-compose up -d postgres
```

## Troubleshooting

### Port Already in Use
If you get port conflicts, check what's using the port:
```powershell
netstat -ano | findstr :5433
```

### Database Connection Error
1. Check Docker is running: `docker ps`
2. Check wavefinder-db container: `docker ps | findstr wavefinder-db`
3. Restart container: `docker-compose restart postgres`

### Prisma Client Errors
```powershell
cd server
npx prisma generate
```

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| User | user@wavefinder.com | User123! |
| Admin | admin@wavefinder.com | Admin123! |
| Business | business@wavefinder.com | Business123! |
| WaveLeader | waveleader@wavefinder.com | WaveLeader123! |

## PowerShell Commands Reference

**PowerShell uses `;` instead of `&&`:**

```powershell
# Wrong (bash syntax)
cd server && npx prisma db push

# Correct (PowerShell syntax)
cd server; npx prisma db push

# Or use separate commands
cd server
npx prisma db push
```

## What's Ready

✅ User Dashboard with stats
✅ Explore Map with layers
✅ My Places (Favorites & Visited)
✅ Digital Passport with QR code
✅ Check-in system with geofencing
✅ Profile & Settings pages
✅ All API endpoints implemented
✅ Seed data with test user

**Milestone 4 is complete and ready for testing!** 🎉

