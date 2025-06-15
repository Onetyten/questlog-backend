import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js'; // export app separately from server start logic
import userProfile from '../schema/userSchema.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await userProfile.deleteMany({});
});

describe('POST /auth/signup', () => {
  it('should create a new user', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toHaveProperty('_id');
    expect(res.body.user.email).toBe('john@example.com');
  });

  it('should not allow signup with missing name', async () => {
    const res = await request(app).post('/auth/signup').send({
      email: 'missingname@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Name is required');
  });

  it('should not allow signup with short password', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'Tiny Password',
      email: 'shortpass@example.com',
      password: 'short',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Password must be at least 8 characters');
  });

  it('should not allow duplicate email', async () => {
    await request(app).post('/auth/signup').send({
      name: 'First User',
      email: 'duplicate@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/auth/signup').send({
      name: 'Second User',
      email: 'duplicate@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('Email already exists');
  });
});
