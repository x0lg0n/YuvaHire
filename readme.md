# YuvaHire - College Job Portal

A modern, full-stack job portal specifically designed for college students and administrators. Built with Next.js, Node.js, and MongoDB.

## 🚀 Features

- **Student Features**: Browse jobs, apply to positions, track applications
- **College Admin Features**: Post jobs, manage applications, view analytics
- **Authentication**: Secure JWT-based authentication with role-based access
- **Real-time Updates**: Live application status updates
- **Responsive Design**: Mobile-first approach with modern UI/UX

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt
- **File Upload**: Cloudinary integration
- **Validation**: Joi schema validation

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 6+
- pnpm (recommended) or npm

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/yuva-hire.git
cd yuva-hire
```

### 2. Install Dependencies
```bash
# Install server dependencies
cd server
pnpm install

# Install client dependencies
cd ../client
pnpm install
```

### 3. Environment Setup

#### Server Environment (.env)
```bash
cd server
cp .env.example .env
```

Configure the following variables:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/yuva-hire
JWT_SECRET=your-super-secret-jwt-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

#### Client Environment (.env.local)
```bash
cd client
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Start Development Servers

#### Terminal 1 - Backend
```bash
cd server
pnpm dev
```

#### Terminal 2 - Frontend
```bash
cd client
pnpm dev
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Job Endpoints
- `GET /api/jobs/my-college` - Get jobs for user's college
- `POST /api/jobs` - Create new job (Admin only)
- `GET /api/jobs/my-posted` - Get posted jobs (Admin only)

### Application Endpoints
- `POST /api/applications` - Apply to a job
- `GET /api/applications/my-applications` - Get user's applications
- `GET /api/applications/job/:id` - Get applications for a job (Admin only)

### College Endpoints
- `GET /api/colleges` - Get all colleges
- `POST /api/colleges` - Create college (Super Admin only)

## 🏗️ Project Structure

```
yuva-hire/
├── client/                 # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # Reusable UI components
│   ├── lib/              # Utilities and API functions
│   └── public/           # Static assets
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── middlewares/      # Custom middlewares
│   └── config/           # Configuration files
└── docs/                 # Documentation
```

## 🧪 Testing

### Backend Tests
```bash
cd server
pnpm test
```

### Frontend Tests
```bash
cd client
pnpm test
```

### E2E Tests
```bash
pnpm test:e2e
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd client
pnpm build

# Start production server
cd server
pnpm start
```

### Docker Deployment
```bash
docker-compose up -d
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports

Please use the [GitHub Issues](https://github.com/yourusername/yuva-hire/issues) page to report bugs.

## 📞 Support

- **Email**: support@yuvahire.com
- **Discord**: [Join our community](https://discord.gg/yuvahire)
- **Documentation**: [docs.yuvahire.com](https://docs.yuvahire.com)

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Next.js](https://nextjs.org/) for the amazing React framework
- [MongoDB](https://mongodb.com/) for the database
- All our contributors and users

## 📊 Project Status

![GitHub stars](https://img.shields.io/github/stars/yourusername/yuva-hire)
![GitHub forks](https://img.shields.io/github/forks/yourusername/yuva-hire)
![GitHub issues](https://img.shields.io/github/issues/yourusername/yuva-hire)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/yuva-hire)
![GitHub license](https://img.shields.io/github/license/yourusername/yuva-hire)

---

Made with ❤️ by the YuvaHire Team