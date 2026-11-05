# Order Manager System 📦

A full-stack order management web application with multi-user session authentication, featuring:
- **Mange Orders Tracker**: Track orders, stages, variations, status filters, and archives.
- **Zipper Order Tracker**: Manage zipper orders, color codes, sizes, quantities, and receiving progress.
- **Persistent Data Store**: JSON-file database engine with atomic writes and per-user isolation.
- **Modern Authentication**: Secure session-based authentication with bcrypt password hashing.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)

### 2. Installation
Open a terminal in the project directory:

```bash
cd server
npm install
```

### 3. Run the Server
```bash
npm start
# or: node server.js
```

### 4. Open in Browser
Visit: [http://localhost:3000](http://localhost:3000)

**Default Login:**
- **Username:** `admin`
- **Password:** `admin123`

---

## 📁 Project Structure

```text
├── public/                 # Static web interfaces
│   ├── login.html          # Authentication login screen
│   ├── mange_orders.html   # Mange Orders management UI
│   └── zipper_tracker.html # Zipper tracker management UI
├── server/                 # Express backend
│   ├── server.js           # Server entry point & session config
│   ├── db.js               # JSON file database helpers & queries
│   ├── auth.js             # Session & auth route handlers
│   ├── package.json        # Dependencies
│   └── routes/
│       ├── mange.js        # Mange orders REST API endpoints
│       └── zipper.js       # Zipper tracker REST API endpoints
├── data/                   # Data storage (auto-created on first run)
│   ├── users.json          # User accounts
│   └── sessions/           # Active user sessions
├── .gitignore              # Ignored files (node_modules, local data, sessions)
└── README.md
```

---

## 🔒 Security Note
Before deploying online or into production:
1. Change the session secret key in `server/server.js`.
2. Update the default admin password.
3. Configure HTTPS via reverse proxy (e.g. Nginx, Caddy, or Cloudflare).
