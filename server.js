const http = require("http");
const express = require("express");
const cors = require("cors");
const { WebSocketServer } = require("ws");
const { openDb, seedIfEmpty, hashPassword, verifyPassword } = require("./lib/db");
const { generateInsights, improvementStatus, downsample, THRESHOLD } = require("./lib/insights");

const REST_PORT = 3001;
const WS_PORT = 8080;

const db = openDb();
seedIfEmpty(db);

const stmts = {
  createUser: db.prepare("INSERT INTO users (username, password) VALUES (?, ?)"),
  findUser: db.prepare("SELECT id, username, password FROM users WHERE username = ?"),
  userById: db.prepare("SELECT id, username FROM users WHERE id = ?"),
  insertLog: db.prepare(
    "INSERT INTO pressure_logs (user_id, timestamp, heel, outer, inner, toe) VALUES (?, ?, ?, ?, ?, ?)"
  ),
  recentLogs: db.prepare(
    "SELECT * FROM pressure_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?"
  ),
  logsSince: db.prepare(
    "SELECT * FROM pressure_logs WHERE user_id = ? AND timestamp >= ? ORDER BY timestamp ASC"
  ),
  allLogs: db.prepare("SELECT * FROM pressure_logs WHERE user_id = ? ORDER BY timestamp ASC"),
  listMeds: db.prepare("SELECT * FROM medicines WHERE user_id = ? ORDER BY time ASC"),
  insertMed: db.prepare(
    "INSERT INTO medicines (user_id, name, time, frequency) VALUES (?, ?, ?, ?)"
  ),
  updateMed: db.prepare(
    "UPDATE medicines SET name = ?, time = ?, frequency = ? WHERE id = ? AND user_id = ?"
  ),
  deleteMed: db.prepare("DELETE FROM medicines WHERE id = ? AND user_id = ?"),
  firstUser: db.prepare("SELECT id FROM users ORDER BY id ASC LIMIT 1"),
};

function clampSensor(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(4095, Math.round(n)));
}

function parsePressure(raw) {
  return { 
    heel: clampSensor(raw.heel), 
    outer: clampSensor(raw.outer), 
    inner: clampSensor(raw.inner), 
    toe: clampSensor(raw.toe) 
  };
}

function resolveUserId(req) {
  const header = req.headers["x-user-id"];
  const q = req.query.userId;
  const body = req.body && req.body.userId;
  const id = Number(header || q || body);
  if (Number.isInteger(id) && id > 0) {
    const row = stmts.userById.get(id);
    if (row) return row.id;
  }
  const first = stmts.firstUser.get();
  return first ? first.id : 1;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ws: `ws://${_req.hostname}:${WS_PORT}`, threshold: THRESHOLD });
});

app.post("/api/auth/signup", (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (username.length < 3) return res.status(400).json({ error: "Username must be at least 3 characters." });
    if (password.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters." });
    if (stmts.findUser.get(username)) return res.status(409).json({ error: "Username already exists." });
    
    const info = stmts.createUser.run(username, hashPassword(password));
    res.json({ id: info.lastInsertRowid, username });
  } catch (err) {
    res.status(500).json({ error: "Database error during signup." });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = stmts.findUser.get(username);
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: "Invalid username or password." });
    }
    res.json({ id: user.id, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Database error during login." });
  }
});

app.get("/api/auth/me", (req, res) => {
  const id = Number(req.query.userId);
  const user = stmts.userById.get(id);
  if (!user) return res.status(401).json({ error: "Not signed in." });
  res.json(user);
});

function persistAndBroadcast(userId, sensors, source) {
  try {
    const timestamp = Date.now();
    stmts.insertLog.run(userId, timestamp, sensors.heel, sensors.outer, sensors.inner, sensors.toe);
    const payload = {
      type: "pressure",
      userId,
      timestamp,
      source,
      threshold: THRESHOLD,
      ...sensors,
    };
    const packed = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(packed);
    }
    latestByUser.set(userId, payload);
    return payload;
  } catch (err) {
    console.error("[db] Error persisting log:", err);
  }
}

app.post("/api/ingest", (req, res) => {
  const userId = resolveUserId(req);
  const sensors = parsePressure(req.body || {});
  const saved = persistAndBroadcast(userId, sensors, "http");
  res.json({ ok: true, saved });
});

app.get("/api/insights", (req, res) => {
  try {
    const userId = resolveUserId(req);
    const rows = stmts.recentLogs.all(userId, 800).reverse();
    res.json({
      userId,
      count: rows.length,
      insights: generateInsights(rows),
      generatedAt: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate insights." });
  }
});

app.get("/api/trends", (req, res) => {
  try {
    const userId = resolveUserId(req);
    const days = Math.min(14, Math.max(1, Number(req.query.days) || 7));
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const rows = stmts.logsSince.all(userId, since);
    res.json({
      userId,
      days,
      threshold: THRESHOLD,
      status: improvementStatus(rows),
      series: downsample(rows, 220).map((r) => ({
        timestamp: r.timestamp,
        heel: r.heel,
        outer: r.outer,
        inner: r.inner,
        toe: r.toe,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trends." });
  }
});

app.get("/api/medicines", (req, res) => {
  try {
    const userId = resolveUserId(req);
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const meds = stmts.listMeds.all(userId).map((m) => ({
      ...m,
      missed: m.frequency === "Daily" && m.time < hm,
    }));
    res.json(meds);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch medicines." });
  }
});

app.post("/api/medicines", (req, res) => {
  try {
    const userId = resolveUserId(req);
    const name = String(req.body.name || "").trim();
    const time = String(req.body.time || "").trim();
    const frequency = String(req.body.frequency || "Daily");
    if (!name || !time) return res.status(400).json({ error: "Name and time are required." });
    
    const info = stmts.insertMed.run(userId, name, time, frequency);
    res.json({ id: info.lastInsertRowid, user_id: userId, name, time, frequency, missed: false });
  } catch (err) {
    res.status(500).json({ error: "Failed to save medicine." });
  }
});

app.put("/api/medicines/:id", (req, res) => {
  try {
    const userId = resolveUserId(req);
    const id = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    const time = String(req.body.time || "").trim();
    const frequency = String(req.body.frequency || "Daily");
    
    if (!name || !time) return res.status(400).json({ error: "Name and time are required." });
    stmts.updateMed.run(name, time, frequency, id, userId);
    res.json({ id, user_id: userId, name, time, frequency });
  } catch (err) {
    res.status(500).json({ error: "Failed to update medicine." });
  }
});

app.delete("/api/medicines/:id", (req, res) => {
  try {
    const userId = resolveUserId(req);
    stmts.deleteMed.run(Number(req.params.id), userId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete medicine." });
  }
});

app.post("/api/demo/start", (req, res) => {
  const userId = resolveUserId(req);
  startSimulator(userId);
  res.json({ ok: true, simulating: true, userId });
});

app.post("/api/demo/stop", (_req, res) => {
  stopSimulator();
  res.json({ ok: true, simulating: false });
});

// --- CRITICAL BINDING UPDATE ---
// Binding to 0.0.0.0 ensures the REST API is accessible across the Windows Hotspot
const httpServer = http.createServer(app);
httpServer.listen(REST_PORT, "0.0.0.0", () => {
  console.log(`[api] REST Server listening on http://0.0.0.0:${REST_PORT}`);
});

// Binding to 0.0.0.0 ensures the WebSocket is accessible to your ESP32 and mobile phone
const wss = new WebSocketServer({ port: WS_PORT, host: "0.0.0.0" });
const latestByUser = new Map();
let simTimer = null;
let simUserId = 1;
let simStep = 0;
let lastEsp32 = 0;

function gaitSample(step) {
  const phase = (step % 20) / 20;
  const noise = () => (Math.random() - 0.5) * 140;
  let heel = 280 + noise();
  let outer = 260 + noise();
  let inner = 270 + noise();
  let toe = 240 + noise();

  if (phase < 0.22) {
    heel = 2400 + phase * 5000 + noise();
  } else if (phase < 0.55) {
    outer = 1500 + Math.sin(phase * 12) * 400 + noise();
    inner = 1700 + Math.sin(phase * 11) * 380 + noise();
  } else {
    toe = 1600 + (phase - 0.55) * 3800 + noise();
    inner = 1200 + noise();
  }

  if (step % 47 === 0) toe += 1700;
  if (step % 61 === 0) heel += 1500;

  return {
    heel: clampSensor(heel),
    outer: clampSensor(outer),
    inner: clampSensor(inner),
    toe: clampSensor(toe),
  };
}

function startSimulator(userId) {
  simUserId = userId || simUserId;
  if (simTimer) return;
  simTimer = setInterval(() => {
    // If ESP32 is actively sending data, the simulator stays quiet.
    // If it disconnects for > 2.5 seconds, the simulator automatically takes over.
    if (Date.now() - lastEsp32 < 2500) return;
    simStep += 1;
    persistAndBroadcast(simUserId, gaitSample(simStep), "simulator");
  }, 420);
  console.log(`[sim] Gait simulator active for user ${simUserId}`);
}

function stopSimulator() {
  if (simTimer) {
    clearInterval(simTimer);
    simTimer = null;
    console.log("[sim] Gait simulator offline");
  }
}

wss.on("connection", (socket) => {
  console.log("[ws] New client connected via Wi-Fi");
  socket.send(
    JSON.stringify({
      type: "hello",
      threshold: THRESHOLD,
      message: "Send {\"heel\":0,\"outer\":0,\"inner\":0,\"toe\":0} from ESP32",
    })
  );

  if (!simTimer) {
    const first = stmts.firstUser.get();
    startSimulator(first ? first.id : 1);
  }

  socket.on("message", (buf) => {
    let msg;
    try {
      msg = JSON.parse(buf.toString());
    } catch {
      return;
    }
    if (msg && msg.type === "hello") return;
    if (msg && ["heel", "outer", "inner", "toe"].some((k) => k in msg)) {
      lastEsp32 = Date.now();
      const userId = Number(msg.userId) || simUserId || 1;
      persistAndBroadcast(userId, parsePressure(msg), "esp32");
    }
  });

  socket.on("close", () => {
    console.log("[ws] Client disconnected");
  });
});

console.log(`[ws] WebSocket Server listening on ws://0.0.0.0:${WS_PORT}`);

process.on("SIGINT", () => {
  stopSimulator();
  wss.close();
  httpServer.close();
  db.close();
  process.exit(0);
});