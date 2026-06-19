import api from '../api/axios.js';

export const settingsService = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};