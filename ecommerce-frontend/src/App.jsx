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

  // Catalog & Filter States
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'price-asc' | 'price-desc'

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

  // Fetch Catalog Products
  const fetchProducts = async (query = '') => {
    setProductsLoading(true);
    try {
      let data;
      if (query.trim()) {
        data = await productService.getByName(query);
      } else {
        data = await productService.getAll();
      }
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load catalog products:', err);
      showToast('Could not load products.', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch Cart Data
  const fetchCart = async () => {
    if (!currentUser || (currentUser.role && currentUser.role.toLowerCase() === 'admin')) return;
    try {
      const data = await cartService.view(currentUser.id);
      setCartData(data || { userId: currentUser.id, items: [], totalprice: 0 });
    } catch (err) {
      console.error('Error fetching bag:', err);
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
      console.error('Error fetching wishlist:', err);
    }
  };

  // Fetch User Addresses
  const fetchAddresses = async () => {
    if (!currentUser) return;
    try {
      const data = await addressService.get(currentUser.id);
      setUserAddresses(data || []);
    } catch (err) {
      console.error('Error fetching addresses:', err);
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
      console.error('Error fetching customer orders:', err);
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
      const msg = err.response?.data?.message || 'Could not add product to bag.';
      showToast(msg, 'error');
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
        showToast('Removed from saved items.', 'success');
      } else {
        await wishlistService.add(currentUser.id, productId);
        showToast('Saved to wishlist.', 'success');
      }
      fetchWishlist();
    } catch (err) {
      showToast('Could not update saved items.', 'error');
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
        fetchProducts(searchQuery);
        if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct(null);
        }
      } catch (err) {
        showToast('Failed to delete product.', 'error');
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
      setAiSearchResults(results || []);
      setAiSearchActive(true);
      setAiQueryNote(searchQuery.trim());
      showToast(`AI found ${results?.length || 0} matching items.`, 'success');
    } catch (err) {
      console.error('AI Search Error:', err);
      showToast('AI search failed; falling back to keyword search.', 'error');
      // Fallback to basic text search
      fetchProducts(searchQuery);
    } finally {
      setIsAiSearchLoading(false);
    }
  };

  const handleClearAiSearch = () => {
    setAiSearchActive(false);
    setAiSearchResults([]);
    setAiQueryNote('');
    setSearchQuery('');
    fetchProducts();
  };

  // Checkout Success Callback
  const handleCheckoutSuccess = () => {
    setCartData({ userId: currentUser?.id, items: [], totalprice: 0 });
    fetchUserOrders();
  };

  // Filtered & Sorted Product Collection
  const baseList = aiSearchActive ? aiSearchResults : products;
  
  const filteredProducts = baseList.filter(p => {
    if (aiSearchActive) return true; // AI already applied semantic filtering
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
    return 0;
  });

  const wishlistedProducts = products.filter(p => wishlistedProductIds.includes(p.id));
  const cartItemsCount = cartData?.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0;

  return (
    <div className="app-container">
      {/* Toast Notifications */}
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />

      {/* Header / Navbar (T19) */}
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        {/* VIEW 1: SHOP & CATALOG (T20, T21, T30) */}
        {currentView === 'shop' && (
          <section className="shop-section">
            {/* Asymmetric Editorial Hero Banner (T20) */}
            <div className="hero">
              <span className="hero-eyebrow">The 2026 Desk Lookbook</span>
              <h1 className="animate-fade-in">
                Tactile Precision for <br />
                <em>Modern Workspaces.</em>
              </h1>
              <p className="animate-fade-in">
                Curated mechanical accessories, acoustic peripherals, and power hubs engineered for clarity, minimal friction, and daily focus.
              </p>

              {/* Natural-Language AI Search Bar (T30) */}
              <form className="hero-search-form animate-fade-in" onSubmit={handleAiSearch}>
                <div className="search-input-wrapper">
                  <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="editorial-search-input"
                    placeholder="Search by keyword, or ask: 'silent mechanical keyboard under $60'..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="search-button-group">
                  <button 
                    type="submit" 
                    className="btn btn-primary ai-search-btn"
                    disabled={isAiSearchLoading || !searchQuery.trim()}
                    title="Search catalog using AI natural language understanding"
                  >
                    ✦ {isAiSearchLoading ? 'Interpreting...' : 'AI Search'}
                  </button>
                </div>
              </form>

              {/* Trust Indicators */}
              <div className="hero-perks">
                <span>✦ Complimentary Shipping</span>
                <span>✦ 30-Day Studio Trial</span>
                <span>✦ Live Catalog Grounding</span>
              </div>
            </div>

            {/* AI Active Filter Banner if active (T30) */}
            {aiSearchActive && (
              <div className="ai-active-filter-banner animate-fade-in">
                <div className="ai-filter-info">
                  <span className="ai-star">✦</span>
                  <span>AI Natural Search Results for: <strong>"{aiQueryNote}"</strong> ({sortedProducts.length} matches)</span>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-xs"
                  onClick={handleClearAiSearch}
                >
                  Clear AI Filter &times;
                </button>
              </div>
            )}

            {/* Catalog Filter & Sort Bar (T21) */}
            <div className="catalog-controls-bar">
              {/* Category Pills */}
              <div className="category-scroll-strip" role="tablist">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === cat}
                    className={`category-pill ${selectedCategory === cat && !aiSearchActive ? 'active' : ''}`}
                    onClick={() => {
                      if (aiSearchActive) setAiSearchActive(false);
                      setSelectedCategory(cat);
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <div className="sort-selector-wrapper">
                <label htmlFor="sort-select" className="sort-label">Sort:</label>
                <select 
                  id="sort-select"
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="default">Curated Order</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Products Grid with Skeletons and Empty States (T21, T27) */}
            {productsLoading ? (
              <div className="product-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="skeleton skeleton-card"></div>
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="empty-state card animate-fade-in">
                <div className="empty-state-circle">✦</div>
                <h3>No accessories match your criteria</h3>
                <p>Try broadening your query or selecting another category.</p>
                {(searchQuery || selectedCategory !== 'All Products' || aiSearchActive) && (
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={() => {
                      handleClearAiSearch();
                      setSelectedCategory('All Products');
                    }}
                  >
                    Reset All Filters
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
          </section>
        )}

        {/* VIEW 2: ADMIN OPERATIONS PANEL (T26, T33) */}
        {currentView === 'admin' && currentUser?.role?.toLowerCase() === 'admin' && (
          <section className="admin-section">
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

        {/* VIEW 3: CUSTOMER DASHBOARD (T25) */}
        {currentView === 'user-dashboard' && currentUser && (
          <section className="dashboard-section">
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

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-mark">✦</span>
            <span className="footer-title">LUMINARY</span>
            <p className="footer-tagline">Curated tech accessories for focused environments.</p>
          </div>
          <div className="footer-links">
            <span className="faint">© 2026 Luminary. Editorial lookbook & AI shopping assistant.</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Product Detail Modal with AI Review Summary & Recommendations (T22, T31, T32) */}
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

      {/* MODAL 2: Auth Modal (T24) */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        showToast={showToast}
      />

      {/* SIDEBAR: Slide-out Cart Drawer (T23) */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartData={cartData}
        onCheckoutSuccess={handleCheckoutSuccess}
        onCartUpdated={fetchCart}
        showToast={showToast}
      />

      {/* FLOATING WIDGET: AI Shopping Concierge Chatbot (T29) */}
      <AiChatWidget 
        currentUser={currentUser}
        onAddToCart={handleAddToCart}
        onViewDetails={setSelectedProduct}
        showToast={showToast}
      />
    </div>
  );
}
