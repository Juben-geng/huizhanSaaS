import axios from 'axios';
import { ElMessage } from 'element-plus';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code === 200) {
      return data.data;
    } else {
      ElMessage.error(data.msg || '请求失败');
      return Promise.reject(new Error(data.msg || '请求失败'));
    }
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      ElMessage.error(data.msg || `请求失败 (${status})`);
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接');
    } else {
      ElMessage.error(error.message || '请求失败');
    }
    return Promise.reject(error);
  }
);

const request = {
  get: (url, params = {}) => instance.get(url, { params }),
  post: (url, data = {}) => instance.post(url, data),
  put: (url, data = {}) => instance.put(url, data),
  delete: (url, params = {}) => instance.delete(url, { params })
};

export default request;
