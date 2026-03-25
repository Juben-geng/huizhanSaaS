import { defineStore } from 'pinia';
import request from '../utils/request';

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: localStorage.getItem('token') || ''
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.userInfo?.username || '',
    avatar: (state) => state.userInfo?.avatar || '/default-avatar.png'
  },

  actions: {
    setToken(token) {
      this.token = token;
      localStorage.setItem('token', token);
    },

    setUserInfo(userInfo) {
      this.userInfo = userInfo;
    },

    async login(credentials) {
      try {
        const data = await request.post('/platform/auth/login', credentials);
        this.token = data.token;
        this.userInfo = data.user;
        localStorage.setItem('token', data.token);
        return data;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },

    async logout() {
      try {
        await request.post('/platform/auth/logout');
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.token = '';
        this.userInfo = null;
        localStorage.removeItem('token');
      }
    },

    async fetchUserInfo() {
      try {
        const data = await request.get('/platform/auth/user/info');
        this.userInfo = data;
        return data;
      } catch (error) {
        console.error('Fetch user info error:', error);
        throw error;
      }
    }
  }
});
