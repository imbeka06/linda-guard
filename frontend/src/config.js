// API Configuration
// Switch between LOCAL and PRODUCTION

const isDevelopment = import.meta.env.MODE === 'development';

export const API_CONFIG = {
  // Use PRODUCTION by default, comment out to use LOCAL
  BASE_URL: 'https://linda-guard.onrender.com',
  WS_URL: 'wss://linda-guard.onrender.com',

  // Uncomment these to use LOCAL development
  // BASE_URL: 'http://127.0.0.1:8001',
  // WS_URL: 'ws://127.0.0.1:8001',
};

export default API_CONFIG;
