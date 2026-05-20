import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const getSongs = async (params = {}) => {
  const response = await axios.get(`${API_URL}/songs`, { 
    headers: getAuthHeader(),
    params 
  });
  return response.data;
};

export const getSongById = async (id) => {
  const response = await axios.get(`${API_URL}/songs/${id}`, { headers: getAuthHeader() });
  return response.data;
};

export const createSong = async (songData) => {
  const response = await axios.post(`${API_URL}/songs`, songData, { headers: getAuthHeader() });
  return response.data;
};

export const updateSong = async (id, songData) => {
  const response = await axios.put(`${API_URL}/songs/${id}`, songData, { headers: getAuthHeader() });
  return response.data;
};

export const deleteSong = async (id) => {
  const response = await axios.delete(`${API_URL}/songs/${id}`, { headers: getAuthHeader() });
  return response.data;
};
