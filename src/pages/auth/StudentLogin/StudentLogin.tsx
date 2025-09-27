import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStudentAuth } from '../../../contexts/StudentAuthContext';
import './StudentLogin.css';

interface FormData {
  identifier: string; // Can be email or student number
  password: string;
  remember: boolean;
}

interface FormErrors {
  identifier?: string;
  password?: string;
}

const StudentLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, isLoading, clearError } = useStudentAuth();

  const [formData, setFormData] = useState<FormData>({
    identifier: '',
    password: '',
    remember: false,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  // Get the intended destination or default to student newsfeed (landing page)
  const from = (location.state as any)?.from?.pathname || '/student/newsfeed';

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear field error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // Clear global error
    if (error) {
      clearError();
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Identifier validation (email or student number)
    if (!formData.identifier.trim()) {
      errors.identifier = 'Email or student number is required';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      console.log('🔐 StudentLogin - Attempting login with:', {
        identifier: formData.identifier,
        userType: 'student',
        redirectTo: from
      });

      await login({
        email: formData.identifier, // Backend handles both email and student number
        password: formData.password,
        userType: 'student',
      });

      console.log('✅ StudentLogin - Login successful, redirecting to:', from);
      // Redirect to intended destination
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by the auth context
      console.error('❌ StudentLogin - Login failed:', error);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Determine if input looks like email or student number
  const isEmail = formData.identifier.includes('@');

  return (
    <div className="student-login">
      <div className="student-login__container">
        {/* Left Panel - Login Form */}
        <div className="student-login__form-section">
          <div className="student-login__form-container">
            {/* Login Form Header */}
            <div className="student-login__form-header">
              <img
                src="/logo/vcba1.png"
                alt="VCBA Logo"
                className="student-login__form-logo"
              />
              <h1 className="student-login__form-title">STUDENT LOGIN</h1>
              <p className="student-login__form-subtitle">Villamor College of Business and Arts, Inc.</p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="student-login__error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="student-login__form" noValidate>
              <div className="student-login__form-group">
                <label htmlFor="identifier" className="student-login__label">Email or Student Number</label>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder="Enter your email or student number"
                  className={`student-login__input ${formErrors.identifier ? 'error' : ''}`}
                  disabled={isLoading}
                  autoComplete="username"
                  required
                />
                {formErrors.identifier && <span className="student-login__error-text">{formErrors.identifier}</span>}
              </div>

              <div className="student-login__form-group">
                <label htmlFor="password" className="student-login__label">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={`student-login__input ${formErrors.password ? 'error' : ''}`}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                {formErrors.password && <span className="student-login__error-text">{formErrors.password}</span>}
              </div>

              <div className="student-login__remember">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  className="student-login__checkbox"
                />
                <label htmlFor="remember" className="student-login__remember-label">Remember me</label>
              </div>

              <button
                type="submit"
                className="student-login__submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel - Information Section */}
        <div className="student-login__info-section">
          <div className="student-login__info-content">

            {/* School Information */}
            <div className="student-login__school-info">
              <img
                src="/logo/ebb1.png"
                alt="E-Bulletin Board Logo"
                className="student-login__school-logo"
              />
              <h3 className="student-login__school-name">
                VCBA E-BULLETIN BOARD
              </h3>
              <p className="student-login__school-description">
                Villamor College of Business and Arts, Inc.
              </p>

              {/* Features */}
              <div className="student-login__features">
                <div className="student-login__feature">
                  <div className="student-login__feature-icon">
                    <img src="/icons/megaphone.png" alt="Categorized Contents" />
                  </div>
                  <div className="student-login__feature-content">
                    <h4>Categorized Contents</h4>
                    <p>Organized announcements by departments, clubs, events, and more</p>
                  </div>
                </div>

                <div className="student-login__feature">
                  <div className="student-login__feature-icon">
                    <img src="/icons/message.png" alt="Centralized Platform" />
                  </div>
                  <div className="student-login__feature-content">
                    <h4>Centralized Platform</h4>
                    <p>All school announcements in one place — accessible anytime, anywhere</p>
                  </div>
                </div>

                <div className="student-login__feature">
                  <div className="student-login__feature-icon">
                    <img src="/icons/heart.png" alt="User-Friendly Environment" />
                  </div>
                  <div className="student-login__feature-content">
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

export default StudentLogin;
