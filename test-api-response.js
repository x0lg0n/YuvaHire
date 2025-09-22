// Test script to verify API response structure
// Run this in browser console to test

async function testApiResponse() {
  try {
    console.log('Testing API response structure...')
    
    // Test login response
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test', password: 'test' })
    })
    
    const loginData = await loginResponse.json()
    console.log('Login response structure:', loginData)
    console.log('Has token:', !!loginData.token)
    console.log('Has user:', !!loginData.user)
    
    // Test register response
    const registerResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: 'testuser', 
        password: 'testpass',
        role: 'student',
        college_name: 'Test College'
      })
    })
    
    const registerData = await registerResponse.json()
    console.log('Register response structure:', registerData)
    console.log('Has token:', !!registerData.token)
    console.log('Has user:', !!registerData.user)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
testApiResponse()
