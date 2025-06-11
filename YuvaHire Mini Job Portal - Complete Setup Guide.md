# YuvaHire Mini Job Portal - Complete Setup Guide

This comprehensive guide provides everything you need to complete the YuvaHire Mini Job Portal project by the June 12 deadline. The project includes a complete full-stack application with authentication, role-based access control, and job management features.

## Quick Start Instructions

1. **Clone or download the project files** to your local machine
2. **Set up the database** using the provided SQL schema
3. **Configure environment variables** for both frontend and backend
4. **Install dependencies** and start both applications
5. **Test the application** locally before deployment

## Project Structure Overview

```
yuva-job-portal/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/        # UI components (shadcn/ui)
│   │   │   ├── student/   # Student-specific pages
│   │   │   └── admin/     # Admin-specific pages
│   │   ├── contexts/      # Authentication context
│   │   ├── lib/          # API configuration
│   │   └── assets/       # Static assets
│   ├── package.json
│   └── README.md
├── server/                # Node.js/Express backend
│   ├── config/           # Database configuration
│   ├── controllers/      # Business logic
│   ├── middleware/       # Authentication middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── database_schema.sql
│   ├── package.json
│   └── README.md
└── README.md            # Main project README
```

## Detailed Setup Instructions

### Step 1: Database Setup (PostgreSQL)

1. **Install PostgreSQL** if not already installed
2. **Create a new database**:
   ```sql
   CREATE DATABASE yuvahire_db;
   ```
3. **Run the schema file**:
   ```bash
   psql -d yuvahire_db -f server/database_schema.sql
   ```

### Step 2: Backend Setup

1. **Navigate to server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

4. **Update .env file** with your database credentials:
   ```
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key_here
   DB_CONNECTION_STRING=postgresql://username:password@localhost:5432/yuvahire_db
   ```

5. **Start the backend server**:
   ```bash
   npm run dev
   ```

### Step 3: Frontend Setup

1. **Navigate to client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start the development server**:
   ```bash
   pnpm run dev
   ```

4. **Open browser** and navigate to `http://localhost:5173`

## Features Included

### Authentication System
- User registration with role selection (Student/College Admin)
- Secure login with JWT tokens
- Role-based access control
- Protected routes

### Student Features
- Browse jobs from their college
- Apply to job opportunities
- View application history and status
- Search and filter jobs

### Admin Features
- Post new job opportunities
- View and manage posted jobs
- Role-based dashboard

### Technical Features
- Responsive design for mobile and desktop
- Modern UI with Tailwind CSS and shadcn/ui
- RESTful API architecture
- Secure password hashing
- Input validation and error handling

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Jobs
- `GET /api/jobs/college/:collegeId` - Get jobs by college (students)
- `POST /api/jobs` - Create job (admins)
- `GET /api/jobs/my-posted` - Get admin's posted jobs

### Applications
- `POST /api/applications` - Apply to job (students)
- `GET /api/applications/my-applications` - Get user applications

### Colleges
- `GET /api/colleges` - Get all colleges

## Testing the Application

1. **Register as a student** and select a college
2. **Register as a college admin** for the same college
3. **Login as admin** and post a job
4. **Login as student** and apply to the job
5. **Check applications** in both student and admin views

## Deployment Options

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically

### Backend (Render/Railway)
1. Create account on Render or Railway
2. Connect GitHub repository
3. Set environment variables
4. Deploy backend service

## Submission Checklist

- [ ] GitHub repository is public and accessible
- [ ] README.md includes setup instructions and live demo links
- [ ] All features are working correctly
- [ ] Application is responsive and user-friendly
- [ ] Loom video demonstrates key functionality
- [ ] Code is clean and well-documented

## Time Management Tips

### Day 1 (Setup & Auth)
- Focus on getting the basic authentication working
- Test login/registration flows
- Set up database and basic API endpoints

### Day 2 (Core Features)
- Implement job posting and viewing
- Add application functionality
- Test role-based access control

### Day 3 (Polish & Deploy)
- Add styling and responsive design
- Deploy to hosting platforms
- Record demonstration video
- Final testing and submission

## Common Issues and Solutions

### Database Connection Issues
- Verify PostgreSQL is running
- Check connection string format
- Ensure database exists and schema is loaded

### CORS Errors
- Backend includes CORS middleware
- Check API base URL in frontend configuration

### Authentication Issues
- Verify JWT secret is set
- Check token storage in localStorage
- Ensure middleware is properly configured

## Additional Resources

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)

This guide provides everything needed to successfully complete the YuvaHire Mini Job Portal project. The boilerplate code includes all essential features and follows best practices for a production-ready application.

