/**
 * db.js — Pure JSON-file database (no native compilation needed)
 * Data is stored in f:\manegement test\data\ as .json files.
 */
const fs   = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ─── Generic read/write helpers ────────────────────────────────────────────
function readJson(file, fallback) {
  const fp = path.join(dataDir, file);
  try {
    if (!fs.existsSync(fp)) return fallback;
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch { return fallback; }
}

function writeJson(file, data) {
  const fp  = path.join(dataDir, file);
  const tmp = fp + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, fp);  // atomic replace
}

// ─── Users ─────────────────────────────────────────────────────────────────
// users.json: { [username_lower]: { id, username, password } }
function readUsers()        { return readJson('users.json', {}); }
function writeUsers(users)  { writeJson('users.json', users); }

// Seed default admin on first run
(function seedAdmin() {
  const users = readUsers();
  if (!users['admin']) {
    users['admin'] = { id: 1, username: 'admin', password: bcrypt.hashSync('admin123', 10) };
    writeUsers(users);
    console.log('[DB] Default admin user created: admin / admin123');
  }
})();

function getUserByUsername(username) {
  const users = readUsers();
  return users[username.toLowerCase()] || null;
}

function verifyPassword(plaintext, hash) {
  return bcrypt.compareSync(plaintext, hash);
}

function changePassword(username, newPassword) {
  const users = readUsers();
  const key = username.toLowerCase();
  if (users[key]) {
    users[key].password = bcrypt.hashSync(newPassword, 10);
    writeUsers(users);
  }
}

// ─── Per-user data file helper ─────────────────────────────────────────────
// Each user gets their own data files: mange_orders_{userId}.json, etc.
function userFile(prefix, userId) { return `${prefix}_${userId}.json`; }

// ─── Mange Orders ──────────────────────────────────────────────────────────
// File: mange_orders_{userId}.json
// Structure: { saved: { [id]: orderObj }, archived: { [id]: orderObj } }

function readMangeData(userId) {
  return readJson(userFile('mange_orders', userId), { saved: {}, archived: {} });
}
function writeMangeData(userId, data) {
  writeJson(userFile('mange_orders', userId), data);
}

function mangeGetOrders(userId) {
  return readMangeData(userId).saved || {};
}

function mangeGetArchived(userId) {
  return readMangeData(userId).archived || {};
}

function mangeUpsertOrder(userId, id, orderData) {
  const data = readMangeData(userId);
  data.saved = data.saved || {};
  // If it's in archived, remove from there
  if (data.archived && data.archived[id]) delete data.archived[id];
  data.saved[id] = orderData;
  writeMangeData(userId, data);
}

function mangeSoftDelete(userId, id) {
  const data = readMangeData(userId);
  data.saved = data.saved || {};
  data.archived = data.archived || {};
  if (data.saved[id]) {
    data.archived[id] = { ...data.saved[id], deletedAt: new Date().toISOString() };
    delete data.saved[id];
    writeMangeData(userId, data);
  }
}

function mangeRestore(userId, id) {
  const data = readMangeData(userId);
  data.saved = data.saved || {};
  data.archived = data.archived || {};
  if (data.archived[id]) {
    const order = { ...data.archived[id] };
    delete order.deletedAt;
    data.saved[id] = order;
    delete data.archived[id];
    writeMangeData(userId, data);
  }
}

function mangePurge(userId, id) {
  const data = readMangeData(userId);
  data.archived = data.archived || {};
  delete data.archived[id];
  writeMangeData(userId, data);
}

// ─── Mange Variations ──────────────────────────────────────────────────────
// File: mange_variations_{userId}.json  →  string[]
function mangeGetVariations(userId) {
  return readJson(userFile('mange_variations', userId), []);
}
function mangeSaveVariations(userId, names) {
  writeJson(userFile('mange_variations', userId), [...new Set(names.filter(n => n && n.trim()))]);
}

// ─── Zipper Orders ─────────────────────────────────────────────────────────
// File: zipper_orders_{userId}.json  →  { [id]: orderObj }
function readZipperData(userId) {
  return readJson(userFile('zipper_orders', userId), {});
}
function writeZipperData(userId, data) {
  writeJson(userFile('zipper_orders', userId), data);
}

function zipperGetOrders(userId) {
  return readZipperData(userId);
}

function zipperUpsertOrder(userId, id, orderData) {
  const data = readZipperData(userId);
  data[id] = orderData;
  writeZipperData(userId, data);
}

function zipperDeleteOrder(userId, id) {
  const data = readZipperData(userId);
  delete data[id];
  writeZipperData(userId, data);
}

function zipperUpdateReceiving(userId, id, receiving) {
  const data = readZipperData(userId);
  if (!data[id]) return false;
  data[id].receiving = receiving;
  data[id].updated = new Date().toISOString();
  writeZipperData(userId, data);
  return true;
}

module.exports = {
  getUserByUsername, verifyPassword, changePassword,
  mangeGetOrders, mangeGetArchived, mangeUpsertOrder,
  mangeSoftDelete, mangeRestore, mangePurge,
  mangeGetVariations, mangeSaveVariations,
  zipperGetOrders, zipperUpsertOrder, zipperDeleteOrder, zipperUpdateReceiving
};
