import axios from 'axios';

// Create api instance with default configurations
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Crucial to send cookies back and forth
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
