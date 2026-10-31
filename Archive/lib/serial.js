const { spawn } = require("child_process");

function parseSerialLine(raw) {
  if (!raw || typeof raw !== "string") return null;
  const line = raw.trim();
  if (!line) return null;

  // 1. Try pure JSON format
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

  // 2. Try key-value format (e.g. Heel:1200,Outer:850,Inner:900,Toe:450)
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
  let hasLoggedWaiting = false;

  const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
$targetPort = '${portName}'

# Check if target port exists
$available = [System.IO.Ports.SerialPort]::GetPortNames()
if ($available -notcontains $targetPort) {
  # If target not found, check if there's any CH340 / USB Serial port
  $usbPort = $available | Where-Object { $_ -ne 'COM1' -and $_ -ne 'COM2' } | Select-Object -First 1
  if ($usbPort) {
    $targetPort = $usbPort
  } else {
    [Console]::WriteLine("[NO_PORT]")
    exit 0
  }
}

try {
  $sp = New-Object System.IO.Ports.SerialPort $targetPort, ${baudRate}, 'None', 8, 'One'
  $sp.ReadTimeout = 2500
  $sp.Open()
  [Console]::WriteLine("[CONNECTED:" + $targetPort + "]")
  while ($sp.IsOpen) {
    try {
      $line = $sp.ReadLine()
      if ($line) { [Console]::WriteLine($line) }
    } catch [System.TimeoutException] {
      # Expected timeout when idle, continue listening
    } catch {
      break
    }
  }
} catch {
  [Console]::WriteLine("[BUSY:" + $targetPort + "]")
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

        if (trimmed.startsWith("[CONNECTED:")) {
          const activePort = trimmed.slice(11, -1);
          log(`[wired-usb] Connected to ESP32 on ${activePort} (${baudRate} baud)`);
          hasLoggedWaiting = false;
          continue;
        }

        if (trimmed === "[NO_PORT]") {
          if (!hasLoggedWaiting) {
            log(`[wired-usb] Waiting for ESP32 USB cable to be plugged in...`);
            hasLoggedWaiting = true;
          }
          continue;
        }

        if (trimmed.startsWith("[BUSY:")) {
          // Port is busy (e.g. Arduino IDE is flashing)
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
      if (running) {
        // Sleep 4 seconds before checking again (low CPU, clean polling)
        retryTimer = setTimeout(launch, 4000);
      }
    });

    child.on("error", () => {
      if (running) {
        retryTimer = setTimeout(launch, 4000);
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
