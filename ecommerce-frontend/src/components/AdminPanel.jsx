import React, { useState, useEffect, useMemo } from 'react';
import { userService, productService, orderService } from '../services/api';

export default function AdminPanel({ 
  products = [], 
  onDeleteProduct, 
  onStartEdit,
  editProduct, 
  onCancelEdit, 
  onProductAdded, 
  showToast 
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'inventory' | 'orders' | 'users'
  
  // Product Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  
  // Users list states
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  // Orders list states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL'); // 'ALL' | 'PLACED' | 'CANCELLED'

  // Sync edit product prop to form fields
  useEffect(() => {
    if (editProduct) {
      setName(editProduct.name || '');
      setDescription(editProduct.description || '');
      setPrice(editProduct.price ? String(editProduct.price) : '');
      setActiveTab('inventory');
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
      setUsers(data || []);
      return data || [];
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
      const activeUsers = (usersList || []).filter(
        u => u.role && (u.role.toLowerCase() === 'user' || u.role.toLowerCase() === 'customer')
      );
      
      const ordersPromises = activeUsers.map(async (u) => {
        try {
          const userOrders = await orderService.getUserOrders(u.id);
          return (userOrders || []).map(o => ({
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
    await fetchAllOrders(usersList);
  };

  useEffect(() => {
    loadData();
  }, []);

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
        name: name.trim(),
        description: description.trim(),
        price: Number(price)
      };

      if (editProduct) {
        productPayload.id = editProduct.id;
      }

      const savedProduct = await productService.addOrUpdate(productPayload);
      
      if (editProduct) {
        showToast(`Product "${savedProduct.name}" updated successfully!`, 'success');
        onCancelEdit && onCancelEdit();
      } else {
        showToast(`Product "${savedProduct.name}" created successfully!`, 'success');
      }
      
      // Reset form
      setName('');
      setDescription('');
      setPrice('');

      onProductAdded && onProductAdded();
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

  // Computed KPIs
  const grossRevenue = useMemo(() => {
    return orders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter(o => o.status !== 'CANCELLED').length;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'ALL') return orders;
    return orders.filter(o => (o.status || '').toUpperCase() === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const query = userSearch.toLowerCase();
    return users.filter(u => 
      (u.name && u.name.toLowerCase().includes(query)) || 
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.role && u.role.toLowerCase().includes(query))
    );
  }, [users, userSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const query = productSearch.toLowerCase();
    return products.filter(p => 
      (p.name && p.name.toLowerCase().includes(query)) || 
      (p.description && p.description.toLowerCase().includes(query))
    );
  }, [products, productSearch]);

  return (
    <div className="admin-view animate-fade-in" style={{ width: '100%', textAlign: 'left' }}>
      
      {/* Executive Page Title */}
      <div className="dash-header-bar">
        <div>
          <h1 className="dash-heading">Store Operations</h1>
          <p className="dash-subheading">
            Live catalog control, order fulfillment, and customer registry management.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary"
            onClick={loadData}
            title="Refresh dashboard data"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            Refresh
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setActiveTab('inventory');
              onCancelEdit && onCancelEdit();
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Product
          </button>
        </div>
      </div>

      {/* KPI Metrics Bar */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap kpi-icon-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Gross Revenue</span>
            <span className="kpi-value">${grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="kpi-subtext">Across {activeOrdersCount} placed orders</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap kpi-icon-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Customer Orders</span>
            <span className="kpi-value">{orders.length}</span>
            <span className="kpi-subtext">{orders.filter(o => o.status === 'CANCELLED').length} cancelled</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap kpi-icon-sky">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Active Products</span>
            <span className="kpi-value">{products.length}</span>
            <span className="kpi-subtext">Live catalog listings</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap kpi-icon-amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Registered Accounts</span>
            <span className="kpi-value">{users.length}</span>
            <span className="kpi-subtext">{users.filter(u => (u.role || '').toLowerCase() === 'admin').length} administrators</span>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`dash-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Overview
        </button>

        <button 
          className={`dash-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          </svg>
          Product Inventory
          <span className="dash-tab-badge">{products.length}</span>
        </button>

        <button 
          className={`dash-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          Customer Orders
          <span className="dash-tab-badge">{orders.length}</span>
        </button>

        <button 
          className={`dash-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
          User Registry
          <span className="dash-tab-badge">{users.length}</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          
          {/* Recent Orders Snapshot */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff' }}>Recent Transactions</h2>
              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                onClick={() => setActiveTab('orders')}
              >
                View All Orders
              </button>
            </div>

            {ordersLoading ? (
              <p style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <p>No orders registered yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {orders.slice(0, 5).map(o => (
                  <div 
                    key={o.orderId} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px', 
                      background: 'var(--surface-elevated)', 
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.88rem' }}>#{o.orderId}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{o.userName}</span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                        {o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'N/A'} &bull; {o.orderItems?.length || 0} items
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ display: 'block', fontSize: '0.92rem', color: '#ffffff' }}>${Number(o.amount).toFixed(2)}</strong>
                      <span className={`role-badge ${o.status === 'CANCELLED' ? 'status-cancelled' : 'status-placed'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catalog Quick Management */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff' }}>Catalog Quick View</h2>
              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                onClick={() => setActiveTab('inventory')}
              >
                Manage Inventory
              </button>
            </div>

            {products.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <p>Catalog is currently empty.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {products.slice(0, 5).map(p => (
                  <div 
                    key={p.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px', 
                      background: 'var(--surface-elevated)', 
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ overflow: 'hidden', paddingRight: '12px' }}>
                      <strong style={{ display: 'block', fontSize: '0.88rem', color: '#ffffff', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{p.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', display: 'block' }}>{p.description}</span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <strong style={{ display: 'block', fontSize: '0.92rem', color: '#ffffff' }}>${Number(p.price).toFixed(2)}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>ID: #{p.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: INVENTORY & CATALOG */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Add / Edit Product Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editProduct ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit Product #{editProduct.id}
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--emerald)' }}>
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Catalog Listing
                </>
              )}
            </h2>

            <form onSubmit={handleAddOrUpdateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Product Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Wireless Noise Canceling Headphones"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Unit Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="e.g. 149.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  placeholder="Key specifications, materials, and features..."
                  rows="4"
                  style={{ resize: 'vertical' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editProduct ? 'Update Product' : 'Publish Product'}
                </button>
                {editProduct && (
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={onCancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Product Directory Table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>
                Catalog Inventory ({filteredProducts.length})
              </h2>

              <div style={{ width: '240px', position: 'relative' }}>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Search products..."
                  style={{ padding: '7px 12px 7px 32px', fontSize: '0.82rem' }}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-tertiary)' }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                </div>
                <h3>No products found</h3>
                <p>No catalog items match your search criteria.</p>
              </div>
            ) : (
              <div className="user-table-container">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th style={{ width: '70px' }}>ID</th>
                      <th>Product</th>
                      <th>Description</th>
                      <th>Price</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((prod) => (
                      <tr key={prod.id}>
                        <td style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>#{prod.id}</td>
                        <td style={{ fontWeight: 600, color: '#ffffff', maxWidth: '200px' }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {prod.name}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', maxWidth: '280px' }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                            {prod.description}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#ffffff' }}>
                          ${Number(prod.price).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={() => {
                                onStartEdit ? onStartEdit(prod) : (() => {
                                  setName(prod.name || '');
                                  setDescription(prod.description || '');
                                  setPrice(prod.price ? String(prod.price) : '');
                                })();
                              }}
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => onDeleteProduct ? onDeleteProduct(prod.id) : (async () => {
                                if (window.confirm(`Delete ${prod.name}?`)) {
                                  try {
                                    await productService.delete(prod.id);
                                    showToast('Product deleted', 'success');
                                    onProductAdded && onProductAdded();
                                  } catch (err) {
                                    showToast('Delete failed', 'error');
                                  }
                                }
                              })()}
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: CUSTOMER ORDERS */}
      {activeTab === 'orders' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff' }}>
                Customer Orders ({filteredOrders.length})
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Track payment status, customer information, and purchase contents.
              </p>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', background: 'var(--canvas)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <button 
                className={`dash-tab-btn ${orderStatusFilter === 'ALL' ? 'active' : ''}`}
                style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                onClick={() => setOrderStatusFilter('ALL')}
              >
                All Orders ({orders.length})
              </button>
              <button 
                className={`dash-tab-btn ${orderStatusFilter === 'PLACED' ? 'active' : ''}`}
                style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                onClick={() => setOrderStatusFilter('PLACED')}
              >
                Active ({orders.filter(o => o.status === 'PLACED').length})
              </button>
              <button 
                className={`dash-tab-btn ${orderStatusFilter === 'CANCELLED' ? 'active' : ''}`}
                style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                onClick={() => setOrderStatusFilter('CANCELLED')}
              >
                Cancelled ({orders.filter(o => o.status === 'CANCELLED').length})
              </button>
            </div>
          </div>

          {ordersLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              Retrieving and aggregating customer orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: '50px 0' }}>
              <div className="empty-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                </svg>
              </div>
              <h3>No orders recorded</h3>
              <p>No customer orders match the selected filter.</p>
            </div>
          ) : (
            <div className="user-table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Placed Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Items Purchased</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.orderId}>
                      <td style={{ fontWeight: 600, color: '#ffffff' }}>#{order.orderId}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, color: '#ffffff' }}>{order.userName}</span>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{order.userEmail}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'}
                      </td>
                      <td style={{ fontWeight: 700, color: '#ffffff' }}>
                        ${Number(order.amount).toFixed(2)}
                      </td>
                      <td>
                        <span className={`role-badge ${order.status === 'CANCELLED' ? 'status-cancelled' : 'status-placed'}`}>
                          {order.status === 'CANCELLED' ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          )}
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '280px' }}>
                          {order.orderItems && order.orderItems.map((item, idx) => (
                            <span key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              &bull; {item.productName || `Product #${item.productId}`} &times; {item.quantity} (${Number(item.price).toFixed(2)})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {order.status !== 'CANCELLED' ? (
                          <button
                            className="btn btn-danger"
                            onClick={() => handleCancelAdminOrder(order.orderId)}
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Cancel
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Closed</span>
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

      {/* TAB 4: USER REGISTRY */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff' }}>
                System Accounts Registry ({filteredUsers.length})
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Registered customer accounts and authorized administrators.
              </p>
            </div>

            <div style={{ width: '240px', position: 'relative' }}>
              <input 
                type="text"
                className="form-control"
                placeholder="Search accounts..."
                style={{ padding: '7px 12px 7px 32px', fontSize: '0.82rem' }}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-tertiary)' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {usersLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              Retrieving registered system users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p>No matching user accounts found.</p>
            </div>
          ) : (
            <div className="user-table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>User ID</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Account Role</th>
                    <th style={{ textAlign: 'right' }}>Security Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>#{u.id}</td>
                      <td style={{ fontWeight: 600, color: '#ffffff' }}>{u.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <span className={`role-badge ${u.role && u.role.toLowerCase() === 'admin' ? 'role-admin' : 'role-customer'}`}>
                          {u.role && u.role.toLowerCase() === 'admin' ? (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                          ) : (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                          )}
                          {u.role}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {u.role && u.role.toLowerCase() !== 'admin' ? (
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteUser(u.email)}
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Remove
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>System Protected</span>
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
