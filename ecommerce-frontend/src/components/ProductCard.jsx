import React, { useState } from 'react';
import { getProductImage, getProductCategory } from '../utils/productImages';

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
  const [imgLoaded, setImgLoaded] = useState(false);

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
      showToast('Please sign in to add products to your bag', 'error');
      return;
    }
    if (currentUser.role && currentUser.role.toLowerCase() === 'admin') {
      showToast('Administrators cannot purchase items.', 'error');
      return;
    }

    setAdding(true);
    try {
      await onAddToCart(product.id, quantity);
      setQuantity(1);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const isAdmin = currentUser && currentUser.role && currentUser.role.toLowerCase() === 'admin';
  const isCustomer = currentUser && (!currentUser.role || currentUser.role.toLowerCase() === 'customer' || currentUser.role.toLowerCase() === 'user');
  const imageUrl = getProductImage(product);
  const category = getProductCategory(product);

  return (
    <article 
      className="product-card" 
      onClick={() => onViewDetails && onViewDetails(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetails && onViewDetails(product);
        }
      }}
      aria-label={`View details for ${product.name}`}
    >
      <div className="product-card-media">
        {/* Wishlist toggle for customer */}
        {isCustomer && (
          <button 
            type="button"
            className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            title={isWishlisted ? "Remove from Saved Items" : "Save to Wishlist"}
            aria-label={isWishlisted ? "Remove from Saved Items" : "Save to Wishlist"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}

        <img 
          src={imageUrl} 
          alt={product.name}
          className={`product-card-image ${imgLoaded ? 'loaded' : ''}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />
        <span className="product-category-tag">{category}</span>
      </div>

      <div className="product-card-content">
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-card-desc">{product.description || 'Precision crafted tech accessory.'}</p>
        
        <div className="product-card-meta">
          <span className="product-price">${Number(product.price).toFixed(2)}</span>
          {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && (
            <span className="stock-warning">Only {product.stock} left</span>
          )}
        </div>

        <div className="product-card-actions">
          {isAdmin ? (
            <div className="admin-card-actions">
              <button 
                type="button"
                className="btn btn-secondary btn-sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(product);
                }}
              >
                Edit
              </button>
              <button 
                type="button"
                className="btn btn-danger btn-sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product.id);
                }}
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="customer-card-actions">
              <div className="qty-control" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="qty-btn" onClick={decrementQty} aria-label="Decrease quantity">−</button>
                <span className="qty-value">{quantity}</span>
                <button type="button" className="qty-btn" onClick={incrementQty} aria-label="Increase quantity">+</button>
              </div>
              <button 
                type="button"
                className="btn btn-primary btn-sm add-bag-btn"
                onClick={handleAddToCart}
                disabled={adding}
              >
                {adding ? 'Adding...' : 'Add to Bag'}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
