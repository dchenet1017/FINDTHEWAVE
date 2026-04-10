# WaveFinder

A monorepo project for WaveFinder application.

## Project Structure

```
wavefinder/
├── client/          # React + Vite + TypeScript frontend
├── server/          # Fastify + TypeScript backend
├── shared/          # Shared utilities and types
└── package.json     # Root package.json with workspaces
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose (for local development)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

**Server:**
```bash
cd server
cp .env.example .env
# Edit .env with your configuration
```

**Client:**
```bash
cd client
cp .env.example .env
# Edit .env with your configuration
```

### Database Setup

**Option 1: Using Docker (Recommended)**

1. Make sure Docker Desktop is running on your machine.

2. Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

**Option 2: Using Local PostgreSQL**

If you prefer to use a local PostgreSQL installation instead of Docker:

1. Install PostgreSQL locally and create a database named `wavefinder`.

2. Update your `server/.env` file with your local PostgreSQL connection string:
   ```
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/wavefinder?schema=public"
   ```

3. Skip the Redis setup for now (it's optional).

2. Generate Prisma Client:

```bash
npm run db:generate --workspace=server
```

3. Push database schema:

```bash
npm run db:push --workspace=server
```

4. Seed initial data (includes test user with favorites and check-ins):

```bash
npm run db:seed --workspace=server
```

**Note:** After adding the Favorite model, make sure to push the schema:

```bash
npm run db:push --workspace=server
```

### Development

Run both client and server concurrently:

```bash
npm run dev
```

Run only the client:

```bash
npm run dev:client
```

Run only the server:

```bash
npm run dev:server
```

### Building

Build all workspaces:

```bash
npm run build
```

Build specific workspace:

```bash
npm run build:client
npm run build:server
```

## Environment Variables

### Server (.env)

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production/test)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT secret key (min 32 characters)
- `JWT_EXPIRES_IN` - Access token expiry (default: 15m)
- `REFRESH_TOKEN_EXPIRES_IN` - Refresh token expiry (default: 7d)
- `FRONTEND_URL` - Frontend URL for CORS
- `REDIS_URL` - Redis connection string (optional)
- `STRIPE_SECRET_KEY` - Stripe secret key for booking payments (required for `/api/bookings`; use test keys in development)

### Client (.env)

- `VITE_API_URL` - Backend API URL (default: http://localhost:3001/api)
- `VITE_MAPBOX_TOKEN` - Mapbox API token (optional)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for Elements on the payment page

## Database Management

- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with initial data
- `npm run db:generate` - Generate Prisma Client

## Workspaces

### Client

React application built with Vite and TypeScript.

**Features:**
- React Router with protected routes
- Role-based access control
- Zustand for state management
- React Query for server state
- Tailwind CSS for styling
- Form validation with React Hook Form + Zod

### Server

Backend server built with Fastify and TypeScript.

**Features:**
- Fastify web framework
- Prisma ORM with PostgreSQL
- JWT authentication
- Refresh token rotation
- Role-based access control
- Zod validation
- Centralized error handling

### Shared

Shared utilities, types, and constants used across client and server.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate token
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user (protected)

### User Dashboard (Protected)

- `GET /api/users/me/profile` - Get user profile with stats
- `PATCH /api/users/me/profile` - Update profile
- `POST /api/users/me/avatar` - Upload avatar
- `GET /api/users/me/stats` - Get dashboard stats
- `GET /api/users/me/activity` - Get activity feed
- `GET /api/users/me/passport` - Get passport data
- `GET /api/users/me/favorites` - Get favorites
- `POST /api/users/me/favorites/:businessId` - Add favorite
- `DELETE /api/users/me/favorites/:businessId` - Remove favorite
- `GET /api/users/me/settings` - Get settings
- `PATCH /api/users/me/settings` - Update settings
- `DELETE /api/users/me` - Delete account

### Check-ins (Protected)

- `GET /api/checkins` - Get check-in history
- `GET /api/checkins/locations` - Get unique check-in locations
- `GET /api/checkins/can-check-in/:businessId` - Check if can check in
- `POST /api/checkins/:businessId` - Perform check-in

### Businesses

- `GET /api/businesses` - List businesses
- `GET /api/businesses/nearby` - Get nearby businesses
- `GET /api/businesses/:id` - Get business details
- `GET /api/businesses/map` - Get businesses for map bounds

### Communities

- `GET /api/communities` - List communities
- `GET /api/communities/:id` - Community detail
- `GET /api/communities/:id/members` - Community members
- `GET /api/communities/:id/waveleaders` - Assigned WaveLeaders
- `POST /api/communities/:id/join` - Join community (protected)
- `POST /api/communities/:id/leave` - Leave community (protected)
- `GET /api/users/me/communities` - User's communities (protected)

### WaveLeader (Public Discovery)

- `GET /api/waveleader` - List WaveLeaders with filters
- `GET /api/waveleader/nearby` - Nearby WaveLeaders
- `GET /api/waveleader/search` - Text search
- `GET /api/waveleader/:id/profile` - Public profile
- `GET /api/waveleader/:id/reviews` - Reviews
- `GET /api/waveleader/:id/availability` - Availability

### WaveLeader (Protected, WaveLeader/Admin)

- `POST /api/waveleader/register` - Register as WaveLeader
- `GET /api/waveleader/me` - Own profile
- `PATCH /api/waveleader/me` - Update profile
- `GET /api/waveleader/dashboard` - Dashboard data
- `GET /api/waveleader/stats` - Stats
- `PATCH /api/waveleader/me/availability` - Toggle availability
- `GET /api/waveleader/me/service-area` - Get service area
- `PUT /api/waveleader/me/service-area` - Update service area
- `GET /api/waveleader/opportunities` - Nearby opportunities
- `POST /api/waveleader/me/portfolio/upload` - Add portfolio image
- `DELETE /api/waveleader/me/portfolio/:imageId` - Remove portfolio image

### Business Dashboard (Protected, Business/Admin)

- `GET /api/business/dashboard` - Dashboard overview
- `GET /api/business/stats` - Stats cards data
- `GET /api/business/revenue` - Revenue series for charts
- `GET /api/business/analytics` - Analytics metrics and series
- `GET /api/business/analytics/peak-hours` - Peak hours table data
- `GET /api/business/analytics/top-customers` - Top customers data
- `GET /api/business/analytics/promotions-performance` - Promotion performance table
- `GET /api/business/analytics/customer-locations` - Customer heatmap data
- `GET /api/business/checkins/recent` - Recent check-ins
- `GET /api/business/location` - Current business location and ad radius
- `PATCH /api/business/location` - Update business location
- `GET /api/business/competitors` - Nearby same-type competitors
- `GET /api/business/waveleaders` - Nearby WaveLeaders for partnerships
- `GET /api/business/ads` - List advertisements
- `POST /api/business/ads` - Create advertisement
- `GET /api/business/ads/estimate` - Estimate ad reach and pricing
- `PATCH /api/business/ads/:id` - Update advertisement
- `DELETE /api/business/ads/:id` - Delete advertisement
- `POST /api/business/ads/:id/pause` - Pause advertisement
- `POST /api/business/ads/:id/resume` - Resume advertisement

### Health Check

- `GET /api/health` - Server health check

## Milestones

### Milestone 1 ✅

✅ Monorepo structure with workspaces
✅ Database schema with Prisma
✅ Authentication system (register, login, JWT)
✅ Protected routes with role-based access
✅ Frontend authentication UI
✅ Environment configuration
✅ Docker Compose for local development
✅ Error handling and validation
✅ TypeScript throughout

### Milestone 5 ✅ - Communities & WaveLeader System

**Duration:** 2 Weeks | **Status:** Complete

✅ Community System
- Communities page with all 6 communities
- Community detail page with members and WaveLeaders
- Join/leave community
- Member count display
- Availability toggle per community

✅ WaveLeader Registration
- 6-step registration flow
- Service area selector with map
- Portfolio upload (URLs)
- Community selection
- Submit creates WaveLeader profile
- User role changes to WAVELEADER
- Redirects to dashboard after registration

✅ WaveLeader Dashboard & Profile
- Dashboard with stats and availability toggle
- Service area map page with edit
- Profile editing (display name, specialty, description, hourly rate)
- Portfolio images (add/remove)
- Public profile page
- Reviews display

✅ WaveLeader Discovery
- Public /waveleaders page
- Search by specialty and name
- Filters (rate, rating, availability, distance, verified)
- WaveLeader cards with View Profile
- Pagination
- Nearby search with location
- Sort options

✅ Map Integration
- WaveLeaders on user map (purple markers)
- WaveLeader popup with View Profile / Book Now
- WaveLeaders tab in map sidebar
- Service area circle on WaveLeader map

✅ API Endpoints
- `GET /api/waveleader` - List WaveLeaders with filters
- `GET /api/waveleader/nearby` - Nearby WaveLeaders
- `GET /api/waveleader/search` - Text search
- `GET /api/waveleader/:id/profile` - Public profile
- `GET /api/waveleader/:id/reviews` - Reviews
- `GET /api/waveleader/:id/availability` - Availability
- `POST /api/waveleader/register` - Register as WaveLeader
- `GET/PATCH /api/waveleader/me` - Own profile
- `GET /api/waveleader/dashboard` - Dashboard data
- `PATCH /api/waveleader/me/availability` - Toggle availability
- `GET/PUT /api/waveleader/me/service-area` - Service area
- `POST /api/waveleader/me/portfolio/upload` - Add portfolio image
- `DELETE /api/waveleader/me/portfolio/:imageId` - Remove portfolio image
- `GET /api/communities` - List communities
- `GET /api/communities/:id` - Community detail
- `POST /api/communities/:id/join` - Join community
- `POST /api/communities/:id/leave` - Leave community
- `GET /api/users/me/communities` - User's communities

**Placeholder pages (future milestones):**
- WaveLeader Bookings - M6
- WaveLeader Earnings - M6+
- WaveLeader Analytics - M6+
- WaveLeader Communities - links to /communities
- WaveLeader Settings - links to /dashboard/settings

### Milestone 7 ✅ - Business Dashboard & Advertisements

**Status:** Complete with API integration and verification

✅ Business dashboard
- Dedicated business layout, sidebar, and header
- Stats cards for check-ins, revenue, promotions, and rating
- Revenue chart, recent check-ins, and map widget
- Business map page with competitors, heatmap, WaveLeaders, and ad coverage

✅ Business analytics
- Time-period selector with comparison support
- Metrics cards with trend data
- Check-ins, revenue, and customer insights charts
- Peak hours, top customers, and promotion performance tables

✅ Advertisement system
- Advertisements list with status tabs
- Create/edit multi-step form
- Dynamic pricing and reach estimation
- Pause, resume, and delete actions

✅ Discovery integration
- Sponsored businesses prioritized in public discovery
- Sponsored badges shown on browse surfaces and business detail
- Ad impressions tracked when sponsored businesses are shown
- Ad clicks tracked when sponsored business profiles are opened

**Dynamic pricing formula**
- Base price: `$150/day`
- Radius multiplier: `1-5mi = 1x`, `6-10mi = 1.5x`, `11-15mi = 2x`, `16-20mi = 2.5x`, `21-25mi = 3x`
- Peak hours boost: `+20%`
- Demographic targeting: `+$50/day`
- Weekend boost: `+$100/day`

### Milestone 4 ✅ - User Dashboard with Map Integration

**Duration:** 1 Week | **Budget:** $500

✅ User Dashboard Layout & Structure
- Fixed sidebar navigation (collapsible)
- Top header with search, notifications, user menu
- Responsive design with mobile drawer

✅ User Dashboard Home Page
- Welcome section with quick actions
- Stats cards (check-ins, points, bookings, favorites)
- Map widget with nearby places
- Upcoming bookings list
- Recent activity timeline

✅ Map Widget Component
- Reusable embeddable map component
- Multiple sizes (small, medium, large)
- Mini popup on marker click
- Expand to full map

✅ User Explore Map Page
- Full-screen map with sidebar
- Tabs: Explore, My Places, WaveLeaders, Events
- User location tracking
- Favorites and check-in layers
- Interactive business popups

✅ Check-in Flow & Components
- Check-in button with geofencing
- Distance validation (100m radius)
- Success animation with points
- Check-in modal with celebration
- Points and streak tracking

✅ User Profile & Settings Pages
- Profile page with editable information
- Avatar upload
- Statistics and communities
- Settings with tabs (Account, Privacy, Notifications, Preferences)
- Password change and account deletion

✅ My Places (Favorites) Page
- Favorites and visited places tabs
- Search, filter, and sort functionality
- Map integration
- Place cards with quick actions

✅ User API Endpoints
- Complete REST API for all user features
- Profile, stats, activity, passport endpoints
- Favorites management
- Settings management
- Check-in endpoints

## Routes

### User Dashboard Routes

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | UserDashboard | Overview with stats and map widget |
| `/dashboard/map` | UserMapPage | Full explore map with layers |
| `/dashboard/places` | PlacesPage | Favorites and visited places |
| `/dashboard/passport` | PassportPage | Digital passport with QR code |
| `/dashboard/profile` | ProfilePage | User profile management |
| `/dashboard/settings` | SettingsPage | User settings and preferences |
| `/dashboard/bookings` | BookingsPage | Placeholder (Milestone 6) |
| `/dashboard/communities` | CommunitiesPage | Browse and join communities |
| `/waveleaders` | WaveLeadersPage | Discover WaveLeaders (public) |
| `/dashboard/rewards` | RewardsPage | Placeholder (Milestone 9) |

### Business Routes

| Route | Page | Description |
|-------|------|-------------|
| `/business/dashboard` | BusinessDashboard | Business home with stats, chart, and map widget |
| `/business/analytics` | BusinessAnalyticsPage | Trends, charts, and tables |
| `/business/map` | BusinessMapPage | Business location, competitors, heatmap, and WaveLeaders |
| `/business/ads` | AdvertisementsPage | Advertisement management |
| `/business/ads/create` | CreateAdPage | Create new advertisement |
| `/business/ads/:id/edit` | CreateAdPage | Edit advertisement |

## Testing

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| User | user@wavefinder.com | User123! |
| Admin | admin@wavefinder.com | Admin123! |
| Business | business@wavefinder.com | Business123! |
| WaveLeader | waveleader@wavefinder.com | WaveLeader123! |

### Testing Checklist

#### User Layout
- ✅ Sidebar shows all navigation items
- ✅ Active route is highlighted
- ✅ Sidebar collapses/expands
- ✅ Mobile drawer works
- ✅ Header shows user info
- ✅ Logout works

#### Dashboard Home
- ✅ Stats cards show correct counts
- ✅ Map widget loads and shows markers
- ✅ "Explore Full Map" navigates to /dashboard/map
- ✅ Upcoming bookings list renders
- ✅ Recent activity shows items

#### Explore Map
- ✅ Full map loads
- ✅ All filters work
- ✅ Favorites tab shows user's favorites
- ✅ Can add/remove favorites from map
- ✅ Marker clicks work

#### Digital Passport
- ✅ Passport card renders with user data
- ✅ QR code generates
- ✅ Level badge is correct
- ✅ Check-in map shows all locations

#### Check-in System
- ✅ Check-in button appears on business popup
- ✅ Geolocation permission requested
- ✅ "Too far" message shows when appropriate
- ✅ Check-in succeeds when in range
- ✅ Points animation plays
- ✅ Stats update after check-in

#### My Places
- ✅ Favorites tab shows saved places
- ✅ Visited tab shows check-in history
- ✅ Can remove favorites
- ✅ Map syncs with list
- ✅ Search works
- ✅ Sort options work

#### Profile & Settings
- ✅ Profile shows user info
- ✅ Can edit name, phone, bio
- ✅ Avatar upload works
- ✅ Settings tabs all accessible
- ✅ Toggle switches save changes

### Demo Flow

1. Login as `user@wavefinder.com` / `User123!`
2. Dashboard shows welcome message and stats
3. Click "Explore Map" - full map opens
4. Find a business, click marker
5. Click "Save to Favorites" - heart fills
6. Go to My Places - business appears in favorites
7. Go back to map, find a nearby business
8. Click "Check In" (may need to allow location)
9. See success animation and points
10. Go to Passport - see new stamp
11. Check stats updated on dashboard

### Milestone 7 Demo Flow

**Business owner journey:**
1. Login as `business@wavefinder.com` / `Business123!`
2. Confirm redirect to `/business/dashboard`
3. Review stats cards, revenue chart, and recent check-ins
4. Open Analytics and review peak hours and top customers
5. Open Map and toggle competitors, heatmap, and WaveLeaders
6. Open Advertisements and create a campaign
7. Adjust radius/targeting and verify pricing changes
8. Launch the ad, then pause/resume/delete it from the list
9. Visit `/dashboard/map` as a user and confirm sponsored businesses surface first

### Milestone 5 Demo Flow

**User Journey:**
1. Login as `user@wavefinder.com` / `User123!`
2. Go to /communities - see all 6 communities
3. Join "Nightlife & Entertainment"
4. View community detail - see members and WaveLeaders
5. Click WaveLeader's public profile
6. Browse /waveleaders - filter by specialty
7. Use "Use my location" for nearby search
8. Click WaveLeader card → View Profile
9. Enable WaveLeaders layer on /dashboard/map
10. Click purple marker → popup with View Profile / Book Now

**WaveLeader Journey:**
1. Login as `waveleader@wavefinder.com` / `WaveLeader123!`
2. View dashboard with stats
3. Toggle availability
4. Go to Service Area map - edit location, radius
5. Save changes
6. Edit profile - add portfolio image URL
7. View public profile at /waveleader/:id/profile
8. Check communities in profile

**New WaveLeader Registration:**
1. Logout, go to /become-waveleader
2. Click "Get Started" → /waveleader/register
3. Complete all 6 steps
4. Submit application
5. Login with new account → WaveLeader dashboard

### Known Limitations (M5)

- Portfolio upload accepts URLs only (no file upload)
- Booking flow not implemented (M6)
- Earnings/analytics pages are placeholders
- Availability time slots are mock data
- Service area uses haversine (no PostGIS)

## License

MIT
