# YuvaHire Mini Job Portal - Backend Boilerplate

This is the backend boilerplate for the YuvaHire Mini Job Portal project.

## Setup Instructions

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   JWT_SECRET=your_jwt_secret_here
   DB_CONNECTION_STRING=your_database_connection_string
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Jobs
- `GET /api/jobs/college/:collegeId` - Get jobs for a specific college (students)
- `POST /api/jobs` - Create a new job (college admins)
- `GET /api/jobs/my-posted` - Get jobs posted by admin (college admins)

### Applications
- `POST /api/applications` - Apply to a job (students)
- `GET /api/applications/my-applications` - Get user's applications (students)

### Colleges
- `GET /api/colleges` - Get all colleges

