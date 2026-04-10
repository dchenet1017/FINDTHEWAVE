# Port 3001 Already in Use - Quick Fix

## Problem
Port 3001 is already in use by another process (likely a previous server instance).

## Solutions

### Option 1: Kill the Process Using Port 3001 (Recommended)

**PowerShell:**
```powershell
# Find the process
$process = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1

# Kill it
if ($process) { Stop-Process -Id $process -Force }
```

**Or manually:**
1. Open Task Manager (Ctrl+Shift+Esc)
2. Go to "Details" tab
3. Find "node.exe" or "tsx" processes
4. End the process

### Option 2: Change Server Port

Edit `server/.env`:
```
PORT=3002
```

Then update `server/src/config/index.ts` if needed, or just use the PORT env variable.

### Option 3: Use Different Port Temporarily

```powershell
# Set environment variable for this session
$env:PORT=3002
npm run dev:server
```

## After Fixing

Restart the dev server:
```powershell
npm run dev
```

## Verify Port is Free

```powershell
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
```

If this returns nothing, the port is free.

