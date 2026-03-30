# NeighbourFix

A civic complaint management platform that allows residents to report and track local infrastructure issues (roads, water, garbage, drainage, power, etc.) and enables ward admins to manage and resolve them.

## Architecture

- **Backend only** — Node.js + Express REST API
- **Database** — MongoDB (Atlas) via Mongoose
- **Auth** — JWT-based authentication
- **File uploads** — Multer (images stored in `backend/uploads/`)
- **Notifications** — Nodemailer for escalation emails
- **PDF generation** — PDFKit for official complaint letters

## Project Structure

```
backend/
  app.js              # Express app setup (CORS, routes, static files)
  server.js           # Entry point, connects to MongoDB, listens on PORT
  config/db.js        # Mongoose connection
  routes/             # auth.js, complaints.js
  controllers/        # authController.js, complaintController.js
  models/             # User.js, Complaint.js
  middleware/         # auth.js (JWT), upload.js (Multer)
  utils/              # emailService.js, pdfGenerator.js
  uploads/            # Uploaded images and generated PDFs
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive JWT
- `GET /api/auth/me` — Get current user (auth required)
- `PUT /api/auth/profile` — Update profile (auth required)

### Complaints
- `POST /api/complaints` — Create complaint with photo upload (resident only)
- `GET /api/complaints` — List complaints (filter by category, status, wardNumber)
- `GET /api/complaints/nearby` — Get nearby complaints (lat, lng, radius)
- `GET /api/complaints/heatmap` — Complaint stats by status
- `GET /api/complaints/:id` — Get single complaint
- `POST /api/complaints/:id/upvote` — Upvote a complaint (auth required)
- `PUT /api/complaints/:id/status` — Update status (admin only)
- `POST /api/complaints/:id/resolve` — Resolve with photos (admin only)

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string (secret) |
| `JWT_SECRET` | Secret key for signing JWTs |
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | Environment (development/production) |
| `EMAIL_USER` | (Optional) SMTP email for escalation emails |
| `EMAIL_PASS` | (Optional) SMTP password |
| `WARD_OFFICER_EMAILS` | (Optional) Comma-separated emails for escalation |

## User Roles

- `resident` — Can create complaints, upvote, view all complaints
- `ward_admin` — Can update complaint status, resolve complaints

## Escalation Logic

When a complaint reaches 5+ upvotes, the system auto-generates a PDF complaint letter and sends an escalation email to ward officers (if email is configured).
