# Smart Diabetic Insole (Feet Health)

Local prototype for live plantar-pressure monitoring, gait insights, and medicine reminders.

This repo is meant to be cloned and run as-is. `database.db` is **tracked** so the team can share the same prototype data. SQLite sidecar files (`*.db-wal`, `*.db-shm`) are **not** tracked.

## Tech stack

| Layer | What we use |
| --- | --- |
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Custom backend | `server.js` — Express REST API on port **3001**, WebSocket on port **8080** |
| Database | SQLite (`database.db`) via `better-sqlite3` |
| App folders | `app/`, `components/`, `context/`, `lib/` |

Default local URLs:

- UI: http://localhost:3000
- REST: http://localhost:3001 (`GET /api/health` to confirm the backend)
- WebSocket: ws://localhost:8080

Optional env vars (only if you need to override defaults): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`. Copy from `.env.example` if the team adds one; never commit a real `.env`.

---

## Prerequisites (all OS)

Install **Node.js 18+** (LTS recommended) from [https://nodejs.org](https://nodejs.org). This also installs `npm`.

Confirm in a terminal:

```bash
node -v
npm -v
```

`better-sqlite3` is a **native** addon. If `npm install` fails on compile:

- **macOS:** install Xcode Command Line Tools  
  `xcode-select --install`
- **Windows:** install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the **Desktop development with C++** workload (needed to compile native modules)

Use **PowerShell** or **Command Prompt** on Windows, and **Terminal** (zsh/bash) on macOS. Commands below are written for each.

---

## 1. Clone the repository

**macOS**

```bash
git clone <REPO_URL>
cd Archive
```

**Windows (PowerShell or CMD)**

```powershell
git clone <REPO_URL>
cd Archive
```

Use the folder name your clone actually creates. Paths on Windows use `\`; Git and npm still accept `/` in most cases.

---

## 2. Install dependencies

Run this **once** after clone, from the project root (same command on both OS):

```bash
npm install
```

This creates `node_modules/` locally. That folder is gitignored and should never be committed.

If install looks corrupted, delete it and retry:

**macOS**

```bash
rm -rf node_modules
npm install
```

**Windows (PowerShell)**

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 3. Run the app

### Recommended: frontend + backend together

`package.json` starts Next.js and `server.js` at the same time:

```bash
npm run dev
```

Leave that process running. Open http://localhost:3000 in a browser.

### Backend only

Use this when you only need the API / WebSocket (ESP32, Postman, etc.):

```bash
node server.js
```

The custom server seeds `database.db` if tables are empty, then listens on **3001** (HTTP) and **8080** (WebSocket).

### Frontend only

```bash
npm run dev:frontend
```

The UI still expects the backend at `http://localhost:3001`. Start `node server.js` in a **second** terminal if you split the processes.

**macOS — two terminals**

```bash
# Terminal 1
node server.js

# Terminal 2
npm run dev:frontend
```

**Windows — two terminals (PowerShell)**

```powershell
# Window 1
node server.js

# Window 2
npm run dev:frontend
```

### Production-style Next.js build (optional)

```bash
npm run build
npm start
```

`npm start` only serves the Next.js app. You still need `node server.js` for the API and WebSocket.

---

## Database

| File | Git | Purpose |
| --- | --- | --- |
| `database.db` | **tracked** | Prototype SQLite database |
| `database.db-wal` | ignored | SQLite write-ahead log (created at runtime) |
| `database.db-shm` | ignored | SQLite shared memory (created at runtime) |

Do not commit WAL/SHM files. After a clean clone, running `node server.js` or `npm run dev` is enough; the server opens `database.db` and creates tables if needed.

---

## OS-specific junk (do not commit)

These files are created by the OS or the toolchain, not by the app. `.gitignore` already excludes them.

| OS | Typical noise |
| --- | --- |
| macOS | `.DS_Store`, `._*`, `__MACOSX/` (from zip extracts) |
| Windows | `Thumbs.db`, `Desktop.ini`, `$RECYCLE.BIN/` |
| Both | `node_modules/`, `.next/`, `.env`, `*.log` |

If a zip on macOS added a `__MACOSX` folder, delete it locally; do not add it to git.

**macOS**

```bash
rm -rf __MACOSX .DS_Store
```

**Windows (PowerShell)**

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
```

---

## Environment variables (optional)

Defaults are localhost. To override:

**macOS (bash/zsh)**

```bash
export NEXT_PUBLIC_API_URL=http://localhost:3001
export NEXT_PUBLIC_WS_URL=ws://localhost:8080
npm run dev
```

**Windows (PowerShell)**

```powershell
$env:NEXT_PUBLIC_API_URL="http://localhost:3001"
$env:NEXT_PUBLIC_WS_URL="ws://localhost:8080"
npm run dev
```

**Windows (CMD)**

```bat
set NEXT_PUBLIC_API_URL=http://localhost:3001
set NEXT_PUBLIC_WS_URL=ws://localhost:8080
npm run dev
```

Prefer a local `.env` file over exporting in the shell. `.env` is gitignored.

---

## Stop the servers / free a port

**macOS** — Ctrl+C in the terminal, or:

```bash
lsof -i :3000
kill -9 <PID>
```

**Windows (PowerShell)** — Ctrl+C in the terminal, or:

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Replace `3000` with `3001` or `8080` if those ports are stuck.

---

## Scripts reference

| Command | What it does |
| --- | --- |
| `npm install` | Install Node dependencies |
| `npm run dev` | Next.js (3000) **and** `server.js` (3001 + 8080) |
| `npm run dev:frontend` | Next.js only |
| `npm run dev:backend` | `node server.js` only |
| `node server.js` | Custom Express + WebSocket server |
| `npm run build` | Production Next.js build |
| `npm start` | Serve the Next.js production build |
| `npm run lint` | ESLint |

---

## Quick health check

1. `npm run dev` with no errors in the terminal.
2. Browser: http://localhost:3000 loads the app.
3. Browser or curl: http://localhost:3001/api/health returns JSON with `"ok": true`.

**macOS**

```bash
curl http://localhost:3001/api/health
```

**Windows (PowerShell)**

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

---

## ESP32 hardware

Sketch: `firmware/esp32_insole.ino`. Laptop and ESP32 must be on the **same Wi-Fi** (or laptop hotspot). Use the laptop's LAN IP, never `localhost`.

1. In the sketch, set `ssid`, `password`, and `serverURL` to `http://YOUR_LAPTOP_IP:3001/api/pressure`.
2. From `Archive`: `npm run dev`.
3. Find your IP (`ipconfig` on Windows). Allow Node through Windows Firewall for ports **3001** and **8080**.
4. ESP32 POSTs `{ heel, leftBall, rightBall, toe }`. The server maps `leftBall` → inner and `rightBall` → outer, saves SQLite, and broadcasts on WebSocket **8080**. `POST /api/ingest` still accepts `{ heel, outer, inner, toe }`.
