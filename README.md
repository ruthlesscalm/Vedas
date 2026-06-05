# VEDAS

VEDAS is a supply chain tracking application built during a university hackathon.

The project focuses on tracking product batches across multiple checkpoints, supporting offline data collection, QR-based verification, and synchronization when connectivity becomes available.

## Features

* User authentication with JWT
* Batch creation and tracking
* QR code generation and scanning
* Offline-first data collection using IndexedDB
* Automatic synchronization when connectivity returns
* Location logging using browser geolocation
* PDF certificate generation
* Role-based access for users and administrators
* Progressive Web App (PWA) support

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* IndexedDB
* Leaflet

### Backend

* Node.js
* Express
* MongoDB
* JWT Authentication
* bcrypt
* SHA-256 hashing

## User Roles

### User

* Create batches
* Scan QR codes
* View personal activity logs

### Admin

* Search batches
* View tracking history
* Verify recorded checkpoints

## Architecture

- Frontend stores pending scans locally using IndexedDB.
- Data is synchronized with the backend when connectivity becomes available.
- QR codes are used to identify batches.
- The backend manages authentication, batch records, and verification.

## Getting Started

### Requirements

* Node.js 18+
* MongoDB

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=<your-mongodb-uri>
JWT_ACCESS_TOKEN=<secret>
JWT_REFRESH_TOKEN=<secret>
```

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Deployment

Frontend:
[`https://vedas.ruthlesscalm.me`](https://vedas.ruthlesscalm.me)

Backend:
`https://api.vedas.ruthlesscalm.me`

## Notes

This project was developed during a university hackathon.

The primary goal was to build a working prototype demonstrating offline-capable supply chain tracking. Due to the limited event timeframe, development focused on functionality rather than production readiness.

## License

This project is licensed under the MIT License.

Feel free to use the code for learning, experimentation, or reference.
