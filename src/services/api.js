// API service for backend communication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Test endpoint
  async testEndpoints() {
    return this.request('/test');
  }

  // Buildings API
  async getBuildings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/buildings?${queryString}` : '/buildings';
    return this.request(endpoint);
  }

  async getBuilding(id) {
    return this.request(`/buildings/${id}`);
  }

  async createBuilding(buildingData) {
    return this.request('/buildings', {
      method: 'POST',
      body: JSON.stringify(buildingData),
    });
  }

  async updateBuilding(id, buildingData) {
    return this.request(`/buildings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(buildingData),
    });
  }

  async deleteBuilding(id) {
    return this.request(`/buildings/${id}`, {
      method: 'DELETE',
    });
  }

  async getBuildingStats() {
    return this.request('/buildings/stats');
  }

  async getNearbyBuildings(lat, lng, radius = 1000) {
    return this.request(`/buildings/nearby/${lat}/${lng}?radius=${radius}`);
  }

  // Users API
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';
    return this.request(endpoint);
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async login(credentials) {
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Get current user profile
  async getCurrentUser() {
    const token = localStorage.getItem('token');
    return this.request('/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  // Update current user profile
  async updateCurrentUser(userData) {
    const token = localStorage.getItem('token');
    return this.request('/users/me', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
  }

  // Registration disabled for admin portal
  // Only predefined admin accounts can access the system

  async getUserStats() {
    return this.request('/users/stats');
  }

  // Paths API
  async getPaths(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/paths?${queryString}` : '/paths';
    return this.request(endpoint);
  }

  async getPath(id) {
    return this.request(`/paths/${id}`);
  }

  async createPath(pathData) {
    return this.request('/paths', {
      method: 'POST',
      body: JSON.stringify(pathData),
    });
  }

  async updatePath(id, pathData) {
    return this.request(`/paths/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pathData),
    });
  }

  async deletePath(id) {
    return this.request(`/paths/${id}`, {
      method: 'DELETE',
    });
  }

  async getPathStats() {
    return this.request('/paths/stats');
  }

  async getNearbyPaths(lat, lng, radius = 1000) {
    return this.request(`/paths/nearby/${lat}/${lng}?radius=${radius}`);
  }

  async getAccessiblePaths() {
    return this.request('/paths/accessible');
  }

  async getPopularPaths() {
    return this.request('/paths/popular');
  }

  async getPathsByType(type) {
    return this.request(`/paths/type/${type}`);
  }

  // Dashboard API
  async getDashboardOverview() {
    return this.request('/dashboard/overview');
  }

  async getDashboardAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/dashboard/analytics?${queryString}` : '/dashboard/analytics';
    return this.request(endpoint);
  }

  async getSystemHealth() {
    return this.request('/dashboard/health');
  }

  async getQuickStats() {
    return this.request('/dashboard/quick-stats');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export the class for testing purposes
export { ApiService };