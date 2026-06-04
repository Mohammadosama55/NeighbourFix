# NeighbourFix — Hyperlocal Civic Complaint & Resolution Tracker

Live Demo: https://neighbour-fix.vercel.app/

NeighbourFix is a MERN-stack civic issue reporting platform built for Indian residents. The app helps users submit, upvote, and track local complaints such as potholes, broken streetlights, garbage collection issues, and other public service problems.

## Key Features

- Complaint reporting with location, category, description, and image uploads
- Interactive map view and public heatmap visualization
- Resident login/register with JWT authentication
- Ward admin dashboard for complaint management and status updates
- Upvotes trigger automatic escalation for high-impact issues
- PDF complaint generation and email escalation for ward authorities
- Responsive React frontend with a Node/Express backend

## Live Deployment

The project is deployed and available at:

https://neighbour-fix.vercel.app/

## Technology Stack

- Frontend: React.js, Vite, React Router, Leaflet, Axios
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, Multer, PDFKit, Nodemailer
- Real-time / notifications: Socket.io client/server
- Hosting: Vercel (frontend) / Node.js production-ready backend

## Repository Structure

```
frontend/
  package.json          # Frontend dependencies and scripts
  src/
    App.jsx
    main.jsx
    index.css
    api/axios.js
    components/
    context/
    pages/
backend/
  package.json          # Backend dependencies and scripts
  app.js
  server.js
  config/db.js
  routes/
  controllers/
  models/
  middleware/
  utils/
  uploads/              # Runtime upload storage
```

## Getting Started

### 1. Install dependencies

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 2. Configure environment

Create a `.env` file in `backend/` with:

```env
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
PORT=3001
NODE_ENV=development
EMAIL_USER=<smtp-user>          # optional
EMAIL_PASS=<smtp-password>      # optional
WARD_OFFICER_EMAILS=<emails>    # optional, comma-separated
```

### 3. Run locally

Open two terminals:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

- Frontend runs on `http://localhost:5000`
- Backend API runs on `http://localhost:3001`

## Production Build

To build the frontend and serve it from the backend:

```bash
cd frontend
npm run build
cp -r dist ../backend/public
cd ../backend
npm start
```

The backend will then serve the static React app plus API routes on the configured port.

## API Endpoints

### Authentication

- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive JWT
- `GET /api/auth/me` — Get current user profile
- `PUT /api/auth/profile` — Update user profile

### Complaints

- `POST /api/complaints` — Create a complaint (with photos)
- `GET /api/complaints` — List complaints with filters
- `GET /api/complaints/nearby` — Nearby complaints by location
- `GET /api/complaints/heatmap` — Heatmap/status statistics
- `GET /api/complaints/:id` — Complaint detail
- `POST /api/complaints/:id/upvote` — Upvote a complaint
- `PUT /api/complaints/:id/status` — Update complaint status
- `POST /api/complaints/:id/resolve` — Resolve a complaint

## User Roles

- `resident` — Can report issues, upvote complaints, and view complaint details
- `ward_admin` — Can manage complaint status, resolve issues, and access admin dashboard

## Notes

- Uploaded files are stored in `backend/uploads/`
- The frontend uses `socket.io-client` for real-time notifications
- If email is configured, complaints with 10+ upvotes are escalated automatically

## License

This repository is provided as-is for demo and development purposes.
