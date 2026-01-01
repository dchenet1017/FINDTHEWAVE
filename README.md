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

4. Seed initial data (communities):

```bash
npm run db:seed --workspace=server
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

### Client (.env)

- `VITE_API_URL` - Backend API URL (default: http://localhost:3001/api)
- `VITE_MAPBOX_TOKEN` - Mapbox API token (optional)

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

### Health Check

- `GET /api/health` - Server health check

## Milestone 1 Checklist

✅ Monorepo structure with workspaces
✅ Database schema with Prisma
✅ Authentication system (register, login, JWT)
✅ Protected routes with role-based access
✅ Frontend authentication UI
✅ Environment configuration
✅ Docker Compose for local development
✅ Error handling and validation
✅ TypeScript throughout

## License

MIT
