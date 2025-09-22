import { test, expect } from '@playwright/test'

// Helper to login as different user types
async function loginAs(page, userType) {
  const users = {
    student: { username: 'teststudent', password: 'password123' },
    admin: { username: 'testadmin', password: 'password123' }
  }
  
  await page.goto('/login')
  await page.getByLabel(/username/i).fill(users[userType].username)
  await page.getByLabel(/password/i).fill(users[userType].password)
  await page.getByRole('button', { name: /login/i }).click()
  
  if (userType === 'student') {
    await expect(page).toHaveURL(/\/student/)
  } else {
    await expect(page).toHaveURL(/\/admin/)
  }
}

test.describe('Job Management', () => {
  test.describe('Student Job Viewing', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'student')
      await page.goto('/student/jobs')
    })

    test('should display available jobs', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /available jobs/i })).toBeVisible()
      
      // Should show job cards
      const jobCards = page.locator('[data-testid="job-card"]')
      await expect(jobCards.first()).toBeVisible()
      
      // Job cards should contain expected information
      await expect(jobCards.first().getByText(/frontend developer/i)).toBeVisible()
      await expect(jobCards.first().getByText(/test university/i)).toBeVisible()
      await expect(jobCards.first().getByText(/apply now/i)).toBeVisible()
    })

    test('should filter jobs by type', async ({ page }) => {
      // Open filter dropdown
      await page.getByRole('combobox', { name: /filter by type/i }).click()
      await page.getByText('Internship').click()
      
      // Should only show internship jobs
      const jobCards = page.locator('[data-testid="job-card"]')
      await expect(jobCards.getByText(/internship/i)).toBeVisible()
    })

    test('should search jobs by title', async ({ page }) => {
      await page.getByPlaceholder(/search jobs/i).fill('Frontend')
      await page.getByRole('button', { name: /search/i }).click()
      
      // Should show filtered results
      const jobCards = page.locator('[data-testid="job-card"]')
      await expect(jobCards.getByText(/frontend/i)).toBeVisible()
    })

    test('should show job details in modal', async ({ page }) => {
      const firstJobCard = page.locator('[data-testid="job-card"]').first()
      await firstJobCard.getByRole('button', { name: /view details/i }).click()
      
      // Should open job details modal
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText(/job details/i)).toBeVisible()
      await expect(page.getByText(/requirements/i)).toBeVisible()
      await expect(page.getByText(/deadline/i)).toBeVisible()
    })

    test('should handle empty job list gracefully', async ({ page }) => {
      // Navigate to a page with no jobs (could be mocked)
      await page.route('**/api/jobs/my-college*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ jobs: [], total: 0 })
        })
      })
      
      await page.reload()
      
      await expect(page.getByText(/no jobs available/i)).toBeVisible()
    })
  })

  test.describe('Job Application Process', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'student')
      await page.goto('/student/jobs')
    })

    test('should apply to a job successfully', async ({ page }) => {
      const firstJobCard = page.locator('[data-testid="job-card"]').first()
      await firstJobCard.getByRole('button', { name: /apply now/i }).click()
      
      // Should open application modal
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText(/apply for this job/i)).toBeVisible()
      
      // Fill application form
      await page.getByLabel(/cover letter/i).fill('I am very interested in this position and believe I would be a great fit.')
      
      // Submit application
      await page.getByRole('button', { name: /submit application/i }).click()
      
      // Should show success message
      await expect(page.getByText(/application submitted successfully/i)).toBeVisible()
      
      // Modal should close
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('should validate required fields in application', async ({ page }) => {
      const firstJobCard = page.locator('[data-testid="job-card"]').first()
      await firstJobCard.getByRole('button', { name: /apply now/i }).click()
      
      // Try to submit without cover letter
      await page.getByRole('button', { name: /submit application/i }).click()
      
      // Should show validation error
      await expect(page.getByText(/cover letter is required/i)).toBeVisible()
    })

    test('should handle duplicate application error', async ({ page }) => {
      // Mock API to return duplicate application error
      await page.route('**/api/applications', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'You have already applied for this job' })
        })
      })
      
      const firstJobCard = page.locator('[data-testid="job-card"]').first()
      await firstJobCard.getByRole('button', { name: /apply now/i }).click()
      
      await page.getByLabel(/cover letter/i).fill('Test application')
      await page.getByRole('button', { name: /submit application/i }).click()
      
      // Should show error message
      await expect(page.getByText(/already applied/i)).toBeVisible()
    })

    test('should close application modal on cancel', async ({ page }) => {
      const firstJobCard = page.locator('[data-testid="job-card"]').first()
      await firstJobCard.getByRole('button', { name: /apply now/i }).click()
      
      await expect(page.getByRole('dialog')).toBeVisible()
      
      await page.getByRole('button', { name: /cancel/i }).click()
      
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })
  })

  test.describe('Admin Job Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'admin')
      await page.goto('/admin/jobs')
    })

    test('should create a new job', async ({ page }) => {
      await page.getByRole('button', { name: /create job/i }).click()
      
      // Should open job creation form
      await expect(page.getByRole('heading', { name: /create new job/i })).toBeVisible()
      
      // Fill job details
      await page.getByLabel(/job title/i).fill('Senior React Developer')
      await page.getByLabel(/description/i).fill('We are looking for an experienced React developer')
      await page.getByLabel(/location/i).fill('Remote')
      await page.getByLabel(/salary/i).fill('80000')
      await page.getByLabel(/requirements/i).fill('React, TypeScript, Node.js')
      
      // Set job type
      await page.getByRole('combobox', { name: /job type/i }).click()
      await page.getByText('Full-time').click()
      
      // Set deadline
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      await page.getByLabel(/deadline/i).fill(futureDate.toISOString().split('T')[0])
      
      // Submit form
      await page.getByRole('button', { name: /create job/i }).click()
      
      // Should show success message
      await expect(page.getByText(/job created successfully/i)).toBeVisible()
      
      // Should see the new job in the list
      await expect(page.getByText(/senior react developer/i)).toBeVisible()
    })

    test('should validate job creation form', async ({ page }) => {
      await page.getByRole('button', { name: /create job/i }).click()
      
      // Try to submit empty form
      await page.getByRole('button', { name: /create job/i }).click()
      
      // Should show validation errors
      await expect(page.getByText(/title is required/i)).toBeVisible()
      await expect(page.getByText(/description is required/i)).toBeVisible()
    })

    test('should edit existing job', async ({ page }) => {
      // Find first job and click edit
      const firstJob = page.locator('[data-testid="job-row"]').first()
      await firstJob.getByRole('button', { name: /edit/i }).click()
      
      // Should open edit form
      await expect(page.getByRole('heading', { name: /edit job/i })).toBeVisible()
      
      // Update job title
      const titleInput = page.getByLabel(/job title/i)
      await titleInput.clear()
      await titleInput.fill('Updated Job Title')
      
      // Save changes
      await page.getByRole('button', { name: /save changes/i }).click()
      
      // Should show success message
      await expect(page.getByText(/job updated successfully/i)).toBeVisible()
      
      // Should see updated title
      await expect(page.getByText(/updated job title/i)).toBeVisible()
    })

    test('should delete job with confirmation', async ({ page }) => {
      const firstJob = page.locator('[data-testid="job-row"]').first()
      const jobTitle = await firstJob.getByTestId('job-title').textContent()
      
      await firstJob.getByRole('button', { name: /delete/i }).click()
      
      // Should show confirmation dialog
      await expect(page.getByText(/are you sure you want to delete/i)).toBeVisible()
      
      await page.getByRole('button', { name: /confirm delete/i }).click()
      
      // Should show success message
      await expect(page.getByText(/job deleted successfully/i)).toBeVisible()
      
      // Job should no longer be visible
      await expect(page.getByText(jobTitle)).not.toBeVisible()
    })

    test('should view job applications', async ({ page }) => {
      const firstJob = page.locator('[data-testid="job-row"]').first()
      await firstJob.getByRole('button', { name: /view applications/i }).click()
      
      // Should navigate to applications page
      await expect(page).toHaveURL(/\/admin\/jobs\/.*\/applications/)
      await expect(page.getByRole('heading', { name: /applications/i })).toBeVisible()
      
      // Should show application list
      const applicationRows = page.locator('[data-testid="application-row"]')
      if (await applicationRows.count() > 0) {
        await expect(applicationRows.first()).toBeVisible()
      } else {
        await expect(page.getByText(/no applications yet/i)).toBeVisible()
      }
    })
  })

  test.describe('Application Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'admin')
      await page.goto('/admin/applications')
    })

    test('should update application status', async ({ page }) => {
      const firstApplication = page.locator('[data-testid="application-row"]').first()
      
      // Open status dropdown
      await firstApplication.getByRole('combobox', { name: /status/i }).click()
      await page.getByText('Accepted').click()
      
      // Should update status
      await expect(page.getByText(/status updated successfully/i)).toBeVisible()
      await expect(firstApplication.getByText(/accepted/i)).toBeVisible()
    })

    test('should filter applications by status', async ({ page }) => {
      // Open filter dropdown
      await page.getByRole('combobox', { name: /filter by status/i }).click()
      await page.getByText('Pending').click()
      
      // Should only show pending applications
      const applicationRows = page.locator('[data-testid="application-row"]')
      await expect(applicationRows.getByText(/pending/i)).toBeVisible()
    })

    test('should view application details', async ({ page }) => {
      const firstApplication = page.locator('[data-testid="application-row"]').first()
      await firstApplication.getByRole('button', { name: /view details/i }).click()
      
      // Should open application details modal
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText(/application details/i)).toBeVisible()
      await expect(page.getByText(/cover letter/i)).toBeVisible()
    })
  })

  test.describe('Student Application Tracking', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'student')
      await page.goto('/student/applications')
    })

    test('should view my applications', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /my applications/i })).toBeVisible()
      
      // Should show application cards
      const applicationCards = page.locator('[data-testid="application-card"]')
      if (await applicationCards.count() > 0) {
        await expect(applicationCards.first()).toBeVisible()
        await expect(applicationCards.first().getByText(/status/i)).toBeVisible()
      } else {
        await expect(page.getByText(/no applications yet/i)).toBeVisible()
      }
    })

    test('should filter applications by status', async ({ page }) => {
      await page.getByRole('combobox', { name: /filter by status/i }).click()
      await page.getByText('Accepted').click()
      
      // Should only show accepted applications
      const applicationCards = page.locator('[data-testid="application-card"]')
      await expect(applicationCards.getByText(/accepted/i)).toBeVisible()
    })

    test('should withdraw pending application', async ({ page }) => {
      const pendingApplication = page.locator('[data-testid="application-card"]')
        .filter({ hasText: 'Pending' }).first()
      
      if (await pendingApplication.count() > 0) {
        await pendingApplication.getByRole('button', { name: /withdraw/i }).click()
        
        // Should show confirmation
        await expect(page.getByText(/are you sure/i)).toBeVisible()
        await page.getByRole('button', { name: /confirm/i }).click()
        
        // Should show success message
        await expect(page.getByText(/application withdrawn/i)).toBeVisible()
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await loginAs(page, 'student')
      
      // Mock network error
      await page.route('**/api/jobs/my-college*', route => {
        route.abort('failed')
      })
      
      await page.goto('/student/jobs')
      
      // Should show error message
      await expect(page.getByText(/unable to load jobs/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible()
    })

    test('should handle server errors', async ({ page }) => {
      await loginAs(page, 'student')
      
      // Mock server error
      await page.route('**/api/jobs/my-college*', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal server error' })
        })
      })
      
      await page.goto('/student/jobs')
      
      // Should show error message
      await expect(page.getByText(/something went wrong/i)).toBeVisible()
    })
  })
})