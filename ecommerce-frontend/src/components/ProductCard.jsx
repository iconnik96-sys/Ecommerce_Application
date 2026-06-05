import React, { useState } from 'react';

// A mapping of product categories/keywords to emojis for stunning visual styling
const getProductEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('phone') || n.includes('mobile') || n.includes('iphone')) return '📱';
  if (n.includes('laptop') || n.includes('computer') || n.includes('macbook')) return '💻';
  if (n.includes('watch') || n.includes('wearable')) return '⌚';
  if (n.includes('shoe') || n.includes('sneaker') || n.includes('boot')) return '👟';
  if (n.includes('shirt') || n.includes('clothing') || n.includes('tee')) return '👕';
  if (n.includes('coffee') || n.includes('mug') || n.includes('cup')) return '☕';
  if (n.includes('headphone') || n.includes('sound') || n.includes('audio')) return '🎧';
  if (n.includes('book') || n.includes('novel')) return '📚';
  if (n.includes('gaming') || n.includes('controller') || n.includes('playstation')) return '🎮';
  return '🎁'; // Default stylish gift box emoji
};

export default function ProductCard({ 
  product, 
  currentUser, 
  onAddToCart, 
  onDelete, 
  onEdit, 
  onToggleWishlist, 
  isWishlisted, 
  onViewDetails, 
  showToast 
}) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const incrementQty = (e) => {
    e.stopPropagation();
    setQuantity(prev => prev + 1);
  };
  const decrementQty = (e) => {
    e.stopPropagation();
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('Please sign in to add products to your cart!', 'error');
      return;
    }
    if (currentUser.role.toLowerCase() === 'admin') {
      showToast('Administrators cannot purchase items.', 'error');
      return;
    }

    setAdding(true);
    try {
      await onAddToCart(product.id, quantity);
      setQuantity(1); // Reset
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const isAdmin = currentUser && currentUser.role.toLowerCase() === 'admin';
  const isCustomer = currentUser && currentUser.role.toLowerCase() === 'customer';

  return (
    <div 
      className="glass-card product-card animate-fade-in" 
      onClick={() => onViewDetails && onViewDetails(product)}
      style={{ cursor: 'pointer' }}
    >
      {/* Absolute positioned wishlist button for customers */}
      {isCustomer && (
        <button 
          className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: isWishlisted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.65)',
            border: `1px solid ${isWishlisted ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s ease',
            color: isWishlisted ? '#ef4444' : '#94a3b8'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted ? "#ef4444" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      )}

      <div className="product-image-container">
        <span className="product-icon">{getProductEmoji(product.name)}</span>
      </div>

      <div className="product-card-body">
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-card-desc">{product.description || 'No description available for this luxury product.'}</p>
        
        <div className="product-card-footer">
          <span className="product-price">${Number(product.price).toFixed(2)}</span>
          
          {isAdmin ? (
            <div style={{ display: 'flex', gap: '8px', zIndex: 5 }}>
              <button 
                className="btn btn-secondary" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(product);
                }}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                📝 Edit
              </button>
              <button 
                className="btn btn-danger" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product.id);
                }}
                style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#ef4444' }}
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="action-buttons" style={{ zIndex: 5 }}>
              <div className="quantity-controller">
                <button className="qty-btn" onClick={decrementQty}>-</button>
                <span className="qty-val">{quantity}</span>
                <button className="qty-btn" onClick={incrementQty}>+</button>
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleAddToCart}
                disabled={adding}
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
