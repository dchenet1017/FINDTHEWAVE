# Run and Test WaveFinder

## Prerequisites

- **Node.js** v18+ (v20+ recommended)
- **PostgreSQL** – either via Docker or installed locally

---

## Step 1: Start the database

### Option A: Docker (recommended)

1. Start **Docker Desktop**.
2. From the project root:

```powershell
docker-compose up -d postgres
```

3. Wait a few seconds, then check:

```powershell
docker ps
```

You should see `wavefinder-db` on port 5433.

### Option B: Local PostgreSQL

1. Install PostgreSQL and create a database named `wavefinder`.
2. In `server/.env`, set:

```
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/wavefinder"
```

Use your actual username, password, and port (often 5432).

---

## Step 2: Apply schema and seed data

From the project root:

```powershell
cd server
npx prisma generate
npx prisma db push
npx prisma db seed
cd ..
```

Or from root with workspaces:

```powershell
npm run db:push --workspace=server
npm run db:seed --workspace=server
```

You should see “Database seeded successfully!” and the test users listed.

---

## Step 3: Run the application

From the project root:

```powershell
npm run dev
```

This starts:

- **Client:** http://localhost:5173 (Vite)
- **Server:** http://localhost:3001 (or the port in `server/.env`)

If you see “EADDRINUSE” for the server port, either stop the other process or change `PORT` in `server/.env`.

---

## Step 4: Test in the browser

1. Open **http://localhost:5173**.
2. Log in with one of these accounts:

| Role       | Email                     | Password       |
|-----------|----------------------------|----------------|
| User      | user@wavefinder.com        | User123!       |
| Admin     | admin@wavefinder.com       | Admin123!      |
| Business  | business@wavefinder.com    | Business123!   |
| WaveLeader| waveleader@wavefinder.com  | WaveLeader123! |

### Quick test flows

**As User**

- Dashboard → stats and map.
- **Explore Map** → full map, business markers, favorites.
- **Communities** → list, join/leave, open a community and check members/WaveLeaders.
- **Find WaveLeaders** (sidebar) → `/waveleaders`, search/filters, open a profile.
- On the map, enable “WaveLeaders” in Layers → purple markers, click for popup and “View Profile”.

**As WaveLeader**

- Dashboard → stats, availability toggle.
- **Service Area** (map) → edit location/radius, save.
- **Profile** → edit name/specialty/rate, add portfolio image URL.
- Open your public profile (e.g. from discovery or direct URL).

**New WaveLeader**

- Log out → **Become a WaveLeader** → complete 6-step registration → submit → log in and see WaveLeader dashboard.

---

## Environment (optional)

**Client** (`client/.env`):

- `VITE_API_URL=http://localhost:3001/api` – if the API is on a different port.
- `VITE_MAPBOX_TOKEN=your_token` – for map tiles (optional; app can run without it).

**Server** (`server/.env`):

- `PORT` – default 3001.
- `DATABASE_URL` – required.
- `JWT_SECRET` – required (min 32 characters).
- `FRONTEND_URL` – e.g. `http://localhost:5173` for CORS.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “Can’t reach database” | Start PostgreSQL (Docker or local) and check `DATABASE_URL`. |
| “EADDRINUSE” on server port | Change `PORT` in `server/.env` or stop the process using that port. |
| 401 on API calls | Log in again; token may have expired. |
| Map blank or no tiles | Add `VITE_MAPBOX_TOKEN` in `client/.env` (optional). |
| Client can’t reach API | Set `VITE_API_URL` to your server URL (e.g. `http://localhost:3001/api`). |

---

## Run server and client separately

**Terminal 1 – server:**

```powershell
npm run dev:server
```

**Terminal 2 – client:**

```powershell
npm run dev:client
```

Use the same database and env setup as above.
