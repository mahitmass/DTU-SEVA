const express = require("express");
const cors = require("cors");
const { WebSocketServer } = require("ws");

const app = express();
const REST_PORT = 3001;
const WS_PORT = 8080;

app.use(cors());
app.use(express.json());

let latestData = {
  heel: 0,
  outer: 0,
  inner: 0,
  toe: 0,
  timestamp: Date.now(),
};

let history = [];

// WebSocket Server on 8080 for instant live UI updates
const wss = new WebSocketServer({ port: WS_PORT });

function broadcast(data) {
  const payload = JSON.stringify({ type: "LIVE_PRESSURE", data });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "LIVE_PRESSURE", data: latestData }));
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "SEVA First Backend Running", latestData });
});

// Get latest readings
app.get("/api/pressure", (req, res) => {
  res.json({ latest: latestData, history: history.slice(-50) });
});

// Receive data from ESP32 over Wi-Fi HTTP POST
app.post("/api/pressure", (req, res) => {
  const body = req.body || {};

  const heel = Number(body.heel ?? 0);
  const outer = Number(body.outer ?? body.rightBall ?? 0);
  const inner = Number(body.inner ?? body.leftBall ?? 0);
  const toe = Number(body.toe ?? 0);

  latestData = {
    heel,
    outer,
    inner,
    toe,
    timestamp: Date.now(),
  };

  history.push(latestData);
  if (history.length > 200) history.shift();

  console.log(`[ESP32 DATA] Heel: ${heel} | Outer: ${outer} | Inner: ${inner} | Toe: ${toe}`);
  broadcast(latestData);

  res.status(200).json({ success: true, data: latestData });
});

app.listen(REST_PORT, "0.0.0.0", () => {
  console.log(`✅ REST API Server listening on http://0.0.0.0:${REST_PORT}`);
  console.log(`✅ WebSocket Server listening on ws://localhost:${WS_PORT}`);
});
