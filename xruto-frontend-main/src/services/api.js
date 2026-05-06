// Use environment variable instead of hardcoded URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Generic API request handler
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('xruto_token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  try {
    if (import.meta.env.DEV) {
      console.log(`[api] ${config.method || 'GET'} ${url}`);
    }

    const response = await fetch(url, config);

    // 401 means the token is missing or expired — clear session and go back to login
    if (response.status === 401) {
      localStorage.removeItem('xruto_token');
      localStorage.removeItem('xruto_user');
      window.location.reload();
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`[api] Request failed for ${endpoint}:`, error);
    }
    throw error;
  }
};


// Admin API
export const adminAPI = {
  // Settings
  async getSettings() {
    return apiRequest('/admin/settings');
  },

  async updateSettings(settings) {
    return apiRequest('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Depots
  async getDepots() {
    return apiRequest('/admin/depots');
  },

  async addDepot(depot) {
    return apiRequest('/admin/depots', {
      method: 'POST',
      body: JSON.stringify(depot),
    });
  },

  async updateDepot(id, depot) {
    return apiRequest(`/admin/depots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(depot),
    });
  },

  async removeDepot(id) {
    return apiRequest(`/admin/depots/${id}`, {
      method: 'DELETE',
    });
  },

  // Drivers
  async getDrivers() {
    return apiRequest('/admin/drivers');
  },

  async getDriver(id) {
    return apiRequest(`/admin/drivers/${id}`);
  },

  async addDriver(driver) {
    return apiRequest('/admin/drivers', {
      method: 'POST',
      body: JSON.stringify(driver),
    });
  },

  async updateDriver(id, driver) {
    return apiRequest(`/admin/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(driver),
    });
  },

  async removeDriver(id) {
    return apiRequest(`/admin/drivers/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleDriverStatus(id, isActive) {
    return apiRequest(`/admin/drivers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  // System
  async getSystemHealth() {
    return apiRequest('/admin/health');
  },

  async testConnection() {
    return apiRequest('/admin/test');
  },
};

// Auth API
export const authAPI = {
  async login(credentials) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async register(userData) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async logout() {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  async getCurrentUser() {
    return apiRequest('/auth/me');
  },
};

// Orders API
export const ordersAPI = {
  async getEligibleOrders(date = new Date().toISOString().split('T')[0]) {
    return apiRequest(`/orders/eligible?date=${date}`);
  },

  async bulkUpload(orders) {
    return apiRequest('/orders/upload-text', {
      method: 'POST',
      body: JSON.stringify({ orders }),
    });
  },

  async resetOrders() {
    return apiRequest('/orders/reset', { method: 'DELETE' });
  }
};

// Routes API
export const routesAPI = {
  async getRoutes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/orders/get-routes${queryString ? `?${queryString}` : ''}`);
  },

  async optimizeRoutes(params) {
    return apiRequest('/orders/generate-routes', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async assignDriver(routeId, driverId) {
    return apiRequest('/orders/assign-driver', {
      method: 'POST',
      body: JSON.stringify({ route_id: routeId, driver_id: driverId }),
    });
  },

  async dispatchRoutes(routeIds) {
    return apiRequest('/orders/dispatch-routes', {
      method: 'POST',
      body: JSON.stringify({ route_ids: routeIds }),
    });
  },
};

// Export default combined API
const api = {
  admin: adminAPI,
  auth: authAPI,
  orders: ordersAPI,
  routes: routesAPI,
};

export default api;