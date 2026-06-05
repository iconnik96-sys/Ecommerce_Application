import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});
// Request interceptor to attach bearer token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('luminary_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to catch unauthorized access (expired token)
let onUnauthorizedCallback = null;

export const registerUnauthorizedHandler = (callback) => {
  onUnauthorizedCallback = callback;
};

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('luminary_token');
      localStorage.removeItem('luminary_user');
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    return response.data; // returns { token }
  },
  register: async (payload) => {
    const response = await API.post('/ecom/users/register', payload);
    return response.data; // returns UserResponseDTO
  },
};

// User Services
export const userService = {
  getAllUsers: async () => {
    const response = await API.get('/ecom/users/getall');
    return response.data;
  },
  getUserByEmail: async (email) => {
    const response = await API.get(`/ecom/users/getbyemail/${encodeURIComponent(email)}`);
    return response.data;
  },
  editInfo: async (email, payload) => {
    const response = await API.put(`/ecom/users/editinfo/${encodeURIComponent(email)}`, payload);
    return response.data;
  },
  deleteUser: async (email) => {
    const response = await API.delete(`/ecom/users/deleteuser/${encodeURIComponent(email)}`);
    return response.data;
  },
};

// Product Services
export const productService = {
  getAll: async () => {
    const response = await API.get('/ecom/products/getAllProducts');
    return response.data;
  },
  getByName: async (name) => {
    const response = await API.get(`/ecom/products/getByName/${encodeURIComponent(name)}`);
    return response.data;
  },
  addOrUpdate: async (payload) => {
    const response = await API.post('/ecom/products/addProduct', payload);
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/ecom/products/deleteproduct/${id}`);
    return response.data;
  },
};

// Cart Services
export const cartService = {
  get: async (userId) => {
    const response = await API.get(`/ecom/cart/viewcart/${userId}`);
    return response.data;
  },
  add: async (userId, productId, quantity) => {
    const response = await API.post(
      `/ecom/cart/addProduct?userId=${userId}&productId=${productId}&quantity=${quantity}`
    );
    return response.data;
  },
  updateQuantity: async (userId, productId, quantityChange) => {
    const response = await API.put('/ecom/cart/updateQuantity', {
      userId,
      productId,
      quantityChange,
    });
    return response.data;
  },
};

// Wishlist Services
export const wishlistService = {
  get: async (userId) => {
    const response = await API.get(`/wishlist/${userId}`);
    return response.data;
  },
  add: async (userId, productId) => {
    const response = await API.post(`/wishlist/add/${userId}/${productId}`);
    return response.data;
  },
  remove: async (userId, productId) => {
    const response = await API.delete(`/wishlist/remove/${userId}/${productId}`);
    return response.data;
  },
};

// Address Services
export const addressService = {
  getAll: async (userId) => {
    const response = await API.get(`/ecom/address/getAll/${userId}`);
    return response.data;
  },
  add: async (payload) => {
    const response = await API.post('/ecom/address/add', payload);
    return response.data;
  },
  update: async (userId, addressId, payload) => {
    const response = await API.put(`/ecom/address/update/${userId}/${addressId}`, payload);
    return response.data;
  },
  delete: async (userId, addressId) => {
    const response = await API.delete(`/ecom/address/delete/${userId}/${addressId}`);
    return response.data;
  },
};

// Order Services
export const orderService = {
  place: async (userId) => {
    const response = await API.post(`/ecom/order/place/${userId}`);
    return response.data;
  },
  getUserOrders: async (userId) => {
    const response = await API.get(`/ecom/order/user/${userId}`);
    return response.data;
  },
  getOrderById: async (orderId) => {
    const response = await API.get(`/ecom/order/getByOrder/${orderId}`);
    return response.data;
  },
  cancel: async (orderId) => {
    const response = await API.put(`/ecom/order/cancel/${orderId}`);
    return response.data;
  },
};

// Review Services
export const reviewService = {
  getForProduct: async (productId) => {
    const response = await API.get(`/ecom/reviews/product/${productId}`);
    return response.data;
  },
  add: async (userId, payload) => {
    const response = await API.post(`/ecom/reviews/${userId}`, payload);
    return response.data;
  },
  delete: async (reviewId) => {
    const response = await API.delete(`/ecom/reviews/${reviewId}`);
    return response.data;
  },
};

export default API;
