import React, { useState } from 'react';
import { orderService, cartService } from '../services/api';

// Help get matching icon for cart items
const getItemEmoji = (name = '') => {
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
  return '🎁';
};

export default function CartDrawer({ isOpen, onClose, cartData, onCheckoutSuccess, onCartUpdated, showToast }) {
  const [checkingOut, setCheckingOut] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      showToast('Your cart is empty!', 'error');
      return;
    }
    
    setCheckingOut(true);
    try {
      await orderService.place(cartData.userId);
      showToast('🎉 Order Placed Successfully! Thank you for shopping at Luminary.', 'success');
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
      <div className="cart-drawer-overlay animate-fade-in" onClick={onClose}></div>
      <div className="cart-drawer">
        <div className="cart-header">
          <h2 className="cart-header-title">
            <span>🛒</span> Shopping Bag
          </h2>
          <button className="close-drawer-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="cart-items-container">
          {items.length === 0 ? (
            <div className="cart-empty animate-fade-in">
              <span style={{ fontSize: '4rem', opacity: 0.5 }}>🛍️</span>
              <p style={{ fontWeight: 600, fontSize: '1.1rem', color: '#f8fafc' }}>Your bag is empty</p>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>Fill it with premium products from our shop!</p>
              <button 
                className="btn btn-secondary" 
                onClick={onClose}
                style={{ marginTop: '10px' }}
              >
                Start Browsing
              </button>
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={item.productId || idx} className="cart-item animate-fade-in">
                <div style={{ fontSize: '2rem', display: 'flex', alignItems: 'center' }}>
                  {getItemEmoji(item.name)}
                </div>
                <div className="cart-item-info">
                  <span className="cart-item-title">{item.name}</span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Qty:</span>
                    <div className="quantity-controller" style={{ display: 'flex', height: '26px' }}>
                      <button className="qty-btn" style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleUpdateQty(item.productId, -1)}>-</button>
                      <span className="qty-val" style={{ width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</span>
                      <button className="qty-btn" style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleUpdateQty(item.productId, 1)}>+</button>
                    </div>
                  </div>

                  <div className="cart-item-price-row" style={{ marginTop: '12px' }}>
                    <span className="cart-item-price">${Number(item.price).toFixed(2)}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#a855f7' }}>
                      Sub: ${Number(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span className="cart-total-label">Total Amount:</span>
              <span className="cart-total-value">${Number(totalPrice).toFixed(2)}</span>
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleCheckout}
              disabled={checkingOut}
              style={{ width: '100%', height: '48px' }}
            >
              {checkingOut ? 'Securing Transaction...' : 'Proceed to Checkout'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
