const jwt = require('jsonwebtoken');
const { auth, requireRole } = require('../../middlewares/auth');
const User = require('../../models/User');

// Mock Express request, response, and next
const mockRequest = (headers = {}, user = null) => ({
  headers,
  user
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

// Mock User.findById
jest.mock('../../models/User');

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('auth middleware', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        role: 'student',
        college_name: 'Test University'
      };

      const token = jwt.sign(
        { id: mockUser._id, username: mockUser.username, role: mockUser.role },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      User.findById.mockResolvedValue(mockUser);

      const req = mockRequest({ authorization: `Bearer ${token}` });
      const res = mockResponse();
      const next = mockNext;

      await auth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext;

      await auth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied. No token provided.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', async () => {
      const req = mockRequest({ authorization: 'InvalidFormat token123' });
      const res = mockResponse();
      const next = mockNext;

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied. Invalid token format.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      const req = mockRequest({ authorization: 'Bearer invalid-token' });
      const res = mockResponse();
      const next = mockNext;

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied. Invalid token.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: 'user123', username: 'testuser', role: 'student' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const req = mockRequest({ authorization: `Bearer ${expiredToken}` });
      const res = mockResponse();
      const next = mockNext;

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied. Invalid token.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request when user not found in database', async () => {
      const token = jwt.sign(
        { id: 'nonexistent', username: 'testuser', role: 'student' },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      User.findById.mockResolvedValue(null);

      const req = mockRequest({ authorization: `Bearer ${token}` });
      const res = mockResponse();
      const next = mockNext;

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied. User not found.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const token = jwt.sign(
        { id: 'user123', username: 'testuser', role: 'student' },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      User.findById.mockRejectedValue(new Error('Database error'));

      const req = mockRequest({ authorization: `Bearer ${token}` });
      const res = mockResponse();
      const next = mockNext;

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Internal server error during authentication.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should work with lowercase authorization header', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        role: 'student',
        college_name: 'Test University'
      };

      const token = jwt.sign(
        { id: mockUser._id, username: mockUser.username, role: mockUser.role },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      User.findById.mockResolvedValue(mockUser);

      const req = mockRequest({ authorization: `bearer ${token}` });
      const res = mockResponse();
      const next = mockNext;

      await auth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('requireRole middleware', () => {
    const mockUser = {
      _id: 'user123',
      username: 'testuser',
      role: 'student',
      college_name: 'Test University'
    };

    it('should allow access for users with required role', () => {
      const middleware = requireRole(['student']);
      const req = mockRequest({}, mockUser);
      const res = mockResponse();
      const next = mockNext;

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access for users with one of multiple required roles', () => {
      const middleware = requireRole(['student', 'college_admin']);
      const req = mockRequest({}, mockUser);
      const res = mockResponse();
      const next = mockNext;

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for users without required role', () => {
      const middleware = requireRole(['college_admin']);
      const req = mockRequest({}, mockUser);
      const res = mockResponse();
      const next = mockNext;

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied. Insufficient permissions.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      const middleware = requireRole(['student']);
      const req = mockRequest(); // No user object
      const res = mockResponse();
      const next = mockNext;

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied. Authentication required.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle super_admin role', () => {
      const superAdminUser = { ...mockUser, role: 'super_admin' };
      const middleware = requireRole(['super_admin']);
      const req = mockRequest({}, superAdminUser);
      const res = mockResponse();
      const next = mockNext;

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle empty roles array', () => {
      const middleware = requireRole([]);
      const req = mockRequest({}, mockUser);
      const res = mockResponse();
      const next = mockNext;

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied. Insufficient permissions.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should be case sensitive for roles', () => {
      const middleware = requireRole(['STUDENT']); // Uppercase
      const req = mockRequest({}, mockUser); // user has 'student' (lowercase)
      const res = mockResponse();
      const next = mockNext;

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Combined auth and requireRole', () => {
    it('should work together for protected admin routes', async () => {
      const mockAdminUser = {
        _id: 'admin123',
        username: 'admin',
        role: 'college_admin',
        college_name: 'Test University'
      };

      const token = jwt.sign(
        { id: mockAdminUser._id, username: mockAdminUser.username, role: mockAdminUser.role },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      User.findById.mockResolvedValue(mockAdminUser);

      const req = mockRequest({ authorization: `Bearer ${token}` });
      const res = mockResponse();
      const next = jest.fn();

      // First apply auth middleware
      await auth(req, res, next);
      
      // Then apply role middleware
      if (next.mock.calls.length > 0) {
        const roleMiddleware = requireRole(['college_admin']);
        roleMiddleware(req, res, next);
      }

      expect(req.user).toEqual(mockAdminUser);
      expect(next).toHaveBeenCalledTimes(2); // Called by both middlewares
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject when auth passes but role fails', async () => {
      const mockStudentUser = {
        _id: 'student123',
        username: 'student',
        role: 'student',
        college_name: 'Test University'
      };

      const token = jwt.sign(
        { id: mockStudentUser._id, username: mockStudentUser.username, role: mockStudentUser.role },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      User.findById.mockResolvedValue(mockStudentUser);

      const req = mockRequest({ authorization: `Bearer ${token}` });
      const res = mockResponse();
      const next = jest.fn();

      // First apply auth middleware
      await auth(req, res, next);
      
      // Then apply role middleware requiring admin
      if (next.mock.calls.length > 0) {
        const roleMiddleware = requireRole(['college_admin']);
        roleMiddleware(req, res, next);
      }

      expect(req.user).toEqual(mockStudentUser);
      expect(next).toHaveBeenCalledTimes(1); // Only called by auth middleware
      expect(res.status).toHaveBeenCalledWith(403); // Role middleware rejects
    });
  });
});