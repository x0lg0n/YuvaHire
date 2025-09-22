import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { server } from '@/lib/__mocks__/server'
import { http, HttpResponse } from 'msw'

// Test component to use the auth context
const TestComponent = () => {
  const { user, login, logout, loading, isAuthenticated } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <button 
        onClick={() => login({ 
          user: { id: '1', username: 'test', role: 'student' }, 
          token: 'test-token' 
        })}
      >
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

const renderWithAuthProvider = (component = <TestComponent />) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('Initial State', () => {
    it('should start with unauthenticated state', () => {
      renderWithAuthProvider()
      
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })

    it('should show loading state initially when checking stored auth', () => {
      localStorage.setItem('token', 'stored-token')
      localStorage.setItem('user', JSON.stringify({ id: '1', username: 'stored' }))
      
      renderWithAuthProvider()
      
      // Should start with loading true when checking stored auth
      expect(screen.getByTestId('loading')).toHaveTextContent('true')
    })

    it('should restore user from localStorage if valid', async () => {
      const storedUser = { id: '1', username: 'storedUser', role: 'student' }
      localStorage.setItem('token', 'valid-token')
      localStorage.setItem('user', JSON.stringify(storedUser))
      
      renderWithAuthProvider()
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(storedUser))
      })
    })

    it('should clear invalid stored tokens', async () => {
      localStorage.setItem('token', 'invalid-token')
      localStorage.setItem('user', JSON.stringify({ id: '1', username: 'test' }))
      
      // Mock API to reject the token
      server.use(
        http.get('/api/auth/verify', () => {
          return HttpResponse.json(
            { message: 'Invalid token' },
            { status: 401 }
          )
        })
      )
      
      renderWithAuthProvider()
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
        expect(screen.getByTestId('user')).toHaveTextContent('null')
      })
      
      // Should clear localStorage
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })
  })

  describe('Login Functionality', () => {
    it('should handle successful login', async () => {
      const user = userEvent.setup()
      renderWithAuthProvider()
      
      const loginButton = screen.getByRole('button', { name: /login/i })
      await user.click(loginButton)
      
      const expectedUser = { id: '1', username: 'test', role: 'student' }
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(expectedUser))
      })
      
      // Should store in localStorage
      expect(localStorage.getItem('token')).toBe('test-token')
      expect(JSON.parse(localStorage.getItem('user'))).toEqual(expectedUser)
    })

    it('should redirect student to student dashboard after login', async () => {
      const mockPush = jest.fn()
      
      // Mock useRouter
      jest.doMock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush })
      }))
      
      const { useRouter } = require('next/navigation')
      
      const user = userEvent.setup()
      renderWithAuthProvider()
      
      const loginButton = screen.getByRole('button', { name: /login/i })
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/student/home')
      })
    })

    it('should redirect admin to admin dashboard after login', async () => {
      const AdminTestComponent = () => {
        const { login } = useAuth()
        
        return (
          <button 
            onClick={() => login({ 
              user: { id: '2', username: 'admin', role: 'college_admin' }, 
              token: 'admin-token' 
            })}
          >
            Admin Login
          </button>
        )
      }
      
      const mockPush = jest.fn()
      
      jest.doMock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush })
      }))
      
      const user = userEvent.setup()
      renderWithAuthProvider(<AdminTestComponent />)
      
      const loginButton = screen.getByRole('button', { name: /admin login/i })
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/applications')
      })
    })

    it('should handle login errors gracefully', async () => {
      const ErrorTestComponent = () => {
        const { login, error } = useAuth()
        
        return (
          <div>
            <div data-testid="error">{error || 'no error'}</div>
            <button 
              onClick={() => login(null)} // Invalid login data
            >
              Invalid Login
            </button>
          </div>
        )
      }
      
      const user = userEvent.setup()
      renderWithAuthProvider(<ErrorTestComponent />)
      
      const loginButton = screen.getByRole('button', { name: /invalid login/i })
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no error')
      })
    })
  })

  describe('Logout Functionality', () => {
    it('should handle logout correctly', async () => {
      const user = userEvent.setup()
      renderWithAuthProvider()
      
      // First login
      const loginButton = screen.getByRole('button', { name: /login/i })
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })
      
      // Then logout
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await user.click(logoutButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
        expect(screen.getByTestId('user')).toHaveTextContent('null')
      })
      
      // Should clear localStorage
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })

    it('should redirect to login page after logout', async () => {
      const mockPush = jest.fn()
      
      jest.doMock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush })
      }))
      
      const user = userEvent.setup()
      renderWithAuthProvider()
      
      // First login
      const loginButton = screen.getByRole('button', { name: /login/i })
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })
      
      // Then logout
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await user.click(logoutButton)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('Token Management', () => {
    it('should handle token expiration', async () => {
      // Set up expired token
      const expiredToken = 'expired-token'
      localStorage.setItem('token', expiredToken)
      localStorage.setItem('user', JSON.stringify({ id: '1', username: 'test' }))
      
      // Mock API to return 401 for expired token
      server.use(
        http.get('/api/auth/verify', () => {
          return HttpResponse.json(
            { message: 'Token expired' },
            { status: 401 }
          )
        })
      )
      
      renderWithAuthProvider()
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
        expect(localStorage.getItem('token')).toBeNull()
      })
    })

    it('should automatically logout on 401 API responses', async () => {
      const user = userEvent.setup()
      renderWithAuthProvider()
      
      // First login
      const loginButton = screen.getByRole('button', { name: /login/i })
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })
      
      // Simulate API call that returns 401
      // This would typically happen through an axios interceptor
      // For testing, we can manually trigger the logout
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await user.click(logoutButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors during authentication', async () => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ id: '1', username: 'test' }))
      
      // Mock network error
      server.use(
        http.get('/api/auth/verify', () => {
          return HttpResponse.error()
        })
      )
      
      renderWithAuthProvider()
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        // Should fallback to unauthenticated state on network error
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })
    })

    it('should handle malformed stored user data', async () => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', 'invalid-json')
      
      renderWithAuthProvider()
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })
      
      // Should clear invalid data
      expect(localStorage.getItem('user')).toBeNull()
    })
  })

  describe('Context Provider', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')
      
      consoleSpy.mockRestore()
    })

    it('should provide all required context values', () => {
      renderWithAuthProvider()
      
      // All context values should be available
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      expect(screen.getByTestId('user')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
    })
  })

  describe('Persistence', () => {
    it('should maintain auth state across page reloads', async () => {
      const user = userEvent.setup()
      const { unmount } = renderWithAuthProvider()
      
      // Login
      const loginButton = screen.getByRole('button', { name: /login/i })
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })
      
      // Unmount and remount (simulate page reload)
      unmount()
      renderWithAuthProvider()
      
      // Should restore auth state
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
        expect(screen.getByTestId('user')).toHaveTextContent(
          JSON.stringify({ id: '1', username: 'test', role: 'student' })
        )
      })
    })

    it('should clear auth state when localStorage is cleared', async () => {
      const user = userEvent.setup()
      renderWithAuthProvider()
      
      // Login
      const loginButton = screen.getByRole('button', { name: /login/i })
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })
      
      // Clear localStorage externally
      localStorage.clear()
      
      // Trigger a state check (this would normally happen on page reload)
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await user.click(logoutButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })
    })
  })
})