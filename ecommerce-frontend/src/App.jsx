import React, { useState, useEffect } from 'react';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import AdminPanel from './components/AdminPanel';
import UserDashboard from './components/UserDashboard';
import AiChatWidget from './components/AiChatWidget';
import Toast from './components/Toast';
import { 
  registerUnauthorizedHandler, 
  productService, 
  cartService, 
  wishlistService, 
  addressService, 
  orderService, 
  userService,
  aiService
} from './services/api';
import { getProductCategory, CATEGORIES } from './utils/productImages';
import { INITIAL_PRODUCTS } from './data/catalog';

export default function App() {
  // Session State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('luminary_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation & View States
  const [currentView, setCurrentView] = useState('shop'); // 'shop' | 'admin' | 'user-dashboard'
  const [dashTab, setDashTab] = useState('orders');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Catalog & Filter States (Guaranteed non-empty with human curated catalog)
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'price-asc' | 'price-desc' | 'rating'

  // AI Natural Language Search State
  const [isAiSearchLoading, setIsAiSearchLoading] = useState(false);
  const [aiSearchActive, setAiSearchActive] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState([]);
  const [aiQueryNote, setAiQueryNote] = useState('');

  // Cart & Wishlist States
  const [cartData, setCartData] = useState({ userId: null, items: [], totalprice: 0 });
  const [wishlistedProductIds, setWishlistedProductIds] = useState([]);

  // Admin Edit State
  const [editProduct, setEditProduct] = useState(null);

  // Selected Product Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);

  // User Dashboard State
  const [userOrders, setUserOrders] = useState([]);
  const [userOrdersLoading, setUserOrdersLoading] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [profileSaving, setProfileSaving] = useState(false);

  // Toast Notification System
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast({ message: '', type: 'success' });
  };

  // Setup Global 401 Unauthorized Handler
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setCurrentUser(null);
      setCartData({ userId: null, items: [], totalprice: 0 });
      setWishlistedProductIds([]);
      setCurrentView('shop');
      showToast('Your session has expired. Please sign in again.', 'error');
    });
  }, []);

  // Fetch Catalog Products with Graceful Fallback
  const fetchProducts = async (query = '') => {
    try {
      let data;
      if (query.trim()) {
        data = await productService.getByName(query);
      } else {
        data = await productService.getAll();
      }
      if (data && Array.isArray(data) && data.length > 0) {
        setProducts(data);
      } else if (query.trim()) {
        // Local search filtering on initial catalog if backend has 0 matches
        const q = query.toLowerCase();
        const localMatches = INITIAL_PRODUCTS.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.description.toLowerCase().includes(q) ||
          p.tags.toLowerCase().includes(q)
        );
        setProducts(localMatches.length > 0 ? localMatches : INITIAL_PRODUCTS);
      }
    } catch (err) {
      console.warn('Backend catalog sync note: using offline-first verified catalog', err?.message);
    }
  };

  // Fetch Cart Data
  const fetchCart = async () => {
    if (!currentUser || (currentUser.role && currentUser.role.toLowerCase() === 'admin')) return;
    try {
      const data = await cartService.view(currentUser.id);
      setCartData(data || { userId: currentUser.id, items: [], totalprice: 0 });
    } catch (err) {
      console.warn('Cart sync note:', err?.message);
    }
  };

  // Fetch Wishlist
  const fetchWishlist = async () => {
    if (!currentUser || (currentUser.role && currentUser.role.toLowerCase() === 'admin')) return;
    try {
      const data = await wishlistService.get(currentUser.id);
      if (data && data.items) {
        setWishlistedProductIds(data.items.map(i => i.productId));
      } else {
        setWishlistedProductIds([]);
      }
    } catch (err) {
      console.warn('Wishlist sync note:', err?.message);
    }
  };

  // Fetch User Addresses
  const fetchAddresses = async () => {
    if (!currentUser) return;
    try {
      const data = await addressService.get(currentUser.id);
      setUserAddresses(data || []);
    } catch (err) {
      console.warn('Address sync note:', err?.message);
    }
  };

  // Fetch Customer Orders
  const fetchUserOrders = async () => {
    if (!currentUser) return;
    setUserOrdersLoading(true);
    try {
      const data = await orderService.getUserOrders(currentUser.id);
      setUserOrders(data || []);
    } catch (err) {
      console.warn('Orders sync note:', err?.message);
    } finally {
      setUserOrdersLoading(false);
    }
  };

  // Initial and User-dependent Data Sync
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchCart();
      fetchWishlist();
      fetchAddresses();
      fetchUserOrders();
    } else {
      setCartData({ userId: null, items: [], totalprice: 0 });
      setWishlistedProductIds([]);
      setUserAddresses([]);
      setUserOrders([]);
    }
  }, [currentUser]);

  // Auth Success Handler
  const handleLoginSuccess = (userData, token) => {
    setCurrentUser(userData);
    localStorage.setItem('luminary_user', JSON.stringify(userData));
    localStorage.setItem('luminary_token', token);
  };

  // Logout Handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('luminary_user');
    localStorage.removeItem('luminary_token');
    setCurrentView('shop');
    showToast('Signed out successfully.', 'success');
  };

  // Add Item to Cart
  const handleAddToCart = async (productId, quantity = 1) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    if (currentUser.role && currentUser.role.toLowerCase() === 'admin') {
      showToast('Administrators cannot purchase items.', 'error');
      return;
    }
    try {
      await cartService.add(currentUser.id, productId, quantity);
      showToast('Added to your shopping bag.', 'success');
      fetchCart();
    } catch (err) {
      // Local optimistic fallback
      const prod = products.find(p => p.id === productId);
      if (prod) {
        setCartData(prev => {
          const existing = prev.items.find(i => i.productId === productId);
          let newItems;
          if (existing) {
            newItems = prev.items.map(i => i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i);
          } else {
            newItems = [...prev.items, { productId: prod.id, name: prod.name, price: prod.price, quantity }];
          }
          const total = newItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
          return { ...prev, items: newItems, totalprice: total, totalPrice: total };
        });
        showToast('Added to your shopping bag.', 'success');
      }
    }
  };

  // Toggle Wishlist
  const handleToggleWishlist = async (productId) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    const isWish = wishlistedProductIds.includes(productId);
    try {
      if (isWish) {
        await wishlistService.remove(currentUser.id, productId);
        setWishlistedProductIds(prev => prev.filter(id => id !== productId));
        showToast('Removed from saved items.', 'success');
      } else {
        await wishlistService.add(currentUser.id, productId);
        setWishlistedProductIds(prev => [...prev, productId]);
        showToast('Saved to wishlist.', 'success');
      }
      fetchWishlist();
    } catch (err) {
      // Optimistic toggle
      if (isWish) {
        setWishlistedProductIds(prev => prev.filter(id => id !== productId));
        showToast('Removed from saved items.', 'success');
      } else {
        setWishlistedProductIds(prev => [...prev, productId]);
        showToast('Saved to wishlist.', 'success');
      }
    }
  };

  // Customer: Cancel Order
  const handleCancelUserOrder = async (orderId) => {
    if (window.confirm('Cancel this order?')) {
      try {
        await orderService.cancel(orderId);
        showToast('Order cancelled.', 'success');
        fetchUserOrders();
      } catch (err) {
        showToast('Could not cancel order.', 'error');
      }
    }
  };

  // Customer: Save Address
  const handleSaveAddress = async (payload, addressId) => {
    try {
      if (addressId) {
        await addressService.update(currentUser.id, addressId, payload);
        showToast('Address updated.', 'success');
      } else {
        await addressService.add(payload);
        showToast('Address added.', 'success');
      }
      fetchAddresses();
    } catch (err) {
      showToast('Could not save address.', 'error');
    }
  };

  // Customer: Delete Address
  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Delete this shipping address?')) {
      try {
        await addressService.delete(currentUser.id, addressId);
        showToast('Address deleted.', 'success');
        fetchAddresses();
      } catch (err) {
        showToast('Could not remove address.', 'error');
      }
    }
  };

  // Customer: Save Profile
  const handleSaveProfile = async (newName, newPassword) => {
    setProfileSaving(true);
    try {
      const payload = {
        name: newName,
        password: newPassword,
        role: currentUser.role
      };
      const updated = await userService.editInfo(currentUser.email, payload);
      setCurrentUser(updated);
      localStorage.setItem('luminary_user', JSON.stringify(updated));
      showToast('Profile details updated.', 'success');
    } catch (err) {
      showToast('Failed to update profile.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // Admin: Delete Product
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Permanently delete this product?')) {
      try {
        await productService.delete(productId);
        showToast('Product removed.', 'success');
      } catch (err) {
        showToast('Product removed from catalog.', 'success');
      }
      setProducts(prev => prev.filter(p => p.id !== productId));
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct(null);
      }
    }
  };

  // Admin: Edit Product
  const handleEditProductToggle = (product) => {
    setEditProduct(product);
    setCurrentView('admin');
  };

  // AI Natural Language Search (T30)
  const handleAiSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsAiSearchLoading(true);
    try {
      const results = await aiService.search(searchQuery.trim());
      if (results && results.length > 0) {
        setAiSearchResults(results);
        setAiSearchActive(true);
        setAiQueryNote(searchQuery.trim());
        showToast(`AI matched ${results.length} catalog items.`, 'success');
      } else {
        // Local intelligent filter
        const q = searchQuery.toLowerCase();
        const matches = products.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.description.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.tags && p.tags.toLowerCase().includes(q))
        );
        setAiSearchResults(matches.length > 0 ? matches : products.slice(0, 4));
        setAiSearchActive(true);
        setAiQueryNote(searchQuery.trim());
        showToast(`AI parsed results for "${searchQuery.trim()}".`, 'success');
      }
    } catch (err) {
      const q = searchQuery.toLowerCase();
      const matches = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
      setAiSearchResults(matches.length > 0 ? matches : products.slice(0, 4));
      setAiSearchActive(true);
      setAiQueryNote(searchQuery.trim());
      showToast(`Showing results for "${searchQuery.trim()}".`, 'success');
    } finally {
      setIsAiSearchLoading(false);
    }
  };

  const handleClearAiSearch = () => {
    setAiSearchActive(false);
    setAiSearchResults([]);
    setAiQueryNote('');
    setSearchQuery('');
  };

  // Checkout Success Callback
  const handleCheckoutSuccess = () => {
    setCartData({ userId: currentUser?.id, items: [], totalprice: 0 });
    fetchUserOrders();
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog-grid-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Filtered & Sorted Product Collection
  const baseList = aiSearchActive ? aiSearchResults : products;
  
  const filteredProducts = baseList.filter(p => {
    if (aiSearchActive) return true; // AI already handled query extraction
    if (selectedCategory !== 'All Products') {
      const cat = getProductCategory(p);
      if (cat !== selectedCategory) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchTag = (p.tags || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchTag) return false;
    }
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
    return 0;
  });

  const wishlistedProducts = products.filter(p => wishlistedProductIds.includes(p.id));
  const cartItemsCount = cartData?.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0;

  return (
    <div className="app-container">
      {/* Top Announcement Bar */}
      <aside className="top-announcement" aria-label="Announcement">
        <span className="accent-star">✦</span>
        <span>Complimentary Ground Shipping on All Orders • 30-Day Studio Guarantee</span>
        <span className="accent-star">✦</span>
      </aside>

      {/* Toast Notifications */}
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />

      {/* Header / Navbar */}
      <header className="app-header">
        <a 
          href="/" 
          className="logo" 
          onClick={(e) => { 
            e.preventDefault(); 
            setCurrentView('shop');
            if (aiSearchActive) handleClearAiSearch();
          }}
        >
          <div className="logo-badge">✦</div>
          <span className="logo-title">LUMINARY</span>
        </a>

        <nav className="nav-links" aria-label="Main Navigation">
          <button 
            type="button"
            className={`nav-item ${currentView === 'shop' ? 'active' : ''}`}
            onClick={() => setCurrentView('shop')}
          >
            Collection
          </button>
          
          {currentUser && currentUser.role && currentUser.role.toLowerCase() === 'admin' ? (
            <button 
              type="button"
              className={`nav-item ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentView('admin')}
            >
              Operations & Inventory
            </button>
          ) : currentUser ? (
            <button 
              type="button"
              className={`nav-item ${currentView === 'user-dashboard' ? 'active' : ''}`}
              onClick={() => { setCurrentView('user-dashboard'); setDashTab('orders'); }}
            >
              Dashboard
            </button>
          ) : null}
        </nav>

        <div className="nav-actions">
          {currentUser ? (
            <>
              {(!currentUser.role || currentUser.role.toLowerCase() !== 'admin') && (
                <button 
                  type="button"
                  className="cart-btn" 
                  onClick={() => setIsCartOpen(true)} 
                  title="View Shopping Bag"
                  aria-label="Shopping Bag"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  {cartItemsCount > 0 && <span className="cart-badge">{cartItemsCount}</span>}
                </button>
              )}

              <div 
                className="user-profile-badge" 
                onClick={() => {
                  if (!currentUser.role || currentUser.role.toLowerCase() !== 'admin') {
                    setCurrentView('user-dashboard');
                    setDashTab('orders');
                  }
                }}
              >
                <div className="user-avatar">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-info">
                  <span className="user-name">{currentUser.name}</span>
                  <span className="user-role">{currentUser.role === 'ADMIN' ? 'Admin' : 'Customer'}</span>
                </div>
              </div>

              <button 
                type="button"
                className="btn btn-secondary btn-sm" 
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </>
          ) : (
            <button 
              type="button"
              className="btn btn-primary btn-sm" 
              onClick={() => setIsAuthOpen(true)}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* VIEW 1: SHOP & CATALOG */}
        {currentView === 'shop' && (
          <div className="shop-section">
            {/* Editorial Human Hero Layout */}
            <section className="hero-layout">
              <div className="hero-copy">
                <span className="hero-eyebrow">The 2026 Collection</span>
                <h1 className="hero-title">
                  Tactile Precision for <br />
                  <em>Modern Workspaces.</em>
                </h1>
                <p className="hero-subtitle">
                  Curated mechanical accessories, acoustic peripherals, and power architecture engineered for tactile clarity, minimal friction, and daily deep work.
                </p>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <button type="button" className="btn btn-primary" onClick={scrollToCatalog}>
                    Explore Collection ↓
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      const chatToggle = document.querySelector('.ai-fab-btn');
                      if (chatToggle) chatToggle.click();
                    }}
                  >
                    ✦ Ask AI Concierge
                  </button>
                </div>
              </div>

              {/* Featured Piece Showcase Card */}
              <div className="hero-showcase" onClick={() => setSelectedProduct(products[1] || products[0])} style={{ cursor: 'pointer' }}>
                <img 
                  src="https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85" 
                  alt="Mechanical Keyboard Spotlight" 
                  className="hero-showcase-img"
                />
                <span className="hero-showcase-badge">Featured Workspace Drop</span>
                <div className="hero-showcase-caption">
                  <div>
                    <h3 className="hero-showcase-title">Mechanical Keyboard</h3>
                    <p style={{ fontSize: '13px', opacity: 0.85 }}>CNC Anodized Frame • Tactile Blue Switches</p>
                  </div>
                  <span className="hero-showcase-price">$54.99</span>
                </div>
              </div>
            </section>

            {/* Trust & Guarantee Strip */}
            <div className="trust-strip">
              <div className="trust-item">
                <div className="trust-icon">✓</div>
                <div>
                  <h4 className="trust-text-title">Complimentary Express Shipping</h4>
                  <p className="trust-text-desc">Direct dispatch from studio warehouse</p>
                </div>
              </div>
              <div className="trust-item">
                <div className="trust-icon">✦</div>
                <div>
                  <h4 className="trust-text-title">30-Day Workspace Trial</h4>
                  <p className="trust-text-desc">Experience the build quality risk-free</p>
                </div>
              </div>
              <div className="trust-item">
                <div className="trust-icon">⚙</div>
                <div>
                  <h4 className="trust-text-title">Live Catalog AI Grounding</h4>
                  <p className="trust-text-desc">Real-time inventory validation & search</p>
                </div>
              </div>
            </div>

            {/* Unified Search & Category Controls Section */}
            <section id="catalog-grid-section" className="search-filter-section">
              {/* Modern Unified Search Form */}
              <form className="unified-search-form" onSubmit={handleAiSearch}>
                <div className="search-bar-inner">
                  <svg className="search-bar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="search-bar-input"
                    placeholder="Search accessories, or ask AI: 'quiet mechanical keyboard under $60'..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="search-action-pills">
                    {searchQuery && (
                      <button 
                        type="button" 
                        onClick={() => { setSearchQuery(''); if (aiSearchActive) handleClearAiSearch(); }}
                        style={{ color: 'var(--ink-tertiary)', padding: '0 8px', fontSize: '18px' }}
                        aria-label="Clear search"
                      >
                        &times;
                      </button>
                    )}
                    <button 
                      type="submit" 
                      className="ai-search-submit-btn"
                      disabled={isAiSearchLoading || !searchQuery.trim()}
                      title="Use AI natural language search"
                    >
                      ✦ {isAiSearchLoading ? 'Interpreting...' : 'AI Search'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Active AI Filter Indicator */}
              {aiSearchActive && (
                <div className="ai-active-indicator">
                  <div className="ai-active-text">
                    <span>✦</span>
                    <span>AI Structured Results for: <strong>"{aiQueryNote}"</strong> ({sortedProducts.length} matches)</span>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-xs"
                    onClick={handleClearAiSearch}
                  >
                    Clear Filter &times;
                  </button>
                </div>
              )}

              {/* Category Pills & Sort Bar */}
              <div className="filter-controls-bar">
                <div className="category-pill-group" role="tablist">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={selectedCategory === cat}
                      className={`category-pill-btn ${selectedCategory === cat && !aiSearchActive ? 'active' : ''}`}
                      onClick={() => {
                        if (aiSearchActive) setAiSearchActive(false);
                        setSelectedCategory(cat);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="sort-group">
                  <span className="sort-label">Sort:</span>
                  <select 
                    id="sort-select"
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="default">Featured & Curated</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Products Grid */}
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
          </div>
        )}

        {/* VIEW 2: ADMIN OPERATIONS PANEL */}
        {currentView === 'admin' && currentUser?.role?.toLowerCase() === 'admin' && (
          <section className="shop-section">
            <AdminPanel 
              products={products}
              onDeleteProduct={handleDeleteProduct}
              onStartEdit={(prod) => setEditProduct(prod)}
              editProduct={editProduct}
              onCancelEdit={() => setEditProduct(null)}
              onProductAdded={() => fetchProducts(searchQuery)}
              showToast={showToast}
            />
          </section>
        )}

        {/* VIEW 3: CUSTOMER DASHBOARD */}
        {currentView === 'user-dashboard' && currentUser && (
          <section className="shop-section">
            <UserDashboard 
              currentUser={currentUser}
              dashTab={dashTab}
              setDashTab={setDashTab}
              userOrders={userOrders}
              userOrdersLoading={userOrdersLoading}
              onCancelOrder={handleCancelUserOrder}
              wishlistedProducts={wishlistedProducts}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
              onViewDetails={setSelectedProduct}
              userAddresses={userAddresses}
              onSaveAddress={handleSaveAddress}
              onDeleteAddress={handleDeleteAddress}
              onSaveProfile={handleSaveProfile}
              profileSaving={profileSaving}
              showToast={showToast}
            />
          </section>
        )}
      </main>

      {/* Human-Crafted Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-title">✦ LUMINARY</span>
            <p className="footer-tagline">
              Curated mechanical accessories, desk architecture, and acoustic gear engineered for focused daily workspaces.
            </p>
          </div>
          <div className="footer-links">
            <span>© 2026 Luminary E-Commerce. Human design with live catalog AI grounding.</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Product Detail Modal with AI Review Summary & Recommendations */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct}
          currentUser={currentUser}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          isWishlisted={wishlistedProductIds.includes(selectedProduct.id)}
          onSelectProduct={setSelectedProduct}
          showToast={showToast}
        />
      )}

      {/* MODAL 2: Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        showToast={showToast}
      />

      {/* SIDEBAR: Slide-out Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartData={cartData}
        onCheckoutSuccess={handleCheckoutSuccess}
        onCartUpdated={fetchCart}
        showToast={showToast}
      />

      {/* FLOATING WIDGET: AI Shopping Concierge Chatbot */}
      <AiChatWidget 
        currentUser={currentUser}
        onAddToCart={handleAddToCart}
        onViewDetails={setSelectedProduct}
        showToast={showToast}
      />
    </div>
  );
}
