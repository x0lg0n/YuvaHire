const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');

let mongoServer;

describe('User Model', () => {
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
  });

  describe('User Schema Validation', () => {
    it('should create a valid student user', async () => {
      const userData = {
        username: 'teststudent',
        password: 'hashedpassword123',
        role: 'student',
        college_name: 'Test University'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.password).toBe(userData.password);
      expect(savedUser.role).toBe('student');
      expect(savedUser.college_name).toBe(userData.college_name);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should create a valid college admin user', async () => {
      const userData = {
        username: 'testadmin',
        password: 'hashedpassword123',
        role: 'college_admin',
        college_name: 'Test University'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toBe('college_admin');
      expect(savedUser.college_name).toBe(userData.college_name);
    });

    it('should create a valid super admin user without college_name', async () => {
      const userData = {
        username: 'superadmin',
        password: 'hashedpassword123',
        role: 'super_admin'
        // college_name is optional for super_admin
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toBe('super_admin');
      expect(savedUser.college_name).toBeUndefined();
    });

    it('should default role to student', async () => {
      const userData = {
        username: 'defaultrole',
        password: 'hashedpassword123',
        college_name: 'Test University'
        // role not specified
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toBe('student');
    });

    it('should require username', async () => {
      const userData = {
        password: 'hashedpassword123',
        role: 'student',
        college_name: 'Test University'
        // username missing
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should require password', async () => {
      const userData = {
        username: 'testuser',
        role: 'student',
        college_name: 'Test University'
        // password missing
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should require college_name for non-super-admin users', async () => {
      const userData = {
        username: 'testuser',
        password: 'hashedpassword123',
        role: 'student'
        // college_name missing
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique username constraint', async () => {
      const userData1 = {
        username: 'duplicateuser',
        password: 'hashedpassword123',
        role: 'student',
        college_name: 'Test University'
      };

      const userData2 = {
        username: 'duplicateuser', // Same username
        password: 'differentpassword',
        role: 'college_admin',
        college_name: 'Different University'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    it('should only allow valid roles', async () => {
      const userData = {
        username: 'invalidrole',
        password: 'hashedpassword123',
        role: 'invalid_role',
        college_name: 'Test University'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User Schema Methods', () => {
    it('should have findByUsername static method', async () => {
      const userData = {
        username: 'findme',
        password: 'hashedpassword123',
        role: 'student',
        college_name: 'Test University'
      };

      const user = new User(userData);
      await user.save();

      const foundUser = await User.findByUsername('findme');
      expect(foundUser).toBeTruthy();
      expect(foundUser.username).toBe('findme');
    });

    it('should return null for non-existent username', async () => {
      const foundUser = await User.findByUsername('nonexistent');
      expect(foundUser).toBeNull();
    });
  });

  describe('User Schema Indexes', () => {
    it('should have unique index on username', async () => {
      const indexes = await User.collection.getIndexes();
      const usernameIndex = Object.values(indexes).find(index => 
        index.key && index.key.username === 1 && index.unique === true
      );
      expect(usernameIndex).toBeTruthy();
    });
  });

  describe('User Schema Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const userData = {
        username: 'timestamptest',
        password: 'hashedpassword123',
        role: 'student',
        college_name: 'Test University'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.createdAt).toBeInstanceOf(Date);
      expect(savedUser.updatedAt).toBeInstanceOf(Date);
      expect(savedUser.createdAt.getTime()).toBeLessThanOrEqual(savedUser.updatedAt.getTime());
    });

    it('should update updatedAt on modification', async () => {
      const userData = {
        username: 'updatetest',
        password: 'hashedpassword123',
        role: 'student',
        college_name: 'Test University'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      const originalUpdatedAt = savedUser.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      savedUser.college_name = 'Updated University';
      const updatedUser = await savedUser.save();

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('User Schema Edge Cases', () => {
    it('should handle empty string username', async () => {
      const userData = {
        username: '',
        password: 'hashedpassword123',
        role: 'student',
        college_name: 'Test University'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should handle very long username', async () => {
      const userData = {
        username: 'a'.repeat(1000), // Very long username
        password: 'hashedpassword123',
        role: 'student',
        college_name: 'Test University'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.username).toBe('a'.repeat(1000));
    });

    it('should handle special characters in username', async () => {
      const userData = {
        username: 'test-user_123@domain.com',
        password: 'hashedpassword123',
        role: 'student',
        college_name: 'Test University'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.username).toBe('test-user_123@domain.com');
    });

    it('should handle unicode characters in college_name', async () => {
      const userData = {
        username: 'unicodetest',
        password: 'hashedpassword123',
        role: 'student',
        college_name: 'गौतम बुद्ध विश्वविद्यालय' // Unicode text
      };

      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.college_name).toBe('गौतम बुद्ध विश्वविद्यालय');
    });
  });

  describe('User Schema Performance', () => {
    it('should efficiently find users by username', async () => {
      // Create multiple users
      const users = [];
      for (let i = 0; i < 100; i++) {
        users.push({
          username: `user${i}`,
          password: 'hashedpassword123',
          role: 'student',
          college_name: 'Test University'
        });
      }
      
      await User.insertMany(users);

      const startTime = Date.now();
      const foundUser = await User.findByUsername('user50');
      const endTime = Date.now();

      expect(foundUser).toBeTruthy();
      expect(foundUser.username).toBe('user50');
      expect(endTime - startTime).toBeLessThan(100); // Should be fast due to index
    });
  });
});