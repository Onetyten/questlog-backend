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
  const hashedPassword1 = await bcrypt.hash('password123', 10);
  const user1 = await userProfile.create({
    name: 'GetChildren Test User One',
    email: 'getchildren1@example.com',
    password: hashedPassword1,
  });
  testUser1Id = user1._id;

  const loginRes1 = await request(app)
    .post('/auth/signin')
    .send({ email: 'getchildren1@example.com', password: 'password123' });
  authTokenUser1 = loginRes1.body.token;

  // Create test user 2
  const hashedPassword2 = await bcrypt.hash('password456', 10);
  const user2 = await userProfile.create({
    name: 'GetChildren Test User Two',
    email: 'getchildren2@example.com',
    password: hashedPassword2,
  });
  testUser2Id = user2._id;

  const loginRes2 = await request(app)
    .post('/auth/signin')
    .send({ email: 'getchildren2@example.com', password: 'password456' });
  authTokenUser2 = loginRes2.body.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await Task.deleteMany({});
});

describe('GET /api/task/fetchchildren/:parent_id', () => {
  let parentTaskUser1, childTaskUser1, grandChildTaskUser1, unrelatedTaskUser1;
  let parentTaskUser2;

  beforeEach(async () => {
    // Tasks for User 1
    parentTaskUser1 = await Task.create({ title: 'User1 Parent', user_id: testUser1Id });
    childTaskUser1 = await Task.create({ title: 'User1 Child', user_id: testUser1Id, parent_id: parentTaskUser1._id });
    grandChildTaskUser1 = await Task.create({ title: 'User1 Grandchild', user_id: testUser1Id, parent_id: childTaskUser1._id });
    unrelatedTaskUser1 = await Task.create({ title: 'User1 Unrelated Parent', user_id: testUser1Id }); // A parent with no children

    // Task for User 2
    parentTaskUser2 = await Task.create({ title: 'User2 Parent', user_id: testUser2Id });
    await Task.create({ title: 'User2 Child', user_id: testUser2Id, parent_id: parentTaskUser2._id });
  });

  describe('Successful Fetching', () => {
    it('should fetch direct children of a task', async () => {
      const res = await request(app)
        .get(`/api/task/fetchchildren/${parentTaskUser1._id}`)
        .set('Authorization', `Bearer ${authTokenUser1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tasks).toBeInstanceOf(Array);
      // It fetches all descendants, so child and grandchild
      expect(res.body.tasks.length).toBe(2);
      const titles = res.body.tasks.map(t => t.title);
      expect(titles).toContain('User1 Child');
      expect(titles).toContain('User1 Grandchild');
    });

    it('should fetch all descendants (children and grandchildren)', async () => {
      const res = await request(app)
        .get(`/api/task/fetchchildren/${parentTaskUser1._id}`)
        .set('Authorization', `Bearer ${authTokenUser1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.tasks.length).toBe(2); // Child and Grandchild
      const taskIds = res.body.tasks.map(t => t._id.toString());
      expect(taskIds).toContain(childTaskUser1._id.toString());
      expect(taskIds).toContain(grandChildTaskUser1._id.toString());
    });

    it('should return 404 if a parent task has no children', async () => {
      const res = await request(app)
        .get(`/api/task/fetchchildren/${unrelatedTaskUser1._id}`) // This task has no children
        .set('Authorization', `Bearer ${authTokenUser1}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No tasks found');
    });
  });

  describe('Authorization and Scoping', () => {
    it('should return 401 if no authorization token is provided', async () => {
      const res = await request(app)
        .get(`/api/task/fetchchildren/${parentTaskUser1._id}`);

      expect(res.statusCode).toBe(401);
    });

    it('should return 404 if user tries to fetch children of another user\'s task', async () => {
      // User1 tries to fetch children of parentTaskUser2
      const res = await request(app)
        .get(`/api/task/fetchchildren/${parentTaskUser2._id}`)
        .set('Authorization', `Bearer ${authTokenUser1}`);

      // Because GetDescendants is scoped by user_id, it won't find tasks for user1 with parent_id of user2's task
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No tasks found');
    });

     it('should return 404 if user tries to fetch children for a parent_id that does not exist for them, even if it exists for another user', async () => {
      const res = await request(app)
        .get(`/api/task/fetchchildren/${parentTaskUser2._id}`) // parent_id belongs to user2
        .set('Authorization', `Bearer ${authTokenUser1}`);     // but user1 is making the request

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('No tasks found');
    });
  });

  describe('Error Handling for parent_id', () => {
    it('should return 400 if parent_id is the string "null"', async () => {
      const res = await request(app)
        .get(`/api/task/fetchchildren/null`)
        .set('Authorization', `Bearer ${authTokenUser1}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('parent_id is required to get tasks');
    });

    it('should return 400 if parent_id is the string "undefined"', async () => {
      const res = await request(app)
        .get(`/api/task/fetchchildren/undefined`)
        .set('Authorization', `Bearer ${authTokenUser1}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('parent_id is required to get tasks');
    });

    it('should return 404 if parent_id is a valid ObjectId but does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/task/fetchchildren/${nonExistentId}`)
        .set('Authorization', `Bearer ${authTokenUser1}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No tasks found');
    });

    it('should return 500 if parent_id is a malformed ObjectId', async () => {
      const malformedId = 'invalid-object-id-format';
      const res = await request(app)
        .get(`/api/task/fetchchildren/${malformedId}`)
        .set('Authorization', `Bearer ${authTokenUser1}`);

      // Mongoose CastError for ObjectId should lead to a 500 based on the generic catch block
      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal server error while fetching child tasks');
    });

    it('should return 404 when parent_id is not provided (route matching /:parent_id with empty param)', async () => {
        const res = await request(app)
            .get(`/api/task/fetchchildren/`) // No parent_id
            .set('Authorization', `Bearer ${authTokenUser1}`);

        expect(res.statusCode).toBe(404); 
    });
  });
});
