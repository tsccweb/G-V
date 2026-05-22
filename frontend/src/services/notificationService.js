import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getNotifications = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getUnreadCount = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const markAsRead = async (id) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const markAllAsRead = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/notifications/read-all`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
