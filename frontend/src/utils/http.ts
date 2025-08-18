import axios from 'axios';

const http = axios.create({
  baseURL: 'http://localhost:3000', // Your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add request or response interceptors here if needed
// For example, to handle authentication tokens or error logging

export default http;
