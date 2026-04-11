# 🧪 Testing Everything Before Frontend Development

Follow this quick checklist to verify all backend endpoints work before starting frontend:

---

## 📋 **Option 1: Automated Testing (Fastest)**

### Run All Tests at Once:
```bash
cd backend
npm test
```

**Expected Output:**
```
PASS tests/auth.test.js
  ✓ should register a new user
  ✓ should login and return jwt token
  ✓ should get current profile with valid token
  ✓ should update profile with valid token
  ✓ resident can create complaint and public can read it
  ✓ resident can upvote complaint and admin can update status/resolve

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

---

## 🚀 **Option 2: Manual Testing with Postman (Recommended)**

### Step 1: Start Backend
```bash
cd backend
npm run dev
```

### Step 2: Import Postman Collection
1. Open **Postman**
2. Click **Import** (top-left)
3. Select `backend/postman-collection.json`
4. All API endpoints auto-loaded ✅

### Step 3: Replace Placeholder Tokens
In each request, replace:
- `PASTE_TOKEN_HERE` → Copy token from login response
- `PASTE_COMPLAINT_ID_HERE` → Copy from create complaint response
- `PASTE_RESIDENT_TOKEN_HERE` / `PASTE_ADMIN_TOKEN_HERE` → Use respective tokens

### Step 4: Run Requests In Order
1. Register Resident
2. Register Admin
3. Login (copy token)
4. Get Profile (paste token)
5. Create Complaint (paste token + attach image)
6. Get All Complaints
7. Upvote (5 times to trigger escalation)
8. Update Status (use admin token)
9. Resolve (use admin token + attach images)
10. Get Heatmap

---

## 🖥️ **Option 3: Manual Testing with cURL**

### 1️⃣ Register Resident
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Resident",
    "email": "john@test.com",
    "password": "Password123!",
    "phone": "9876543210",
    "role": "resident",
    "wardNumber": "10",
    "address": "123 Main Street"
  }'
```

**Copy the returned token:**
```
TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2️⃣ Get Profile
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 3️⃣ Create Complaint (without file upload)
```bash
curl -X POST http://localhost:5000/api/complaints \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pothole on Main Street",
    "description": "Large dangerous pothole",
    "category": "road",
    "wardNumber": "10",
    "address": "Main Street",
    "location": { "coordinates": [77.5994, 12.9716] }
  }'
```

**Copy the returned complaint ID:**
```
COMPLAINT_ID=507f1f77bcf86cd799439011
```

### 4️⃣ Get All Complaints
```bash
curl -X GET http://localhost:5000/api/complaints
```

### 5️⃣ Upvote Complaint (5 times)
```bash
curl -X POST http://localhost:5000/api/complaints/$COMPLAINT_ID/upvote \
  -H "Authorization: Bearer $TOKEN"
```

### 6️⃣ Get Heatmap
```bash
curl -X GET http://localhost:5000/api/complaints/heatmap
```

---

## ✨ **Complete End-to-End Flow (5 minutes)**

```
┌─────────────────────────────────────┐
│ 1. START SERVER                     │
│ npm run dev                         │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 2. REGISTER USERS                   │
│ - Resident                          │
│ - Admin                             │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 3. LOGIN & GET TOKEN                │
│ - Login with resident email         │
│ - Copy JWT token                    │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 4. CREATE COMPLAINT                 │
│ - Use resident token                │
│ - Upload image (optional)           │
│ - Copy complaint ID                 │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 5. UPVOTE 5 TIMES                   │
│ - Triggers escalation               │
│ - Email sent ✅                     │
│ - PDF generated ✅                  │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 6. ADMIN ACTIONS                    │
│ - Update status (in_progress)       │
│ - Resolve with photos               │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 7. CHECK HEATMAP                    │
│ ✅ All endpoints working!           │
└─────────────────────────────────────┘
```

---

## 🔍 **Verification Checklist**

Copy-paste this and check off as you go:

### **Auth API (6 endpoints)**
- [ ] POST `/api/auth/register` - Register returns token
- [ ] POST `/api/auth/login` - Login returns token  
- [ ] GET `/api/auth/me` - Profile returns user data
- [ ] PUT `/api/auth/profile` - Update changes data
- [ ] POST `/api/auth/logout` - Logout works
- [ ] GET `/api/auth/me` with logged-out token → 401 error ✅

### **Complaint API (8 endpoints)**
- [ ] POST `/api/complaints` - Create complaint
- [ ] GET `/api/complaints` - List all (public)
- [ ] GET `/api/complaints/:id` - Single complaint
- [ ] GET `/api/complaints/nearby` - Geospatial search
- [ ] POST `/api/complaints/:id/upvote` - Upvote increases count
- [ ] At 5 upvotes: Email + PDF triggered ✅
- [ ] PUT `/api/complaints/:id/status` - Admin updates status
- [ ] POST `/api/complaints/:id/resolve` - Admin resolves

### **Features Verification**
- [ ] File uploads work (images saved to `/uploads`)
- [ ] PDF generated and stored
- [ ] Escalation email received
- [ ] Token blacklist works (logout)
- [ ] Geospatial queries work
- [ ] Admin-only routes return 403 for residents

---

## 📊 **Test Data Reference**

**Accounts Created:**
```
RESIDENT:
  Email: john@test.com
  Password: Password123!

ADMIN:
  Email: admin@municipality.gov
  Password: AdminPass123!
```

**Sample Complaint Coordinates (Bangalore):**
- Latitude: 12.9716
- Longitude: 77.5994
- Ward: 10

**Categories:**
- road
- water
- garbage
- drainage
- power
- other

---

## 🐛 **Troubleshooting**

| Error | Fix |
|-------|-----|
| `Cannot GET /api/auth/register` | Backend not running (`npm run dev`) |
| `MONGODB_NOT_RUNNING` | Start MongoDB: `mongod` or use MongoDB Atlas |
| `Cannot read property 'coordinates'` | Ensure location format: `{"coordinates": [lng, lat]}` |
| `File size exceeds 5MB` | Use smaller images (<5MB) |
| `401 Unauthorized` | Token expired or incorrect format (use `Bearer ...`) |
| `Email not sending` | Check `.env` EMAIL_USER/EMAIL_PASS |
| `Redis connection refused` | Fine - falls back to in-memory |

---

## 📝 **Notes for Frontend Developer**

Once all tests pass ✅, frontend can assume:

✅ **Authentication:**
- JWT tokens valid for 7 days
- Logout blacklists token
- All auth endpoints working

✅ **File Uploads:**
- Multipart/form-data accepted
- Files saved to `backend/uploads/`
- Return URLs: `/uploads/complaint-xxx.jpg`

✅ **Geospatial:**
- MongoDB `2dsphere` index ready
- Nearby queries working (5km default radius)

✅ **Escalation:**
- Auto-triggers at 5 upvotes
- Sends email → check `mdosamayes@gmail.com`
- PDF attached to email

✅ **Admin Functions:**
- Role-based access control working
- Status updates restricted to admins
- Resolve endpoint working

---

## 🎉 **You're Ready!**

All backend APIs are tested and ready. Start frontend development! 🚀

For detailed endpoint documentation, see `TESTING_GUIDE.md`
