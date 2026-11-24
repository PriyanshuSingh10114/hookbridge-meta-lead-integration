import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

export const fetchLeads = async (page = 1, limit = 50) => {
  try {
    const response = await apiClient.get('/api/leads', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Server error fetching leads');
    } else if (error.request) {
      throw new Error(`Unable to connect to backend at ${API_BASE_URL}. Check server connection.`);
    } else {
      throw error;
    }
  }
};

export const checkBackendHealth = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return response.data;
  } catch (error) {
    return { success: false, status: 'unreachable', error: error.message };
  }
};

export const updateLeadStatus = async (id, status) => {
  try {
    const response = await apiClient.patch(`/api/leads/${id}/status`, { status });
    return response.data;
  } catch (error) {
    const fallback = await apiClient.patch(`/api/leads/${id}`, { status });
    return fallback.data;
  }
};

export default {
  fetchLeads,
  checkBackendHealth,
  updateLeadStatus
};
