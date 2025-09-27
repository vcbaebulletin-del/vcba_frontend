import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { VALIDATION_RULES } from '../../../config/constants';
import './AdminLogin.css';

interface FormData {
  email: string;
  password: string;
  remember: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, isLoading, clearError, user } = useAdminAuth();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    remember: false,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loginSuccessful, setLoginSuccessful] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle redirect after successful login when user data is available
  useEffect(() => {
    if (loginSuccessful && user) {
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        console.log('🔍 AdminLogin - User data available after login:', user);
        console.log('🔍 AdminLogin - User position:', user.position);

        if (user.position === 'super_admin') {
          console.log('✅ AdminLogin - Redirecting super_admin to announcement-approval');
          navigate('/admin/announcement-approval', { replace: true });
        } else if (user.position === 'professor') {
          console.log('✅ AdminLogin - Redirecting professor to posts');
          navigate('/admin/posts', { replace: true });
        } else {
          console.log('⚠️ AdminLogin - Unknown position, defaulting to posts. Position:', user.position);
          navigate('/admin/posts', { replace: true });
        }
      }
      setLoginSuccessful(false); // Reset the flag
    }
  }, [loginSuccessful, user, navigate, location.state]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!VALIDATION_RULES.EMAIL.PATTERN.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }

    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login({
        email: formData.email,
        password: formData.password,
        userType: 'admin',
      });

      // Set flag to trigger redirect in useEffect
      setLoginSuccessful(true);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForceLogout = () => {
    console.log('🚪 AdminLogin - Force logout clicked');
    // Clear all possible authentication data
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies by setting them to expire
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Reload the page to ensure clean state
    window.location.reload();
  };

  return (
    <div className="admin-login">
      <div className="admin-login__container">
        {/* Left Panel - Login Form */}
        <div className="admin-login__form-section">
          <div className="admin-login__form-container">
            {/* Login Form Header */}
            <div className="admin-login__form-header">
              <img
                src="/logo/vcba1.png"
                alt="VCBA Logo"
                className="admin-login__form-logo"
              />
              <h1 className="admin-login__form-title">Villamor College of Business and Arts, Inc.</h1>
              <p className="admin-login__form-subtitle">Administrator Portal</p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="admin-login__error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="admin-login__form" noValidate>
              <div className="admin-login__form-group">
                <label htmlFor="email" className="admin-login__label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className={`admin-login__input ${formErrors.email ? 'error' : ''}`}
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
                {formErrors.email && <span className="admin-login__error-text">{formErrors.email}</span>}
              </div>

              <div className="admin-login__form-group">
                <label htmlFor="password" className="admin-login__label">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={`admin-login__input ${formErrors.password ? 'error' : ''}`}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                {formErrors.password && <span className="admin-login__error-text">{formErrors.password}</span>}
              </div>

              {/* <div className="admin-login__remember">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                checked={formData.remember}
                onChange={handleInputChange}
                className="admin-login__checkbox"
              />
                <label htmlFor="remember" className="admin-login__remember-label">Remember me</label>
              </div> */}

              <button
                type="submit"
                className="admin-login__submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Sign Up Link */}
            {/* <div className="admin-login__signup-link">
              Don't have an account? <Link to="/admin/register">Sign Up</Link>
            </div> */}

            {/* Force Logout Button */}
            {/* <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleForceLogout}
                style={{
                  background: 'none',
                  border: '1px solid #dc2626',
                  color: '#dc2626',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#dc2626';
                }}
              >
                🚪 Clear All Data & Logout
              </button>
            </div> */}
          </div>
        </div>

        {/* Right Panel - Information Section */}
        <div className="admin-login__info-section">
          <div className="admin-login__info-content">

            {/* School Information */}
            <div className="admin-login__school-info">
              <img
                src="/logo/ebb1.png"
                alt="E-Bulletin Board Logo"
                className="admin-login__school-logo"
              />
              <h3 className="admin-login__school-name">
                VCBA E-BULLETIN BOARD
              </h3>
              <p className="admin-login__school-description">
                Villamor College of Business and Arts, Inc.
              </p>

              {/* Features */}
              <div className="admin-login__features">
                <div className="admin-login__feature">
                  <div className="admin-login__feature-icon">
                    <img src="/icons/megaphone.png" alt="Categorized Contents" />
                  </div>
                  <div className="admin-login__feature-content">
                    <h4>Categorized Contents</h4>
                    <p>Organized announcements by departments, clubs, events, and more</p>
                  </div>
                </div>

                <div className="admin-login__feature">
                  <div className="admin-login__feature-icon">
                    <img src="/icons/message.png" alt="Centralized Platform" />
                  </div>
                  <div className="admin-login__feature-content">
                    <h4>Centralized Platform</h4>
                    <p>All school announcements in one place — accessible anytime, anywhere</p>
                  </div>
                </div>

                <div className="admin-login__feature">
                  <div className="admin-login__feature-icon">
                    <img src="/icons/heart.png" alt="User-Friendly Environment" />
                  </div>
                  <div className="admin-login__feature-content">
                    <h4>User-Friendly Environment</h4>
                    <p>Simple design with smooth navigation and accessibility support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminLogin;
