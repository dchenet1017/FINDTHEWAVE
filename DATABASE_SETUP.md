# Database Setup Instructions

## 1. Start PostgreSQL (required first)

This project’s Docker Compose file exposes Postgres on **host port `5434`** (see `docker-compose.yml`).

From the **project root** (folder that contains `docker-compose.yml`):

```powershell
docker compose up -d postgres
```

Check that the container is running:

```powershell
docker ps
```

You should see `wavefinder-db` with `0.0.0.0:5434->5432/tcp`.

**`DATABASE_URL` in `server/.env` must match that port**, for example:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5434/wavefinder?schema=public"
```

### Error: `P1001: Can't reach database server at localhost:5434`

| Cause | What to do |
|--------|------------|
| Docker Desktop not running | Start **Docker Desktop** and wait until it is ready. |
| Container stopped | Run `docker compose up -d postgres` from project root. |
| Wrong port in `.env` | Use **`5434`** if you use this repo’s `docker-compose.yml`. |

---

## 2. Prisma: `db push` and `generate`

```powershell
cd server
npx prisma db push
npx prisma generate
npm run db:seed
```

### Error: `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`

On Windows, another process is often locking the Prisma engine file.

1. **Stop anything using Node** for this project: dev server (`npm run dev`), Prisma Studio, other terminals running `tsx`/`node`.
2. Close extra terminals in Cursor/VS Code, then try again:

   ```powershell
   cd server
   npx prisma generate
   ```

3. If it still fails:
   - Quit **Docker Desktop** only if you’re not using it for DB (optional test).
   - Temporarily **pause real-time protection** in Windows Security for the project folder, or add an exclusion for `Wavefinder`.
   - Run **PowerShell as Administrator** and run `npx prisma generate` from `server` again.

4. Last resort — clear generated client and regenerate:

   ```powershell
   cd C:\Users\Muhammad Kashif\Documents\Dimitry\Wavefinder
   Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
   cd server
   npx prisma generate
   ```

---

## 3. Verify connection

```powershell
cd server
npx prisma studio
```

---

## Alternative: PostgreSQL without Docker

If you use a local Postgres on another port (e.g. **5432** or **5433**), set `DATABASE_URL` to that host/port and create database `wavefinder` with user/password you configure.

---

## Stripe webhooks (local testing)

Set `STRIPE_WEBHOOK_SECRET` in `server/.env`. Then:

```powershell
stripe login
stripe listen --forward-to localhost:3001/api/payments/webhook
```

Trigger test events:```powershell
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```