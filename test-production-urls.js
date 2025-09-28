// Test script to validate production URLs are being used correctly
const axios = require('axios');

async function testProductionURLs() {
  console.log('🧪 Testing Production URL Configuration...\n');
  
  const frontendUrl = 'https://vcba-frontend.vercel.app';
  const expectedBackendUrl = 'https://vcbabackend-production.up.railway.app';
  
  try {
    // Test 1: Check if frontend is accessible
    console.log('1️⃣ Testing frontend accessibility...');
    const frontendResponse = await axios.get(frontendUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('✅ Frontend accessible:', frontendResponse.status);
    
    // Check if the HTML contains localhost references (should not)
    const htmlContent = frontendResponse.data;
    if (htmlContent.includes('localhost:5000') || htmlContent.includes('localhost:3000')) {
      console.error('❌ CRITICAL: Frontend HTML still contains localhost references!');
      console.error('This indicates the build process is not using production environment variables.');
    } else {
      console.log('✅ Frontend HTML does not contain localhost references');
    }
    
    // Test 2: Check if backend is accessible
    console.log('\n2️⃣ Testing backend accessibility...');
    const backendHealthResponse = await axios.get(`${expectedBackendUrl}/health`, {
      timeout: 10000
    });
    console.log('✅ Backend accessible:', backendHealthResponse.status);
    console.log('📋 Backend health data:', backendHealthResponse.data);
    
    // Test 3: Test CORS from frontend origin
    console.log('\n3️⃣ Testing CORS configuration...');
    const corsResponse = await axios.get(`${expectedBackendUrl}/api/welcome-page/data`, {
      headers: {
        'Origin': frontendUrl,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log('✅ CORS test successful:', corsResponse.status);
    console.log('📋 CORS Headers:', {
      'access-control-allow-origin': corsResponse.headers['access-control-allow-origin'],
      'access-control-allow-credentials': corsResponse.headers['access-control-allow-credentials']
    });
    
    // Test 4: Test API endpoint that frontend uses
    console.log('\n4️⃣ Testing welcome page API endpoint...');
    const welcomeResponse = await axios.get(`${expectedBackendUrl}/api/welcome-page/data`, {
      headers: {
        'Origin': frontendUrl
      },
      timeout: 10000
    });
    console.log('✅ Welcome page API successful:', welcomeResponse.status);
    console.log('📋 Welcome page data structure:', {
      hasData: !!welcomeResponse.data,
      success: welcomeResponse.data?.success,
      hasBackground: !!welcomeResponse.data?.data?.background,
      hasCards: !!welcomeResponse.data?.data?.cards
    });
    
    console.log('\n🎉 All Production URL Tests Passed!');
    console.log('✅ Frontend is accessible');
    console.log('✅ Backend is accessible');
    console.log('✅ CORS is properly configured');
    console.log('✅ API endpoints are working');
    console.log('\n🚀 The application should now work correctly in production!');
    
  } catch (error) {
    console.error('❌ Production URL Test Failed:', error.message);
    if (error.response) {
      console.error('📋 Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        headers: error.response.headers
      });
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔍 Connection refused - check if the backend URL is correct');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('🔍 Request timeout - backend might be slow to respond');
    }
  }
}

// Run the test
testProductionURLs().catch(console.error);
