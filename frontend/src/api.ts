import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getStats = () => api.get('/analytics/stats');
export const searchNews = (data: any) => api.post('/search', data);
export const getArticles = (params: any) => api.get('/articles', { params });
export const generateReport = (data: any) => api.post('/reports/generate', data);
export const getReports = () => api.get('/reports');
export const getReportById = (id: number) => api.get(`/reports/${id}`);
