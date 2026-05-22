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
  forgotLoading: false,
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

  setError: (message) => {
    set({ error: message, isLoading: false });
    setTimeout(() => set({ error: null }), 3000);
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, isLoading: false });
    } catch (error) {
      useAuthStore.getState().setError(error.response?.data?.error || 'Login failed');
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
      useAuthStore.getState().setError(error.response?.data?.error || 'Registration failed');
    }
  },

  googleLogin: async ({ credential, accessToken }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/google-login`, { credential, accessToken });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, isLoading: false });
    } catch (error) {
      useAuthStore.getState().setError(error.response?.data?.error || 'Google login failed');
    }
  },

  forgotPassword: async (email) => {
    set({ forgotLoading: true, error: null });
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      set({ forgotLoading: false });
      return true;
    } catch (error) {
      set({ forgotLoading: false });
      useAuthStore.getState().setError(error.response?.data?.error || 'Failed to send OTP');
      return false;
    }
  },

  verifyOTP: async (email, code) => {
    set({ forgotLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, { email, code });
      set({ forgotLoading: false });
      return response.data.valid;
    } catch (error) {
      set({ forgotLoading: false });
      useAuthStore.getState().setError(error.response?.data?.error || 'Invalid OTP');
      return false;
    }
  },

  resetPassword: async (email, code, newPassword) => {
    set({ forgotLoading: true, error: null });
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { email, code, newPassword });
      set({ forgotLoading: false });
      return true;
    } catch (error) {
      set({ forgotLoading: false });
      useAuthStore.getState().setError(error.response?.data?.error || 'Failed to reset password');
      return false;
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
