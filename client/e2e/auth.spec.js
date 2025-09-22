import { test, expect } from '@playwright/test'

// Test data
const testUsers = {
  student: {
    username: 'teststudent',
    password: 'password123',
    college: 'Test University'
  },
  admin: {
    username: 'testadmin',
    password: 'password123',
    college: 'Test University'
  }
}

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test.describe('User Registration', () => {
    test('should register a new student successfully', async ({ page }) => {
      await page.goto('/register')
      
      // Check if we're on the registration page
      await expect(page.getByRole('heading', { name: /register/i })).toBeVisible()
      
      // Fill out registration form
      await page.getByLabel(/username/i).fill('newstudent123')
      await page.getByLabel(/password/i).fill('password123')
      await page.getByLabel(/college/i).fill('Test University')
      
      // Select student role
      await page.getByRole('combobox', { name: /role/i }).click()
      await page.getByText('Student').click()
      
      // Submit form
      await page.getByRole('button', { name: /register/i }).click()
      
      // Should redirect to student dashboard
      await expect(page).toHaveURL(/\/student\/home/)
      await expect(page.getByText(/welcome/i)).toBeVisible()
    })

    test('should register a new college admin successfully', async ({ page }) => {
      await page.goto('/register')
      
      await page.getByLabel(/username/i).fill('newadmin123')
      await page.getByLabel(/password/i).fill('password123')
      await page.getByLabel(/college/i).fill('Test University')
      
      // Select admin role
      await page.getByRole('combobox', { name: /role/i }).click()
      await page.getByText('College Admin').click()
      
      await page.getByRole('button', { name: /register/i }).click()
      
      // Should redirect to admin dashboard
      await expect(page).toHaveURL(/\/admin/)
      await expect(page.getByText(/dashboard/i)).toBeVisible()
    })

    test('should show validation errors for invalid input', async ({ page }) => {
      await page.goto('/register')
      
      // Try to submit empty form
      await page.getByRole('button', { name: /register/i }).click()
      
      // Should show validation errors
      await expect(page.getByText(/username.*required/i)).toBeVisible()
      await expect(page.getByText(/password.*required/i)).toBeVisible()
    })

    test('should reject duplicate username', async ({ page }) => {
      await page.goto('/register')
      
      // Try to register with existing username
      await page.getByLabel(/username/i).fill('existinguser')
      await page.getByLabel(/password/i).fill('password123')
      await page.getByLabel(/college/i).fill('Test University')
      
      await page.getByRole('button', { name: /register/i }).click()
      
      // Should show error message
      await expect(page.getByText(/user already exists/i)).toBeVisible()
    })
  })

  test.describe('User Login', () => {
    test('should login student successfully', async ({ page }) => {
      await page.goto('/login')
      
      // Check if we're on login page
      await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()
      
      // Fill login form
      await page.getByLabel(/username/i).fill(testUsers.student.username)
      await page.getByLabel(/password/i).fill(testUsers.student.password)
      
      // Submit form
      await page.getByRole('button', { name: /login/i }).click()
      
      // Should redirect to student dashboard
      await expect(page).toHaveURL(/\/student\/home/)
      await expect(page.getByText(/welcome/i)).toBeVisible()
    })

    test('should login admin successfully', async ({ page }) => {
      await page.goto('/login')
      
      await page.getByLabel(/username/i).fill(testUsers.admin.username)
      await page.getByLabel(/password/i).fill(testUsers.admin.password)
      
      await page.getByRole('button', { name: /login/i }).click()
      
      // Should redirect to admin dashboard
      await expect(page).toHaveURL(/\/admin/)
      await expect(page.getByText(/dashboard/i)).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')
      
      await page.getByLabel(/username/i).fill('wronguser')
      await page.getByLabel(/password/i).fill('wrongpass')
      
      await page.getByRole('button', { name: /login/i }).click()
      
      // Should show error message
      await expect(page.getByText(/invalid credentials/i)).toBeVisible()
      
      // Should stay on login page
      await expect(page).toHaveURL(/\/login/)
    })

    test('should show loading state during login', async ({ page }) => {
      await page.goto('/login')
      
      await page.getByLabel(/username/i).fill(testUsers.student.username)
      await page.getByLabel(/password/i).fill(testUsers.student.password)
      
      // Start login
      const loginPromise = page.getByRole('button', { name: /login/i }).click()
      
      // Should show loading state
      await expect(page.getByText(/logging in/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /login/i })).toBeDisabled()
      
      await loginPromise
    })

    test('should validate form fields', async ({ page }) => {
      await page.goto('/login')
      
      // Try to submit empty form
      await page.getByRole('button', { name: /login/i }).click()
      
      // Should show validation errors
      await expect(page.getByText(/username must be at least 3 characters/i)).toBeVisible()
      await expect(page.getByText(/password must be at least 6 characters/i)).toBeVisible()
    })
  })

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // First login
      await page.goto('/login')
      await page.getByLabel(/username/i).fill(testUsers.student.username)
      await page.getByLabel(/password/i).fill(testUsers.student.password)
      await page.getByRole('button', { name: /login/i }).click()
      
      await expect(page).toHaveURL(/\/student\/home/)
      
      // Find and click logout button
      await page.getByRole('button', { name: /logout/i }).click()
      
      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/)
    })

    test('should clear auth state on logout', async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.getByLabel(/username/i).fill(testUsers.student.username)
      await page.getByLabel(/password/i).fill(testUsers.student.password)
      await page.getByRole('button', { name: /login/i }).click()
      
      await expect(page).toHaveURL(/\/student\/home/)
      
      // Logout
      await page.getByRole('button', { name: /logout/i }).click()
      
      // Check that auth state is cleared
      const token = await page.evaluate(() => localStorage.getItem('token'))
      const user = await page.evaluate(() => localStorage.getItem('user'))
      
      expect(token).toBeNull()
      expect(user).toBeNull()
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected route without authentication
      await page.goto('/student/home')
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)
    })

    test('should allow authenticated users to access protected routes', async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.getByLabel(/username/i).fill(testUsers.student.username)
      await page.getByLabel(/password/i).fill(testUsers.student.password)
      await page.getByRole('button', { name: /login/i }).click()
      
      // Should be able to access protected route
      await page.goto('/student/jobs')
      await expect(page).toHaveURL(/\/student\/jobs/)
    })

    test('should prevent role-based access violations', async ({ page }) => {
      // Login as student
      await page.goto('/login')
      await page.getByLabel(/username/i).fill(testUsers.student.username)
      await page.getByLabel(/password/i).fill(testUsers.student.password)
      await page.getByRole('button', { name: /login/i }).click()
      
      // Try to access admin route
      await page.goto('/admin/jobs')
      
      // Should be redirected or show access denied
      await expect(page).not.toHaveURL(/\/admin\/jobs/)
    })
  })

  test.describe('Session Persistence', () => {
    test('should maintain login state across page reloads', async ({ page }) => {
      // Login
      await page.goto('/login')
      await page.getByLabel(/username/i).fill(testUsers.student.username)
      await page.getByLabel(/password/i).fill(testUsers.student.password)
      await page.getByRole('button', { name: /login/i }).click()
      
      await expect(page).toHaveURL(/\/student\/home/)
      
      // Reload page
      await page.reload()
      
      // Should still be authenticated
      await expect(page).toHaveURL(/\/student\/home/)
      await expect(page.getByText(/welcome/i)).toBeVisible()
    })

    test('should handle expired tokens gracefully', async ({ page }) => {
      // Set up an expired token
      await page.evaluate(() => {
        localStorage.setItem('token', 'expired-token')
        localStorage.setItem('user', JSON.stringify({ id: '1', username: 'test' }))
      })
      
      // Try to access protected route
      await page.goto('/student/home')
      
      // Should redirect to login due to expired token
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/login')
      
      // Tab through form elements
      await page.keyboard.press('Tab')
      await expect(page.getByLabel(/username/i)).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.getByLabel(/password/i)).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: /login/i })).toBeFocused()
    })

    test('should support screen readers', async ({ page }) => {
      await page.goto('/login')
      
      // Check for proper ARIA labels
      const usernameInput = page.getByLabel(/username/i)
      const passwordInput = page.getByLabel(/password/i)
      
      await expect(usernameInput).toHaveAttribute('aria-label')
      await expect(passwordInput).toHaveAttribute('aria-label')
    })

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/login')
      
      // Check that page has proper heading structure
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/login')
      
      // Form should be visible and usable on mobile
      await expect(page.getByLabel(/username/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /login/i })).toBeVisible()
      
      // Should be able to complete login flow
      await page.getByLabel(/username/i).fill(testUsers.student.username)
      await page.getByLabel(/password/i).fill(testUsers.student.password)
      await page.getByRole('button', { name: /login/i }).click()
      
      await expect(page).toHaveURL(/\/student\/home/)
    })
  })
})