# YuvaHire Backend

This is the backend server for YuvaHire, built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites

- Node.js v18.0 or higher
- MongoDB v5.0 or higher
- pnpm package manager

### Installation

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Environment Setup**

   ```bash
   # Copy example environment file
   cp .env.example .env

   # Configure environment variables
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/yuvahire
   JWT_SECRET=your_secure_secret
   NODE_ENV=development
   ```

3. **Start Development Server**

   ```bash
   pnpm dev
   ```

4. **Start Production Server**

   ```bash
   pnpm start
   ```

## 📁 Project Structure

```plaintext
server/
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middlewares/       # Custom middleware
├── models/            # Database models
├── routes/            # API routes
├── app.js            # Express app setup
└── server.js         # Server entry point
```

## 🌐 API Routes

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Jobs

- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Applications

- `POST /api/applications` - Submit application
- `GET /api/applications/my-applications` - Get user's applications
- `PUT /api/applications/:id/status` - Update application status

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control (Student/College Admin)
- Token refresh mechanism

## 💾 Database

- MongoDB with Mongoose ODM
- Data validation using Mongoose schemas
- Indexes for optimized queries

## 🛡️ Security Features

- Password hashing with bcrypt
- Request rate limiting
- CORS configuration
- Input validation
- XSS protection
- Security headers

## 🔍 Error Handling

Standardized error response format:

```json
{
  "error": {
    "message": "Error description",
    "status": 400,
    "code": "VALIDATION_ERROR"
  }
}
```

## 📊 Logging

- Request logging with Morgan
- Error logging with stack traces in development
- Clean error responses in production

## ⚡ Performance

- Connection pooling for MongoDB
- Response compression
- Cache headers
- Optimized query patterns

