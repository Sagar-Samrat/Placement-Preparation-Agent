import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const parseError = (error, defaultMsg) => {
  const detail = error.response?.data?.detail;
  if (!detail) return defaultMsg;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(err => err.msg || JSON.stringify(err)).join(', ');
  }
  if (typeof detail === 'object') {
    return detail.message || JSON.stringify(detail);
  }
  return defaultMsg;
};

const api = axios.create({
  baseURL: API_URL,
});

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

export const authAPI = {
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
};

export const resumeAPI = {
  upload: (formData) => api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDetails: () => api.get('/resume/details'),
};

export const companyAPI = {
  select: (companyName) => api.post('/company/select', { company_name: companyName }),
  analyzeJD: (companyName, jdText) => api.post('/jd/analyze', { company_name: companyName, jd_text: jdText }),
  analyzeGap: (targetCompany, jdId = null) => api.post('/skill-gap/analyze', { target_company: targetCompany, jd_id: jdId }),
};

export const roadmapAPI = {
  generate: () => api.post('/roadmap/generate'),
  getActive: () => api.get('/roadmap/active'),
  toggleTask: (taskId, completed) => api.post('/roadmap/toggle-task', { task_id: taskId, completed }),
};

export const interviewAPI = {
  start: (companyName, roundType) => api.post('/interview/start', { company_name: companyName, round_type: roundType }),
  submitAnswer: (interviewId, userAnswer) => api.post('/interview/answer', { interview_id: interviewId, user_answer: userAnswer }),
  getResults: (interviewId) => api.get(`/interview/results/${interviewId}`),
};

export const dashboardAPI = {
  getData: () => api.get('/dashboard'),
};

export default api;
