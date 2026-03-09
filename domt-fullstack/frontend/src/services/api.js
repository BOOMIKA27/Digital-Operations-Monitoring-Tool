import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('domt_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 - redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('domt_token')
      localStorage.removeItem('domt_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
}

// ─── Systems ─────────────────────────────────────────────
export const systemsAPI = {
  getAll: () => api.get('/systems'),
  getOne: (id) => api.get(`/systems/${id}`),
  create: (data) => api.post('/systems', data),
  update: (id, data) => api.put(`/systems/${id}`, data),
  delete: (id) => api.delete(`/systems/${id}`),
  getMetrics: (id, hours = 24) => api.get(`/systems/${id}/metrics?hours=${hours}`),
  getDashboardStats: () => api.get('/systems/stats/dashboard'),
}

// ─── Alerts ──────────────────────────────────────────────
export const alertsAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  acknowledge: (id) => api.put(`/alerts/${id}/acknowledge`),
  resolve: (id) => api.put(`/alerts/${id}/resolve`),
  delete: (id) => api.delete(`/alerts/${id}`),
}

// ─── Users ───────────────────────────────────────────────
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

// ─── Logs ────────────────────────────────────────────────
export const logsAPI = {
  getAll: (params) => api.get('/logs', { params }),
}

// ─── Alert Rules ─────────────────────────────────────────
export const rulesAPI = {
  getAll: () => api.get('/alert-rules'),
  create: (data) => api.post('/alert-rules', data),
  update: (id, data) => api.put(`/alert-rules/${id}`, data),
  delete: (id) => api.delete(`/alert-rules/${id}`),
}

// ─── Analytics ───────────────────────────────────────────
export const analyticsAPI = {
  get: (days = 7) => api.get(`/analytics?days=${days}`),
}

export default api
