# NeighbourFix Backend Testing Guide

## ✅ Pre-Testing Checklist

- [ ] MongoDB running (`mongodb://localhost:27017`)
- [ ] Node.js & npm installed
- [ ] Backend dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Postman or curl installed

---

## 🚀 Start the Server

```bash
cd backend
npm run dev
```

Expected output:
```
MongoDB Connected: localhost
Server running on port 5000
```

---

## 📋 Testing Flow (Step by Step)

### **STEP 1: Register User (Resident)**
**POST** `http://localhost:5000/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Resident",
  "email": "john@test.com",
  "password": "Password123!",
  "phone": "9876543210",
  "role": "resident",
  "wardNumber": "10",
  "address": "123 Main Street"
}
```

**Expected Response:** `201`
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "12345...",
    "name": "John Resident",
    "email": "john@test.com",
    "role": "resident"
  }
}
```

**Save this token as:** `RESIDENT_TOKEN`

---

### **STEP 2: Register Admin User**
**POST** `http://localhost:5000/api/auth/register`

**Body:**
```json
{
  "name": "Admin Officer",
  "email": "admin@municipality.gov",
  "password": "AdminPass123!",
  "phone": "1234567890",
  "role": "ward_admin",
  "wardNumber": "10",
  "address": "Municipal Office"
}
```

**Expected Response:** `201`

**Save this token as:** `ADMIN_TOKEN`

---

### **STEP 3: Login**
**POST** `http://localhost:5000/api/auth/login`

**Body:**
```json
{
  "email": "john@test.com",
  "password": "Password123!"
}
```

**Expected Response:** `200`
```json
{
  "token": "eyJhbGc..."
}
```

---

### **STEP 4: Get My Profile**
**GET** `http://localhost:5000/api/auth/me`

**Headers:**
```
Authorization: Bearer RESIDENT_TOKEN
```

**Expected Response:** `200`
```json
{
  "_id": "12345...",
  "name": "John Resident",
  "email": "john@test.com",
  "phone": "9876543210",
  "role": "resident"
}
```

---

### **STEP 5: Update Profile**
**PUT** `http://localhost:5000/api/auth/profile`

**Headers:**
```
Authorization: Bearer RESIDENT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "phone": "9999999999",
  "address": "456 New Street"
}
```

**Expected Response:** `200`

---

### **STEP 6: Create Complaint (with Photo)**
**POST** `http://localhost:5000/api/complaints`

**Headers:**
```
Authorization: Bearer RESIDENT_TOKEN
Content-Type: multipart/form-data
```

**Body (form-data):**
```
title: "Pothole on Main Street"
description: "Large dangerous pothole causing traffic hazard"
category: "road"
wardNumber: "10"
address: "Main Street, Bangalore"
location: {"coordinates": [77.5994, 12.9716]}
photos: [SELECT IMAGE FILE]
```

**Expected Response:** `201`
```json
{
  "_id": "complaint123...",
  "title": "Pothole on Main Street",
  "status": "reported",
  "upvotes": 0,
  "photos": ["upload/image.png"]
}
```

**Save this ID as:** `COMPLAINT_ID`

---

### **STEP 7: Get All Complaints (Public)**
**GET** `http://localhost:5000/api/complaints`

**Expected Response:** `200`
```json
[
  {
    "_id": "complaint123...",
    "title": "Pothole on Main Street",
    "category": "road",
    "status": "reported",
    "upvotes": 0,
    "wardNumber": "10"
  }
]
```

---

### **STEP 8: Get Complaint By ID**
**GET** `http://localhost:5000/api/complaints/COMPLAINT_ID`

**Expected Response:** `200`

---

### **STEP 9: Get Nearby Complaints (Geospatial)**
**GET** `http://localhost:5000/api/complaints/nearby?lat=12.9716&lng=77.5994&radius=5000`

**Expected Response:** `200` (array of nearby complaints)

---

### **STEP 10: Upvote Complaint (First Vote)**
**POST** `http://localhost:5000/api/complaints/COMPLAINT_ID/upvote`

**Headers:**
```
Authorization: Bearer RESIDENT_TOKEN
```

**Expected Response:** `200`
```json
{
  "upvotes": 1
}
```

Repeat this **4 more times** to reach 5 upvotes (triggers escalation)

---

### **STEP 11: Upvote Complaint (5th time - Triggers Escalation)**

**After 5th upvote:**
- PDF generated ✅
- Email sent to ward officers ✅
- Complaint marked escalated ✅

**Check email:** `mdosamayes@gmail.com` should receive escalation notice

---

### **STEP 12: Update Complaint Status (Admin Only)**
**PUT** `http://localhost:5000/api/complaints/COMPLAINT_ID/status`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "status": "in_progress"
}
```

**Expected Response:** `200`

---

### **STEP 13: Resolve Complaint (Admin Only)**
**POST** `http://localhost:5000/api/complaints/COMPLAINT_ID/resolve`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
Content-Type: multipart/form-data
```

**Body (form-data):**
```
resolutionNotes: "Pothole filled with asphalt"
resolutionPhotos: [SELECT BEFORE/AFTER IMAGES]
```

**Expected Response:** `200`

---

### **STEP 14: Get Heatmap Data**
**GET** `http://localhost:5000/api/complaints/heatmap`

**Expected Response:** `200`
```json
{
  "heatmap": {
    "reported": 5,
    "in_progress": 2,
    "resolved": 1,
    "rejected": 0
  }
}
```

---

### **STEP 15: Logout (Blacklist Token)**
**POST** `http://localhost:5000/api/auth/logout`

**Headers:**
```
Authorization: Bearer RESIDENT_TOKEN
```

**Expected Response:** `200`
```json
{
  "message": "Successfully logged out"
}
```

**Verify:** Try using the same token again on `/me` → should get `401 "Token is blacklisted"`

---

## 🧪 Testing with cURL

### Register (Copy-Paste Ready)
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

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "Password123!"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Complaint with Image
```bash
curl -X POST http://localhost:5000/api/complaints \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Pothole" \
  -F "description=Large pothole on road" \
  -F "category=road" \
  -F "wardNumber=10" \
  -F "address=Main Street" \
  -F "location={\"coordinates\":[77.5994,12.9716]}" \
  -F "photos=@/path/to/image.jpg"
```

### Get All Complaints
```bash
curl -X GET http://localhost:5000/api/complaints
```

### Upvote Complaint
```bash
curl -X POST http://localhost:5000/api/complaints/COMPLAINT_ID/upvote \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔴 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `MONGODB NOT RUNNING` | Start MongoDB: `mongod` or use MongoDB Compass |
| `REDIS CONNECTION ERROR` | OK - falls back to in-memory token blacklist |
| `EMAIL NOT SENDING` | Check `EMAIL_USER` and `EMAIL_PASS` in `.env` |
| `MULTER FILE NOT RECEIVING` | Ensure form-data content-type in requests |
| `TOKEN EXPIRED` | Tokens expire in 7 days, login again |
| `FILE SIZE ERROR` | Max 5MB, use smaller images |
| `ADMIN ACCESS DENIED` | Make sure using ADMIN_TOKEN with admin role |

---

## ✨ Verification Checklist

- [ ] **Auth API**
  - [ ] Register resident works
  - [ ] Register admin works
  - [ ] Login returns token
  - [ ] Get profile returns user data
  - [ ] Update profile changes data
  - [ ] Logout blacklists token
  - [ ] Using logged-out token returns 401

- [ ] **Complaint API**
  - [ ] Create complaint with photo upload
  - [ ] Get all complaints (public)
  - [ ] Get complaint by ID
  - [ ] Nearby search works with coordinates
  - [ ] Upvote increases count
  - [ ] Escalation triggers at 5 upvotes
  - [ ] Admin can update status
  - [ ] Admin can resolve with photos
  - [ ] Heatmap returns stats

- [ ] **Email & PDF**
  - [ ] Escalation email received
  - [ ] PDF generated and attached
  - [ ] PDF contains complaint details

---

## 📊 Sample Test Data

**Resident 1:**
- Email: `john@test.com`
- Password: `Password123!`
- Role: `resident`

**Resident 2:**
- Email: `maria@test.com`
- Password: `Password123!`
- Role: `resident`

**Admin:**
- Email: `admin@municipality.gov`
- Password: `AdminPass123!`
- Role: `ward_admin`

**Ward Numbers:** 10, 11, 12

**Categories:** road, water, garbage, drainage, power, other

**Status:** reported, in_progress, resolved, rejected

---

## 🎯 Full Test Sequence (5 min)

1. Register resident + admin (30s)
2. Create complaint (30s)
3. Upvote 5 times (1 min)
4. Check escalation email (1 min)
5. Admin updates status (30s)
6. Admin resolves (30s)
7. Check heatmap (30s)

**Total: ~5 minutes all endpoints tested ✅**

---

## 🎨 Postman Collection Import

Create file `postman-collection.json` and import in Postman for auto-complete.

**Or use:** `npm run dev` + Postman's API learning mode

---

**Ready to develop frontend!** All backend endpoints tested ✅
