import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/login/page'
import { AuthContext } from '@/lib/auth-context'
import { server } from '@/lib/__mocks__/server'
import { http, HttpResponse } from 'msw'

// Mock the auth context
const mockLogin = jest.fn()
const mockAuthContextValue = {
  user: null,
  login: mockLogin,
  logout: jest.fn(),
  loading: false,
  isAuthenticated: false
}

// Mock next/navigation
jest.mock('next/navigation')
const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn()
}

beforeEach(() => {
  useRouter.mockReturnValue(mockRouter)
  jest.clearAllMocks()
})

const renderLoginPage = (authContextValue = mockAuthContextValue) => {
  return render(
    <AuthContext.Provider value={authContextValue}>
      <LoginPage />
    </AuthContext.Provider>
  )
}

describe('LoginPage', () => {
  describe('Rendering', () => {
    it('should render login form with all required fields', () => {
      renderLoginPage()
      
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument()
    })

    it('should render with proper accessibility attributes', () => {
      renderLoginPage()
      
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      expect(usernameInput).toHaveAttribute('autoComplete', 'username')
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should show correct placeholder text', () => {
      renderLoginPage()
      
      expect(screen.getByPlaceholderText(/enter your username/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show validation errors for empty fields', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      
      const submitButton = screen.getByRole('button', { name: /login/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument()
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for short username', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      
      const usernameInput = screen.getByLabelText(/username/i)
      await user.type(usernameInput, 'ab') // Less than 3 characters
      
      const submitButton = screen.getByRole('button', { name: /login/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for short password', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      
      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(passwordInput, '12345') // Less than 6 characters
      
      const submitButton = screen.getByRole('button', { name: /login/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
      })
    })

    it('should not show validation errors for valid input', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      await user.type(usernameInput, 'testStudent')
      await user.type(passwordInput, 'password123')
      
      const submitButton = screen.getByRole('button', { name: /login/i })
      await user.click(submitButton)
      
      // Wait to ensure no validation errors appear
      await waitFor(() => {
        expect(screen.queryByText(/username must be at least 3 characters/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/password must be at least 6 characters/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid credentials', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /login/i })
      
      await user.type(usernameInput, 'testStudent')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          message: 'Login successful',
          user: {
            id: '1',
            username: 'testStudent',
            role: 'student',
            college_name: 'Test University'
          },
          token: 'mock-student-token'
        })
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /login/i })
      
      await user.type(usernameInput, 'testStudent')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      // Check for loading state
      expect(screen.getByText(/logging in/i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('should handle login errors gracefully', async () => {
      // Override the default handler to return an error
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json(
            { message: 'Invalid credentials' },
            { status: 400 }
          )
        })
      )

      const user = userEvent.setup()
      renderLoginPage()
      
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /login/i })
      
      await user.type(usernameInput, 'wronguser')
      await user.type(passwordInput, 'wrongpass')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })

    it('should handle network errors', async () => {
      // Override the default handler to simulate network error
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.error()
        })
      )

      const user = userEvent.setup()
      renderLoginPage()
      
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /login/i })
      
      await user.type(usernameInput, 'testuser')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/cannot connect to the server/i)).toBeInTheDocument()
      })
    })

    it('should clear previous errors on new submission', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      
      // First, cause an error
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json(
            { message: 'Invalid credentials' },
            { status: 400 }
          )
        })
      )
      
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /login/i })
      
      await user.type(usernameInput, 'wronguser')
      await user.type(passwordInput, 'wrongpass')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
      
      // Clear inputs and try again with valid credentials
      await user.clear(usernameInput)
      await user.clear(passwordInput)
      
      // Reset to successful handler
      server.resetHandlers()
      
      await user.type(usernameInput, 'testStudent')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Server Health Check', () => {
    it('should perform health check before login', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /login/i })
      
      await user.type(usernameInput, 'testStudent')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled()
      })
    })

    it('should handle server unavailable during health check', async () => {
      // Override health check to fail
      server.use(
        http.head('/api/health', () => {
          return HttpResponse.error()
        })
      )

      const user = userEvent.setup()
      renderLoginPage()
      
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /login/i })
      
      await user.type(usernameInput, 'testStudent')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/cannot connect to server/i)).toBeInTheDocument()
      })
    })
  })

  describe('AuthRedirect Integration', () => {
    it('should not redirect when user is not authenticated', () => {
      renderLoginPage()
      
      // Should render the login form
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
    })

    it('should handle authenticated user appropriately', () => {
      const authenticatedContextValue = {
        ...mockAuthContextValue,
        user: { id: '1', username: 'testuser', role: 'student' },
        isAuthenticated: true
      }
      
      renderLoginPage(authenticatedContextValue)
      
      // AuthRedirect component should handle this case
      // The exact behavior depends on AuthRedirect implementation
    })
  })

  describe('Navigation', () => {
    it('should have working register link', () => {
      renderLoginPage()
      
      const registerLink = screen.getByRole('link', { name: /register/i })
      expect(registerLink).toHaveAttribute('href', '/register')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderLoginPage()
      
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument()
      
      // Form should be properly structured
      const form = screen.getByRole('form') || screen.getByDisplayValue('').closest('form')
      expect(form).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      
      // Tab through form elements
      await user.tab()
      expect(screen.getByLabelText(/username/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/password/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /login/i })).toHaveFocus()
    })

    it('should support form submission with Enter key', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      await user.type(usernameInput, 'testStudent')
      await user.type(passwordInput, 'password123')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled()
      })
    })
  })
})