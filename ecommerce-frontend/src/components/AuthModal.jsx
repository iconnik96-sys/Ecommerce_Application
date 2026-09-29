import React, { useState, useEffect } from 'react';
import { authService, userService } from '../services/api';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, showToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const loginData = await authService.login(email, password);
        const token = loginData.token;
        localStorage.setItem('luminary_token', token);

        const userData = await userService.getUserByEmail(email);

        if (userData && userData.email) {
          if (userData.role.toLowerCase() !== role.toLowerCase()) {
            showToast(`Role mismatch: this account is registered as '${userData.role}'.`, 'error');
            localStorage.removeItem('luminary_token');
            setLoading(false);
            return;
          }
          
          showToast(`Welcome back, ${userData.name}.`, 'success');
          onLoginSuccess(userData, token);
          onClose();
        } else {
          showToast('Account could not be verified.', 'error');
          localStorage.removeItem('luminary_token');
        }
      } else {
        const registerPayload = {
          name,
          email,
          password,
          role: role.toUpperCase()
        };

        await authService.register(registerPayload);
        
        const loginData = await authService.login(email, password);
        const token = loginData.token;
        localStorage.setItem('luminary_token', token);

        const userData = await userService.getUserByEmail(email);
        
        showToast('Registration complete. Welcome to Luminary.', 'success');
        onLoginSuccess(userData, token);
        onClose();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Authentication failed. Please verify credentials.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">&times;</button>
        
        <header className="auth-header">
          <div className="auth-brand-mark">✦</div>
          <h2 id="auth-modal-title" className="modal-title">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="modal-subtitle">
            {isLogin 
              ? 'Access your curated desk collection, saved orders, and wishlist.' 
              : 'Join Luminary for curated tech essentials and tailored recommendations.'}
          </p>
        </header>

        <div className="auth-toggle">
          <button 
            type="button" 
            className={`auth-toggle-btn ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button 
            type="button" 
            className={`auth-toggle-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="auth-name" className="form-label">Full Name</label>
              <input 
                id="auth-name"
                type="text" 
                className="form-input" 
                placeholder="Eleanor Vance" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email" className="form-label">Email Address</label>
            <input 
              id="auth-email"
              type="email" 
              className="form-input" 
              placeholder="eleanor@studio.co" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password" className="form-label">Password</label>
            <input 
              id="auth-password"
              type="password" 
              className="form-input" 
              placeholder="••••••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-role" className="form-label">Account Role</label>
            <select 
              id="auth-role"
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">Customer (Shop & Manage Orders)</option>
              <option value="admin">Administrator (Catalog & Inventory)</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary auth-submit-btn" 
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In to Luminary' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}
