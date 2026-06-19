import api from '../api/axios.js';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (fullname, email, password) => api.post('/auth/register', { fullname, email, password }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  autoLogin: () => api.post('/auth/auto-login'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/user/profile', data),
  uploadAvatar: (formData) => api.post('/user/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (oldPassword, newPassword) => api.put('/user/change-password', { oldPassword, newPassword }),
};
