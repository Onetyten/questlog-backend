import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import app from '../app.js';
import userProfile from '../schema/userSchema.js';
import Task from '../schema/taskSchema.js';

let mongoServer;
let authToken;
let testUserId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);

  // Create a test user
  const hashedPassword = await bcrypt.hash('testpassword123', 10);
  const user = await userProfile.create({
    name: 'Task Test User',
    email: 'tasktest@example.com',
    password: hashedPassword,
    refreshTokens: [],
  });
  testUserId = user._id;

  // Log in to get a token
  const loginRes = await request(app)
    .post('/auth/signin')
    .send({
      email: 'tasktest@example.com',
      password: 'testpassword123',
    });

  authToken = loginRes.body.token;
  if (!authToken) {
    console.error('Failed to get auth token in beforeAll:', loginRes.body);
    throw new Error('Authentication token not received. Check signin endpoint and credentials.');
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('POST /api/task/add', () => {
  // Clean up tasks after each test in this describe block
  afterEach(async () => {
    await Task.deleteMany({});
  });

  it('should add a new task successfully with valid data and authorization', async () => {
    const taskData = {
      title: 'My New Test Task',
      priority: 'high',
    };

    const res = await request(app)
      .post('/api/task/add')
      .set('Authorization', `Bearer ${authToken}`)
      .send(taskData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/created a new task successfully/i);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.title).toBe(taskData.title);
    expect(res.body.data.priority).toBe(taskData.priority);
    expect(res.body.data.user_id.toString()).toBe(testUserId.toString());
    expect(res.body.data.status).toBe('pending'); // Default value from schema

    // Optionally, verify in DB
    const dbTask = await Task.findById(res.body.data._id);
    expect(dbTask).not.toBeNull();
    expect(dbTask.title).toBe(taskData.title);
  });

  it('should return 400 if title is missing', async () => {
    const taskData = {
      priority: 'medium', // Missing title
    };

    const res = await request(app)
      .post('/api/task/add')
      .set('Authorization', `Bearer ${authToken}`)
      .send(taskData);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/the task is empty/i);
  });

  it('should return 401 if authorization token is missing', async () => {
    const taskData = {
      title: 'Task without Auth',
    };

    const res = await request(app)
      .post('/api/task/add')
      .send(taskData); // No Authorization header

    // This expectation depends on your Authorization middleware.
    // A common response for missing/invalid token is 401.
    // If your middleware behaves differently (e.g., 403 or leads to a 500 due to req.user being undefined),
    // you might need to adjust this.
    expect(res.statusCode).toBe(401);
    // You might also want to check the response body if your auth middleware provides one.
    // e.g., expect(res.body.message).toMatch(/Unauthorized/i);
  });

  it('should add a task with parent_id (null), priority, and dueDate', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const taskData = {
      title: 'Task with all specifiable fields',
      parent_id: null,
      priority: 'medium',
      dueDate: futureDate.toISOString(),
    };

    const res = await request(app)
      .post('/api/task/add')
      .set('Authorization', `Bearer ${authToken}`)
      .send(taskData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(taskData.title);
    expect(res.body.data.parent_id).toBeNull();
    expect(res.body.data.priority).toBe(taskData.priority);
    expect(new Date(res.body.data.dueDate).toISOString()).toBe(taskData.dueDate);
  });

  it('should return 500 if invalid priority (not in enum) is provided', async () => {
    const taskData = {
      title: 'Task with invalid priority',
      priority: 'extremely urgent', // Invalid enum value
    };

    const res = await request(app)
      .post('/api/task/add')
      .set('Authorization', `Bearer ${authToken}`)
      .send(taskData);

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Server Error/i);
    expect(res.body.error).toMatch(/validation failed/i); // Mongoose validation error
  });
});