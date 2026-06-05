import React, { useState, useEffect } from 'react';
import { userService, productService, orderService } from '../services/api';

export default function AdminPanel({ editProduct, onCancelEdit, onProductAdded, showToast }) {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'orders'
  
  // Product Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Users list states
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Orders list states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Sync edit product prop to form fields
  useEffect(() => {
    if (editProduct) {
      setName(editProduct.name || '');
      setDescription(editProduct.description || '');
      setPrice(editProduct.price ? String(editProduct.price) : '');
    } else {
      setName('');
      setDescription('');
      setPrice('');
    }
  }, [editProduct]);

  // Fetch registered users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
      return data; // return to chain orders loading
    } catch (err) {
      console.error('Failed to load registered users:', err);
      showToast('Could not load user registry.', 'error');
      return [];
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch all orders across users
  const fetchAllOrders = async (usersList) => {
    setOrdersLoading(true);
    try {
      const activeUsers = usersList.filter(
        u => u.role.toLowerCase() === 'user' || u.role.toLowerCase() === 'customer'
      );
      
      const ordersPromises = activeUsers.map(async (u) => {
        try {
          const userOrders = await orderService.getUserOrders(u.id);
          return userOrders.map(o => ({
            ...o,
            userName: u.name,
            userEmail: u.email
          }));
        } catch (err) {
          console.error(`Error loading orders for user ${u.id}`, err);
          return [];
        }
      });

      const results = await Promise.all(ordersPromises);
      const flatOrders = results.flat().sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
      setOrders(flatOrders);
    } catch (err) {
      console.error('Failed to aggregate orders:', err);
      showToast('Could not load system orders.', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadData = async () => {
    const usersList = await fetchUsers();
    if (activeTab === 'orders') {
      await fetchAllOrders(usersList);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleAddOrUpdateProduct = async (e) => {
    e.preventDefault();
    if (!name || !description || !price) {
      showToast('Please fill out all product details.', 'error');
      return;
    }

    if (isNaN(Number(price)) || Number(price) <= 0) {
      showToast('Price must be a valid number greater than 0', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const productPayload = {
        name,
        description,
        price: Number(price)
      };

      if (editProduct) {
        productPayload.id = editProduct.id;
      }

      const savedProduct = await productService.addOrUpdate(productPayload);
      
      if (editProduct) {
        showToast(`Product "${savedProduct.name}" updated successfully!`, 'success');
        onCancelEdit();
      } else {
        showToast(`Product "${savedProduct.name}" created successfully!`, 'success');
      }
      
      // Reset form
      setName('');
      setDescription('');
      setPrice('');

      onProductAdded();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error occurred while saving product';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (email) => {
    if (window.confirm(`Are you sure you want to permanently delete user with email ${email}?`)) {
      try {
        await userService.deleteUser(email);
        showToast('User removed successfully', 'success');
        fetchUsers();
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Could not delete user';
        showToast(errorMsg, 'error');
      }
    }
  };

  const handleCancelAdminOrder = async (orderId) => {
    if (window.confirm(`Are you sure you want to cancel order #${orderId}?`)) {
      try {
        await orderService.cancel(orderId);
        showToast('Order cancelled successfully', 'success');
        fetchAllOrders(users);
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Could not cancel order';
        showToast(errorMsg, 'error');
      }
    }
  };

  return (
    <div className="admin-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Admin Dashboard Tabs */}
      <div className="auth-toggle" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <button 
          className={`auth-toggle-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory & Users
        </button>
        <button 
          className={`auth-toggle-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Customer Orders
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', width: '100%' }}>
          {/* Column 1: Add/Edit Product Form */}
          <div className="admin-sidebar" style={{ width: '100%' }}>
            <div className="glass-panel admin-card">
              <h2 className="admin-card-title">
                {editProduct ? (
                  <>
                    <span style={{ fontSize: '1.4rem' }}>📝</span>
                    Edit Product #{editProduct.id}
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#06b6d4' }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add New Product
                  </>
                )}
              </h2>
              
              <form onSubmit={handleAddOrUpdateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Product Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Premium Wireless Headphones"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="199.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Description</label>
                  <textarea
                    className="form-control"
                    placeholder="Enter detailed description here..."
                    rows="4"
                    style={{ resize: 'none' }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ flex: 1, height: '44px' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product Listing'}
                  </button>
                  {editProduct && (
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={onCancelEdit}
                      style={{ height: '44px' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Column 2: User Registry list */}
          <div className="glass-panel admin-card" style={{ height: 'fit-content', width: '100%' }}>
            <h2 className="admin-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#a855f7' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              System Users Registry ({users.length})
            </h2>

            {usersLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                Retrieving registered system users...
              </div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">👥</span>
                <p>No registered users found inside database.</p>
              </div>
            ) : (
              <div className="user-table-container" style={{ overflowX: 'auto' }}>
                <table className="user-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td style={{ color: '#06b6d4', fontWeight: 600 }}>#{u.id}</td>
                        <td style={{ fontWeight: 500 }}>{u.name}</td>
                        <td style={{ color: '#94a3b8' }}>{u.email}</td>
                        <td>
                          <span className={`role-badge role-${u.role.toLowerCase()}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.role.toLowerCase() !== 'admin' ? (
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDeleteUser(u.email)}
                              style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#ef4444' }}
                            >
                              Delete
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>System protected</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Order Management Tab View */
        <div className="glass-panel admin-card animate-fade-in" style={{ width: '100%' }}>
          <h2 className="admin-card-title">
            <span>📦</span> System Customer Orders ({orders.length})
          </h2>

          {ordersLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              Retrieving and aggregating customer orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📦</span>
              <p>No customer orders have been placed yet.</p>
            </div>
          ) : (
            <div className="user-table-container" style={{ overflowX: 'auto' }}>
              <table className="user-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th>Order Items</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orderId}>
                      <td style={{ color: '#6366f1', fontWeight: 600 }}>#{order.orderId}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500 }}>{order.userName}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{order.userEmail}</span>
                        </div>
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        {order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'}
                      </td>
                      <td style={{ color: '#06b6d4', fontWeight: 700 }}>
                        ${Number(order.amount).toFixed(2)}
                      </td>
                      <td>
                        <span className={`role-badge`} style={{
                          background: order.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          color: order.status === 'CANCELLED' ? '#f87171' : '#4ade80',
                          border: `1px solid ${order.status === 'CANCELLED' ? '#ef4444' : '#22c55e'}`
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '300px' }}>
                          {order.orderItems && order.orderItems.map((item, idx) => (
                            <span key={idx} style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                              🎁 {item.productName || `Product ID: ${item.productId}`} x {item.quantity} (${Number(item.price).toFixed(2)})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {order.status !== 'CANCELLED' ? (
                          <button
                            className="btn btn-danger"
                            onClick={() => handleCancelAdminOrder(order.orderId)}
                            style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#ef4444' }}
                          >
                            Cancel Order
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Cancelled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
