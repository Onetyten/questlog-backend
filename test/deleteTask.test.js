import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import app from '../app.js';
import userProfile from '../schema/userSchema.js'; // Assuming this is your User model
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
  const hashedPassword1 = await bcrypt.hash('password123', 10);
  const user1 = await userProfile.create({
    name: 'Delete Test User One',
    email: 'deletetest1@example.com',
    password: hashedPassword1,
    refreshTokens: [],
  });
  testUser1Id = user1._id;

  const loginRes1 = await request(app)
    .post('/auth/signin')
    .send({
      email: 'deletetest1@example.com',
      password: 'password123',
    });
  authTokenUser1 = loginRes1.body.token;
  if (!authTokenUser1) {
    console.error('Failed to get auth token for user1:', loginRes1.body);
    throw new Error('Authentication token not received for user1.');
  }

  // Create test user 2
  const hashedPassword2 = await bcrypt.hash('password456', 10);
  const user2 = await userProfile.create({
    name: 'Delete Test User Two',
    email: 'deletetest2@example.com',
    password: hashedPassword2,
    refreshTokens: [],
  });
  testUser2Id = user2._id;

  const loginRes2 = await request(app)
    .post('/auth/signin')
    .send({
      email: 'deletetest2@example.com',
      password: 'password456',
    });
  authTokenUser2 = loginRes2.body.token;
  if (!authTokenUser2) {
    console.error('Failed to get auth token for user2:', loginRes2.body);
    throw new Error('Authentication token not received for user2.');
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('DELETE /api/task/delete/:_id', () => {
  // Clean up tasks after each test in this describe block
  afterEach(async () => {
    await Task.deleteMany({});
  });

  it('should delete a task successfully and return 200', async () => {
    const task = await Task.create({
      title: 'Task to be deleted',
      user_id: testUser1Id,
    });

    const res = await request(app)
      .delete(`/api/task/delete/${task._id}`)
      .set('Authorization', `Bearer ${authTokenUser1}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted a task successfully/i);
    expect(res.body.data._id).toBe(task._id.toString());

    const dbTask = await Task.findById(task._id);
    expect(dbTask).toBeNull();
  });

  it('should delete a task and all its subtasks successfully', async () => {
    const parentTask = await Task.create({
      title: 'Parent Task',
      user_id: testUser1Id,
    });
    const childTask = await Task.create({
      title: 'Child Task',
      user_id: testUser1Id,
      parent_id: parentTask._id,
    });
    const grandChildTask = await Task.create({
      title: 'Grandchild Task',
      user_id: testUser1Id,
      parent_id: childTask._id,
    });

    const res = await request(app)
      .delete(`/api/task/delete/${parentTask._id}`)
      .set('Authorization', `Bearer ${authTokenUser1}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const dbParentTask = await Task.findById(parentTask._id);
    expect(dbParentTask).toBeNull();
    const dbChildTask = await Task.findById(childTask._id);
    expect(dbChildTask).toBeNull();
    const dbGrandChildTask = await Task.findById(grandChildTask._id);
    expect(dbGrandChildTask).toBeNull();
  });

  it('should return 404 if task to delete is not found', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/task/delete/${nonExistentId}`)
      .set('Authorization', `Bearer ${authTokenUser1}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Task not found');
  });

  it('should return 400 if no task ID is provided', async () => {
    const res = await request(app)
      .delete('/api/task/delete/')
      .set('Authorization', `Bearer ${authTokenUser1}`);
    expect(res.statusCode).toBe(404)
  });
  
  it('should return 401 if authorization token is missing', async () => {
    const task = await Task.create({
      title: 'Task for auth test',
      user_id: testUser1Id,
    });

    const res = await request(app)
      .delete(`/api/task/delete/${task._id}`);

    expect(res.statusCode).toBe(401); 

    const dbTask = await Task.findById(task._id);
    expect(dbTask).not.toBeNull(); 
  });

  it('should return 403 if user tries to delete another user\'s task (and task is deleted due to current logic)', async () => {
    const taskOfUser1 = await Task.create({
      title: 'User1 Task - Attempt Delete by User2',
      user_id: testUser1Id,
    });

    const res = await request(app)
      .delete(`/api/task/delete/${taskOfUser1._id}`)
      .set('Authorization', `Bearer ${authTokenUser2}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Forbidden: You do not have permission to delete this task.');
    const dbTask = await Task.findById(taskOfUser1._id);
    expect(dbTask).toBeNull(); 
  });
});
