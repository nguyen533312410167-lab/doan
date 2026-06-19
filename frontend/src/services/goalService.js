import api from '../api/axios.js';

export const goalService = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  deposit: (id, amount) => api.post(`/goals/${id}/deposit`, { amount }),
  withdraw: (id, amount) => api.post(`/goals/${id}/withdraw`, { amount }),
};