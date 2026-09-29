import React, { useState } from 'react';
import { getProductImage } from '../utils/productImages';

export default function UserDashboard({
  currentUser,
  dashTab,
  setDashTab,
  userOrders = [],
  userOrdersLoading,
  onCancelOrder,
  wishlistedProducts = [],
  onToggleWishlist,
  onAddToCart,
  onViewDetails,
  userAddresses = [],
  onSaveAddress,
  onDeleteAddress,
  onSaveProfile,
  profileSaving,
  showToast
}) {
  // Address Form State
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [pincode, setPincode] = useState('');

  // Profile Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [password, setPassword] = useState('');

  const openNewAddress = () => {
    setEditingAddress(null);
    setFullName('');
    setMobile('');
    setAddressLine('');
    setCity('');
    setStateVal('');
    setPincode('');
    setAddressFormOpen(true);
  };

  const startEditAddress = (addr) => {
    setEditingAddress(addr);
    setFullName(addr.fullName || '');
    setMobile(addr.mobile || '');
    setAddressLine(addr.addressLine || '');
    setCity(addr.city || '');
    setStateVal(addr.state || '');
    setPincode(addr.pincode || '');
    setAddressFormOpen(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !mobile || !addressLine || !city || !stateVal || !pincode) {
      showToast('Please complete all address fields.', 'error');
      return;
    }

    const payload = {
      fullName,
      mobile,
      addressLine,
      city,
      state: stateVal,
      pincode,
      userId: currentUser.id
    };

    await onSaveAddress(payload, editingAddress ? editingAddress.id : null);
    setAddressFormOpen(false);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name || !password) {
      showToast('Please enter your name and current/new password.', 'error');
      return;
    }
    await onSaveProfile(name, password);
    setPassword('');
  };

  return (
    <div className="user-dashboard-view animate-fade-in">
      {/* Customer Header Banner */}
      <div className="customer-banner">
        <div>
          <span className="section-label">Account Overview</span>
          <h1 className="customer-name-heading">Welcome, {currentUser?.name}</h1>
          <p className="customer-email-sub">{currentUser?.email} • Customer Account</p>
        </div>

        <div className="customer-stats-strip">
          <div className="stat-pill">
            <span className="stat-num">{userOrders.length}</span>
            <span className="stat-label">Orders</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num">{wishlistedProducts.length}</span>
            <span className="stat-label">Saved</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num">{userAddresses.length}</span>
            <span className="stat-label">Addresses</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          type="button"
          className={`dash-tab-btn ${dashTab === 'orders' ? 'active' : ''}`}
          onClick={() => setDashTab('orders')}
        >
          Order History ({userOrders.length})
        </button>

        <button 
          type="button"
          className={`dash-tab-btn ${dashTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setDashTab('wishlist')}
        >
          Saved Items ({wishlistedProducts.length})
        </button>

        <button 
          type="button"
          className={`dash-tab-btn ${dashTab === 'addresses' ? 'active' : ''}`}
          onClick={() => setDashTab('addresses')}
        >
          Shipping Addresses ({userAddresses.length})
        </button>

        <button 
          type="button"
          className={`dash-tab-btn ${dashTab === 'profile' ? 'active' : ''}`}
          onClick={() => setDashTab('profile')}
        >
          Security & Profile
        </button>
      </div>

      {/* TAB 1: ORDER HISTORY */}
      {dashTab === 'orders' && (
        <div className="card customer-tab-card">
          <header className="card-header">
            <h3>Order History</h3>
            <p className="card-subtitle">Detailed invoices, tracking status, and order contents.</p>
          </header>

          {userOrdersLoading ? (
            <p className="faint" style={{ padding: '30px 0', textAlign: 'center' }}>Loading your orders...</p>
          ) : userOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-circle">✦</div>
              <h3>No orders yet</h3>
              <p>When you complete a purchase, your order history and receipt will appear here.</p>
            </div>
          ) : (
            <div className="orders-stack">
              {userOrders.map((o) => (
                <article key={o.orderId} className="user-order-card">
                  <div className="user-order-head">
                    <div>
                      <span className="order-id">Order #{o.orderId}</span>
                      <span className="order-date">{o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="order-head-right">
                      <span className={`status-badge ${o.status === 'CANCELLED' ? 'status-cancelled' : 'status-placed'}`}>
                        {o.status}
                      </span>
                      <span className="order-total-amount">${Number(o.amount).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Items in order */}
                  <div className="order-items-list">
                    {o.orderItems && o.orderItems.map((item, idx) => (
                      <div key={idx} className="order-item-row">
                        <span className="order-item-title">{item.productName || `Product #${item.productId}`}</span>
                        <span className="order-item-meta">Qty: {item.quantity} × ${Number(item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {o.status !== 'CANCELLED' && (
                    <div className="order-foot-actions">
                      <button 
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => onCancelOrder(o.orderId)}
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WISHLIST */}
      {dashTab === 'wishlist' && (
        <div className="card customer-tab-card">
          <header className="card-header">
            <h3>Saved Items</h3>
            <p className="card-subtitle">Products you've bookmarked for future workspace upgrades.</p>
          </header>

          {wishlistedProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-circle">✦</div>
              <h3>Your wishlist is empty</h3>
              <p>Save items as you browse to keep track of accessories you love.</p>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlistedProducts.map((p) => {
                const img = getProductImage(p);
                return (
                  <article key={p.id} className="wishlist-card">
                    <img src={img} alt={p.name} className="wishlist-img" />
                    <div className="wishlist-details">
                      <span className="wishlist-category">{p.category || 'Tech Accessory'}</span>
                      <h4 className="wishlist-title">{p.name}</h4>
                      <span className="wishlist-price">${Number(p.price).toFixed(2)}</span>
                      <div className="wishlist-actions">
                        <button 
                          type="button" 
                          className="btn btn-primary btn-xs"
                          onClick={() => onAddToCart(p.id, 1)}
                        >
                          Add to Bag
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-xs"
                          onClick={() => onViewDetails && onViewDetails(p)}
                        >
                          View Details
                        </button>
                        <button 
                          type="button" 
                          className="btn-text-danger"
                          onClick={() => onToggleWishlist(p.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADDRESSES */}
      {dashTab === 'addresses' && (
        <div className="card customer-tab-card">
          <div className="card-header-row">
            <div>
              <h3>Shipping Addresses</h3>
              <p className="card-subtitle">Saved delivery locations for seamless checkout.</p>
            </div>
            {!addressFormOpen && (
              <button 
                type="button"
                className="btn btn-primary btn-sm"
                onClick={openNewAddress}
              >
                + Add Address
              </button>
            )}
          </div>

          {addressFormOpen && (
            <form onSubmit={handleAddressSubmit} className="address-form-box animate-fade-in">
              <h4>{editingAddress ? 'Edit Address' : 'New Shipping Address'}</h4>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Apartment, suite, unit, building, floor"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State / Region</label>
                  <input
                    type="text"
                    className="form-input"
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Postal Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-btn-row">
                <button type="submit" className="btn btn-primary btn-sm">Save Address</button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setAddressFormOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {userAddresses.length === 0 && !addressFormOpen ? (
            <div className="empty-state">
              <div className="empty-state-circle">✦</div>
              <h3>No saved addresses</h3>
              <p>Add a default delivery address to expedite your orders.</p>
            </div>
          ) : (
            <div className="addresses-grid">
              {userAddresses.map((addr) => (
                <div key={addr.id} className="address-card">
                  <div className="address-card-head">
                    <span className="address-recipient">{addr.fullName}</span>
                    <span className="address-phone">{addr.mobile}</span>
                  </div>
                  <p className="address-text">
                    {addr.addressLine}<br />
                    {addr.city}, {addr.state} {addr.pincode}
                  </p>
                  <div className="address-card-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-xs"
                      onClick={() => startEditAddress(addr)}
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger btn-xs"
                      onClick={() => onDeleteAddress(addr.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROFILE */}
      {dashTab === 'profile' && (
        <div className="card customer-tab-card" style={{ maxWidth: '520px' }}>
          <header className="card-header">
            <h3>Profile & Credentials</h3>
            <p className="card-subtitle">Update your personal account information and password.</p>
          </header>

          <form onSubmit={handleProfileSubmit} className="admin-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={currentUser?.email || ''}
                disabled
              />
              <span className="faint" style={{ fontSize: 'var(--text-xs)', marginTop: '4px', display: 'block' }}>
                Account email cannot be modified.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter new password to confirm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={profileSaving}
            >
              {profileSaving ? 'Saving Changes...' : 'Update Profile'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
