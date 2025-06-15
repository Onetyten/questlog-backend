import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import app from '../app.js';
import userProfile from '../schema/userSchema.js';
import Task from '../schema/taskSchema.js';

let mongoServer;
let authTokenUser1;
let testUser1Id;
let authTokenUser2; 
let testUser2Id;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create test user 1
  const hashedPassword1 = await bcrypt.hash('fetchTestPass1', 10);
  const user1 = await userProfile.create({
    name: 'Fetch Test User One',
    email: 'fetchtest1@example.com',
    password: hashedPassword1,
    refreshTokens: [],
  });
  testUser1Id = user1._id;

  const loginRes1 = await request(app)
    .post('/auth/signin')
    .send({
      email: 'fetchtest1@example.com',
      password: 'fetchTestPass1',
    });
  authTokenUser1 = loginRes1.body.token;
  if (!authTokenUser1) {
    console.error('Failed to get auth token for user1 (fetch test):', loginRes1.body);
    throw new Error('Authentication token not received for user1 (fetch test).');
  }

  // Create test user 2
  const hashedPassword2 = await bcrypt.hash('fetchTestPass2', 10);
  const user2 = await userProfile.create({
    name: 'Fetch Test User Two',
    email: 'fetchtest2@example.com',
    password: hashedPassword2,
    refreshTokens: [],
  });
  testUser2Id = user2._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('GET /api/task/fetch (Fetch Tasks)', () => {
  beforeEach(async () => {
    await Task.deleteMany({});
  });

  it('should fetch all tasks belonging to the authenticated user', async () => {
    // Create tasks for user 1
    await Task.create({ title: 'User1 Task 1', user_id: testUser1Id, description: 'Description 1' });
    await Task.create({ title: 'User1 Task 2', user_id: testUser1Id, status: 'completed' });
    // Create a task for user 2 (should not be fetched by user 1)
    await Task.create({ title: 'User2 Task 1', user_id: testUser2Id, description: 'Should not see this' });

    const res = await request(app)
      .get('/api/task/fetch')
      .set('Authorization', `Bearer ${authTokenUser1}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tasks).toBeInstanceOf(Array);
    expect(res.body.tasks.length).toBe(2);

    // Check if all fetched tasks belong to user1
    res.body.tasks.forEach(task => {
      expect(task.user_id.toString()).toBe(testUser1Id.toString());
    });

    const titles = res.body.tasks.map(t => t.title).sort();
    expect(titles).toEqual(['User1 Task 1', 'User1 Task 2'].sort());
  });

  it('should return 404 if the authenticated user has no tasks', async () => {
    await Task.create({ title: 'User2 Task Only', user_id: testUser2Id });

    const res = await request(app)
      .get('/api/task/fetch')
      .set('Authorization', `Bearer ${authTokenUser1}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('No tasks found');
  });

  it('should return 401 if authorization token is missing', async () => {
    const res = await request(app)
      .get('/api/task/fetch');

    expect(res.statusCode).toBe(401);
  });

  it('should return 401 if authorization token is invalid', async () => {
    const res = await request(app)
      .get('/api/task/fetch')
      .set('Authorization', 'Bearer invalidtoken123');

    expect(res.statusCode).toBe(401);
  });

});