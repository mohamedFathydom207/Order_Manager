const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// All routes require auth
router.use(requireAuth);

// GET /api/zipper/orders — list all orders
router.get('/orders', (req, res) => {
  res.json(db.zipperGetOrders(req.session.userId));
});

// POST /api/zipper/orders — create or update an order
router.post('/orders', (req, res) => {
  const { id, order } = req.body || {};
  if (!id || !order) return res.status(400).json({ error: 'id and order required' });
  db.zipperUpsertOrder(req.session.userId, id, order);
  res.json({ ok: true });
});

// DELETE /api/zipper/orders/:id — delete order
router.delete('/orders/:id', (req, res) => {
  db.zipperDeleteOrder(req.session.userId, req.params.id);
  res.json({ ok: true });
});

// PUT /api/zipper/orders/:id/receiving — update receiving data only
router.put('/orders/:id/receiving', (req, res) => {
  const { receiving } = req.body || {};
  if (!receiving || typeof receiving !== 'object') return res.status(400).json({ error: 'receiving object required' });
  const ok = db.zipperUpdateReceiving(req.session.userId, req.params.id, receiving);
  if (!ok) return res.status(404).json({ error: 'Order not found' });
  res.json({ ok: true });
});

// POST /api/zipper/import — bulk import backup
router.post('/import', (req, res) => {
  const orders = req.body?.orders || req.body;
  if (!orders || typeof orders !== 'object' || Array.isArray(orders)) {
    return res.status(400).json({ error: 'Invalid backup' });
  }
  const userId = req.session.userId;
  for (const [id, order] of Object.entries(orders)) {
    db.zipperUpsertOrder(userId, id, order);
  }
  res.json({ ok: true });
});

module.exports = router;
