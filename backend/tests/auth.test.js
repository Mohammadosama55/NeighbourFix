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
});
