const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "..", "database.db");

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(test, "hex"));
  } catch {
    return false;
  }
}

function openDb() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pressure_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      heel INTEGER NOT NULL,
      outer INTEGER NOT NULL,
      inner INTEGER NOT NULL,
      toe INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      time TEXT NOT NULL,
      frequency TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_pressure_user_time
      ON pressure_logs (user_id, timestamp);
  `);

  return db;
}

function seedIfEmpty(db) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  if (count > 0) return;

  const insertUser = db.prepare(
    "INSERT INTO users (username, password) VALUES (?, ?)"
  );
  const demoId = insertUser.run("demo", hashPassword("demo123")).lastInsertRowid;

  const insertMed = db.prepare(
    "INSERT INTO medicines (user_id, name, time, frequency) VALUES (?, ?, ?, ?)"
  );
  insertMed.run(demoId, "Metformin", "08:00", "Daily");
  insertMed.run(demoId, "Atorvastatin", "21:00", "Daily");
  insertMed.run(demoId, "Vitamin B12", "12:30", "Weekly");

  const insertLog = db.prepare(`
    INSERT INTO pressure_logs (user_id, timestamp, heel, outer, inner, toe)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const insertMany = db.transaction(() => {
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const dayStart = now - dayOffset * day;
      const alertBias = dayOffset >= 3 ? 0.28 : 0.11;
      const sessions = [
        { hour: 7, samples: 48 },
        { hour: 12, samples: 28 },
        { hour: 18, samples: 40 },
      ];

      for (const session of sessions) {
        for (let i = 0; i < session.samples; i++) {
          const ts = dayStart - (dayStart % day) + session.hour * 3600000 + i * 8000;
          const phase = (i % 12) / 12;
          const heelBase = phase < 0.28 ? 2200 + phase * 2800 : 400 + Math.random() * 500;
          const outerBase = phase > 0.2 && phase < 0.65 ? 1400 + Math.random() * 900 : 350;
          const innerBase = phase > 0.25 && phase < 0.7 ? 1600 + Math.random() * 1000 : 380;
          const toeBase = phase > 0.55 ? 1800 + (phase - 0.55) * 3200 : 300;

          const spike = Math.random() < alertBias;
          const heel = Math.round(Math.max(0, heelBase + (spike && Math.random() < 0.4 ? 1600 : 0) + (Math.random() - 0.5) * 220));
          const outer = Math.round(Math.max(0, outerBase + (spike && Math.random() < 0.25 ? 1400 : 0) + (Math.random() - 0.5) * 180));
          const inner = Math.round(Math.max(0, innerBase + (spike && Math.random() < 0.25 ? 1300 : 0) + (Math.random() - 0.5) * 180));
          const toe = Math.round(Math.max(0, toeBase + (spike && Math.random() < 0.45 ? 1700 : 0) + (Math.random() - 0.5) * 220));

          insertLog.run(demoId, ts, heel, outer, inner, toe);
        }
      }
    }
  });

  insertMany();
  console.log(`[db] Seeded demo user (demo / demo123) with history for user_id=${demoId}`);
}

module.exports = { openDb, seedIfEmpty, hashPassword, verifyPassword, DB_PATH };
