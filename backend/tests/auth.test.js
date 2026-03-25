import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/User.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);
});

afterEach(async () => {
  await User.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth API', () => {
  const baseUrl = '/api/auth';

  it('should register a new user', async () => {
    const payload = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      phone: '1234567890',
      role: 'resident',
      address: '123 Main St',
    };

    const res = await request(app).post(`${baseUrl}/register`).send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.role).toBe('resident');
  });

  it('should login and return jwt token', async () => {
    const user = {
      name: 'John Doe',
      email: 'john2@example.com',
      password: 'Password123!'
    };

    await request(app).post(`${baseUrl}/register`).send(user);

    const res = await request(app).post(`${baseUrl}/login`).send({ email: user.email, password: user.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should get current profile with valid token', async () => {
    const user = {
      name: 'John Doe',
      email: 'john3@example.com',
      password: 'Password123!'
    };

    const registerResponse = await request(app).post(`${baseUrl}/register`).send(user);
    const token = registerResponse.body.token;

    const meRes = await request(app)
      .get(`${baseUrl}/me`)
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.email).toBe(user.email);
    expect(meRes.body).not.toHaveProperty('password');
  });

  it('should update profile with valid token', async () => {
    const user = {
      name: 'John Doe',
      email: 'john4@example.com',
      password: 'Password123!'
    };

    const registerResponse = await request(app).post(`${baseUrl}/register`).send(user);
    const token = registerResponse.body.token;

    const updateRes = await request(app)
      .put(`${baseUrl}/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '7777777777', address: 'New Address' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.phone).toBe('7777777777');
    expect(updateRes.body.address).toBe('New Address');
  });

  describe('Complaint routes', () => {
    const complaintBase = '/api/complaints';

    it('resident can create complaint and public can read it', async () => {
      const user = { name: 'Res', email: 'res@example.com', password: 'Password123!' };
      const registerResp = await request(app).post(`${baseUrl}/register`).send(user);
      const token = registerResp.body.token;

      const newComplaint = {
        title: 'Pothole',
        description: 'Big pothole on road',
        category: 'road',
        location: { coordinates: [77.599, 12.971] },
        wardNumber: '10',
        address: 'Main road',
        photos: ['http://example.com/pothole.jpg']
      };

      const createResp = await request(app)
        .post(complaintBase)
        .set('Authorization', `Bearer ${token}`)
        .send(newComplaint);
      expect(createResp.statusCode).toBe(201);
      expect(createResp.body.title).toBe('Pothole');
      expect(createResp.body.status).toBe('reported');

      const listResp = await request(app).get(complaintBase);
      expect(listResp.statusCode).toBe(200);
      expect(Array.isArray(listResp.body)).toBe(true);
      expect(listResp.body.length).toBeGreaterThanOrEqual(1);

      const getResp = await request(app).get(`${complaintBase}/${createResp.body._id}`);
      expect(getResp.statusCode).toBe(200);
      expect(getResp.body._id).toBe(createResp.body._id);
    });

    it('resident can upvote complaint and admin can update status/resolve', async () => {
      const resident = { name: 'Res2', email: 'res2@example.com', password: 'Password123!' };
      const admin = { name: 'Admin', email: 'admin@example.com', password: 'Password123!', role: 'ward_admin' };
      const regRes = await request(app).post(`${baseUrl}/register`).send(resident);
      const residentToken = regRes.body.token;
      const regAdmin = await request(app).post(`${baseUrl}/register`).send(admin);
      const adminToken = regAdmin.body.token;

      const complaintData = {
        title: 'Garbage dump',
        description: 'Garbage pile near park',
        category: 'garbage',
        location: { coordinates: [77.599, 12.972] },
        wardNumber: '11',
        address: 'Garden street'
      };

      const cResp = await request(app).post(complaintBase).set('Authorization', `Bearer ${residentToken}`).send(complaintData);
      const id = cResp.body._id;

      const upvoteResp = await request(app).post(`${complaintBase}/${id}/upvote`).set('Authorization', `Bearer ${residentToken}`);
      expect(upvoteResp.statusCode).toBe(200);
      expect(upvoteResp.body.upvotes).toBe(1);

      const statusResp = await request(app).put(`${complaintBase}/${id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'in_progress' });
      expect(statusResp.statusCode).toBe(200);
      expect(statusResp.body.status).toBe('in_progress');

      const resolveResp = await request(app).post(`${complaintBase}/${id}/resolve`).set('Authorization', `Bearer ${adminToken}`).send({ resolutionNotes: 'Fixed', resolutionPhotos: [] });
      expect(resolveResp.statusCode).toBe(200);
      expect(resolveResp.body.status).toBe('resolved');

      const heatmapResp = await request(app).get(`${complaintBase}/heatmap`);
      expect(heatmapResp.statusCode).toBe(200);
      expect(heatmapResp.body.heatmap).toBeDefined();
    });
  });
});
