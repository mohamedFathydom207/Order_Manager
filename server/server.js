const express    = require('express');
const session    = require('express-session');
const path       = require('path');
const fs         = require('fs');

const { mountAuthRoutes } = require('./auth');
const mangeRouter  = require('./routes/mange');
const zipperRouter = require('./routes/zipper');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Session store — file-based (pure JS, no native compilation) ───────────
const dataDir = path.join(__dirname, '..', 'data');
const sessionsDir = path.join(dataDir, 'sessions');
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

const FileStore = require('session-file-store')(session);

app.use(session({
  store: new FileStore({
    path: sessionsDir,
    ttl: 7 * 24 * 60 * 60,   // 7 days in seconds
    reapInterval: 3600,       // clean up expired sessions every hour
    logFn: () => {}           // silence verbose logging
  }),
  secret: 'mange-zipper-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// ─── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Auth routes (/api/login, /api/logout, /api/me) ───────────────────────
mountAuthRoutes(app);

// ─── API routes ───────────────────────────────────────────────────────────
app.use('/api/mange',  mangeRouter);
app.use('/api/zipper', zipperRouter);

// ─── Static files ─────────────────────────────────────────────────────────
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// ─── Root: redirect to login ───────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'login.html'));
});

// ─── 404 fallback ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).send('Not found');
});

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}`);
  console.log(`   Mange Orders   → http://localhost:${PORT}/mange_orders.html`);
  console.log(`   Zipper Tracker → http://localhost:${PORT}/zipper_tracker.html`);
  console.log(`   Login with: admin / admin123\n`);
});
