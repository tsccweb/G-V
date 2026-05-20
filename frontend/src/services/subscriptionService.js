import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const getPendingRequest = async () => {
  try {
    const response = await axios.get(`${API_URL}/subscriptions/pending`, { headers: getAuthHeader() });
    return response.data;
  } catch (error) {
    return null;
  }
};

export const requestUpgrade = async (plan) => {
  const response = await axios.put(`${API_URL}/subscriptions`, { plan }, { headers: getAuthHeader() });
  return response.data;
};
