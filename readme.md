# YuvaHire - Modern College Job Portal

![YuvaHire Logo](client/public/globe.svg)

YuvaHire is a modern, full-stack job portal application designed to bridge the gap between college students and employment opportunities. It provides a streamlined platform for colleges to post jobs and for students to find and apply for positions that match their skills and interests.

## 🌟 Features

### For Students
- **Smart Job Discovery**: Find relevant jobs from your college
- **Easy Application Process**: Apply to multiple jobs with a single profile
- **Application Tracking**: Monitor your application status in real-time
- **Personalized Dashboard**: View and manage all your applications
- **Advanced Search**: Filter jobs by type, location, and salary range

### For College Administrators
- **Efficient Job Posting**: Create and manage job listings
- **Application Management**: Review and process student applications
- **Analytics Dashboard**: Track application statistics and trends
- **Candidate Management**: Evaluate and communicate with applicants
- **Multi-format Job Listings**: Support for full-time, part-time, and internship positions

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 15 with React 19
- **Styling**: TailwindCSS with customizable themes
- **State Management**: React Context API
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with role-based access control
- **API Documentation**: OpenAPI/Swagger
- **Security**: CORS, Helmet, Rate Limiting

## 🛠️ Installation

### Prerequisites
- Node.js 18.0 or higher
- MongoDB 5.0 or higher
- pnpm package manager

### Frontend Setup
```bash
# Navigate to client directory
cd client

# Install dependencies
pnpm install

# Create .env.local file
cp .env.example .env.local

# Start development server
pnpm dev
```

### Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
pnpm install

# Create .env file
cp .env.example .env

# Start development server
pnpm dev
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## 📚 API Documentation

The API is RESTful and uses standard HTTP methods. Full documentation is available at `/api/docs` when running the server.

### Core Endpoints

- **Authentication**: `/api/auth/*`
- **Jobs**: `/api/jobs/*`
- **Applications**: `/api/applications/*`
- **Colleges**: `/api/colleges/*`
- **Users**: `/api/users/*`

## 🔐 Security

- JWT-based authentication
- Role-based access control
- Request rate limiting
- Security headers (CORS, XSS Protection, etc.)
- Input validation and sanitization
- Secure password hashing

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- All the contributors who have helped shape YuvaHire
- The open-source community for the amazing tools and libraries
- College administrators and students for valuable feedback

## 📬 Contact

For support or queries, please open an issue or contact us at [GitHub Issues](https://github.com/yourusername/YuvaHire/issues).

---
Made with ❤️ for the student community