const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const User = require('../../models/User');
const Job = require('../../models/Job');
const Application = require('../../models/Application');

let mongoServer;
let studentToken;
let adminToken;
let studentId;
let adminId;
let jobId;

describe('Application Controller', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});

    // Create test users
    const student = await User.create({
      username: 'student',
      password: await require('bcryptjs').hash('password123', 10),
      role: 'student',
      college_name: 'Test University'
    });
    studentId = student._id;

    const admin = await User.create({
      username: 'admin',
      password: await require('bcryptjs').hash('password123', 10),
      role: 'college_admin',
      college_name: 'Test University'
    });
    adminId = admin._id;

    // Get auth tokens
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'student', password: 'password123' });
    studentToken = studentLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'password123' });
    adminToken = adminLogin.body.token;

    // Create a test job
    const job = await Job.create({
      title: 'Test Job',
      description: 'Test job description',
      location: 'Remote',
      type: 'Full-time',
      salary: 50000,
      requirements: 'Test requirements',
      college_name: 'Test University',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      postedBy: adminId
    });
    jobId = job._id;
  });

  describe('POST /api/applications', () => {
    const validApplicationData = {
      coverLetter: 'I am very interested in this position and believe I would be a great fit.'
    };

    it('should create application as student', async () => {
      const applicationData = {
        ...validApplicationData,
        job: jobId
      };

      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body).toHaveProperty('application');
      expect(response.body.application.coverLetter).toBe(validApplicationData.coverLetter);
      expect(response.body.application.status).toBe('pending');
      expect(response.body.application.student.toString()).toBe(studentId.toString());
      expect(response.body.application.job.toString()).toBe(jobId.toString());
    });

    it('should reject application without authentication', async () => {
      const applicationData = {
        ...validApplicationData,
        job: jobId
      };

      await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(401);
    });

    it('should reject application by college admin', async () => {
      const applicationData = {
        ...validApplicationData,
        job: jobId
      };

      await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(applicationData)
        .expect(403);
    });

    it('should reject duplicate applications', async () => {
      const applicationData = {
        ...validApplicationData,
        job: jobId
      };

      // First application
      await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(applicationData)
        .expect(201);

      // Second application (duplicate)
      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(applicationData)
        .expect(400);

      expect(response.body.message).toContain('already applied');
    });

    it('should validate required job field', async () => {
      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(validApplicationData)
        .expect(400);

      expect(response.body.message).toContain('Job ID is required');
    });

    it('should reject application to non-existent job', async () => {
      const fakeJobId = new mongoose.Types.ObjectId();
      const applicationData = {
        ...validApplicationData,
        job: fakeJobId
      };

      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(applicationData)
        .expect(404);

      expect(response.body.message).toContain('Job not found');
    });

    it('should reject application to expired job', async () => {
      // Create expired job
      const expiredJob = await Job.create({
        title: 'Expired Job',
        description: 'This job has expired',
        location: 'Remote',
        type: 'Full-time',
        salary: 40000,
        requirements: 'Requirements',
        college_name: 'Test University',
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        postedBy: adminId
      });

      const applicationData = {
        ...validApplicationData,
        job: expiredJob._id
      };

      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(applicationData)
        .expect(400);

      expect(response.body.message).toContain('deadline has passed');
    });

    it('should reject application to different college job', async () => {
      // Create job for different college
      const otherCollegeJob = await Job.create({
        title: 'Other College Job',
        description: 'Job from another college',
        location: 'Remote',
        type: 'Full-time',
        salary: 45000,
        requirements: 'Requirements',
        college_name: 'Other University',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        postedBy: adminId
      });

      const applicationData = {
        ...validApplicationData,
        job: otherCollegeJob._id
      };

      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(applicationData)
        .expect(403);

      expect(response.body.message).toContain('different college');
    });
  });

  describe('GET /api/applications/my-applications', () => {
    beforeEach(async () => {
      // Create test applications
      await Application.create([
        {
          job: jobId,
          student: studentId,
          coverLetter: 'Application 1',
          status: 'pending'
        },
        {
          job: jobId,
          student: studentId,
          coverLetter: 'Application 2',
          status: 'accepted'
        }
      ]);
    });

    it('should return student\'s applications', async () => {
      const response = await request(app)
        .get('/api/applications/my-applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('applications');
      expect(Array.isArray(response.body.applications)).toBe(true);
      expect(response.body.applications.length).toBe(2);
      
      response.body.applications.forEach(app => {
        expect(app.student._id.toString()).toBe(studentId.toString());
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/applications/my-applications')
        .expect(401);
    });

    it('should populate job and student details', async () => {
      const response = await request(app)
        .get('/api/applications/my-applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const application = response.body.applications[0];
      expect(application.job).toHaveProperty('title');
      expect(application.job).toHaveProperty('description');
      expect(application.student).toHaveProperty('username');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/applications/my-applications?page=1&limit=1')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.applications.length).toBe(1);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 1);
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get('/api/applications/my-applications?status=accepted')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.applications.length).toBe(1);
      expect(response.body.applications[0].status).toBe('accepted');
    });
  });

  describe('GET /api/applications/job/:jobId', () => {
    beforeEach(async () => {
      // Create another student for additional applications
      const student2 = await User.create({
        username: 'student2',
        password: await require('bcryptjs').hash('password123', 10),
        role: 'student',
        college_name: 'Test University'
      });

      // Create applications
      await Application.create([
        {
          job: jobId,
          student: studentId,
          coverLetter: 'Application from student 1',
          status: 'pending'
        },
        {
          job: jobId,
          student: student2._id,
          coverLetter: 'Application from student 2',
          status: 'pending'
        }
      ]);
    });

    it('should return applications for job as admin', async () => {
      const response = await request(app)
        .get(`/api/applications/job/${jobId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('applications');
      expect(Array.isArray(response.body.applications)).toBe(true);
      expect(response.body.applications.length).toBe(2);
    });

    it('should reject access by student', async () => {
      await request(app)
        .get(`/api/applications/job/${jobId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent job', async () => {
      const fakeJobId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/applications/job/${fakeJobId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should only show applications for admin\'s college jobs', async () => {
      // Create job from different college
      const otherAdmin = await User.create({
        username: 'otheradmin',
        password: await require('bcryptjs').hash('password123', 10),
        role: 'college_admin',
        college_name: 'Other University'
      });

      const otherJob = await Job.create({
        title: 'Other Job',
        description: 'Job from other college',
        location: 'Remote',
        type: 'Full-time',
        salary: 50000,
        requirements: 'Requirements',
        college_name: 'Other University',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        postedBy: otherAdmin._id
      });

      await request(app)
        .get(`/api/applications/job/${otherJob._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/applications/:id/status', () => {
    let applicationId;

    beforeEach(async () => {
      const application = await Application.create({
        job: jobId,
        student: studentId,
        coverLetter: 'Test application',
        status: 'pending'
      });
      applicationId = application._id;
    });

    it('should update application status as admin', async () => {
      const response = await request(app)
        .put(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'accepted' })
        .expect(200);

      expect(response.body.application.status).toBe('accepted');
    });

    it('should reject status update by student', async () => {
      await request(app)
        .put(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'accepted' })
        .expect(403);
    });

    it('should validate status values', async () => {
      const response = await request(app)
        .put(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.message).toContain('Invalid status');
    });

    it('should return 404 for non-existent application', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .put(`/api/applications/${fakeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'accepted' })
        .expect(404);
    });
  });

  describe('DELETE /api/applications/:id', () => {
    let applicationId;

    beforeEach(async () => {
      const application = await Application.create({
        job: jobId,
        student: studentId,
        coverLetter: 'Test application',
        status: 'pending'
      });
      applicationId = application._id;
    });

    it('should allow student to withdraw their application', async () => {
      await request(app)
        .delete(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const deletedApp = await Application.findById(applicationId);
      expect(deletedApp).toBeNull();
    });

    it('should reject withdrawal by other students', async () => {
      // Create another student
      const otherStudent = await User.create({
        username: 'otherstudent',
        password: await require('bcryptjs').hash('password123', 10),
        role: 'student',
        college_name: 'Test University'
      });

      const otherLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'otherstudent', password: 'password123' });

      await request(app)
        .delete(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${otherLogin.body.token}`)
        .expect(403);
    });

    it('should prevent withdrawal of non-pending applications', async () => {
      // Update application status to accepted
      await Application.findByIdAndUpdate(applicationId, { status: 'accepted' });

      const response = await request(app)
        .delete(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);

      expect(response.body.message).toContain('pending applications');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid ObjectId format', async () => {
      await request(app)
        .get('/api/applications/job/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should handle database errors gracefully', async () => {
      // Close database connection to simulate error
      await mongoose.disconnect();

      const response = await request(app)
        .get('/api/applications/my-applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('message');

      // Reconnect for other tests
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });
  });
});