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
  const [dashTab, setDashTab] = useState('orders'); // 'orders' | 'wishlist' | 'addresses' | 'profile'

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
      fetchUserOrders();
      fetchAddresses();
      fetchWishlist();
    }
  }, [currentView, currentUser]);

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
  }, [dashTab]);

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

      {/* Modern Refined Header */}
      <header className="app-header">
        <a href="/" className="logo" onClick={(e) => { e.preventDefault(); setCurrentView('shop'); }}>
          <div className="logo-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <span>Luminary</span>
        </a>

        <nav className="nav-links">
          <span 
            className={`nav-item ${currentView === 'shop' ? 'active' : ''}`}
            onClick={() => setCurrentView('shop')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            Browse Shop
          </span>
          {currentUser && currentUser.role.toLowerCase() === 'admin' && (
            <span 
              className={`nav-item ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentView('admin')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Admin Dashboard
            </span>
          )}
          {currentUser && currentUser.role.toLowerCase() === 'user' && (
            <span 
              className={`nav-item ${currentView === 'user-dashboard' ? 'active' : ''}`}
              onClick={() => { setCurrentView('user-dashboard'); setDashTab('orders'); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              My Dashboard
            </span>
          )}
        </nav>

        <div className="nav-actions">
          {currentUser ? (
            <>
              {currentUser.role.toLowerCase() === 'user' && (
                <button className="cart-btn" onClick={() => setIsCartOpen(true)} title="View Cart">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                  {cartItemsCount > 0 && <span className="cart-badge">{cartItemsCount}</span>}
                </button>
              )}

              <div 
                className="user-profile-badge" 
                style={{ cursor: currentUser.role.toLowerCase() === 'user' ? 'pointer' : 'default' }}
                onClick={() => {
                  if (currentUser.role.toLowerCase() === 'user') {
                    setCurrentView('user-dashboard');
                    setDashTab('orders');
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

              <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '7px 14px', fontSize: '0.82rem' }}>
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
              products={products}
              onDeleteProduct={handleDeleteProduct}
              onStartEdit={handleEditProductToggle}
              editProduct={editProduct}
              onCancelEdit={() => setEditProduct(null)}
              onProductAdded={() => {
                fetchProducts();
                setEditProduct(null);
              }}
              showToast={showToast}
            />
          ) : (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '480px', margin: '60px auto' }}>
              <div className="empty-state-icon" style={{ margin: '0 auto 16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '8px' }}>Access Restricted</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.88rem' }}>
                You must have an administrator account to view store operations and manage system registry.
              </p>
              <button className="btn btn-primary" onClick={() => setCurrentView('shop')}>Back to Shop</button>
            </div>
          )
        )}

        {/* CUSTOMER USER DASHBOARD */}
        {currentView === 'user-dashboard' && currentUser && (
          <div className="animate-fade-in" style={{ width: '100%' }}>
            
            {/* Customer Account Header Banner */}
            <div className="customer-banner">
              <div className="customer-info-group">
                <div className="customer-avatar-large">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="customer-meta">
                  <h2>Welcome, {currentUser.name}</h2>
                  <p>
                    {currentUser.email} &bull; <span className="role-badge role-customer" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>Verified Account</span>
                  </p>
                </div>
              </div>

              <div className="customer-stats-strip">
                <div className="stat-pill">
                  <span className="stat-pill-label">Orders</span>
                  <span className="stat-pill-val">{userOrders.length}</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill-label">Wishlist</span>
                  <span className="stat-pill-val">{wishlistedProductIds.length}</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill-label">Addresses</span>
                  <span className="stat-pill-val">{userAddresses.length}</span>
                </div>
              </div>
            </div>

            {/* 2-Column Dashboard Layout */}
            <div className="user-dash-container">
              
              {/* Sidebar Navigation */}
              <div className="glass-panel" style={{ padding: '16px', height: 'fit-content' }}>
                <div className="dash-sidebar-nav">
                  <button 
                    className={`dash-nav-btn ${dashTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setDashTab('orders')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    <span style={{ flex: 1 }}>Order History</span>
                    <span className="dash-tab-badge">{userOrders.length}</span>
                  </button>

                  <button 
                    className={`dash-nav-btn ${dashTab === 'wishlist' ? 'active' : ''}`}
                    onClick={() => setDashTab('wishlist')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span style={{ flex: 1 }}>Saved Wishlist</span>
                    <span className="dash-tab-badge">{wishlistedProductIds.length}</span>
                  </button>

                  <button 
                    className={`dash-nav-btn ${dashTab === 'addresses' ? 'active' : ''}`}
                    onClick={() => setDashTab('addresses')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span style={{ flex: 1 }}>Shipping Addresses</span>
                    <span className="dash-tab-badge">{userAddresses.length}</span>
                  </button>

                  <button 
                    className={`dash-nav-btn ${dashTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setDashTab('profile')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Profile & Security</span>
                  </button>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '8px 0', paddingTop: '8px' }}>
                    <button 
                      className="dash-nav-btn"
                      onClick={() => setCurrentView('shop')}
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                      </svg>
                      <span>Return to Catalog</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="glass-panel" style={{ padding: '28px', height: 'fit-content' }}>
                
                {/* 1. ORDER HISTORY */}
                {dashTab === 'orders' && (
                  <div>
                    <div style={{ marginBottom: '22px' }}>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                        Order History
                      </h2>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        All your recent transactions and order status details.
                      </p>
                    </div>

                    {userOrdersLoading ? (
                      <div style={{ padding: '50px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Retrieving your purchase history...
                      </div>
                    ) : userOrders.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                          </svg>
                        </div>
                        <h3>No orders placed yet</h3>
                        <p>When you complete a purchase, your invoices and shipment tracking will appear here.</p>
                        <button className="btn btn-primary" onClick={() => setCurrentView('shop')}>
                          Browse Catalog
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {userOrders.map((order) => (
                          <div key={order.orderId} className="order-card">
                            <div className="order-card-header">
                              <div className="order-meta-col">
                                <span className="label">Order Reference</span>
                                <span className="val" style={{ color: '#ffffff' }}>#{order.orderId}</span>
                              </div>
                              <div className="order-meta-col">
                                <span className="label">Date Placed</span>
                                <span className="val">{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</span>
                              </div>
                              <div className="order-meta-col">
                                <span className="label">Total Paid</span>
                                <span className="val" style={{ color: '#ffffff' }}>${Number(order.amount).toFixed(2)}</span>
                              </div>
                              <div>
                                <span className={`role-badge ${order.status === 'CANCELLED' ? 'status-cancelled' : 'status-placed'}`}>
                                  {order.status === 'CANCELLED' ? (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                                  ) : (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                  )}
                                  {order.status}
                                </span>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px 0' }}>
                              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                Purchased Items:
                              </span>
                              {order.orderItems && order.orderItems.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                                  <span>&bull; {item.productName || `Product #${item.productId}`} &times; {item.quantity}</span>
                                  <span style={{ fontWeight: 600, color: '#ffffff' }}>${Number(item.price).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            {order.status !== 'CANCELLED' && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                                <button 
                                  className="btn btn-danger" 
                                  onClick={() => handleCancelUserOrder(order.orderId)}
                                  style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                                >
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

                {/* 2. SAVED WISHLIST */}
                {dashTab === 'wishlist' && (
                  <div>
                    <div style={{ marginBottom: '22px' }}>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                        Saved Wishlist
                      </h2>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        Products you have saved to purchase later.
                      </p>
                    </div>

                    {wishlistedProductIds.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                        </div>
                        <h3>Your wishlist is currently empty</h3>
                        <p>Tap the heart icon on any product in the store to save it here.</p>
                        <button className="btn btn-primary" onClick={() => setCurrentView('shop')}>
                          Browse Catalog
                        </button>
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

                {/* 3. SHIPPING ADDRESSES */}
                {dashTab === 'addresses' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                          Shipping Addresses
                        </h2>
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                          Manage saved delivery addresses for accelerated checkout.
                        </p>
                      </div>

                      {!addressFormOpen && (
                        <button 
                          className="btn btn-primary" 
                          onClick={() => { setEditingAddress(null); setAddressFormOpen(true); }}
                          style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          Add Address
                        </button>
                      )}
                    </div>

                    {addressFormOpen ? (
                      <div className="glass-panel" style={{ padding: '24px', background: 'var(--surface-elevated)', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '16px' }}>
                          {editingAddress ? 'Edit Address' : 'New Shipping Address'}
                        </h3>
                        <form onSubmit={handleAddressSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', textAlign: 'left' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Full Name</label>
                            <input type="text" className="form-control" placeholder="Jane Doe" value={addrFullName} onChange={(e) => setAddrFullName(e.target.value)} required />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Mobile Number</label>
                            <input type="text" className="form-control" placeholder="+1 (555) 000-0000" value={addrMobile} onChange={(e) => setAddrMobile(e.target.value)} required />
                          </div>
                          <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                            <label className="form-label">Street Address</label>
                            <input type="text" className="form-control" placeholder="100 Main St, Suite 400" value={addrAddressLine} onChange={(e) => setAddrAddressLine(e.target.value)} required />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">City</label>
                            <input type="text" className="form-control" placeholder="Seattle" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} required />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">State / Region</label>
                            <input type="text" className="form-control" placeholder="WA" value={addrState} onChange={(e) => setAddrState(e.target.value)} required />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Postal Code / ZIP</label>
                            <input type="text" className="form-control" placeholder="98101" value={addrPincode} onChange={(e) => setAddrPincode(e.target.value)} required />
                          </div>
                          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                              {editingAddress ? 'Update Address' : 'Save Address'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => setAddressFormOpen(false)}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div>
                        {userAddresses.length === 0 ? (
                          <div className="empty-state">
                            <div className="empty-state-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                            </div>
                            <h3>No shipping addresses registered</h3>
                            <p>Save your delivery locations to speed up future orders.</p>
                            <button className="btn btn-primary" onClick={() => setAddressFormOpen(true)}>
                              Add Address
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                            {userAddresses.map((addr) => (
                              <div key={addr.id} className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <strong style={{ fontSize: '0.96rem', color: '#ffffff', marginBottom: '4px' }}>{addr.fullName}</strong>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Phone: {addr.mobile}</span>
                                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, flexGrow: 1, margin: '8px 0' }}>
                                  {addr.addressLine}<br />
                                  {addr.city}, {addr.state} {addr.pincode}
                                </p>
                                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: 'auto' }}>
                                  <button className="btn btn-secondary" onClick={() => startEditAddress(addr)} style={{ flex: 1, padding: '5px 10px', fontSize: '0.78rem' }}>
                                    Edit
                                  </button>
                                  <button className="btn btn-danger" onClick={() => handleDeleteAddress(addr.id)} style={{ flex: 1, padding: '5px 10px', fontSize: '0.78rem' }}>
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

                {/* 4. PROFILE & SECURITY */}
                {dashTab === 'profile' && (
                  <div>
                    <div style={{ marginBottom: '22px' }}>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                        Personal Profile & Security
                      </h2>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        Update your account name and authentication credentials.
                      </p>
                    </div>

                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '440px', textAlign: 'left' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Email Address (Read-only)</label>
                        <input type="text" className="form-control" value={currentUser.email} disabled style={{ opacity: 0.6 }} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Full Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={profileName} 
                          onChange={(e) => setProfileName(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Confirm or New Password</label>
                        <input 
                          type="password" 
                          className="form-control" 
                          placeholder="Type new or current password..." 
                          value={profilePassword} 
                          onChange={(e) => setProfilePassword(e.target.value)} 
                          required 
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={profileSaving}>
                        {profileSaving ? 'Saving Changes...' : 'Save Profile Details'}
                      </button>
                    </form>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

      </main>

      {/* Styled Modern Footer */}
      <footer className="app-footer">
        <div className="footer-logo">
          <div className="logo-badge" style={{ width: '24px', height: '24px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>Luminary Commerce</span>
        </div>
        <p className="footer-text">
          &copy; {new Date().getFullYear()} Luminary Platform &bull; Engineered with Spring Boot &amp; React architecture.
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
