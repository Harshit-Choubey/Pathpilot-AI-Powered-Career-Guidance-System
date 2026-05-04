import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: attach JWT token ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: handle 401 auto-logout ─────────────────────────────
// Only force-logout on 401 for auth-critical calls, NOT background data fetches
const SILENT_401_PATHS = [
  '/auth/login', '/auth/register', '/auth/me',
  '/roadmaps', '/events', '/career', '/chat'
];
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isSilentPath = SILENT_401_PATHS.some(p => url.includes(p));

    if (error.response?.status === 401 && !isSilentPath) {
      localStorage.removeItem('token');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: (credentials) =>
    api.post('/auth/login/access-token', new URLSearchParams({ username: credentials.email, password: credentials.password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/update-profile', data),
};

// Assessment Service
export const assessmentService = {
  submit: (responses) => api.post('/assessment/submit', { responses }),
  getHistory: () => api.get('/assessment/history'),
  getById: (id) => api.get(`/assessment/${id}`),
};

// Career & Comparison Service
export const careerService = {
  getAll: (params) => api.get('/career', { params }),
  search: (query) => api.get(`/career/search?q=${query}`),
  getBySlug: (slug) => api.get(`/career/${slug}`),
  compare: (slugs) => api.post('/career/compare', { slugs }),
};

// Chatbot Service
export const chatService = {
  sendMessage: (message, history = [], context = {}) => {
    return api.post('/chat/', { message, history, context });
  }
};

export const roadmapService = {
  createNode: (data) => api.post('/roadmaps/nodes', data),
  getRoadmap: () => api.get('/roadmaps/'),
  getSkillGap: () => api.get('/roadmaps/skill-gap'),
  generateRoadmap: (career) => api.post('/roadmaps/generate', { career }),
  completeTask: (taskId) => api.post(`/roadmaps/tasks/${taskId}/complete`),
};

export const eventService = {
  track: (data) => api.post('/events/track', data),
  getAnalytics: () => api.get('/events/analytics')
};

export const progressService = {
  getProgress: () => api.get('/progress/'),
  submitFeedback: (data) => api.post('/progress/feedback', data),
  getDailyMission: () => api.get('/progress/daily-mission'),
  getSkillGraph: () => api.get('/progress/skill-graph'),
};

export default api;
