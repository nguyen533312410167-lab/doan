import api from '../api/axios.js';

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (username, email, password) => api.post('/auth/register', { username, email, password }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  autoLogin: () => api.post('/auth/auto-login'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/user/profile', data),
  uploadAvatar: (formData) => api.post('/user/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (oldPassword, newPassword) => api.put('/user/change-password', { oldPassword, newPassword }),
};
