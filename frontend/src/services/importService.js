import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const importSongFromUrl = async (url) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/import/import`, { url }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const importSongFromPdf = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('pdf', file);
  
  const response = await axios.post(`${API_URL}/import/pdf`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const searchOnline = async (query) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/import/search?q=${encodeURIComponent(query)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};
