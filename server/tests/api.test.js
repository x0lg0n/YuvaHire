// Comprehensive test suite for YuvaHire backend
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const College = require('../models/College');

let mongoServer;
let authToken;
let adminToken;
let studentToken;

describe('YuvaHire API Tests', () => {
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
    await College.deleteMany({});
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new student', async () => {
        const userData = {
          username: 'teststudent',
          password: 'password123',
          role: 'student',
          college_name: 'Test University'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.username).toBe(userData.username);
        expect(response.body.user.role).toBe('student');
      });

      it('should register a new college admin', async () => {
        const userData = {
          username: 'testadmin',
          password: 'password123',
          role: 'college_admin',
          college_name: 'Test University'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.role).toBe('college_admin');
      });

      it('should reject duplicate username', async () => {
        const userData = {
          username: 'duplicate',
          password: 'password123',
          role: 'student',
          college_name: 'Test University'
        };

        await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('message');
      });
    });

    describe('POST /api/auth/login', () => {
      beforeEach(async () => {
        const userData = {
          username: 'testuser',
          password: 'password123',
          role: 'student',
          college_name: 'Test University'
        };

        await request(app)
          .post('/api/auth/register')
          .send(userData);
      });

      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'testuser',
            password: 'password123'
          })
          .expect(200);

        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.username).toBe('testuser');
      });

      it('should reject invalid credentials', async () => {
        await request(app)
          .post('/api/auth/login')
          .send({
            username: 'testuser',
            password: 'wrongpassword'
          })
          .expect(400);
      });
    });
  });

  describe('Jobs', () => {
    let adminToken;
    let collegeId;

    beforeEach(async () => {
      // Create college
      const college = await College.create({
        name: 'Test University',
        location: 'Test City'
      });
      collegeId = college._id;

      // Create admin user
      const adminUser = await User.create({
        username: 'admin',
        password: await require('bcryptjs').hash('password123', 10),
        role: 'college_admin',
        college_name: 'Test University'
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'password123'
        });

      adminToken = loginResponse.body.token;
    });

    describe('POST /api/jobs', () => {
      it('should create a new job', async () => {
        const jobData = {
          title: 'Software Engineer',
          description: 'Build amazing applications',
          location: 'Remote',
          type: 'Full-time',
          salary: 50000,
          requirements: 'JavaScript, React, Node.js',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        const response = await request(app)
          .post('/api/jobs')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(jobData)
          .expect(201);

        expect(response.body).toHaveProperty('job');
        expect(response.body.job.title).toBe(jobData.title);
        expect(response.body.job.college_name).toBe('Test University');
      });

      it('should reject job creation without auth', async () => {
        const jobData = {
          title: 'Software Engineer',
          description: 'Build amazing applications',
          location: 'Remote',
          type: 'Full-time',
          salary: 50000,
          requirements: 'JavaScript, React, Node.js'
        };

        await request(app)
          .post('/api/jobs')
          .send(jobData)
          .expect(401);
      });
    });

    describe('GET /api/jobs/my-college', () => {
      beforeEach(async () => {
        // Create some test jobs
        await Job.create([
          {
            title: 'Job 1',
            description: 'Description 1',
            location: 'Remote',
            type: 'Full-time',
            salary: 50000,
            requirements: 'Requirements 1',
            college_name: 'Test University',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          {
            title: 'Job 2',
            description: 'Description 2',
            location: 'On-site',
            type: 'Part-time',
            salary: 25000,
            requirements: 'Requirements 2',
            college_name: 'Test University',
            deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
          }
        ]);
      });

      it('should return jobs for the user\'s college', async () => {
        const response = await request(app)
          .get('/api/jobs/my-college')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('jobs');
        expect(Array.isArray(response.body.jobs)).toBe(true);
        expect(response.body.jobs.length).toBe(2);
        expect(response.body.jobs[0].college_name).toBe('Test University');
      });
    });
  });

  describe('Applications', () => {
    let studentToken;
    let jobId;

    beforeEach(async () => {
      // Create student user
      const studentUser = await User.create({
        username: 'student',
        password: await require('bcryptjs').hash('password123', 10),
        role: 'student',
        college_name: 'Test University'
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'student',
          password: 'password123'
        });

      studentToken = loginResponse.body.token;

      // Create a job
      const job = await Job.create({
        title: 'Test Job',
        description: 'Test Description',
        location: 'Remote',
        type: 'Full-time',
        salary: 50000,
        requirements: 'Test Requirements',
        college_name: 'Test University',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      jobId = job._id;
    });

    describe('POST /api/applications', () => {
      it('should create a new application', async () => {
        const applicationData = {
          job: jobId,
          coverLetter: 'I am interested in this position'
        };

        const response = await request(app)
          .post('/api/applications')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(applicationData)
          .expect(201);

        expect(response.body).toHaveProperty('application');
        expect(response.body.application.status).toBe('pending');
        expect(response.body.application.job.toString()).toBe(jobId.toString());
      });

      it('should prevent duplicate applications', async () => {
        const applicationData = {
          job: jobId,
          coverLetter: 'I am interested in this position'
        };

        await request(app)
          .post('/api/applications')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(applicationData)
          .expect(201);

        await request(app)
          .post('/api/applications')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(applicationData)
          .expect(400);
      });
    });

    describe('GET /api/applications/my-applications', () => {
      beforeEach(async () => {
        // Create some applications
        await Application.create([
          {
            job: jobId,
            student: (await User.findOne({ username: 'student' }))._id,
            coverLetter: 'Application 1',
            status: 'pending'
          },
          {
            job: jobId,
            student: (await User.findOne({ username: 'student' }))._id,
            coverLetter: 'Application 2',
            status: 'accepted'
          }
        ]);
      });

      it('should return user\'s applications', async () => {
        const response = await request(app)
          .get('/api/applications/my-applications')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('applications');
        expect(Array.isArray(response.body.applications)).toBe(true);
        expect(response.body.applications.length).toBe(2);
      });
    });
  });

  describe('Colleges', () => {
    let superAdminToken;

    beforeEach(async () => {
      // Create super admin user
      const superAdmin = await User.create({
        username: 'superadmin',
        password: await require('bcryptjs').hash('password123', 10),
        role: 'super_admin',
        college_name: null
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'superadmin',
          password: 'password123'
        });

      superAdminToken = loginResponse.body.token;
    });

    describe('POST /api/colleges', () => {
      it('should create a new college', async () => {
        const collegeData = {
          name: 'New University',
          location: 'New City'
        };

        const response = await request(app)
          .post('/api/colleges')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(collegeData)
          .expect(201);

        expect(response.body).toHaveProperty('college');
        expect(response.body.college.name).toBe(collegeData.name);
        expect(response.body.college.location).toBe(collegeData.location);
      });

      it('should reject college creation by non-super admin', async () => {
        const collegeData = {
          name: 'New University',
          location: 'New City'
        };

        await request(app)
          .post('/api/colleges')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(collegeData)
          .expect(403);
      });
    });

    describe('GET /api/colleges', () => {
      beforeEach(async () => {
        await College.create([
          { name: 'University A', location: 'City A' },
          { name: 'University B', location: 'City B' },
          { name: 'University C', location: 'City C' }
        ]);
      });

      it('should return all colleges', async () => {
        const response = await request(app)
          .get('/api/colleges')
          .expect(200);

        expect(response.body).toHaveProperty('colleges');
        expect(Array.isArray(response.body.colleges)).toBe(true);
        expect(response.body.colleges.length).toBe(3);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid routes', async () => {
      await request(app)
        .get('/api/invalid-route')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle server errors gracefully', async () => {
      // This would require mocking a database failure
      // Implementation depends on specific error scenarios
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill().map(() =>
        request(app).get('/api/health')
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should complete within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/health')
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // 1 second
    });
  });
});
