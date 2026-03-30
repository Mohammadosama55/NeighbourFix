# NeighbourFix — Hyperlocal Civic Complaint & Resolution Tracker

A full MERN stack web application for Indian residents to report, upvote, and track local civic complaints. Automatically escalates high-priority issues to ward authorities with PDF complaint letters.

## Architecture

- **Frontend**: React.js + Vite (port 5000) — complaint listing, map view, heatmap, admin dashboard
- **Backend**: Node.js + Express REST API (port 3001 in dev, 5000 in prod)
- **Database**: MongoDB (Atlas) via Mongoose with 2dsphere geospatial index
- **Auth**: JWT-based with role-based middleware (resident / ward_admin)
- **File uploads**: Multer (images stored in `backend/uploads/`)
- **PDF generation**: PDFKit for formal complaint letters on escalation
- **Email**: Nodemailer for escalation emails to ward officers
- **Maps**: Leaflet.js + react-leaflet for interactive complaint pins and heatmap

## Project Structure

```
frontend/
  src/
    App.jsx, main.jsx, index.css
    api/axios.js              # Axios instance with JWT interceptor
    context/AuthContext.jsx   # Auth state (login/register/logout)
    components/
      Navbar.jsx              # Top navigation
      ComplaintCard.jsx       # Complaint preview card
      MapView.jsx             # Leaflet map with colored status pins
      ProtectedRoute.jsx      # Route guard for auth/admin
    pages/
      Home.jsx                # Complaint list with filters + map toggle
      Login.jsx, Register.jsx # Auth pages
      CreateComplaint.jsx     # GPS picker + photo upload form
      ComplaintDetail.jsx     # Full complaint view with upvoting
      AdminDashboard.jsx      # Ward admin management table
      HeatmapPage.jsx         # Public accountability heatmap
      Profile.jsx             # User profile editor

backend/
  app.js              # Express app (CORS, routes, static files, SPA fallback)
  server.js           # Entry point, MongoDB connect, PORT listen
  config/db.js        # Mongoose connection
  routes/             # auth.js, complaints.js
  controllers/        # authController.js, complaintController.js
  models/             # User.js, Complaint.js
  middleware/         # auth.js (JWT + adminOnly), upload.js (Multer)
  utils/              # emailService.js, pdfGenerator.js
  uploads/            # Runtime: uploaded images and generated PDFs
  public/             # Runtime: built frontend (production only)
```

## Workflows

- **Start application** — Vite dev server (`cd frontend && npm run dev`) on port 5000
- **Backend API** — Node.js server (`cd backend && npm start`) on port 3001

## API Endpoints

### Auth (`/api/auth`)
- `POST /register` — Register a new user
- `POST /login` — Login and receive JWT
- `GET /me` — Get current user profile (auth required)
- `PUT /profile` — Update profile (auth required)

### Complaints (`/api/complaints`)
- `POST /` — Create complaint with photos (resident only)
- `GET /` — List complaints (filter by category, status, wardNumber)
- `GET /nearby` — Nearby complaints (lat, lng, radius)
- `GET /heatmap` — Complaint stats by status
- `GET /:id` — Single complaint detail
- `POST /:id/upvote` — Upvote (auth required; triggers escalation at 10 upvotes)
- `PUT /:id/status` — Update status (ward_admin only)
- `POST /:id/resolve` — Resolve with photos + notes (ward_admin only)

## Environment Variables

| Variable | Environment | Description |
|---|---|---|
| `MONGODB_URI` | Secret | MongoDB Atlas connection string |
| `JWT_SECRET` | Shared | JWT signing secret (auto-generated) |
| `PORT` | Shared (3001 dev) / Production (5000) | Server port |
| `NODE_ENV` | Shared (development) / Production (production) | Environment mode |
| `EMAIL_USER` | Optional | SMTP email for escalation notifications |
| `EMAIL_PASS` | Optional | SMTP password |
| `WARD_OFFICER_EMAILS` | Optional | Comma-separated escalation email recipients |

## User Roles

- **resident** — Register, report complaints (with GPS + photos), upvote, view all
- **ward_admin** — All resident permissions + update statuses, resolve/reject complaints

## Escalation Logic

When a complaint reaches 10+ upvotes, the system:
1. Auto-generates a formal PDF complaint letter (PDFKit)
2. Emails it to ward officers (if `EMAIL_USER`/`EMAIL_PASS` are configured)
3. Marks the complaint as `escalated`

## Deployment (Production)

Build step: `cd frontend && npm run build && cp -r dist ../backend/public`
Run step: `cd backend && npm start` (serves API + static React app on port 5000)
