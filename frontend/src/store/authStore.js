import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Globally intercept responses to catch device conflict logouts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.error === 'Session expired (logged in on another device)') {
      toast.error('You were logged out because you logged in on a new device.', { duration: 6000 });
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  theme: localStorage.getItem('theme') || 'dark',
  isLoading: !!localStorage.getItem('token'),
  error: null,

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
      return { theme: newTheme };
    });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Login failed', isLoading: false });
    }
  },

  register: async ({ email, password, firstName, middleName, lastName, phone, role }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email, password, firstName, middleName, lastName, phone, role
      });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Registration failed', isLoading: false });
    }
  },

  googleLogin: async (credential) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/google-login`, { credential });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Google login failed', isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  checkAuth: async (silent = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!silent) set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: response.data, token, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
    }
  },
}));

export default useAuthStore;
