// Debug script for job application functionality
// Run this in browser console to test the application submission

async function debugJobApplication() {
  console.log('=== Job Application Debug Script ===');
  
  try {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No authentication token found. Please log in first.');
      return;
    }
    console.log('✅ Authentication token found');
    
    // Check user info
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      console.log('✅ User info:', user);
      if (user.role !== 'student') {
        console.error('❌ User is not a student. Only students can apply to jobs.');
        return;
      }
    }
    
    // Test API connection
    console.log('🔍 Testing API connection...');
    const response = await fetch('/api/jobs', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Failed to fetch jobs:', response.status, response.statusText);
      return;
    }
    
    const jobs = await response.json();
    console.log('✅ Jobs fetched successfully:', jobs.length, 'jobs found');
    
    if (jobs.length === 0) {
      console.log('⚠️ No jobs available to test with');
      return;
    }
    
    // Test application submission with first job
    const testJob = jobs[0];
    console.log('🔍 Testing application submission for job:', testJob.title);
    
    const applyResponse = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobId: testJob._id
      })
    });
    
    console.log('📊 Application response status:', applyResponse.status);
    console.log('📊 Application response headers:', Object.fromEntries(applyResponse.headers.entries()));
    
    const applyData = await applyResponse.json();
    console.log('📊 Application response data:', applyData);
    
    if (applyResponse.ok) {
      console.log('✅ Application submitted successfully!');
    } else {
      console.error('❌ Application failed:', applyData);
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
}

// Function to test the applyToJob API function
async function testApplyToJobFunction() {
  console.log('=== Testing applyToJob API Function ===');
  
  try {
    // Import the function (this will only work if the module is loaded)
    const { applyToJob } = await import('./lib/api.js');
    
    // Get a job ID from the current page
    const jobCards = document.querySelectorAll('[data-job-id]');
    if (jobCards.length === 0) {
      console.log('⚠️ No job cards found on page. Make sure you\'re on a jobs page.');
      return;
    }
    
    const jobId = jobCards[0].getAttribute('data-job-id');
    console.log('🔍 Testing with job ID:', jobId);
    
    const result = await applyToJob({ jobId });
    console.log('✅ applyToJob function result:', result);
    
  } catch (error) {
    console.error('❌ applyToJob function test failed:', error);
  }
}

// Function to check current page state
function checkPageState() {
  console.log('=== Page State Check ===');
  
  console.log('📍 Current URL:', window.location.href);
  console.log('🔑 Token in localStorage:', !!localStorage.getItem('token'));
  console.log('👤 User in localStorage:', !!localStorage.getItem('user'));
  
  // Check for job cards
  const jobCards = document.querySelectorAll('[data-job-id]');
  console.log('📋 Job cards found:', jobCards.length);
  
  // Check for error messages
  const errorMessages = document.querySelectorAll('.text-red-500, .text-destructive');
  console.log('❌ Error messages found:', errorMessages.length);
  
  // Check for loading states
  const loadingElements = document.querySelectorAll('[disabled], .loading, .spinner');
  console.log('⏳ Loading elements found:', loadingElements.length);
}

// Export functions to global scope
window.debugJobApplication = debugJobApplication;
window.testApplyToJobFunction = testApplyToJobFunction;
window.checkPageState = checkPageState;

console.log('🔧 Debug functions loaded:');
console.log('- debugJobApplication() - Test the full application flow');
console.log('- testApplyToJobFunction() - Test the API function directly');
console.log('- checkPageState() - Check current page state');

// Auto-run page state check
checkPageState();

