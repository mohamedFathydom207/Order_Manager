const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// All routes require auth
router.use(requireAuth);

// GET /api/mange/orders — return all active orders + archived + variations
router.get('/orders', (req, res) => {
  const saved    = db.mangeGetOrders(req.session.userId);
  const archived = db.mangeGetArchived(req.session.userId);
  const variations = db.mangeGetVariations(req.session.userId);
  res.json({ saved, archived, variations });
});

// POST /api/mange/orders — create or update an order
router.post('/orders', (req, res) => {
  const { id, order } = req.body || {};
  if (!id || !order) return res.status(400).json({ error: 'id and order required' });
  db.mangeUpsertOrder(req.session.userId, id, order);
  res.json({ ok: true });
});

// DELETE /api/mange/orders/:id — soft delete (move to archive)
router.delete('/orders/:id', (req, res) => {
  db.mangeSoftDelete(req.session.userId, req.params.id);
  res.json({ ok: true });
});

// GET /api/mange/archived — list archived
router.get('/archived', (req, res) => {
  res.json(db.mangeGetArchived(req.session.userId));
});

// POST /api/mange/archived/:id/restore — restore from archive
router.post('/archived/:id/restore', (req, res) => {
  db.mangeRestore(req.session.userId, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/mange/archived/:id — permanently delete
router.delete('/archived/:id', (req, res) => {
  db.mangePurge(req.session.userId, req.params.id);
  res.json({ ok: true });
});

// GET /api/mange/variations
router.get('/variations', (req, res) => {
  res.json(db.mangeGetVariations(req.session.userId));
});

// PUT /api/mange/variations
router.put('/variations', (req, res) => {
  const { variations } = req.body || {};
  if (!Array.isArray(variations)) return res.status(400).json({ error: 'variations must be an array' });
  db.mangeSaveVariations(req.session.userId, variations);
  res.json({ ok: true });
});

// POST /api/mange/import — bulk import backup
router.post('/import', (req, res) => {
  const { saved, archived, variations } = req.body || {};
  if (!saved || typeof saved !== 'object') return res.status(400).json({ error: 'Invalid backup' });
  const userId = req.session.userId;

  for (const [id, order] of Object.entries(saved)) {
    db.mangeUpsertOrder(userId, id, order);
  }
  if (archived && typeof archived === 'object') {
    for (const [id, order] of Object.entries(archived)) {
      db.mangeUpsertOrder(userId, id, order);
      db.mangeSoftDelete(userId, id);
    }
  }
  if (Array.isArray(variations)) {
    db.mangeSaveVariations(userId, variations);
  }
  res.json({ ok: true });
});

module.exports = router;
