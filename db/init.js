'use strict';

/**
 * db/init.js — Database initialization & seed
 */

const { createDatabase } = require('./sqlite-shim');
const bcrypt = require('bcryptjs');

async function initDB() {
  const db = await createDatabase();

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  /* ══════════════════════════════════════
     SCHEMA
     ══════════════════════════════════════ */

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      name       TEXT    NOT NULL,
      password   TEXT    NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'user'    CHECK(role   IN ('admin','user')),
      status     TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      cat        TEXT    NOT NULL DEFAULT 'Other',
      unit       TEXT    NOT NULL DEFAULT 'units',
      price      REAL    NOT NULL DEFAULT 0,
      total      REAL    NOT NULL DEFAULT 0,
      used       REAL    NOT NULL DEFAULT 0,
      threshold  REAL    NOT NULL DEFAULT 1,
      project_id TEXT    DEFAULT '',
      mr_number  TEXT    DEFAULT '',
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id         TEXT    PRIMARY KEY,
      name       TEXT    NOT NULL,
      desc       TEXT    DEFAULT '',
      budget     REAL    NOT NULL DEFAULT 0,
      progress   INTEGER NOT NULL DEFAULT 0,
      status     TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','on-hold')),
      deadline   TEXT    DEFAULT '',
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      due        TEXT    DEFAULT '',
      priority   TEXT    NOT NULL DEFAULT 'medium' CHECK(priority IN ('high','medium','low')),
      status     TEXT    NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming','overdue','done')),
      assign     TEXT    DEFAULT 'Studio',
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS otp_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL,
      otp        TEXT    NOT NULL,
      expires_at TEXT    NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0
    );
  `);

  /* ══════════════════════════════════════
     SEED — only if users table is empty
     ══════════════════════════════════════ */

  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (!userCount || userCount.n === 0) {
    console.log('🌱 Seeding database…');

    // ── Admin accounts — passwords come from environment variables ──
    // Set ADMIN_EMAIL_1, ADMIN_NAME_1, ADMIN_PASS_1 (and _2) in Vercel dashboard
    const admins = [];

    const e1 = process.env.ADMIN_EMAIL_1;
    const n1 = process.env.ADMIN_NAME_1;
    const p1 = process.env.ADMIN_PASS_1;
    if (e1 && n1 && p1) admins.push({ email: e1, name: n1, password: p1 });

    const e2 = process.env.ADMIN_EMAIL_2;
    const n2 = process.env.ADMIN_NAME_2;
    const p2 = process.env.ADMIN_PASS_2;
    if (e2 && n2 && p2) admins.push({ email: e2, name: n2, password: p2 });

    // Fallback: if no env vars set, log a warning (don't crash)
    if (admins.length === 0) {
      console.warn('⚠️  No ADMIN_EMAIL_1 / ADMIN_PASS_1 env vars found. No admin accounts seeded.');
      console.warn('   Set these in your Vercel dashboard under Project → Settings → Environment Variables.');
    }

    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (email, name, password, role, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const admin of admins) {
      const hash = bcrypt.hashSync(admin.password, 10);
      insertUser.run(admin.email.trim().toLowerCase(), admin.name, hash, 'admin', 'approved');
      console.log(`  ✓ Admin seeded: ${admin.email}`);
    }

    // ── Sample inventory ────────────────────────────────────────────
    const insertInv = db.prepare(`
      INSERT INTO inventory (name, cat, unit, price, total, used, threshold, project_id, mr_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedInventory = [
      ['Polymer Clay – White', 'Clay & Armature', 'kg', 18, 10, 3, 2, '', 'MR-001'],
      ['Aluminum Wire 1.5mm', 'Clay & Armature', 'kg', 12, 5, 4.5, 1, 'p1', 'MR-002'],
      ['Acrylic Paint Set', 'Paints & Finishes', 'packs', 35, 4, 1, 1, '', 'MR-003'],
      ['Silicone Mold Rubber', 'Mold Materials', 'liters', 55, 3, 2.8, 0.5, 'p2', 'MR-004'],
      ['Sculpting Loop Tools', 'Sculpting Tools', 'units', 8, 12, 2, 3, '', 'MR-005'],
      ['Epoxy Primer Coat', 'Paints & Finishes', 'liters', 28, 6, 1.5, 1, 'p1', 'MR-006'],
    ];
    for (const row of seedInventory) insertInv.run(...row);

    // ── Sample projects ─────────────────────────────────────────────
    const insertProj = db.prepare(`
      INSERT INTO projects (id, name, desc, budget, progress, status, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const seedProjects = [
      ['p1', 'Dragon Scale Series', 'Fantasy dragon commission', 450, 65, 'active', '2025-08-30'],
      ['p2', 'Portrait Commission', 'Client: Mr. Ashoka', 280, 30, 'active', '2025-07-15'],
      ['p3', 'Studio Display Set', 'Internal display models', 180, 90, 'active', '2025-06-01'],
    ];
    for (const row of seedProjects) insertProj.run(...row);

    // ── Sample tasks ────────────────────────────────────────────────
    const insertTask = db.prepare(`
      INSERT INTO tasks (name, due, priority, status, assign)
      VALUES (?, ?, ?, ?, ?)
    `);

    const seedTasks = [
      ['Clean kiln & check heating elements', '2025-05-10', 'high', 'overdue', 'Studio'],
      ['Restock polymer clay supply', '2025-05-28', 'high', 'upcoming', 'Jane'],
      ['Tool sterilization & storage', '2025-05-01', 'medium', 'done', 'Studio'],
      ['Update ventilation filter', '2025-06-05', 'medium', 'upcoming', 'Studio'],
      ['Check armature wire stock', '2025-05-20', 'low', 'upcoming', 'Jane'],
    ];
    for (const row of seedTasks) insertTask.run(...row);

    console.log('✅ Database seeded.');
  }

  return db;
}

module.exports = { initDB };

if (require.main === module) {
  initDB().then(() => console.log('Done.')).catch(console.error);
}
