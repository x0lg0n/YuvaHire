# YuvaHire

<div align="center">
  <img src="client/public/globe.svg" alt="YuvaHire Logo" width="120" />
  
  ### Modern College Job Portal
  
  [![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
  [![MongoDB](https://img.shields.io/badge/MongoDB-%3E%3D5.0-green)](server/README.md)
</div>

---

YuvaHire is a production-ready job portal platform designed to revolutionize how colleges connect their students with employment opportunities. Built with modern technologies and best practices, it provides a seamless experience for both students and college administrators.

## ✨ Key Features

### For Students

* Smart Job Discovery with AI-powered recommendations
* One-click application process with profile management
* Real-time application status tracking
* Personalized dashboard with job matches
* Advanced search with multiple filters

### For College Administrators

* Efficient job posting and management system
* Comprehensive application tracking dashboard
* Advanced analytics and reporting
* Automated candidate communication
* Multi-format job listing support

## 🚀 Technology Stack

### Frontend

* Next.js 15 with React 19
* TailwindCSS with custom theming
* React Context for state management
* React Hook Form with Zod validation
* Radix UI primitives

### Backend

* Node.js with Express
* MongoDB with Mongoose ODM
* JWT authentication
* OpenAPI/Swagger documentation
* Enterprise-grade security

## 📦 Quick Start

### Prerequisites

* Node.js (>= 18.0.0)
* MongoDB (>= 5.0)
* pnpm package manager

### Development Setup

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/yuvahire.git
   cd yuvahire
   ```

2. Install dependencies

   ```bash
   # Frontend
   cd client
   pnpm install

   # Backend
   cd ../server
   pnpm install
   ```

3. Configure environment

   ```bash
   # Frontend (.env.local)
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Backend (.env)
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/yuvahire
   JWT_SECRET=your_secure_secret
   NODE_ENV=development
   ```

4. Start development servers

   ```bash
   # Terminal 1 (Frontend)
   cd client
   pnpm dev

   # Terminal 2 (Backend)
   cd server
   pnpm dev
   ```

## 🔍 Documentation

* [Frontend Documentation](client/README.md)
* [Backend Documentation](server/README.md)
* [Contributing Guide](CONTRIBUTING.md)
* [API Documentation](server/README.md#api-routes)

## 🔐 Security Features

* JWT-based authentication
* Role-based access control
* Rate limiting and CORS
* Input validation
* XSS protection
* Security headers

## 📈 Roadmap

* AI-powered job matching
* Resume parsing and analysis
* Interview scheduling system
* Mobile applications
* Analytics dashboard
* Integration with job boards

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

* [GitHub Issues](https://github.com/yourusername/yuvahire/issues)
* [Documentation](https://yuvahire.com/docs)
* [Community Discord](https://discord.gg/yuvahire)

---

<div align="center">
Made with ❤️ for the student community
</div>