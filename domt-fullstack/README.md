# DOMT — Digital Operations Monitoring Tool (Fullstack)

A complete fullstack monitoring application:
- **Backend**: Node.js + Express + MongoDB + JWT Auth
- **Frontend**: React + Vite + Recharts

---

## Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

---

## 🚀 Quick Start

### 1. Start MongoDB
```bash
# If MongoDB is installed locally:
mongod --dbpath /data/db

# OR use MongoDB Atlas — update MONGO_URI in backend/.env
```

### 2. Setup Backend
```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env → set MONGO_URI, JWT_SECRET

# Seed database with sample data
npm run seed

# Start backend server
npm run dev
```
Backend runs at: **http://localhost:5000**

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: **http://localhost:5173**

---

## 🔐 Demo Credentials (after seeding)

| Role  | Email           | Password  |
|-------|-----------------|-----------|
| Admin | admin@domt.io   | admin123  |
| User  | john@domt.io    | user123   |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login & get JWT token |
| GET | /api/auth/me | Get current user (protected) |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/change-password | Change password |
| POST | /api/auth/forgot-password | Forgot password |

### Systems
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/systems | List all systems |
| POST | /api/systems | Add system |
| GET | /api/systems/:id | Get system details |
| PUT | /api/systems/:id | Update system |
| DELETE | /api/systems/:id | Delete system (admin) |
| GET | /api/systems/:id/metrics | Get historical metrics |
| GET | /api/systems/stats/dashboard | Dashboard stats |
| POST | /api/systems/heartbeat | Agent heartbeat (no auth) |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/alerts | List alerts |
| PUT | /api/alerts/:id/acknowledge | Acknowledge alert |
| PUT | /api/alerts/:id/resolve | Resolve alert |
| DELETE | /api/alerts/:id | Delete alert (admin) |

### Admin (Admin role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/users | List/create users |
| PUT/DELETE | /api/users/:id | Update/delete user |
| GET/POST | /api/alert-rules | Manage alert rules |
| PUT/DELETE | /api/alert-rules/:id | Update/delete rule |

### Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/logs | Activity logs |
| GET | /api/analytics?days=7 | Aggregated analytics |

---

## 🤖 Connecting a Real Agent

Your monitoring agent should POST to `/api/systems/heartbeat` every N seconds:

```json
POST /api/systems/heartbeat
Content-Type: application/json

{
  "agentKey": "agt_your_key_here",
  "uptime": "5d 3h",
  "metrics": {
    "cpu": 45.2,
    "memory": 72.1,
    "disk": 55.0,
    "network": 120.5,
    "temperature": 62
  }
}
```

The backend will:
1. Update system status and metrics
2. Store time-series metric data
3. Check alert rules and create alerts automatically

---

## 📁 Project Structure

```
domt-fullstack/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # MongoDB connection
│   │   ├── controllers/          # Business logic
│   │   │   ├── authController.js
│   │   │   ├── systemController.js
│   │   │   ├── alertController.js
│   │   │   └── adminController.js
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT middleware
│   │   │   └── error.js          # Error handler
│   │   ├── models/               # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── System.js
│   │   │   ├── Alert.js
│   │   │   ├── AlertRule.js
│   │   │   ├── Log.js
│   │   │   └── Metric.js
│   │   ├── routes/               # Express routes
│   │   ├── utils/seed.js         # Database seeder
│   │   └── server.js             # Entry point
│   ├── .env                      # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── services/api.js        # Axios API layer
    │   ├── context/AuthContext.jsx
    │   ├── hooks/useApi.js        # Data fetching hooks
    │   ├── components/layout/     # Sidebar, Topbar, Layout
    │   ├── components/ui/         # StatCard, etc.
    │   └── pages/                 # All 15 pages
    ├── vite.config.js             # Proxy to backend
    └── package.json
```

---

## 🛠 Tech Stack

**Backend**
- Express.js — REST API
- MongoDB + Mongoose — Database & ODM
- JWT — Authentication
- bcryptjs — Password hashing
- express-rate-limit — Rate limiting
- morgan — HTTP logging

**Frontend**
- React 18 + Vite — UI framework
- React Router v6 — Routing
- Axios — HTTP client with interceptors
- Recharts — Charts
- date-fns — Date formatting
- Lucide React — Icons
