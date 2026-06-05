import React, { useState, useEffect } from 'react';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import ProductCard from './components/ProductCard';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';
import { 
  registerUnauthorizedHandler, 
  productService, 
  cartService, 
  wishlistService, 
  addressService, 
  orderService, 
  reviewService,
  userService
} from './services/api';
import './App.css';

export default function App() {
  // Session / Session States
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('luminary_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Modal & Sidebar Controls
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentView, setCurrentView] = useState('shop'); // 'shop' | 'admin' | 'user-dashboard'
  const [dashTab, setDashTab] = useState('profile'); // 'profile' | 'addresses' | 'wishlist' | 'orders'

  // Data States
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cartData, setCartData] = useState({ userId: null, items: [], totalprice: 0 });
  const [wishlistedProductIds, setWishlistedProductIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'price-asc' | 'price-desc'

  // Admin Edit Product Reference
  const [editProduct, setEditProduct] = useState(null);

  // User Dashboard State
  const [userAddresses, setUserAddresses] = useState([]);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addrFullName, setAddrFullName] = useState('');
  const [addrMobile, setAddrMobile] = useState('');
  const [addrAddressLine, setAddrAddressLine] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPincode, setAddrPincode] = useState('');

  const [userOrders, setUserOrders] = useState([]);
  const [userOrdersLoading, setUserOrdersLoading] = useState(false);

  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Product Details Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductReviews, setSelectedProductReviews] = useState([]);
  const [selectedProductReviewsLoading, setSelectedProductReviewsLoading] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Toast System
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast({ message: '', type: 'success' });
  };

  // Setup Global interceptor handler on token expiry (401)
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setCurrentUser(null);
      setCartData({ userId: null, items: [], totalprice: 0 });
      setWishlistedProductIds([]);
      setCurrentView('shop');
      showToast('Your session has expired. Please sign in again.', 'error');
    });
  }, []);

  // Fetch all products or searched products
  const fetchProducts = async (query = '') => {
    setProductsLoading(true);
    try {
      let data;
      if (query.trim()) {
        data = await productService.getByName(query);
      } else {
        data = await productService.getAll();
      }
      setProducts(data);
    } catch (err) {
      console.error(err);
      showToast('Could not fetch products. Make sure the backend server is active.', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch cart details
  const fetchCart = async () => {
    if (!currentUser || currentUser.role.toLowerCase() !== 'user') return;
    try {
      const data = await cartService.get(currentUser.id);
      setCartData(data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  // Fetch wishlist details
  const fetchWishlist = async () => {
    if (!currentUser || currentUser.role.toLowerCase() !== 'user') return;
    try {
      const data = await wishlistService.get(currentUser.id);
      if (data && data.items) {
        setWishlistedProductIds(data.items.map(item => item.productId));
      } else {
        setWishlistedProductIds([]);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  };

  // Fetch user addresses
  const fetchAddresses = async () => {
    if (!currentUser) return;
    try {
      const data = await addressService.getAll(currentUser.id);
      setUserAddresses(data);
    } catch (err) {
      console.error('Error loading addresses:', err);
    }
  };

  // Fetch user orders
  const fetchUserOrders = async () => {
    if (!currentUser) return;
    setUserOrdersLoading(true);
    try {
      const data = await orderService.getUserOrders(currentUser.id);
      setUserOrders(data.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0)));
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setUserOrdersLoading(false);
    }
  };

  // Initial loads
  useEffect(() => {
    fetchProducts();
  }, []);

  // Load contextual data when user state changes
  useEffect(() => {
    if (currentUser) {
      fetchCart();
      fetchWishlist();
      setProfileName(currentUser.name || '');
      setProfilePassword('');
      
      // Auto redirect to correct dashboards
      if (currentUser.role.toLowerCase() === 'admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('shop');
      }
    } else {
      setCartData({ userId: null, items: [], totalprice: 0 });
      setWishlistedProductIds([]);
      setCurrentView('shop');
    }
  }, [currentUser]);

  // Load tab data inside User Dashboard
  useEffect(() => {
    if (currentView === 'user-dashboard' && currentUser) {
      if (dashTab === 'addresses') {
        fetchAddresses();
      } else if (dashTab === 'wishlist') {
        fetchWishlist();
      } else if (dashTab === 'orders') {
        fetchUserOrders();
      }
    }
  }, [currentView, dashTab]);

  // Handle product searches (debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Fetch product reviews if detail modal opens
  useEffect(() => {
    if (selectedProduct) {
      fetchProductReviews(selectedProduct.id);
    }
  }, [selectedProduct]);

  const fetchProductReviews = async (productId) => {
    setSelectedProductReviewsLoading(true);
    try {
      const data = await reviewService.getForProduct(productId);
      setSelectedProductReviews(data);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setSelectedProductReviewsLoading(false);
    }
  };

  // Handle Login Event
  const handleLoginSuccess = (userData, token) => {
    setCurrentUser(userData);
    localStorage.setItem('luminary_user', JSON.stringify(userData));
  };

  // Handle Logout Event
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('luminary_user');
    localStorage.removeItem('luminary_token');
    showToast('Signed out successfully. See you soon!', 'success');
  };

  // Customer: Add item to cart
  const handleAddToCart = async (productId, quantity) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    try {
      await cartService.add(currentUser.id, productId, quantity);
      showToast('Added item to your bag!', 'success');
      fetchCart();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Could not add product to cart.';
      showToast(errorMsg, 'error');
    }
  };

  // Admin: Delete product
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to permanently delete this product?')) {
      try {
        await productService.delete(productId);
        showToast('Product successfully removed', 'success');
        fetchProducts(searchQuery);
        // Clear selected details if deleting current selection
        if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct(null);
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to delete product.';
        showToast(errorMsg, 'error');
      }
    }
  };

  // Admin: Edit product toggle
  const handleEditProductToggle = (product) => {
    setEditProduct(product);
    setCurrentView('admin');
  };

  // Customer: Toggle Wishlist
  const handleToggleWishlist = async (productId) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    const isWish = wishlistedProductIds.includes(productId);
    try {
      if (isWish) {
        await wishlistService.remove(currentUser.id, productId);
        showToast('Removed product from wishlist', 'success');
      } else {
        await wishlistService.add(currentUser.id, productId);
        showToast('Added product to wishlist!', 'success');
      }
      fetchWishlist();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Could not update wishlist';
      showToast(errorMsg, 'error');
    }
  };

  // Customer: Edit Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName || !profilePassword) {
      showToast('Please specify a name and password to update profile.', 'error');
      return;
    }

    setProfileSaving(true);
    try {
      const payload = {
        name: profileName,
        password: profilePassword,
        role: currentUser.role
      };
      const updatedUser = await userService.editInfo(currentUser.email, payload);
      setCurrentUser(updatedUser);
      localStorage.setItem('luminary_user', JSON.stringify(updatedUser));
      showToast('Profile details updated successfully!', 'success');
      setProfilePassword('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update profile info.';
      showToast(errorMsg, 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // Customer: Addresses Add or Edit Submit
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!addrFullName || !addrMobile || !addrAddressLine || !addrCity || !addrState || !addrPincode) {
      showToast('Please fill in all address fields.', 'error');
      return;
    }

    try {
      const payload = {
        fullName: addrFullName,
        mobile: addrMobile,
        addressLine: addrAddressLine,
        city: addrCity,
        state: addrState,
        pincode: addrPincode,
        userId: currentUser.id
      };

      if (editingAddress) {
        await addressService.update(currentUser.id, editingAddress.id, payload);
        showToast('Address updated successfully', 'success');
      } else {
        await addressService.add(payload);
        showToast('Address created successfully', 'success');
      }

      // Reset address form
      setAddressFormOpen(false);
      setEditingAddress(null);
      setAddrFullName('');
      setAddrMobile('');
      setAddrAddressLine('');
      setAddrCity('');
      setAddrState('');
      setAddrPincode('');

      fetchAddresses();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Could not save address details';
      showToast(errorMsg, 'error');
    }
  };

  // Pre-fill address edit form
  const startEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddrFullName(addr.fullName || '');
    setAddrMobile(addr.mobile || '');
    setAddrAddressLine(addr.addressLine || '');
    setAddrCity(addr.city || '');
    setAddrState(addr.state || '');
    setAddrPincode(addr.pincode || '');
    setAddressFormOpen(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Delete this shipping address?')) {
      try {
        await addressService.delete(currentUser.id, addressId);
        showToast('Address deleted successfully', 'success');
        fetchAddresses();
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Could not remove address';
        showToast(errorMsg, 'error');
      }
    }
  };

  // Customer: Cancel Order
  const handleCancelUserOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await orderService.cancel(orderId);
        showToast('Order cancelled successfully', 'success');
        fetchUserOrders();
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Could not cancel order';
        showToast(errorMsg, 'error');
      }
    }
  };

  // Customer: Add Review
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      showToast('Please type a comment for your review.', 'error');
      return;
    }

    setReviewSubmitting(true);
    try {
      const payload = {
        rating: newRating,
        comment: newComment,
        productId: selectedProduct.id
      };
      await reviewService.add(currentUser.id, payload);
      showToast('Review posted successfully! Thank you.', 'success');
      setNewComment('');
      setNewRating(5);
      fetchProductReviews(selectedProduct.id);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Could not add review';
      showToast(errorMsg, 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete your review?')) {
      try {
        await reviewService.delete(reviewId);
        showToast('Review deleted successfully', 'success');
        fetchProductReviews(selectedProduct.id);
      } catch (err) {
        showToast('Could not remove review', 'error');
      }
    }
  };

  // Checkout success (clear items)
  const handleCheckoutSuccess = () => {
    setCartData({ userId: currentUser?.id, items: [], totalprice: 0 });
    fetchUserOrders();
  };

  // Sort and Filter Logic
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return 0; // default (no sorting change)
  });

  const cartItemsCount = cartData?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  // View Details Modal close helper
  const handleCloseDetailsModal = () => {
    setSelectedProduct(null);
    setSelectedProductReviews([]);
    setNewComment('');
    setNewRating(5);
  };

  return (
    <div className="app-container">
      {/* Dynamic Notifications */}
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />

      {/* Styled Glassmorphic Header */}
      <header className="app-header glass-panel">
        <a href="/" className="logo" onClick={(e) => { e.preventDefault(); setCurrentView('shop'); }}>
          <span style={{ fontSize: '1.8rem' }}>🛍️</span>
          <span className="gradient-text">Luminary</span>
        </a>

        <nav className="nav-links">
          <span 
            className={`nav-item ${currentView === 'shop' ? 'active' : ''}`}
            onClick={() => setCurrentView('shop')}
          >
            Browse Shop
          </span>
          {currentUser && currentUser.role.toLowerCase() === 'admin' && (
            <span 
              className={`nav-item ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentView('admin')}
            >
              Admin Dashboard
            </span>
          )}
          {currentUser && currentUser.role.toLowerCase() === 'user' && (
            <span 
              className={`nav-item ${currentView === 'user-dashboard' ? 'active' : ''}`}
              onClick={() => { setCurrentView('user-dashboard'); setDashTab('profile'); }}
            >
              My Dashboard
            </span>
          )}
        </nav>

        <div className="nav-actions">
          {currentUser ? (
            <>
              {currentUser.role.toLowerCase() === 'user' && (
                <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                  {cartItemsCount > 0 && <span className="cart-badge">{cartItemsCount}</span>}
                </button>
              )}

              <div 
                className="user-profile-badge" 
                style={{ cursor: currentUser.role.toLowerCase() === 'user' ? 'pointer' : 'default' }}
                onClick={() => {
                  if (currentUser.role.toLowerCase() === 'user') {
                    setCurrentView('user-dashboard');
                    setDashTab('profile');
                  }
                }}
              >
                <div className="user-avatar">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <span className="user-name">{currentUser.name}</span>
                  <span className="user-role">{currentUser.role === 'ADMIN' ? 'Admin' : 'Customer'}</span>
                </div>
              </div>

              <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px' }}>
                Sign Out
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsAuthOpen(true)}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* SHOP VIEW */}
        {currentView === 'shop' && (
          <div className="shop-section">
            {/* Elegant Hero Banner */}
            <div className="hero">
              <h1 className="animate-fade-in">
                Discover the Future of <br />
                <span className="gradient-text">Premium Commerce</span>
              </h1>
              <p className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Curated collections of the finest technology, wearables, and apparel crafted for those who value absolute perfection.
              </p>
              
              <div className="search-container animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search designer products by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Shop Product Catalog grid */}
            <div style={{ padding: '0 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6366f1' }}><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                  {searchQuery ? `Search Results for "${searchQuery}"` : 'Featured Masterpieces'}
                </h2>
                
                {/* Product Sorting */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>Sort:</span>
                  <select 
                    className="form-control select-control" 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ padding: '8px 36px 8px 12px', fontSize: '0.85rem', background: 'rgba(15, 23, 42, 0.4)' }}
                  >
                    <option value="default">Default Catalog</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {productsLoading ? (
                <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8' }}>
                  <p style={{ fontSize: '1.2rem', fontWeight: 500 }}>Sourcing premium products...</p>
                </div>
              ) : sortedProducts.length === 0 ? (
                <div className="empty-state glass-panel animate-fade-in">
                  <span className="empty-state-icon">🔍</span>
                  <h3>No masterpiece match found</h3>
                  <p>Try searching for other products, or sign in as administrator to publish new ones.</p>
                  {searchQuery && (
                    <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <div className="product-grid">
                  {sortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      currentUser={currentUser}
                      onAddToCart={handleAddToCart}
                      onDelete={handleDeleteProduct}
                      onEdit={handleEditProductToggle}
                      onToggleWishlist={handleToggleWishlist}
                      isWishlisted={wishlistedProductIds.includes(product.id)}
                      onViewDetails={setSelectedProduct}
                      showToast={showToast}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADMIN VIEW */}
        {currentView === 'admin' && (
          currentUser?.role.toLowerCase() === 'admin' ? (
            <AdminPanel 
              editProduct={editProduct}
              onCancelEdit={() => setEditProduct(null)}
              onProductAdded={() => {
                fetchProducts();
                setEditProduct(null);
              }}
              showToast={showToast}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '100px' }}>
              <h2>Access Denied</h2>
              <button className="btn btn-primary" onClick={() => setCurrentView('shop')}>Back to Shop</button>
            </div>
          )
        )}

        {/* CUSTOMER USER DASHBOARD */}
        {currentView === 'user-dashboard' && currentUser && (
          <div className="admin-container animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', width: '100%' }}>
            
            {/* Dashboard Navigation Sidebar */}
            <div className="admin-sidebar" style={{ width: '100%' }}>
              <div className="glass-panel admin-card">
                <h2 className="admin-card-title">
                  <span>✨</span> Dashboard
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    className={`btn ${dashTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`} 
                    onClick={() => setDashTab('profile')}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    👤 Profile Details
                  </button>
                  <button 
                    className={`btn ${dashTab === 'addresses' ? 'btn-primary' : 'btn-secondary'}`} 
                    onClick={() => setDashTab('addresses')}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    📍 Shipping Addresses
                  </button>
                  <button 
                    className={`btn ${dashTab === 'wishlist' ? 'btn-primary' : 'btn-secondary'}`} 
                    onClick={() => setDashTab('wishlist')}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    ❤️ My Wishlist
                  </button>
                  <button 
                    className={`btn ${dashTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`} 
                    onClick={() => setDashTab('orders')}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    📦 Order History
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard Action Content Area */}
            <div className="glass-panel admin-card" style={{ height: 'fit-content', gridColumn: 'span 2', width: '100%' }}>
              
              {/* Profile sub-tab */}
              {dashTab === 'profile' && (
                <div>
                  <h2 className="admin-card-title">👤 Manage Personal Profile</h2>
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px', margin: '0 auto', textAlign: 'left' }}>
                    <div className="form-group">
                      <label className="form-label">Email Address (Read-only)</label>
                      <input type="text" className="form-control" value={currentUser.email} disabled style={{ opacity: 0.6 }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={profileName} 
                        onChange={(e) => setProfileName(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Update/Verify Password</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        placeholder="Type new or current password..." 
                        value={profilePassword} 
                        onChange={(e) => setProfilePassword(e.target.value)} 
                        required 
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px', marginTop: '10px' }} disabled={profileSaving}>
                      {profileSaving ? 'Saving Changes...' : 'Save Profile Details'}
                    </button>
                  </form>
                </div>
              )}

              {/* Addresses sub-tab */}
              {dashTab === 'addresses' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 className="admin-card-title" style={{ margin: 0 }}>📍 My Shipping Addresses</h2>
                    {!addressFormOpen && (
                      <button className="btn btn-primary" onClick={() => { setEditingAddress(null); setAddressFormOpen(true); }} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                        + Add Address
                      </button>
                    )}
                  </div>

                  {addressFormOpen ? (
                    <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.2)' }}>
                      <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>
                        {editingAddress ? '📝 Edit Address Detail' : '➕ Add Shipping Address'}
                      </h3>
                      <form onSubmit={handleAddressSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', textAlign: 'left' }}>
                        <div className="form-group">
                          <label className="form-label">Full Name</label>
                          <input type="text" className="form-control" placeholder="John Doe" value={addrFullName} onChange={(e) => setAddrFullName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Mobile Number</label>
                          <input type="text" className="form-control" placeholder="+1 (555) 000-0000" value={addrMobile} onChange={(e) => setAddrMobile(e.target.value)} required />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label">Street / Address Line</label>
                          <input type="text" className="form-control" placeholder="Apt 4B, 100 Main St" value={addrAddressLine} onChange={(e) => setAddrAddressLine(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">City</label>
                          <input type="text" className="form-control" placeholder="New York" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">State / Region</label>
                          <input type="text" className="form-control" placeholder="NY" value={addrState} onChange={(e) => setAddrState(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Pincode / ZIP</label>
                          <input type="text" className="form-control" placeholder="10001" value={addrPincode} onChange={(e) => setAddrPincode(e.target.value)} required />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '44px' }}>
                            {editingAddress ? 'Update Address' : 'Save Address'}
                          </button>
                          <button type="button" className="btn btn-secondary" onClick={() => setAddressFormOpen(false)} style={{ height: '44px' }}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div>
                      {userAddresses.length === 0 ? (
                        <div className="empty-state">
                          <span className="empty-state-icon">📍</span>
                          <p>You have not registered any shipping address.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                          {userAddresses.map((addr) => (
                            <div key={addr.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <strong style={{ fontSize: '1.05rem', color: '#f8fafc', display: 'block', marginBottom: '8px' }}>{addr.fullName}</strong>
                              <span style={{ fontSize: '0.88rem', color: '#94a3b8', display: 'block' }}>📞 {addr.mobile}</span>
                              <p style={{ margin: '12px 0', fontSize: '0.9rem', color: '#e2e8f0', flexGrow: 1 }}>
                                {addr.addressLine}<br />
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: 'auto' }}>
                                <button className="btn btn-secondary" onClick={() => startEditAddress(addr)} style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem' }}>
                                  Edit
                                </button>
                                <button className="btn btn-danger" onClick={() => handleDeleteAddress(addr.id)} style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', background: '#ef4444' }}>
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Wishlist sub-tab */}
              {dashTab === 'wishlist' && (
                <div>
                  <h2 className="admin-card-title">❤️ My Wishlist</h2>
                  {wishlistedProductIds.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-state-icon">❤️</span>
                      <p>Your wishlist is empty. Add items from the catalog.</p>
                      <button className="btn btn-secondary" onClick={() => setCurrentView('shop')}>Browse Products</button>
                    </div>
                  ) : (
                    <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                      {products.filter(p => wishlistedProductIds.includes(p.id)).map(product => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          currentUser={currentUser}
                          onAddToCart={handleAddToCart}
                          onDelete={handleDeleteProduct}
                          onEdit={handleEditProductToggle}
                          onToggleWishlist={handleToggleWishlist}
                          isWishlisted={true}
                          onViewDetails={setSelectedProduct}
                          showToast={showToast}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Orders sub-tab */}
              {dashTab === 'orders' && (
                <div>
                  <h2 className="admin-card-title">📦 Order History</h2>
                  {userOrdersLoading ? (
                    <div style={{ padding: '40px', color: '#94a3b8' }}>Loading past purchases...</div>
                  ) : userOrders.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-state-icon">🛍️</span>
                      <p>You have not placed any orders yet.</p>
                      <button className="btn btn-secondary" onClick={() => setCurrentView('shop')}>Shop Now</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                      {userOrders.map((order) => (
                        <div key={order.orderId} className="glass-panel" style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '12px' }}>
                            <div>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>ORDER NUMBER</span>
                              <strong style={{ color: '#06b6d4' }}>#{order.orderId}</strong>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>ORDER DATE</span>
                              <span style={{ color: '#e2e8f0' }}>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>TOTAL AMOUNT</span>
                              <strong style={{ color: '#a855f7' }}>${Number(order.amount).toFixed(2)}</strong>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>STATUS</span>
                              <span className="role-badge" style={{
                                background: order.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                color: order.status === 'CANCELLED' ? '#f87171' : '#4ade80',
                                border: `1px solid ${order.status === 'CANCELLED' ? '#ef4444' : '#22c55e'}`,
                                display: 'inline-block',
                                marginTop: '4px'
                              }}>
                                {order.status}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Purchased Items:</span>
                            {order.orderItems && order.orderItems.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#e2e8f0' }}>
                                <span>🎁 {item.productName || `Product ID: ${item.productId}`} x {item.quantity}</span>
                                <span>${Number(item.price).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          {order.status !== 'CANCELLED' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                              <button className="btn btn-danger" onClick={() => handleCancelUserOrder(order.orderId)} style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#ef4444' }}>
                                Cancel Order
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* Styled Footer */}
      <footer className="app-footer">
        <div className="footer-logo">
          🛍️ <span className="gradient-text">Luminary E-Commerce</span>
        </div>
        <p className="footer-text">
          &copy; {new Date().getFullYear()} Luminary Inc. All rights reserved. Crafted with absolute precision.
        </p>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        showToast={showToast}
      />

      {/* Slide-out Shopping Cart */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartData={cartData}
        onCheckoutSuccess={handleCheckoutSuccess}
        onCartUpdated={fetchCart}
        showToast={showToast}
      />

      {/* Product Details Expansion Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={handleCloseDetailsModal}>
          <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', padding: '30px' }}>
            <button className="modal-close" onClick={handleCloseDetailsModal}>&times;</button>
            
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)', borderRadius: '12px', fontSize: '3rem' }}>
                {selectedProduct.name.toLowerCase().includes('phone') ? '📱' :
                 selectedProduct.name.toLowerCase().includes('laptop') ? '💻' :
                 selectedProduct.name.toLowerCase().includes('watch') ? '⌚' :
                 selectedProduct.name.toLowerCase().includes('shoe') ? '👟' : '🎁'}
              </div>
              <div style={{ flex: 1 }}>
                <h2 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{selectedProduct.name}</h2>
                <strong style={{ fontSize: '1.4rem', color: '#06b6d4', display: 'block', marginBottom: '10px' }}>${Number(selectedProduct.price).toFixed(2)}</strong>
                <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.6 }}>{selectedProduct.description || 'No detailed description available.'}</p>
              </div>
            </div>

            {/* Reviews Section */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '350px', overflowY: 'auto', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                💬 Customer Feedbacks ({selectedProductReviews.length})
              </h3>

              {/* Add review form for logged in customers */}
              {currentUser && currentUser.role.toLowerCase() === 'user' ? (
                <form onSubmit={handleAddReview} style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Post Your Masterpiece Rating:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1,2,3,4,5].map(star => (
                        <span 
                          key={star} 
                          onClick={() => setNewRating(star)} 
                          style={{ cursor: 'pointer', fontSize: '1.4rem', color: star <= newRating ? '#f59e0b' : '#475569', transition: 'color 0.15s' }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>({newRating}/5 Stars)</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Share your thoughts about this masterpiece..." 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)} 
                      style={{ flex: 1, padding: '8px 12px', fontSize: '0.88rem' }}
                      required
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', height: '38px', fontSize: '0.85rem' }} disabled={reviewSubmitting}>
                      Post
                    </button>
                  </div>
                </form>
              ) : !currentUser ? (
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  Please <span style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 600 }} onClick={() => { handleCloseDetailsModal(); setIsAuthOpen(true); }}>sign in</span> to write a review.
                </p>
              ) : null}

              {/* Review list */}
              {selectedProductReviewsLoading ? (
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading reviews...</span>
              ) : selectedProductReviews.length === 0 ? (
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', display: 'block', padding: '20px' }}>
                  Be the first one to rate this luxury product!
                </span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedProductReviews.map((rev) => (
                    <div key={rev.reviewId} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#f8fafc' }}>👤 {rev.userName}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5-rev.rating)}</span>
                          {currentUser && currentUser.name === rev.userName && (
                            <button 
                              onClick={() => handleDeleteReview(rev.reviewId)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '4px 0 0' }}>{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              {currentUser && currentUser.role.toLowerCase() === 'user' && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    handleAddToCart(selectedProduct.id, 1);
                    handleCloseDetailsModal();
                  }}
                  style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                >
                  🛒 Add to Bag
                </button>
              )}
              <button className="btn btn-secondary" onClick={handleCloseDetailsModal} style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
