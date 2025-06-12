# YuvaHire Frontend

This is the frontend application for YuvaHire, built with Next.js 15 and React 19.

## 🚀 Quick Start

### Prerequisites

- Node.js v18.0 or higher
- pnpm package manager
- Backend server running (see ../server/README.md)

### Installation

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Environment Setup**

   ```bash
   # Copy example environment file
   cp .env.example .env.local

   # Configure environment variables in .env.local:
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Start Development Server**

   ```bash
   pnpm dev
   ```

## 📁 Project Structure

```
client/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── student/           # Student dashboard pages
│   ├── login/             # Authentication pages
│   └── register/          # Registration pages
├── components/            # Reusable components
│   ├── ui/               # UI component library
│   └── ...               # Other components
├── lib/                   # Utilities and helpers
└── public/               # Static assets
```

## 🔧 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier

## 🎨 UI Components

We use a custom UI component library built with:
- Radix UI primitives
- TailwindCSS
- Shadcn UI

### Component Usage Example

```jsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function MyComponent() {
  return (
    <div>
      <Input placeholder="Enter text" />
      <Button>Click me</Button>
    </div>
  )
}
```

## 🔐 Authentication

Authentication is handled through JWT tokens and managed with React Context. Protected routes are implemented using the `protected-route` component.

## 📱 Responsive Design

The application is fully responsive and follows a mobile-first approach using TailwindCSS breakpoints.

## 🌐 API Integration

API calls are managed through a centralized `api.js` utility using Axios.

## 🌈 Theming

Supports light/dark mode and custom color themes through TailwindCSS configuration.
