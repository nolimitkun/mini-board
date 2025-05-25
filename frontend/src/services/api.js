import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API endpoints
export const vmApi = {
  // Get all providers
  getProviders: () => api.get('/providers'),

  // Get VMs with filters
  getVMs: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const queryString = queryParams.toString();
    return api.get(`/vms${queryString ? `?${queryString}` : ''}`);
  },

  // Compare VMs
  compareVMs: (vms) => api.post('/vms/compare', { vms }),

  // Get recommendations
  getRecommendations: (requirements) => 
    api.post('/vms/recommendations', { requirements }),

  // Get regions
  getRegions: (provider = null) => {
    const params = provider ? `?provider=${provider}` : '';
    return api.get(`/regions${params}`);
  },

  // Get statistics
  getStats: () => api.get('/stats'),

  // Preview database data
  previewData: (maxRows = 5) => api.get(`/preview?max_rows=${maxRows}`),

  // Reload data
  reloadData: () => api.post('/reload'),

  // Health check
  healthCheck: () => api.get('/health'),

  // Get API info
  getApiInfo: () => api.get('/'),
};

export default api;
