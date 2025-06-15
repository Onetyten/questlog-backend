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
    name: 'Patch Test User One',
    email: 'patchtest1@example.com',
    password: hashedPassword1,
  });
  testUser1Id = user1._id;

  const loginRes1 = await request(app)
    .post('/auth/signin')
    .send({ email: 'patchtest1@example.com', password: 'password123' });
  authTokenUser1 = loginRes1.body.token;

  // Create test user 2
  const hashedPassword2 = await bcrypt.hash('password456', 10);
  const user2 = await userProfile.create({
    name: 'Patch Test User Two',
    email: 'patchtest2@example.com',
    password: hashedPassword2,
  });
  testUser2Id = user2._id;

  const loginRes2 = await request(app)
    .post('/auth/signin')
    .send({ email: 'patchtest2@example.com', password: 'password456' });
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

describe('PATCH /api/task/edit/:_id', () => {
  let taskToEdit;

  beforeEach(async () => {
    taskToEdit = await Task.create({
      title: 'Initial Task Title',
      user_id: testUser1Id,
      priority: 'medium',
      status: 'pending',
    });
  });

  describe('Successful Updates by Owner', () => {
    it('should update task title successfully', async () => {
      const res = await request(app)
        .patch(`/api/task/edit/${taskToEdit._id}`)
        .set('Authorization', `Bearer ${authTokenUser1}`)
        .send({ title: 'Updated Task Title' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.updatedTask.title).toBe('Updated Task Title');
      const dbTask = await Task.findById(taskToEdit._id);
      expect(dbTask.title).toBe('Updated Task Title');
    });

    it('should update task status successfully', async () => {
      const res = await request(app)
        .patch(`/api/task/edit/${taskToEdit._id}`)
        .set('Authorization', `Bearer ${authTokenUser1}`)
        .send({ status: 'completed' });

      expect(res.statusCode).toBe(200);
      expect(res.body.updatedTask.status).toBe('completed');
      const dbTask = await Task.findById(taskToEdit._id);
      expect(dbTask.status).toBe('completed');
    });

    it('should update task priority successfully', async () => {
      const res = await request(app)
        .patch(`/api/task/edit/${taskToEdit._id}`)
        .set('Authorization', `Bearer ${authTokenUser1}`)
        .send({ priority: 'high' });

      expect(res.statusCode).toBe(200);
      expect(res.body.updatedTask.priority).toBe('high');
      const dbTask = await Task.findById(taskToEdit._id);
      expect(dbTask.priority).toBe('high');
    });

    it('should update task dueDate successfully', async () => {
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 5);
      const res = await request(app)
        .patch(`/api/task/edit/${taskToEdit._id}`)
        .set('Authorization', `Bearer ${authTokenUser1}`)
        .send({ dueDate: newDueDate.toISOString() });

      expect(res.statusCode).toBe(200);
      expect(new Date(res.body.updatedTask.dueDate).toISOString()).toBe(newDueDate.toISOString());
      const dbTask = await Task.findById(taskToEdit._id);
      expect(new Date(dbTask.dueDate).toISOString()).toBe(newDueDate.toISOString());
    });

    it('should return 200 and the task if no fields are provided for update', async () => {
        const res = await request(app)
          .patch(`/api/task/edit/${taskToEdit._id}`)
          .set('Authorization', `Bearer ${authTokenUser1}`)
          .send({});
  
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.updatedTask.title).toBe(taskToEdit.title);
        const dbTask = await Task.findById(taskToEdit._id);
        expect(dbTask.title).toBe(taskToEdit.title); // Verify in DB
      });

    it('should update parent_id to a valid task_id successfully', async () => {
        const parentTask = await Task.create({ title: 'Parent Task', user_id: testUser1Id });
        const res = await request(app)
            .patch(`/api/task/edit/${taskToEdit._id}`)
            .set('Authorization', `Bearer ${authTokenUser1}`)
            .send({ parent_id: parentTask._id.toString() });

        expect(res.statusCode).toBe(200);
        expect(res.body.updatedTask.parent_id.toString()).toBe(parentTask._id.toString());
        const dbTask = await Task.findById(taskToEdit._id);
        expect(dbTask.parent_id.toString()).toBe(parentTask._id.toString());
    });
  });

  describe('Validation and Error Handling', () => {
    it('should return 404 if task ID is not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/task/edit/${nonExistentId}`)
        .set('Authorization', `Bearer ${authTokenUser1}`)
        .send({ title: 'Trying to update non-existent' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Task not found');
    });

    it('should not update title and return 200 if new title is an empty string', async () => {
        const originalTitle = taskToEdit.title;
        const res = await request(app)
          .patch(`/api/task/edit/${taskToEdit._id}`)
          .set('Authorization', `Bearer ${authTokenUser1}`)
          .send({ title: '' }); // Empty title
  
        expect(res.statusCode).toBe(200); // Current logic doesn't update for empty/whitespace title
        expect(res.body.updatedTask.title).toBe(originalTitle);
        const dbTask = await Task.findById(taskToEdit._id);
        expect(dbTask.title).toBe(originalTitle); // Title should remain unchanged
      });

    it('should not update title and return 200 if new title is only whitespace', async () => {
        const originalTitle = taskToEdit.title;
        const res = await request(app)
          .patch(`/api/task/edit/${taskToEdit._id}`)
          .set('Authorization', `Bearer ${authTokenUser1}`)
          .send({ title: '   ' }); // Whitespace title
  
        expect(res.statusCode).toBe(200);
        expect(res.body.updatedTask.title).toBe(originalTitle);
        const dbTask = await Task.findById(taskToEdit._id);
        expect(dbTask.title).toBe(originalTitle);
    });

    it('should return 400 if trying to set parent_id to the task\'s own ID', async () => {
      const res = await request(app)
        .patch(`/api/task/edit/${taskToEdit._id}`)
        .set('Authorization', `Bearer ${authTokenUser1}`)
        .send({ parent_id: taskToEdit._id.toString() });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("You can't parent this task to itself");
    });

    it('should return 400 if trying to set parent_id to one of its descendants', async () => {
      const childTask = await Task.create({ title: 'Child', user_id: testUser1Id, parent_id: taskToEdit._id });
      const grandChildTask = await Task.create({ title: 'Grandchild', user_id: testUser1Id, parent_id: childTask._id });

      const res = await request(app)
        .patch(`/api/task/edit/${taskToEdit._id}`) // Editing parent task
        .set('Authorization', `Bearer ${authTokenUser1}`)
        .send({ parent_id: grandChildTask._id.toString() }); // Trying to parent to grandchild

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("You can't parent this task to its child");
    });

    it('should return 500 for invalid enum value for status (Mongoose validation)', async () => {
      const res = await request(app)
        .patch(`/api/task/edit/${taskToEdit._id}`)
        .set('Authorization', `Bearer ${authTokenUser1}`)
        .send({ status: 'invalid_status_value' });

      expect(res.statusCode).toBe(500); // Mongoose validation error leads to 500 in current catch block
      expect(res.body.message).toBe('Error updating tasks');
    });

    it('should return 500 for invalid enum value for priority (Mongoose validation)', async () => {
      const res = await request(app)
        .patch(`/api/task/edit/${taskToEdit._id}`)
        .set('Authorization', `Bearer ${authTokenUser1}`)
        .send({ priority: 'super_high_priority' });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Error updating tasks');
    });

    it('should return 500 if task ID in path is malformed (e.g. "invalid-id")', async () => {
        const res = await request(app)
          .patch(`/api/task/edit/invalid-id-format`)
          .set('Authorization', `Bearer ${authTokenUser1}`)
          .send({ title: 'test' });
  
        expect(res.statusCode).toBe(500); // Mongoose CastError
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Error updating tasks');
      });

    // Test for parent_id: null (assuming the .length on null bug is fixed)
    it('should correctly set parent_id to null and return 200', async () => {
        // First, ensure the task has a parent_id
        const parent = await Task.create({ title: 'Temporary Parent', user_id: testUser1Id });
        await Task.findByIdAndUpdate(taskToEdit._id, { parent_id: parent._id });
        
        const taskWithParent = await Task.findById(taskToEdit._id);
        expect(taskWithParent.parent_id).toBeDefined();

        const res = await request(app)
          .patch(`/api/task/edit/${taskToEdit._id}`)
          .set('Authorization', `Bearer ${authTokenUser1}`)
          .send({ parent_id: null }); // Attempting to set parent_id to null
  
        // Assuming the bug is fixed and it now correctly sets parent_id to null
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Task updated successfully');
      });

    it('should allow setting parent_id to a non-existent task ID (current behavior)', async () => {
        const nonExistentParentId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .patch(`/api/task/edit/${taskToEdit._id}`)
            .set('Authorization', `Bearer ${authTokenUser1}`)
            .send({ parent_id: nonExistentParentId });

        // Current code does not validate if parent_id exists before setting
        expect(res.statusCode).toBe(200);
        expect(res.body.updatedTask.parent_id.toString()).toBe(nonExistentParentId);
        const dbTask = await Task.findById(taskToEdit._id);
        expect(dbTask.parent_id.toString()).toBe(nonExistentParentId);
        // This is a potential issue: parent_id now points to a non-existent task.
    });
  });

  describe('Authorization', () => {
    it('should return 401 if no auth token is provided', async () => {
      const res = await request(app)
        .patch(`/api/task/edit/${taskToEdit._id}`)
        .send({ title: 'Update without auth' });

      expect(res.statusCode).toBe(401); // Assuming your auth middleware returns 401
    });

    it('IMPORTANT: Current code allows user to update another user\'s task (should be 403)', async () => {
      // This task belongs to user1
      const taskOfUser1 = await Task.create({
        title: 'User1 Original Task',
        user_id: testUser1Id,
      });

      const res = await request(app)
        .patch(`/api/task/edit/${taskOfUser1._id}`)
        .set('Authorization', `Bearer ${authTokenUser2}`) // Authenticated as user2
        .send({ title: 'Updated by User2' });

      // CURRENT BEHAVIOR (BUG):
      // The route does not check if req.user.id matches task.user_id.
      // So, it will likely return 200 and update the task.
      expect(res.statusCode).toBe(200); // This is the bug! Should be 403.
      expect(res.body.success).toBe(true);

      const dbTask = await Task.findById(taskOfUser1._id);
      expect(dbTask.title).toBe('Updated by User2'); // Task was actually updated by wrong user!
      expect(dbTask.user_id.toString()).toBe(testUser1Id.toString()); // User ID of task remains user1

      // IDEAL BEHAVIOR (AFTER FIX):
      // expect(res.statusCode).toBe(403);
      // expect(res.body.success).toBe(false);
      // expect(res.body.message).toMatch(/Forbidden/i);
      // const dbTaskUnchanged = await Task.findById(taskOfUser1._id);
      // expect(dbTaskUnchanged.title).toBe('User1 Original Task'); // Title should not change
    });
  });
});