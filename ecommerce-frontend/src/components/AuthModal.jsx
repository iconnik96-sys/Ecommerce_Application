import React, { useState } from 'react';
import { authService, userService } from '../services/api';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, showToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Sign In Flow: Call JWT login
        const loginData = await authService.login(email, password);
        const token = loginData.token;
        
        // Save token to localStorage so interceptor picks it up
        localStorage.setItem('luminary_token', token);

        // Retrieve user details by email
        const userData = await userService.getUserByEmail(email);

        if (userData && userData.email) {
          // Check role alignment
          if (userData.role.toLowerCase() !== role.toLowerCase()) {
            showToast(`User found, but role is '${userData.role}' instead of selected '${role}'`, 'error');
            localStorage.removeItem('luminary_token');
            setLoading(false);
            return;
          }
          
          showToast(`Welcome back, ${userData.name}!`, 'success');
          onLoginSuccess(userData, token);
          onClose();
        } else {
          showToast('Account not found.', 'error');
          localStorage.removeItem('luminary_token');
        }
      } else {
        // Register Flow: Register then login
        const registerPayload = {
          name,
          email,
          password,
          role: role.toUpperCase() // match backend Role enum USER/ADMIN
        };

        await authService.register(registerPayload);
        
        // Auto-login after registration
        const loginData = await authService.login(email, password);
        const token = loginData.token;
        localStorage.setItem('luminary_token', token);

        const userData = await userService.getUserByEmail(email);
        
        showToast('Registration successful! Welcome.', 'success');
        onLoginSuccess(userData, token);
        onClose();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'An error occurred during authentication';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-fade-in">
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <h2 className="modal-title gradient-text">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="modal-subtitle">
          {isLogin ? 'Sign in to access your premium catalog' : 'Join us for a tailored shopping experience'}
        </p>

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Account Role</label>
            <select
              className="form-control select-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px', height: '48px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}
