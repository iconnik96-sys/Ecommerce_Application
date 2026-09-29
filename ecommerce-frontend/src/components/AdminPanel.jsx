import React, { useState, useEffect, useMemo } from 'react';
import { userService, productService, orderService, aiService } from '../services/api';
import { getProductImage, CATEGORIES } from '../utils/productImages';

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
  const [category, setCategory] = useState('Desk & Peripherals');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('50');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // AI Generation States
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [suggestingTags, setSuggestingTags] = useState(false);
  
  // Users list states
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  // Orders list states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Sync edit product prop to form fields
  useEffect(() => {
    if (editProduct) {
      setName(editProduct.name || '');
      setCategory(editProduct.category || 'Desk & Peripherals');
      setPrice(editProduct.price ? String(editProduct.price) : '');
      setStock(editProduct.stock !== undefined ? String(editProduct.stock) : '50');
      setImageUrl(editProduct.imageUrl || '');
      setTags(editProduct.tags || '');
      setDescription(editProduct.description || '');
      setActiveTab('inventory');
    } else {
      setName('');
      setCategory('Desk & Peripherals');
      setPrice('');
      setStock('50');
      setImageUrl('');
      setTags('');
      setDescription('');
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

  // AI Description Generator (T33)
  const handleAiGenerateDescription = async () => {
    if (!name.trim()) {
      showToast('Please provide a product title first.', 'error');
      return;
    }
    setGeneratingDesc(true);
    try {
      const res = await aiService.generateDescription(name, category, price, description);
      if (res && res.description) {
        setDescription(res.description);
        showToast('AI description generated successfully.', 'success');
      }
    } catch (err) {
      console.error('AI description error:', err);
      showToast('Failed to generate description with AI.', 'error');
    } finally {
      setGeneratingDesc(false);
    }
  };

  // AI Tag & Category Suggester (T33)
  const handleAiSuggestTags = async () => {
    if (!name.trim()) {
      showToast('Please provide a product title first.', 'error');
      return;
    }
    setSuggestingTags(true);
    try {
      const res = await aiService.suggestTags(name, description);
      if (res) {
        if (res.tags && res.tags.length > 0) {
          setTags(res.tags.join(', '));
        }
        if (res.category) {
          setCategory(res.category);
        }
        showToast('Tags and category suggested by AI.', 'success');
      }
    } catch (err) {
      console.error('AI tag suggestion error:', err);
      showToast('Failed to suggest tags with AI.', 'error');
    } finally {
      setSuggestingTags(false);
    }
  };

  const handleAddOrUpdateProduct = async (e) => {
    e.preventDefault();
    if (!name || !description || !price) {
      showToast('Please fill out product title, price, and description.', 'error');
      return;
    }

    if (isNaN(Number(price)) || Number(price) <= 0) {
      showToast('Price must be a valid number greater than 0.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const productPayload = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        category: category.trim(),
        stock: parseInt(stock, 10) || 50,
        imageUrl: imageUrl.trim(),
        tags: tags.trim()
      };

      if (editProduct) {
        productPayload.id = editProduct.id;
      }

      const savedProduct = await productService.addOrUpdate(productPayload);
      
      if (editProduct) {
        showToast(`Product "${savedProduct.name}" updated successfully.`, 'success');
        onCancelEdit && onCancelEdit();
      } else {
        showToast(`Product "${savedProduct.name}" created successfully.`, 'success');
      }
      
      // Reset form
      setName('');
      setCategory('Desk & Peripherals');
      setPrice('');
      setStock('50');
      setImageUrl('');
      setTags('');
      setDescription('');

      onProductAdded && onProductAdded();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error occurred while saving product.';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (email) => {
    if (window.confirm(`Permanently remove account with email ${email}?`)) {
      try {
        await userService.deleteUser(email);
        showToast('User removed successfully.', 'success');
        fetchUsers();
      } catch (err) {
        showToast(err.response?.data?.message || 'Could not delete user.', 'error');
      }
    }
  };

  const handleCancelAdminOrder = async (orderId) => {
    if (window.confirm(`Cancel order #${orderId}?`)) {
      try {
        await orderService.cancel(orderId);
        showToast('Order marked as cancelled.', 'success');
        fetchAllOrders(users);
      } catch (err) {
        showToast('Could not cancel order.', 'error');
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
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query)) ||
      (p.tags && p.tags.toLowerCase().includes(query))
    );
  }, [products, productSearch]);

  return (
    <div className="admin-view animate-fade-in">
      {/* Header Bar */}
      <div className="dash-header-bar">
        <div>
          <span className="section-label">Operations Suite</span>
          <h1 className="dash-heading">Store Management</h1>
          <p className="dash-subheading">
            Catalog inventory, AI content generation, fulfillment oversight, and user accounts.
          </p>
        </div>
        <div className="admin-header-actions">
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
          >
            Refresh Data
          </button>
          <button 
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setActiveTab('inventory');
              onCancelEdit && onCancelEdit();
            }}
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Gross Revenue</span>
          <span className="kpi-value">${grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="kpi-subtext">Across {activeOrdersCount} fulfilled orders</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Customer Orders</span>
          <span className="kpi-value">{orders.length}</span>
          <span className="kpi-subtext">{orders.filter(o => o.status === 'CANCELLED').length} cancelled</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Catalog Items</span>
          <span className="kpi-value">{products.length}</span>
          <span className="kpi-subtext">Active listings</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Registered Accounts</span>
          <span className="kpi-value">{users.length}</span>
          <span className="kpi-subtext">{users.filter(u => (u.role || '').toLowerCase() === 'admin').length} admin accounts</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          type="button"
          className={`dash-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>

        <button 
          type="button"
          className={`dash-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Product Inventory ({products.length})
        </button>

        <button 
          type="button"
          className={`dash-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Customer Orders ({orders.length})
        </button>

        <button 
          type="button"
          className={`dash-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Registry ({users.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="admin-overview-grid">
          {/* Recent Orders */}
          <div className="card admin-overview-card">
            <div className="card-header-row">
              <h3>Recent Transactions</h3>
              <button 
                type="button"
                className="btn btn-secondary btn-sm" 
                onClick={() => setActiveTab('orders')}
              >
                View All
              </button>
            </div>

            {ordersLoading ? (
              <p className="faint" style={{ padding: '20px 0' }}>Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="faint" style={{ padding: '20px 0' }}>No orders placed yet.</p>
            ) : (
              <div className="admin-mini-list">
                {orders.slice(0, 5).map(o => (
                  <div key={o.orderId} className="admin-mini-item">
                    <div>
                      <div className="admin-mini-title">#{o.orderId} • {o.userName}</div>
                      <span className="admin-mini-sub">{o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'N/A'} • {o.orderItems?.length || 0} items</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="admin-mini-price">${Number(o.amount).toFixed(2)}</span>
                      <span className={`status-badge ${o.status === 'CANCELLED' ? 'status-cancelled' : 'status-placed'}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catalog Quick View */}
          <div className="card admin-overview-card">
            <div className="card-header-row">
              <h3>Catalog Listings</h3>
              <button 
                type="button"
                className="btn btn-secondary btn-sm" 
                onClick={() => setActiveTab('inventory')}
              >
                Manage
              </button>
            </div>

            {products.length === 0 ? (
              <p className="faint" style={{ padding: '20px 0' }}>Catalog is empty.</p>
            ) : (
              <div className="admin-mini-list">
                {products.slice(0, 5).map(p => {
                  const img = getProductImage(p);
                  return (
                    <div key={p.id} className="admin-mini-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={img} alt={p.name} className="admin-thumb-sm" />
                        <div>
                          <div className="admin-mini-title">{p.name}</div>
                          <span className="admin-mini-sub">{p.category || 'Desk & Peripherals'}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="admin-mini-price">${Number(p.price).toFixed(2)}</span>
                        <span className="admin-mini-sub">Stock: {p.stock !== undefined ? p.stock : 50}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY & CATALOG WITH AI TOOLS */}
      {activeTab === 'inventory' && (
        <div className="admin-inventory-layout">
          {/* Add / Edit Product Form */}
          <div className="card admin-form-card">
            <header className="card-header">
              <h3>{editProduct ? `Edit Product #${editProduct.id}` : 'Add Catalog Listing'}</h3>
              <p className="card-subtitle">Complete product specifications and leverage AI tools for marketing copy.</p>
            </header>

            <form onSubmit={handleAddOrUpdateProduct} className="admin-form">
              <div className="form-group">
                <label className="form-label">Product Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Wireless Ergonomic Trackball Mouse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.filter(c => c !== 'All Products').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Unit Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="49.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Initial Stock</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="50"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL (Optional)</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Tags Field with AI Suggestion Button */}
              <div className="form-group">
                <div className="form-label-with-action">
                  <label className="form-label" style={{ margin: 0 }}>Tags & Keywords</label>
                  <button 
                    type="button" 
                    className="ai-action-btn"
                    onClick={handleAiSuggestTags}
                    disabled={suggestingTags || !name.trim()}
                  >
                    ✦ {suggestingTags ? 'Analyzing...' : 'AI Suggest Tags'}
                  </button>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ergonomic, wireless, silent-click"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              {/* Description Field with AI Generator Button */}
              <div className="form-group">
                <div className="form-label-with-action">
                  <label className="form-label" style={{ margin: 0 }}>Product Description</label>
                  <button 
                    type="button" 
                    className="ai-action-btn"
                    onClick={handleAiGenerateDescription}
                    disabled={generatingDesc || !name.trim()}
                  >
                    ✦ {generatingDesc ? 'Generating Copy...' : 'AI Generate Description'}
                  </button>
                </div>
                <textarea
                  className="form-input"
                  placeholder="Precision craftsmanship, technical specs, and editorial highlights..."
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-btn-row">
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

          {/* Products Directory Table */}
          <div className="card admin-table-card">
            <div className="admin-table-header">
              <div>
                <h3>Catalog Directory ({filteredProducts.length})</h3>
                <p className="card-subtitle">Active products, pricing, and live inventory levels.</p>
              </div>

              <input 
                type="text"
                className="form-input admin-search-input"
                placeholder="Search catalog..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>

            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <p>No products match your search.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="editorial-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((prod) => {
                      const img = getProductImage(prod);
                      return (
                        <tr key={prod.id}>
                          <td>
                            <div className="product-cell">
                              <img src={img} alt={prod.name} className="admin-cell-thumb" />
                              <div>
                                <span className="cell-title">{prod.name}</span>
                                <span className="cell-subtitle">ID #{prod.id}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="category-pill-sm">{prod.category || 'General'}</span>
                          </td>
                          <td className="cell-price">${Number(prod.price).toFixed(2)}</td>
                          <td>
                            <span className={`stock-pill ${(prod.stock !== undefined && prod.stock <= 5) ? 'stock-low' : 'stock-ok'}`}>
                              {prod.stock !== undefined ? `${prod.stock} in stock` : '50 in stock'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="cell-actions">
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs"
                                onClick={() => {
                                  onStartEdit ? onStartEdit(prod) : (() => {
                                    setName(prod.name || '');
                                    setDescription(prod.description || '');
                                    setPrice(prod.price ? String(prod.price) : '');
                                  })();
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-xs"
                                onClick={() => onDeleteProduct && onDeleteProduct(prod.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER ORDERS */}
      {activeTab === 'orders' && (
        <div className="card admin-orders-card">
          <div className="admin-table-header">
            <div>
              <h3>Customer Orders ({filteredOrders.length})</h3>
              <p className="card-subtitle">Manage customer fulfillment, review totals, and cancel orders.</p>
            </div>

            <div className="filter-button-group">
              <button 
                type="button"
                className={`filter-btn ${orderStatusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setOrderStatusFilter('ALL')}
              >
                All ({orders.length})
              </button>
              <button 
                type="button"
                className={`filter-btn ${orderStatusFilter === 'PLACED' ? 'active' : ''}`}
                onClick={() => setOrderStatusFilter('PLACED')}
              >
                Active ({orders.filter(o => o.status === 'PLACED').length})
              </button>
              <button 
                type="button"
                className={`filter-btn ${orderStatusFilter === 'CANCELLED' ? 'active' : ''}`}
                onClick={() => setOrderStatusFilter('CANCELLED')}
              >
                Cancelled ({orders.filter(o => o.status === 'CANCELLED').length})
              </button>
            </div>
          </div>

          {ordersLoading ? (
            <p className="faint" style={{ padding: '40px 0', textAlign: 'center' }}>Loading orders...</p>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <p>No orders recorded for this filter.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="editorial-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.orderId}>
                      <td className="cell-bold">#{order.orderId}</td>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-name">{order.userName}</span>
                          <span className="customer-email">{order.userEmail}</span>
                        </div>
                      </td>
                      <td className="faint">{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="cell-price">${Number(order.amount).toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${order.status === 'CANCELLED' ? 'status-cancelled' : 'status-placed'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div className="order-items-snippet">
                          {order.orderItems && order.orderItems.map((item, idx) => (
                            <span key={idx}>
                              {item.productName || `Item #${item.productId}`} × {item.quantity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {order.status !== 'CANCELLED' ? (
                          <button
                            type="button"
                            className="btn btn-danger btn-xs"
                            onClick={() => handleCancelAdminOrder(order.orderId)}
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="faint" style={{ fontSize: 'var(--text-xs)' }}>Closed</span>
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
        <div className="card admin-users-card">
          <div className="admin-table-header">
            <div>
              <h3>Account Registry ({filteredUsers.length})</h3>
              <p className="card-subtitle">Registered customer and administrator accounts.</p>
            </div>

            <input 
              type="text"
              className="form-input admin-search-input"
              placeholder="Search accounts..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>

          {usersLoading ? (
            <p className="faint" style={{ padding: '40px 0', textAlign: 'center' }}>Loading user registry...</p>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <p>No matching user accounts.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="editorial-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="faint">#{u.id}</td>
                      <td className="cell-bold">{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-pill ${u.role && u.role.toLowerCase() === 'admin' ? 'role-admin' : 'role-customer'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {u.role && u.role.toLowerCase() !== 'admin' ? (
                          <button
                            type="button"
                            className="btn btn-danger btn-xs"
                            onClick={() => handleDeleteUser(u.email)}
                          >
                            Remove
                          </button>
                        ) : (
                          <span className="faint" style={{ fontSize: 'var(--text-xs)' }}>Protected</span>
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
