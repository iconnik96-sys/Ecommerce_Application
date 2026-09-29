import React, { useState, useEffect } from 'react';
import { reviewService, aiService } from '../services/api';
import { getProductImage, getProductCategory } from '../utils/productImages';

export default function ProductDetailModal({ 
  product, 
  currentUser, 
  onClose, 
  onAddToCart, 
  onToggleWishlist, 
  isWishlisted, 
  onSelectProduct,
  showToast 
}) {
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSummary, setReviewSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);

  // Review Form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (!product) return;

    // 1. Fetch Reviews
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const data = await reviewService.getProductReviews(product.id);
        setReviews(data || []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };

    // 2. Fetch AI Review Summary
    const fetchSummary = async () => {
      setSummaryLoading(true);
      try {
        const res = await aiService.reviewSummary(product.id);
        if (res && res.summary) {
          setReviewSummary(res.summary);
        }
      } catch (err) {
        console.error('Error fetching AI review summary:', err);
      } finally {
        setSummaryLoading(false);
      }
    };

    // 3. Fetch Recommendations
    const fetchRecs = async () => {
      setRecsLoading(true);
      try {
        const data = await aiService.recommendations(product.id);
        setRecommendations(data || []);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setRecsLoading(false);
      }
    };

    fetchReviews();
    fetchSummary();
    fetchRecs();
  }, [product]);

  if (!product) return null;

  const imageUrl = getProductImage(product);
  const category = getProductCategory(product);
  const isCustomer = currentUser && (!currentUser.role || currentUser.role.toLowerCase() === 'customer' || currentUser.role.toLowerCase() === 'user');

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to leave a review.', 'error');
      return;
    }
    if (!comment.trim()) {
      showToast('Please write a brief comment.', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewService.addReview(currentUser.id, {
        rating,
        comment: comment.trim(),
        productId: product.id
      });
      showToast('Review submitted successfully.', 'success');
      setComment('');
      setRating(5);
      // Refresh reviews
      const updated = await reviewService.getProductReviews(product.id);
      setReviews(updated || []);
      // Refresh summary
      const sumRes = await aiService.reviewSummary(product.id);
      if (sumRes?.summary) setReviewSummary(sumRes.summary);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not submit review.';
      showToast(msg, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewService.deleteReview(reviewId);
      showToast('Review removed.', 'success');
      const updated = await reviewService.getProductReviews(product.id);
      setReviews(updated || []);
    } catch (err) {
      showToast('Could not delete review.', 'error');
    }
  };

  const handleAddToCart = async () => {
    if (!currentUser) {
      showToast('Please sign in to add items to your bag.', 'error');
      return;
    }
    if (currentUser.role && currentUser.role.toLowerCase() === 'admin') {
      showToast('Administrators cannot purchase items.', 'error');
      return;
    }

    setAddingToCart(true);
    try {
      await onAddToCart(product.id, quantity);
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content product-detail-modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">&times;</button>

        <div className="detail-layout">
          {/* Left Column: Image & Highlights */}
          <div className="detail-media-column">
            <div className="detail-image-wrapper">
              <img src={imageUrl} alt={product.name} className="detail-hero-image" />
              <span className="product-category-tag">{category}</span>
            </div>

            {/* AI Review Summary Card */}
            <div className="ai-summary-card">
              <div className="ai-summary-header">
                <span className="ai-star">✦</span>
                <h4>AI Review Digest</h4>
              </div>
              {summaryLoading ? (
                <div className="ai-summary-loading">
                  <span className="skeleton skeleton-text" style={{ width: '90%' }}></span>
                  <span className="skeleton skeleton-text" style={{ width: '75%' }}></span>
                </div>
              ) : reviewSummary ? (
                <p className="ai-summary-text">{reviewSummary}</p>
              ) : (
                <p className="ai-summary-text faint">
                  {reviews.length === 0 
                    ? "No reviews yet. Be the first to share your thoughts on this piece."
                    : "Synthesizing verified customer impressions..."}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Information, Cart Actions & Reviews */}
          <div className="detail-info-column">
            <header className="detail-header">
              <span className="detail-category">{category}</span>
              <h1 className="detail-title">{product.name}</h1>
              <div className="detail-price-row">
                <span className="detail-price">${Number(product.price).toFixed(2)}</span>
                <span className="detail-shipping-pill">Complimentary Ground Shipping</span>
              </div>
            </header>

            <div className="detail-description">
              <p>{product.description || 'Precision crafted accessory engineered for longevity, tactile response, and seamless daily utility.'}</p>
            </div>

            {/* Tag List if present */}
            {product.tags && (
              <div className="detail-tags">
                {product.tags.split(',').map((tag, i) => (
                  <span key={i} className="detail-tag-pill">#{tag.trim()}</span>
                ))}
              </div>
            )}

            {/* Actions: Add to bag, Qty, Wishlist */}
            <div className="detail-actions">
              <div className="qty-control">
                <button type="button" className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                <span className="qty-value">{quantity}</span>
                <button type="button" className="qty-btn" onClick={() => setQuantity(q => q + 1)}>+</button>
              </div>

              <button 
                type="button"
                className="btn btn-primary detail-add-btn"
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? 'Adding to Bag...' : `Add to Bag • $${Number(product.price * quantity).toFixed(2)}`}
              </button>

              {isCustomer && (
                <button 
                  type="button"
                  className={`detail-wishlist-btn ${isWishlisted ? 'active' : ''}`}
                  onClick={() => onToggleWishlist(product.id)}
                  title={isWishlisted ? "Remove from Saved" : "Save to Wishlist"}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              )}
            </div>

            {/* "You May Also Like" Recommendations */}
            {recommendations.length > 0 && (
              <section className="detail-recs-section">
                <h4 className="detail-section-title">
                  <span>✦</span> You May Also Like
                </h4>
                <div className="detail-recs-grid">
                  {recommendations.map(rec => {
                    const rImg = getProductImage(rec);
                    return (
                      <div 
                        key={rec.id} 
                        className="detail-rec-card"
                        onClick={() => onSelectProduct && onSelectProduct(rec)}
                      >
                        <img src={rImg} alt={rec.name} className="detail-rec-img" />
                        <div className="detail-rec-meta">
                          <span className="detail-rec-name">{rec.name}</span>
                          <span className="detail-rec-price">${Number(rec.price).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Customer Reviews Section */}
            <section className="detail-reviews-section">
              <h4 className="detail-section-title">Customer Feedback ({reviews.length})</h4>

              {/* Review Input */}
              {currentUser ? (
                <form onSubmit={handleAddReview} className="detail-review-form">
                  <div className="rating-select-row">
                    <label className="form-label" style={{ margin: 0 }}>Rating:</label>
                    <div className="star-picker">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${rating >= star ? 'active' : ''}`}
                          onClick={() => setRating(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea 
                    className="form-input review-textarea"
                    placeholder="Share your experience with build quality, ergonomics, or finish..."
                    rows="3"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                  <button 
                    type="submit" 
                    className="btn btn-secondary btn-sm"
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              ) : (
                <p className="detail-signin-notice">Sign in to leave a review.</p>
              )}

              {/* Reviews List */}
              <div className="detail-reviews-list">
                {reviewsLoading ? (
                  <p className="faint">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <p className="faint">No reviews yet.</p>
                ) : (
                  reviews.map((rev) => (
                    <article key={rev.id} className="review-item">
                      <div className="review-item-header">
                        <div className="review-user-badge">
                          <span className="review-avatar">{(rev.userName || 'U').charAt(0).toUpperCase()}</span>
                          <span className="review-username">{rev.userName || 'Verified Buyer'}</span>
                        </div>
                        <div className="review-stars">
                          {'★'.repeat(rev.rating || 5)}{'☆'.repeat(5 - (rev.rating || 5))}
                        </div>
                      </div>
                      <p className="review-comment">{rev.comment}</p>
                      
                      {(currentUser?.id === rev.userId || currentUser?.role?.toLowerCase() === 'admin') && (
                        <button 
                          type="button"
                          className="review-delete-btn"
                          onClick={() => handleDeleteReview(rev.id)}
                        >
                          Delete
                        </button>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
