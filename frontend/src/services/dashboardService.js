import api from '../api/axios.js';

export const dashboardService = {
  get: () => api.get('/dashboard'),
};