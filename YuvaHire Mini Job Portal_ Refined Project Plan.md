# YuvaHire Mini Job Portal: Refined Project Plan

This document outlines a refined step-by-step plan and recommended folder structure for the YuvaHire Mini Job Portal project, aiming for completion by the June 12 deadline. The plan is designed for a full-stack build, assuming a solo developer working with Node.js, Express, Next.js, and GitHub.

## Project Overview

The YuvaHire Mini Job Portal will facilitate job postings by college administrators and job applications by students. It will feature role-based access control, ensuring that college administrators can post and view jobs, while students can view jobs specific to their college and apply to them.

## Core Technologies

*   **Frontend:** Next.js (React), Axios, Tailwind CSS
*   **Backend:** Node.js, Express.js, CORS, Bcrypt.js, JSON Web Tokens (JWT)
*   **Database:** PostgreSQL (or MongoDB, as per user's choice)
*   **Version Control:** Git, GitHub

## Refined Step-by-Step Plan

### Day 1: Setup & Core Authentication

#### Morning: Project Setup & Database

1.  **GitHub Repository Creation:**
    *   Create a new public GitHub repository (e.g., `yuva-job-portal`).
    *   Clone the repository to your local machine.

2.  **Initial Folder Structure Creation:**
    *   Inside the `yuva-job-portal` directory, create two subdirectories:
        *   `client` (for the Next.js frontend)
        *   `server` (for the Node.js + Express backend)

3.  **Frontend Setup (`client` directory):**
    *   Navigate into the `client` directory.
    *   Initialize a new Next.js project: `npx create-next-app@latest . --ts --tailwind --eslint` (or similar, based on preference for TypeScript, Tailwind, ESLint).
    *   Install additional dependencies: `npm install axios` (or `yarn add axios`).

4.  **Backend Setup (`server` directory):**
    *   Navigate into the `server` directory.
    *   Initialize a new Node.js project: `npm init -y` (or `yarn init -y`).
    *   Install core dependencies: `npm install express cors bcryptjs jsonwebtoken dotenv pg` (if using PostgreSQL) or `npm install express cors bcryptjs jsonwebtoken dotenv mongoose` (if using MongoDB).

5.  **Database Setup (PostgreSQL Example):**
    *   Ensure PostgreSQL is installed and running.
    *   Create a new database for the project (e.g., `yuvahire_db`).
    *   Define and create necessary tables:
        *   `users`: `id (PK), username (UNIQUE), password (hashed), role (ENUM: 'student', 'college_admin'), college_id (FK to colleges.id)`
        *   `colleges`: `id (PK), name (UNIQUE), location`
        *   `jobs`: `id (PK), title, description, location, deadline, college_id (FK to colleges.id)`
        *   `applications`: `id (PK), job_id (FK to jobs.id), student_id (FK to users.id), status (ENUM: 'pending', 'accepted', 'rejected')`
    *   (Optional) Use an ORM like Sequelize or Prisma for easier database interaction and migrations.

#### Afternoon: Backend & Frontend Authentication

1.  **Backend Authentication APIs (`server` directory):**
    *   **User Model/Schema:** Create a model/schema for `User` (e.g., `server/models/User.js` or `server/models/user.ts`).
    *   **Authentication Routes:** Implement API endpoints in `server/routes/auth.js` (or `server/routes/auth.ts`):
        *   `POST /api/auth/register`: Handles user registration, hashes passwords using `bcryptjs`, and saves user data to the database. Assigns a default role (e.g., 'student').
        *   `POST /api/auth/login`: Authenticates users, compares hashed passwords, and generates a JSON Web Token (JWT) upon successful login. The JWT should contain `userId` and `role`.
    *   **Middleware:** Create a JWT authentication middleware (e.g., `server/middleware/auth.js`) to protect routes, verifying the token and attaching user information to the request object.

2.  **Frontend Authentication Pages (`client` directory):**
    *   **Login Page (`client/pages/login.js` or `.tsx`):**
        *   Create a UI for user login with input fields for username and password.
        *   Add a toggle or separate forms for 'Student' and 'College Admin' roles (though initial registration can be unified, login might differentiate).
        *   On successful login, store the received JWT in `localStorage` or `sessionStorage`.
        *   Redirect to a role-based dashboard.
    *   **Signup Page (`client/pages/signup.js` or `.tsx`):**
        *   Create a UI for user registration with input fields for username, password, and potentially college selection (for students).
        *   Handle form submission, sending data to the backend `/api/auth/register` endpoint.
        *   Display success/error messages.

### Day 2: Core Functionality (Jobs & Applications)

#### Morning: College Admin & Student Job Flows

1.  **Backend Job APIs (`server` directory):**
    *   **Job Model/Schema:** Create a model/schema for `Job` (e.g., `server/models/Job.js`).
    *   **Job Routes:** Implement API endpoints in `server/routes/jobs.js`:
        *   `POST /api/jobs`: (Protected by `auth` middleware, `college_admin` role required) Allows college administrators to post new jobs. Requires `title`, `description`, `location`, `deadline`, and `college_id` (derived from the authenticated admin's `college_id`).
        *   `GET /api/jobs/my-posted`: (Protected by `auth` middleware, `college_admin` role required) Retrieves all jobs posted by the authenticated college administrator's college.
        *   `GET /api/jobs/college/:collegeId`: (Protected by `auth` middleware, `student` role required) Retrieves jobs for a specific college ID. Students will automatically fetch jobs for their associated college.

2.  **Frontend College Admin Pages (`client` directory):**
    *   **Job Post Form (`client/pages/admin/post-job.js` or `.tsx`):**
        *   Create a form for college administrators to input job details (title, description, location, deadline).
        *   Submit data to `POST /api/jobs`.
    *   **Posted Jobs List (`client/pages/admin/my-jobs.js` or `.tsx`):**
        *   Display a list of jobs posted by the logged-in college administrator.
        *   Fetch data from `GET /api/jobs/my-posted`.

3.  **Frontend Student Pages (`client` directory):**
    *   **College Association:** During student registration or profile setup, allow selection of a college from a dropdown (populated by `GET /api/colleges` endpoint, which you'll need to create).
    *   **View College Jobs (`client/pages/student/jobs.js` or `.tsx`):**
        *   Display jobs relevant to the student's associated college.
        *   Fetch data from `GET /api/jobs/college/:collegeId` using the student's `college_id` from their token.
    *   **Apply to Job:** Add a button on each job listing to allow students to apply.
        *   This will trigger a `POST` request to a new backend endpoint (e.g., `POST /api/applications`).

#### Afternoon: Frontend Enhancements & Bonus Features

1.  **Frontend Views & Logic (`client` directory):**
    *   **Role-Based Dashboard (`client/pages/dashboard.js` or `.tsx`):**
        *   Implement conditional rendering based on user role (student/admin) to display relevant navigation and content.
    *   **


"Apply" Button Logic:**
        *   Ensure the 


"Apply" button is only visible to students and can only be clicked once per job by a given student. This requires tracking applications in the backend.
    *   **Feedback Messages:** Implement UI to show success/error messages for user actions (e.g., 


job posted successfully, application submitted, etc.).

2.  **Bonus if Time Allows:**
    *   **Job Filters:** Add search functionality to filter jobs by title or location on the student job listing page.
    *   **"My Applications" Page (`client/pages/student/my-applications.js` or `.tsx`):**
        *   Create a page for students to view all jobs they have applied to, along with their application status.
        *   This will require a new backend API endpoint (e.g., `GET /api/applications/my-applications`) to fetch applications by `student_id`.

### Day 3: Polish, Video, Submission

#### Morning: Clean up, README & Deployment

1.  **Clean up & Styling:**
    *   Apply basic styling using Tailwind CSS to improve the UI/UX.
    *   Ensure responsive design for various screen sizes.
    *   **Role-Based Access Control (RBAC) Review:** Double-check all backend routes and frontend components to ensure strict role-based access. For example:
        *   College administrators cannot apply to jobs.
        *   Students cannot post jobs.
        *   Students can only view jobs from their associated college.

2.  **README.md Creation:**
    *   Create a comprehensive `README.md` file in the root of your `yuva-job-portal` repository.
    *   Include clear instructions on how to set up and run both the frontend and backend applications locally.
    *   List all technologies used.
    *   Detail your approach and any assumptions made during development.
    *   Reserve a section for the Loom video link.

3.  **Deployment (Optional but Highly Recommended):**
    *   **Frontend (Vercel):** Deploy the Next.js `client` application to Vercel. Vercel offers seamless integration with Next.js.
    *   **Backend (Render/Railway):** Deploy the Node.js `server` application to a platform like Render or Railway. Ensure your database is also accessible from the deployed backend.
    *   Add the hosted links to your `README.md`.

#### Afternoon: Record Video & Final Checklist

1.  **Record Loom Video:**
    *   Create a 3-5 minute video walkthrough using Loom.
    *   Demonstrate key functionalities:
        *   User registration (student and/or admin).
        *   Login for both roles.
        *   College admin posting a job.
        *   Student viewing jobs (filtered by college).
        *   Student applying to a job.
        *   (If implemented) Student viewing their applications.

2.  **Final Checklist:**
    *   Verify that your GitHub repository is public.
    *   Ensure the `README.md` is clear, complete, and includes all necessary instructions and links.
    *   Confirm the Loom video is uploaded and the link is added to the `README.md`.
    *   If deployed, ensure the live demo is working correctly.

## Recommended Folder Structure

```
yuva-job-portal/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable UI components (e.g., Button, Input, Navbar)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layouts/          # Layout components (e.g., AuthLayout, DashboardLayout)
│   │   ├── lib/              # Utility functions, API configurations (e.g., axios instance)
│   │   ├── pages/            # Next.js pages (routes)
│   │   │   ├── api/          # Next.js API routes (if used for serverless functions)
│   │   │   ├── admin/        # Admin-specific pages (e.g., post-job.js, my-jobs.js)
│   │   │   ├── student/      # Student-specific pages (e.g., jobs.js, my-applications.js)
│   │   │   ├── index.js      # Homepage
│   │   │   ├── login.js      # Login page
│   │   │   └── signup.js     # Signup page
│   │   ├── styles/           # Global styles, Tailwind CSS configuration
│   │   └── types/            # TypeScript type definitions
│   ├── .env.local            # Environment variables for frontend
│   ├── next.config.js
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── server/
│   ├── config/               # Database connection, JWT secrets
│   ├── controllers/          # Business logic for routes (e.g., authController.js, jobController.js)
│   ├── middleware/           # Express middleware (e.g., authMiddleware.js)
│   ├── models/               # Database schemas/models (e.g., User.js, Job.js, College.js, Application.js)
│   ├── routes/               # API routes (e.g., auth.js, jobs.js, colleges.js, applications.js)
│   ├── .env                  # Environment variables for backend
│   ├── app.js                # Main Express application file
│   ├── package.json
│   └── server.js             # Entry point to start the server
├── .gitignore
└── README.md
```

This detailed plan and folder structure should provide a solid roadmap for completing the YuvaHire Mini Job Portal project within the given timeframe. Good luck!

