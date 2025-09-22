import { http, HttpResponse } from 'msw'

// Mock user data
const mockUsers = {
  student: {
    id: '1',
    username: 'testStudent',
    role: 'student',
    college_name: 'Test University'
  },
  admin: {
    id: '2',
    username: 'testAdmin',
    role: 'college_admin',
    college_name: 'Test University'
  }
}

// Mock job data
const mockJobs = [
  {
    _id: '1',
    title: 'Frontend Developer',
    description: 'Build amazing React applications',
    location: 'Remote',
    type: 'Full-time',
    salary: 75000,
    college_name: 'Test University',
    requirements: 'React, JavaScript, HTML, CSS',
    deadline: '2024-12-31T23:59:59.000Z',
    status: 'active'
  },
  {
    _id: '2',
    title: 'Backend Developer Intern',
    description: 'Work with Node.js and databases',
    location: 'On-site',
    type: 'Internship',
    salary: 25000,
    college_name: 'Test University',
    requirements: 'Node.js, Express, MongoDB',
    deadline: '2024-11-30T23:59:59.000Z',
    status: 'active'
  }
]

// Mock application data
const mockApplications = [
  {
    _id: '1',
    job: mockJobs[0],
    student: mockUsers.student,
    coverLetter: 'I am very interested in this position',
    status: 'pending',
    createdAt: '2024-01-15T10:00:00.000Z'
  }
]

export const handlers = [
  // Authentication endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const { username, password } = await request.json()
    
    if (username === 'testStudent' && password === 'password123') {
      return HttpResponse.json({
        message: 'Login successful',
        user: mockUsers.student,
        token: 'mock-student-token'
      })
    }
    
    if (username === 'testAdmin' && password === 'password123') {
      return HttpResponse.json({
        message: 'Login successful',
        user: mockUsers.admin,
        token: 'mock-admin-token'
      })
    }
    
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 400 }
    )
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const { username, password, role, college_name } = await request.json()
    
    if (!username || !password) {
      return HttpResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      )
    }
    
    if (username === 'existingUser') {
      return HttpResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      )
    }
    
    const newUser = {
      id: '999',
      username,
      role: role || 'student',
      college_name
    }
    
    return HttpResponse.json({
      message: 'User created successfully',
      user: newUser,
      token: 'mock-registration-token'
    }, { status: 201 })
  }),

  // Job endpoints
  http.get('/api/jobs/my-college', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const limit = parseInt(url.searchParams.get('limit')) || 10
    const type = url.searchParams.get('type')
    const sortBy = url.searchParams.get('sortBy')
    const sortOrder = url.searchParams.get('sortOrder')
    
    let filteredJobs = [...mockJobs]
    
    if (type) {
      filteredJobs = filteredJobs.filter(job => job.type === type)
    }
    
    if (sortBy === 'salary') {
      filteredJobs.sort((a, b) => {
        return sortOrder === 'desc' ? b.salary - a.salary : a.salary - b.salary
      })
    }
    
    const startIndex = (page - 1) * limit
    const paginatedJobs = filteredJobs.slice(startIndex, startIndex + limit)
    
    return HttpResponse.json({
      jobs: paginatedJobs,
      total: filteredJobs.length,
      page,
      limit
    })
  }),

  http.post('/api/jobs', async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.includes('mock-admin-token')) {
      return HttpResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }
    
    const jobData = await request.json()
    
    if (!jobData.title) {
      return HttpResponse.json(
        { message: 'Title is required' },
        { status: 400 }
      )
    }
    
    const newJob = {
      _id: '999',
      ...jobData,
      college_name: 'Test University',
      status: 'active'
    }
    
    return HttpResponse.json({
      message: 'Job created successfully',
      job: newJob
    }, { status: 201 })
  }),

  http.get('/api/jobs/my-posted', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.includes('mock-admin-token')) {
      return HttpResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }
    
    return HttpResponse.json({
      jobs: mockJobs
    })
  }),

  // Application endpoints
  http.post('/api/applications', async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.includes('mock-student-token')) {
      return HttpResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }
    
    const applicationData = await request.json()
    
    if (!applicationData.job) {
      return HttpResponse.json(
        { message: 'Job ID is required' },
        { status: 400 }
      )
    }
    
    const job = mockJobs.find(j => j._id === applicationData.job)
    if (!job) {
      return HttpResponse.json(
        { message: 'Job not found' },
        { status: 404 }
      )
    }
    
    const newApplication = {
      _id: '999',
      job: applicationData.job,
      student: mockUsers.student.id,
      coverLetter: applicationData.coverLetter,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    
    return HttpResponse.json({
      message: 'Application submitted successfully',
      application: newApplication
    }, { status: 201 })
  }),

  http.get('/api/applications/my-applications', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.includes('mock-student-token')) {
      return HttpResponse.json(
        { message: 'Access denied' },
        { status: 401 }
      )
    }
    
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page')) || 1
    const limit = parseInt(url.searchParams.get('limit')) || 10
    
    let filteredApplications = [...mockApplications]
    
    if (status) {
      filteredApplications = filteredApplications.filter(app => app.status === status)
    }
    
    const startIndex = (page - 1) * limit
    const paginatedApplications = filteredApplications.slice(startIndex, startIndex + limit)
    
    return HttpResponse.json({
      applications: paginatedApplications,
      total: filteredApplications.length,
      page,
      limit
    })
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      message: 'YuvaHire Backend is running!',
      timestamp: new Date().toISOString()
    })
  }),

  http.head('/api/health', () => {
    return new HttpResponse(null, { status: 200 })
  }),

  // College endpoints
  http.get('/api/colleges', () => {
    return HttpResponse.json({
      colleges: [
        { _id: '1', name: 'Test University', location: 'Test City' },
        { _id: '2', name: 'Demo College', location: 'Demo City' }
      ]
    })
  }),

  // Error simulation endpoints
  http.get('/api/error/500', () => {
    return HttpResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }),

  http.get('/api/error/network', () => {
    return HttpResponse.error()
  })
]