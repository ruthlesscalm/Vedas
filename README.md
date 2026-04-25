# VEDAS — Verified Ecosystem for Decentralized Asset Security

[![Production](https://img.shields.io/badge/Status-Production--Ready-10b981.svg)](https://vedas.ruthlesscalm.me)
[![Architecture](https://img.shields.io/badge/Architecture-MERN--PWA-6366f1.svg)]()
[![Security](https://img.shields.io/badge/Security-SHA--256-blue.svg)]()

> A decentralized, offline-resilient supply chain transparency platform — built for India's last-mile logistics where internet is a luxury, not a given.

---

## ⚠️ The Problem

In emerging markets and industrial logistics, **80% of supply chain blind spots** occur in "Edge" environments — warehouses, transit routes, and distribution centers with zero to low internet connectivity.

* **Trust Deficit** — Manual logging is prone to tampering, leading to "ghost deliveries" and inventory shrinkage.
* **Connectivity Barriers** — Standard cloud-based tracking systems fail when the signal drops, causing data loss at the most critical moments.
* **Counterfeit Risk** — Without source-point cryptographic verification, fraudulent goods easily enter the legitimate supply stream.

---

## 🛡️ Our Solution

VEDAS replaces "assumed trust" with **cryptographic proof**. By utilizing a specialized **Ghost-Log Engine**, VEDAS ensures that every product movement is timestamped, geolocated, and signed — regardless of network availability.

### How It Works — The 3-Step Protocol

1. **Genesis Seal** — A manufacturer registers items and generates a unique Batch ID. The system creates a **SHA-256 Genesis Hash** containing product data, GPS origin, and timestamp. A QR code and PDF certificate are generated as the physical proof.

2. **Edge Verification** — Field workers scan the QR code at each checkpoint. If offline, the **Ghost-Log Engine** caches the scan in a secure **IndexedDB** vault, capturing GPS coordinates, user identity, and local timestamps.

3. **Automated Reconciliation** — Once a 2G/4G/WiFi signal is detected, the system syncs all queued Ghost logs to the central ledger. The server independently re-computes every hash — if anything was tampered with, it's flagged immediately.

### The Real-World Scenario

> *Picture a truck carrying Ragi from a farm in rural Karnataka to a processing plant in Bangalore. The internet is dead at the farm. The truck goes through a forest with zero signal. At the factory gate, internet returns — and the Ghost logs from the farm and the road instantly fly to the dashboard. The factory manager sees a verified, tamper-proof timeline of the entire journey, even though the truck was offline for 80% of the trip.*

---

## 🚀 Key Features

| Feature | What It Does |
| :--- | :--- |
| **Ghost-Log Engine** | Zero-failure logging in 0% connectivity zones via IndexedDB local-first storage. Logs queue silently and sync automatically on reconnect. |
| **Cryptographic Sealing** | Every batch and checkpoint is hashed with SHA-256. The server re-verifies independently — any tampering is detected and flagged. |
| **Proof of Location** | GPS coordinates are captured at every scan node to prevent location spoofing and ensure physical presence. |
| **QR-Based Chain of Custody** | Scan via device camera or image upload. UUID validation guards against non-VEDAS QR codes. |
| **Admin Journey Tracker** | Search any batch by ID — see full origin details, every checkpoint on a timeline, and Verified/Tampered status per entry. |
| **PWA Architecture** | Installable on Android/iOS without App Store friction. Caches all assets for instant loading even on 2G networks. |
| **PDF Ledger** | Instant generation of "Audit-Ready" PDF batch seal certificates for compliance and verification. |
| **Role-Based Access** | Users seal and scan. Admins track any batch across the entire supply chain. |

---

## 🏗️ Technical Architecture

### The Stack

* **Frontend:** React 18 (Vite), TailwindCSS 4, Framer Motion, Leaflet.js (GIS mapping)
* **Backend:** Node.js (Express 5), JWT authentication, SHA-256 hash verification
* **Storage:** MongoDB Atlas (cloud ledger), IndexedDB (edge/local caching via Ghost-Log Engine)
* **Security:** SHA-256 hashing (WebCrypto + Node crypto), bcrypt password hashing, UUID v4, secure httpOnly cookies

### Project Structure

```
Vedas/
│
├── backend/                        # RESTful API server
│   ├── src/
│   │   ├── server.js               # Entry point
│   │   ├── app.js                  # Express app — CORS, routing, middleware
│   │   ├── config/                 # Environment configuration
│   │   ├── controllers/
│   │   │   ├── auth.controller.js  # Register, login, token refresh, logout
│   │   │   └── batch.controller.js # Seal, sync, fetch batch, fetch user logs
│   │   ├── models/
│   │   │   ├── user.model.js       # User accounts with roles
│   │   │   ├── batch.model.js      # Sealed batch records
│   │   │   └── log.model.js        # Checkpoint scan logs
│   │   ├── middlewares/            # Identity verification & ownership guards
│   │   ├── routes/                 # Auth and batch route definitions
│   │   ├── errors/                 # Custom error handling
│   │   └── utils/                  # Async handler utility
│   ├── _.env                       # Environment variable template
│   └── package.json
│
└── frontend/                       # PWA Frontend (Vite + React)
    ├── src/
    │   ├── App.jsx                 # Routing — public vs protected, role-based dashboard
    │   ├── pages/
    │   │   ├── Login.jsx           # Login page
    │   │   ├── Register.jsx        # Registration page
    │   │   └── Dashboard.jsx       # Tabbed dashboard (Seal / Sync / My Logs)
    │   ├── components/
    │   │   ├── SealBatch.jsx       # Genesis Seal — batch form + QR/PDF generation
    │   │   ├── SyncBatch.jsx       # Edge Verification — QR scanner with offline fallback
    │   │   ├── AdminDashboard.jsx  # Batch search + journey timeline viewer
    │   │   ├── MyLogs.jsx          # Personal scan history
    │   │   ├── OfflineSyncBanner.jsx # Pending Ghost-Log count + sync trigger
    │   │   └── PWAInstallPrompt.jsx  # "Add to Home Screen" prompt
    │   ├── context/
    │   │   └── AuthContext.jsx     # Global auth & state management
    │   └── utils/
    │       ├── api.js              # Axios instance with credentials
    │       ├── crypto.js           # SHA-256 hashing (WebCrypto API)
    │       ├── db.js               # Ghost-Log Engine — IndexedDB offline queue
    │       └── geolocation.js      # GPS location capture
    ├── vite.config.js              # Vite + PWA + Tailwind + dev proxy
    └── package.json
```

---

## 👤 User Roles

| Role | Capabilities |
|---|---|
| **User** | Seal new batches, scan QR codes at checkpoints, view personal scan history |
| **Admin** | All user capabilities + search any batch by ID and view the full chain-of-custody journey with tamper status |

---

## 🚀 Getting Started

### Prerequisites

* Node.js ≥ 18
* MongoDB (Atlas or local)

### Backend Setup

```bash
cd backend
cp _.env .env          # then edit .env with your credentials
npm install
node ./src/server.js            # starts with nodemon on port 5000
```

**Required `.env` variables:**
```
PORT=5000
MONGO_URI=your_mongo_database_uri
JWT_ACCESS_TOKEN=<random-256-bit-hex>
JWT_REFRESH_TOKEN=<random-256-bit-hex>
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev            # starts on http://localhost:5173, proxies /api to backend
```

### Production Build

```bash
cd frontend
npm run build          # outputs to dist/
```

---

## 🌐 Deployment

| Service | URL |
|---|---|
| Frontend | [`vedas.ruthlesscalm.me`](https://vedas.ruthlesscalm.me) |
| Backend | `api.vedas.ruthlesscalm.me` | check heatlth at `api.vedas.ruthlesscalm.me/health`

---

## 🤝 Contribution

We welcome contributions from the community to make global supply chains more transparent.

1. **Fork** the repository.
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`.
3. **Commit** your changes: `git commit -m 'Add some amazing feature'`.
4. **Push** to the branch: `git push origin feature/amazing-feature`.
5. **Open** a Pull Request.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

MIT © 2026 [Ruthless Calm](https://github.com/ruthlesscalm)

---

> **"Trust is not a feeling. It is a cryptographic constant."**
