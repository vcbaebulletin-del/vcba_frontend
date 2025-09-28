// Debug script to check environment variables in production
console.log('🔍 Environment Variables Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('REACT_APP_WEBSOCKET_URL:', process.env.REACT_APP_WEBSOCKET_URL);

// Test API_BASE_URL from constants
import { API_BASE_URL, WEBSOCKET_URL } from './src/config/constants';
console.log('API_BASE_URL from constants:', API_BASE_URL);
console.log('WEBSOCKET_URL from constants:', WEBSOCKET_URL);

// Test if environment variables are being loaded correctly
if (API_BASE_URL.includes('localhost')) {
  console.error('❌ CRITICAL: API_BASE_URL is still using localhost!');
  console.error('This means environment variables are not being loaded correctly.');
} else {
  console.log('✅ API_BASE_URL is using production URL');
}

// Export for use in other files
export { API_BASE_URL, WEBSOCKET_URL };
