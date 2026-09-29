import React, { useState } from 'react';
import { orderService, cartService } from '../services/api';
import { getProductImage } from '../utils/productImages';

export default function CartDrawer({ isOpen, onClose, cartData, onCheckoutSuccess, onCartUpdated, showToast }) {
  const [checkingOut, setCheckingOut] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      showToast('Your bag is currently empty.', 'error');
      return;
    }
    
    setCheckingOut(true);
    try {
      await orderService.place(cartData.userId);
      showToast('Order confirmed. Thank you for choosing Luminary.', 'success');
      onCheckoutSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Could not complete checkout.';
      showToast(errorMsg, 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleUpdateQty = async (productId, change) => {
    try {
      await cartService.updateQuantity(cartData.userId, productId, change);
      if (onCartUpdated) {
        onCartUpdated();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Could not update quantity';
      showToast(errorMsg, 'error');
    }
  };

  const items = cartData?.items || [];
  const totalPrice = cartData?.totalPrice ?? cartData?.totalprice ?? 0;

  return (
    <>
      <div className="cart-drawer-overlay animate-fade-in" onClick={onClose} aria-hidden="true" />
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping Bag">
        <header className="cart-header">
          <div className="cart-header-title-group">
            <span className="cart-header-badge">✦</span>
            <h2 className="cart-header-title">Shopping Bag</h2>
            <span className="cart-count-pill">({items.reduce((acc, i) => acc + (i.quantity || 1), 0)})</span>
          </div>
          <button className="close-drawer-btn" onClick={onClose} aria-label="Close cart">&times;</button>
        </header>

        <div className="cart-items-container">
          {items.length === 0 ? (
            <div className="cart-empty animate-fade-in">
              <div className="cart-empty-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <h3 className="cart-empty-title">Your bag is empty</h3>
              <p className="cart-empty-text">Discover curated accessories crafted for modern workspaces and daily commutes.</p>
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={onClose}
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <ul className="cart-item-list">
              {items.map((item, idx) => {
                const img = getProductImage({ name: item.name });
                return (
                  <li key={item.productId || idx} className="cart-item animate-fade-in">
                    <img src={img} alt={item.name} className="cart-item-thumb" />
                    <div className="cart-item-info">
                      <div className="cart-item-head">
                        <h4 className="cart-item-title">{item.name}</h4>
                        <span className="cart-item-subtotal">
                          ${Number(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="cart-item-bottom">
                        <div className="qty-control">
                          <button 
                            type="button" 
                            className="qty-btn" 
                            onClick={() => handleUpdateQty(item.productId, -1)}
                            aria-label="Decrease quantity"
                          >−</button>
                          <span className="qty-value">{item.quantity}</span>
                          <button 
                            type="button" 
                            className="qty-btn" 
                            onClick={() => handleUpdateQty(item.productId, 1)}
                            aria-label="Increase quantity"
                          >+</button>
                        </div>
                        <span className="cart-item-unit-price">${Number(item.price).toFixed(2)} each</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="cart-footer">
            <div className="cart-shipping-notice">
              <span>✦ Complimentary ground shipping on all orders</span>
            </div>
            <div className="cart-total-row">
              <span className="cart-total-label">Subtotal</span>
              <span className="cart-total-value">${Number(totalPrice).toFixed(2)}</span>
            </div>
            <button 
              type="button"
              className="btn btn-primary cart-checkout-btn"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? 'Placing Order...' : 'Complete Purchase'}
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
