const express = require("express");
const cors = require("cors");
const { WebSocketServer } = require("ws");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const app = express();
const REST_PORT = 3001;
const WS_PORT = 8080;

app.use(cors());
app.use(express.json());

let latestData = { heel: 0, outer: 0, inner: 0, toe: 0, timestamp: Date.now() };
let history = [];
let activeUsbPort = "Scanning...";

const wss = new WebSocketServer({ port: WS_PORT });

function broadcast(data) {
  const payload = JSON.stringify({ type: "LIVE_PRESSURE", data, usbPort: activeUsbPort });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(payload);
  });
}

function updateSensorData(body) {
  const heel = Number(body.heel ?? 0);
  const outer = Number(body.outer ?? body.rightBall ?? 0);
  const inner = Number(body.inner ?? body.leftBall ?? 0);
  const toe = Number(body.toe ?? 0);

  latestData = { heel, outer, inner, toe, timestamp: Date.now() };
  history.push(latestData);
  if (history.length > 100) history.shift();
  broadcast(latestData);
}

// AUTO-DETECT WIRED ESP32 USB COM PORT ON WINDOWS
let connectedPort = null;
async function connectWiredESP32() {
  if (connectedPort && connectedPort.isOpen) return;
  try {
    const ports = await SerialPort.list();
    // Look for ESP32 USB chips (CP210x, CH340, USB Serial) or any COM port
    const espPortInfo = ports.find((p) =>
      /usb|uart|cp210|ch340|silicon|wch|com/i.test(
        `${p.path} ${p.manufacturer || ""} ${p.friendlyName || ""}`
      )
    ) || ports[0];

    if (!espPortInfo) {
      activeUsbPort = "No USB COM Port Found";
      return;
    }

    console.log(`?? Connecting to Wired ESP32 on ${espPortInfo.path}...`);
    connectedPort = new SerialPort({ path: espPortInfo.path, baudRate: 115200, autoOpen: false });

    connectedPort.open((err) => {
      if (err) {
        activeUsbPort = `${espPortInfo.path} Busy (Close Arduino IDE!)`;
        console.log(`?? Could not open ${espPortInfo.path}: ${err.message}. Close Arduino Serial Monitor!`);
        connectedPort = null;
        return;
      }
      activeUsbPort = `Connected (${espPortInfo.path})`;
      console.log(`? WIRED ESP32 LIVE ON ${espPortInfo.path}!`);

      const parser = connectedPort.pipe(new ReadlineParser({ delimiter: "\n" }));
      parser.on("data", (line) => {
        const clean = line.trim();
        if (clean.startsWith("{") && clean.endsWith("}")) {
          try {
            const parsed = JSON.parse(clean);
            updateSensorData(parsed);
          } catch (e) {}
        }
      });
    });

    connectedPort.on("close", () => {
      activeUsbPort = "Disconnected";
      connectedPort = null;
    });
  } catch (err) {
    console.error("Serial scan error:", err.message);
  }
}

setInterval(connectWiredESP32, 3000);
connectWiredESP32();

// Mock Auth Endpoints so /account Login & Signup NEVER 404
app.post("/api/auth/signup", (req, res) => {
  const { username } = req.body || {};
  res.json({ ok: true, user: { id: 1, username: username || "demo" }, token: "demo-token" });
});
app.post("/api/auth/login", (req, res) => {
  const { username } = req.body || {};
  res.json({ ok: true, user: { id: 1, username: username || "demo" }, token: "demo-token" });
});
app.get("/api/auth/me", (req, res) => {
  res.json({ ok: true, user: { id: 1, username: "demo" } });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, usbPort: activeUsbPort, latestData });
});

app.get("/api/pressure", (req, res) => {
  res.json({ latest: latestData, usbPort: activeUsbPort, history: history.slice(-30) });
});

app.post("/api/pressure", (req, res) => {
  updateSensorData(req.body || {});
  res.json({ success: true, data: latestData });
});

app.listen(REST_PORT, "0.0.0.0", () => {
  console.log(`? Server running on http://localhost:${REST_PORT}`);
});
