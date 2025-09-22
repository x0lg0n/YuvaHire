import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthContext } from '@/lib/auth-context'
import { server } from '@/lib/__mocks__/server'
import { http, HttpResponse } from 'msw'
import JobCard from '@/components/job-card'

// Mock auth context
const mockAuthContextValue = {
  user: {
    id: '1',
    username: 'testStudent',
    role: 'student',
    college_name: 'Test University'
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false
}

const mockJob = {
  _id: '1',
  title: 'Frontend Developer',
  description: 'Build amazing React applications with modern tools and frameworks.',
  location: 'Remote',
  type: 'Full-time',
  salary: 75000,
  college_name: 'Test University',
  requirements: 'React, JavaScript, HTML, CSS, Git',
  deadline: '2024-12-31T23:59:59.000Z',
  status: 'active',
  createdAt: '2024-01-15T10:00:00.000Z'
}

const renderJobCard = (job = mockJob, authContextValue = mockAuthContextValue) => {
  return render(
    <AuthContext.Provider value={authContextValue}>
      <JobCard job={job} />
    </AuthContext.Provider>
  )
}

describe('JobCard Component', () => {
  describe('Rendering', () => {
    it('should render job information correctly', () => {
      renderJobCard()
      
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
      expect(screen.getByText(/build amazing react applications/i)).toBeInTheDocument()
      expect(screen.getByText('Remote')).toBeInTheDocument()
      expect(screen.getByText('Full-time')).toBeInTheDocument()
      expect(screen.getByText('₹75,000')).toBeInTheDocument()
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    it('should render requirements properly', () => {
      renderJobCard()
      
      expect(screen.getByText(/react/i)).toBeInTheDocument()
      expect(screen.getByText(/javascript/i)).toBeInTheDocument()
      expect(screen.getByText(/html/i)).toBeInTheDocument()
      expect(screen.getByText(/css/i)).toBeInTheDocument()
      expect(screen.getByText(/git/i)).toBeInTheDocument()
    })

    it('should display formatted deadline', () => {
      renderJobCard()
      
      // The exact format depends on your date formatting logic
      expect(screen.getByText(/december|dec|31|2024/i)).toBeInTheDocument()
    })

    it('should show apply button for students', () => {
      renderJobCard()
      
      expect(screen.getByRole('button', { name: /apply now/i })).toBeInTheDocument()
    })

    it('should not show apply button for non-students', () => {
      const adminContext = {
        ...mockAuthContextValue,
        user: {
          ...mockAuthContextValue.user,
          role: 'college_admin'
        }
      }
      
      renderJobCard(mockJob, adminContext)
      
      expect(screen.queryByRole('button', { name: /apply now/i })).not.toBeInTheDocument()
    })

    it('should handle missing optional fields gracefully', () => {
      const jobWithMissingFields = {
        ...mockJob,
        requirements: undefined,
        salary: undefined
      }
      
      renderJobCard(jobWithMissingFields)
      
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
      expect(screen.queryByText('₹')).not.toBeInTheDocument()
    })

    it('should truncate long descriptions', () => {
      const jobWithLongDescription = {
        ...mockJob,
        description: 'A'.repeat(500) // Very long description
      }
      
      renderJobCard(jobWithLongDescription)
      
      // Should show truncated text with "..." or similar
      const descriptionElement = screen.getByText(/A+/)
      expect(descriptionElement.textContent.length).toBeLessThan(500)
    })
  })

  describe('Application Functionality', () => {
    it('should open application modal when apply button is clicked', async () => {
      const user = userEvent.setup()
      renderJobCard()
      
      const applyButton = screen.getByRole('button', { name: /apply now/i })
      await user.click(applyButton)
      
      // Should open application modal
      await waitFor(() => {
        expect(screen.getByText(/apply for this job/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/cover letter/i)).toBeInTheDocument()
      })
    })

    it('should submit application successfully', async () => {
      const user = userEvent.setup()
      renderJobCard()
      
      const applyButton = screen.getByRole('button', { name: /apply now/i })
      await user.click(applyButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/cover letter/i)).toBeInTheDocument()
      })
      
      const coverLetterInput = screen.getByLabelText(/cover letter/i)
      const submitButton = screen.getByRole('button', { name: /submit application/i })
      
      await user.type(coverLetterInput, 'I am very interested in this position')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/application submitted successfully/i)).toBeInTheDocument()
      })
    })

    it('should handle application errors', async () => {
      // Mock API to return error
      server.use(
        http.post('/api/applications', () => {
          return HttpResponse.json(
            { message: 'You have already applied for this job' },
            { status: 400 }
          )
        })
      )

      const user = userEvent.setup()
      renderJobCard()
      
      const applyButton = screen.getByRole('button', { name: /apply now/i })
      await user.click(applyButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/cover letter/i)).toBeInTheDocument()
      })
      
      const coverLetterInput = screen.getByLabelText(/cover letter/i)
      const submitButton = screen.getByRole('button', { name: /submit application/i })
      
      await user.type(coverLetterInput, 'I am very interested in this position')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/already applied/i)).toBeInTheDocument()
      })
    })

    it('should validate cover letter is required', async () => {
      const user = userEvent.setup()
      renderJobCard()
      
      const applyButton = screen.getByRole('button', { name: /apply now/i })
      await user.click(applyButton)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument()
      })
      
      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/cover letter is required/i)).toBeInTheDocument()
      })
    })

    it('should close modal when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderJobCard()
      
      const applyButton = screen.getByRole('button', { name: /apply now/i })
      await user.click(applyButton)
      
      await waitFor(() => {
        expect(screen.getByText(/apply for this job/i)).toBeInTheDocument()
      })
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByText(/apply for this job/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Job Status', () => {
    it('should show expired status for past deadline', () => {
      const expiredJob = {
        ...mockJob,
        deadline: '2020-01-01T00:00:00.000Z' // Past date
      }
      
      renderJobCard(expiredJob)
      
      expect(screen.getByText(/expired/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /apply now/i })).not.toBeInTheDocument()
    })

    it('should show inactive status', () => {
      const inactiveJob = {
        ...mockJob,
        status: 'inactive'
      }
      
      renderJobCard(inactiveJob)
      
      expect(screen.getByText(/inactive/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /apply now/i })).not.toBeInTheDocument()
    })

    it('should calculate days remaining correctly', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5) // 5 days from now
      
      const jobWithNearDeadline = {
        ...mockJob,
        deadline: futureDate.toISOString()
      }
      
      renderJobCard(jobWithNearDeadline)
      
      expect(screen.getByText(/5 days left/i)).toBeInTheDocument()
    })
  })

  describe('Different Job Types', () => {
    it('should render internship correctly', () => {
      const internshipJob = {
        ...mockJob,
        type: 'Internship',
        salary: 15000
      }
      
      renderJobCard(internshipJob)
      
      expect(screen.getByText('Internship')).toBeInTheDocument()
      expect(screen.getByText('₹15,000')).toBeInTheDocument()
    })

    it('should render part-time job correctly', () => {
      const partTimeJob = {
        ...mockJob,
        type: 'Part-time',
        location: 'On-site'
      }
      
      renderJobCard(partTimeJob)
      
      expect(screen.getByText('Part-time')).toBeInTheDocument()
      expect(screen.getByText('On-site')).toBeInTheDocument()
    })

    it('should handle remote jobs', () => {
      const remoteJob = {
        ...mockJob,
        location: 'Remote'
      }
      
      renderJobCard(remoteJob)
      
      expect(screen.getByText('Remote')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderJobCard()
      
      const jobCard = screen.getByRole('article') || screen.getByTestId('job-card')
      expect(jobCard).toHaveAttribute('aria-label', expect.stringContaining('Frontend Developer'))
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      renderJobCard()
      
      const applyButton = screen.getByRole('button', { name: /apply now/i })
      
      await user.tab()
      expect(applyButton).toHaveFocus()
      
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText(/apply for this job/i)).toBeInTheDocument()
      })
    })

    it('should have semantic HTML structure', () => {
      renderJobCard()
      
      // Should use proper heading hierarchy
      expect(screen.getByRole('heading', { name: /frontend developer/i })).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing job data gracefully', () => {
      const incompleteJob = {
        _id: '1',
        title: 'Test Job'
        // Missing other required fields
      }
      
      expect(() => renderJobCard(incompleteJob)).not.toThrow()
      expect(screen.getByText('Test Job')).toBeInTheDocument()
    })

    it('should handle network errors during application', async () => {
      server.use(
        http.post('/api/applications', () => {
          return HttpResponse.error()
        })
      )

      const user = userEvent.setup()
      renderJobCard()
      
      const applyButton = screen.getByRole('button', { name: /apply now/i })
      await user.click(applyButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/cover letter/i)).toBeInTheDocument()
      })
      
      const coverLetterInput = screen.getByLabelText(/cover letter/i)
      const submitButton = screen.getByRole('button', { name: /submit application/i })
      
      await user.type(coverLetterInput, 'Test application')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/unable to connect/i)).toBeInTheDocument()
      })
    })
  })
})