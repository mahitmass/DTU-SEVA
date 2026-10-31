const { spawn } = require("child_process");

function parseSerialLine(raw) {
  if (!raw || typeof raw !== "string") return null;
  const line = raw.trim();
  if (!line) return null;

  // 1. Try pure JSON format: {"heel":1200,"outer":850,"inner":900,"toe":450}
  if (line.startsWith("{") && line.endsWith("}")) {
    try {
      const obj = JSON.parse(line);
      return {
        heel: obj.heel,
        outer: obj.outer ?? obj.rightBall ?? obj.right_ball,
        inner: obj.inner ?? obj.leftBall ?? obj.left_ball,
        toe: obj.toe,
      };
    } catch {
      /* ignore */
    }
  }

  // 2. Try Serial Plotter / key-value format (e.g. Heel:1200,Outer:850,Inner:900,Toe:450)
  const h = line.match(/heel[:=]\s*(\d+)/i);
  const o = line.match(/(?:outer|rightball|right_ball)[:=]\s*(\d+)/i);
  const i = line.match(/(?:inner|leftball|left_ball)[:=]\s*(\d+)/i);
  const t = line.match(/toe[:=]\s*(\d+)/i);

  if (h || o || i || t) {
    return {
      heel: h ? Number(h[1]) : 0,
      outer: o ? Number(o[1]) : 0,
      inner: i ? Number(i[1]) : 0,
      toe: t ? Number(t[1]) : 0,
    };
  }

  return null;
}

function startSerialBridge({ portName = "COM9", baudRate = 115200, onData, log = console.log } = {}) {
  let child = null;
  let running = true;
  let retryTimer = null;
  let isConnected = false;

  const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
$portName = '${portName}'

# Check if target port exists
$available = [System.IO.Ports.SerialPort]::GetPortNames()
if ($available -notcontains $portName) {
  [Console]::WriteLine("[NO_PORT]")
  exit 0
}

try {
  $sp = New-Object System.IO.Ports.SerialPort $portName, ${baudRate}, 'None', 8, 'One'
  $sp.ReadTimeout = 2000
  $sp.Open()
  [Console]::WriteLine("[CONNECTED]")
  while ($sp.IsOpen) {
    try {
      $line = $sp.ReadLine()
      if ($line) { [Console]::WriteLine($line) }
    } catch [System.TimeoutException] {
      # Timeout is expected when no data is sent; keep listening
    } catch {
      break
    }
  }
} catch {
  [Console]::WriteLine("[BUSY]")
} finally {
  if ($sp -and $sp.IsOpen) { $sp.Close() }
}
`;

  function launch() {
    if (!running) return;

    child = spawn("powershell", ["-NoProfile", "-NonInteractive", "-Command", psScript], {
      windowsHide: true,
    });

    let buffer = "";

    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed === "[CONNECTED]") {
          if (!isConnected) {
            log(`[wired-usb] Connected to ESP32 on ${portName} (${baudRate} baud)`);
            isConnected = true;
          }
          continue;
        }

        if (trimmed === "[NO_PORT]" || trimmed === "[BUSY]") {
          isConnected = false;
          continue;
        }

        const data = parseSerialLine(trimmed);
        if (data && typeof onData === "function") {
          onData(data);
        }
      }
    });

    child.on("close", () => {
      child = null;
      isConnected = false;
      if (running) {
        // Quietly retry every 3 seconds without flooding terminal
        retryTimer = setTimeout(launch, 3000);
      }
    });

    child.on("error", () => {
      isConnected = false;
      if (running) {
        retryTimer = setTimeout(launch, 3000);
      }
    });
  }

  launch();

  return {
    stop() {
      running = false;
      if (retryTimer) clearTimeout(retryTimer);
      if (child) {
        try {
          child.kill();
        } catch {
          /* ignore */
        }
      }
    },
  };
}

module.exports = { startSerialBridge, parseSerialLine };
