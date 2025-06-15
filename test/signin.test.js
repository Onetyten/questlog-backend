import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import app from '../app.js';
import userProfile from '../schema/userSchema.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
  });

  // Create a test user
  const hashedPassword = await bcrypt.hash('testpassword', 10);
  await userProfile.create({
    name: 'Test User',
    email: 'test@example.com',
    password: hashedPassword,
    refreshTokens: [],
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('POST /auth/signin', () => {
  it('logs in successfully with correct credentials', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: 'test@example.com',
      password: 'testpassword',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('fails login with incorrect password', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/incorrect password/i);
  });

  it('fails login for non-existent user', async () => {
    const res = await request(app).post('/auth/signin').send({
      email: 'ghost@example.com',
      password: 'ghostpass',
    });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/user not found/i);
  });

});
