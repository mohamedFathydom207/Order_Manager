const db = require('./db');

/**
 * Middleware: require authenticated session.
 * Returns 401 JSON if not logged in.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
}

/**
 * Mount auth routes on an Express router.
 */
function mountAuthRoutes(app) {
  // POST /api/login
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const user = db.getUserByUsername(username.trim());
    if (!user || !db.verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    req.session.userId = user.id;
    req.session.username = user.username;
    return res.json({ ok: true, username: user.username });
  });

  // POST /api/logout
  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  // GET /api/me — check current session
  app.get('/api/me', (req, res) => {
    if (req.session && req.session.userId) {
      return res.json({ loggedIn: true, username: req.session.username });
    }
    return res.json({ loggedIn: false });
  });

  // POST /api/change-password
  app.post('/api/change-password', requireAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Invalid password data' });
    }
    const user = db.getUserByUsername(req.session.username);
    if (!user || !db.verifyPassword(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Current password incorrect' });
    }
    db.changePassword(req.session.userId, newPassword);
    return res.json({ ok: true });
  });
}

module.exports = { requireAuth, mountAuthRoutes };
