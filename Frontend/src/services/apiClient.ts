import axios, { AxiosError } from 'axios';

export const API_BASE_URL = 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Token to outgoing requests automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sx_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Format API error messages cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const detail = error.response?.data?.detail;
    let message = 'An unexpected error occurred.';

    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail) && detail.length > 0) {
      message = detail[0].msg || JSON.stringify(detail[0]);
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);
