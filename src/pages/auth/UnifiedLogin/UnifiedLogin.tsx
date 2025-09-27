import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { useStudentAuth } from '../../../contexts/StudentAuthContext';
import { VALIDATION_RULES } from '../../../config/constants';
import { Eye, EyeOff } from 'lucide-react';
import LazyImage from '../../../components/common/LazyImage';
import './UnifiedLogin.css';

interface CarouselImage {
  id: number;
  image: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  created_by_name: string;
}

interface FormData {
  identifier: string; // Email for admin, email for student
  password: string;
  remember: boolean;
}

interface FormErrors {
  identifier?: string;
  password?: string;
  general?: string;
}

const UnifiedLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const adminAuth = useAdminAuth();
  const studentAuth = useStudentAuth();

  const [formData, setFormData] = useState<FormData>({
    identifier: '',
    password: '',
    remember: false,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccessful, setLoginSuccessful] = useState(false);
  const [detectedUserType, setDetectedUserType] = useState<'admin' | 'student' | null>(null);

  // Carousel state
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselLoading, setCarouselLoading] = useState(true);

  // Get the current auth context based on detected user type (fallback to student for initial state)
  const currentAuth = detectedUserType === 'admin' ? adminAuth : studentAuth;
  const { error, isLoading, clearError, user } = currentAuth;

  // Determine redirect destination based on detected user type and location state
  const getRedirectDestination = () => {
    const from = (location.state as any)?.from?.pathname;

    if (detectedUserType === 'admin') {
      if (from && from.startsWith('/admin')) {
        return from;
      }
      // Default admin redirect based on user position
      if (user?.position === 'super_admin') {
        return '/admin/announcement-approval';
      } else if (user?.position === 'professor') {
        return '/admin/posts';
      } else {
        return '/admin/posts';
      }
    } else {
      if (from && from.startsWith('/student')) {
        return from;
      }
      return '/student/newsfeed';
    }
  };

  // Load carousel images
  const loadCarouselImages = async () => {
    try {
      setCarouselLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/welcome-page/carousel`);
      const data = await response.json();

      if (data.success && data.data.images.length > 0) {
        setCarouselImages(data.data.images);
      } else {
        // Fallback to default images if no carousel images are available
        console.warn('No carousel images available, using fallback');
      }
    } catch (err) {
      console.error('Error loading carousel images:', err);
    } finally {
      setCarouselLoading(false);
    }
  };

  // Handle successful login redirect
  useEffect(() => {
    if (loginSuccessful && user) {
      const destination = getRedirectDestination();
      console.log(`✅ UnifiedLogin - Login successful, redirecting to: ${destination}`);
      navigate(destination, { replace: true });
    }
  }, [loginSuccessful, user, navigate]);

  // Load carousel images on component mount
  useEffect(() => {
    loadCarouselImages();
  }, []);

  // Auto-rotate carousel images
  useEffect(() => {
    if (carouselImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) =>
          (prevIndex + 1) % carouselImages.length
        );
      }, 4000); // Change image every 4 seconds

      return () => clearInterval(interval);
    }
  }, [carouselImages.length]);

  // Clear errors when user starts typing
  useEffect(() => {
    if (error) {
      clearError();
    }
    setFormErrors({});
  }, [formData.identifier, formData.password]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.identifier.trim()) {
      errors.identifier = 'Email is required';
    } else {
      // Validate email format if it looks like an email
      const isEmail = formData.identifier.includes('@');
      if (isEmail && !VALIDATION_RULES.EMAIL.PATTERN.test(formData.identifier)) {
        errors.identifier = 'Please enter a valid email address';
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      console.log('🔐 UnifiedLogin - Attempting automatic login detection for:', {
        identifier: formData.identifier,
      });

      // Try admin login first
      try {
        await adminAuth.login({
          email: formData.identifier,
          password: formData.password,
          userType: 'admin',
        });

        console.log('✅ UnifiedLogin - Admin login successful');
        setDetectedUserType('admin');
        setLoginSuccessful(true);
        return;
      } catch (adminError) {
        console.log('🔄 UnifiedLogin - Admin login failed, trying student login...');
      }

      // If admin login fails, try student login
      try {
        await studentAuth.login({
          email: formData.identifier,
          password: formData.password,
          userType: 'student',
        });

        console.log('✅ UnifiedLogin - Student login successful');
        setDetectedUserType('student');
        setLoginSuccessful(true);
        return;
      } catch (studentError) {
        console.log('❌ UnifiedLogin - Student login also failed');
        throw studentError; // Throw the student error as the final error
      }

    } catch (err) {
      console.error('❌ UnifiedLogin - All login attempts failed:', err);
      // Error is handled by the auth context
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Determine if input looks like email
  const isEmail = formData.identifier.includes('@');
  const inputPlaceholder = 'Enter your email address';

  return (
    <div className="unified-login">
      <div className="unified-login__container">
        {/* Left Panel - Login Form */}
        <div className="unified-login__form-section">
          <div className="unified-login__form-container">
            {/* Login Form Header */}
            <div className="unified-login__form-header">
              <img
                src="/logo/vcba1.png"
                alt="VCBA Logo"
                className="unified-login__form-logo"
              />
              <h1 className="unified-login__form-title">Villamor College of Business and Arts, Inc.</h1>
              
              {/* I will comment this for now */}
              {/* <p className="unified-login__form-subtitle">
                {formData.userType === 'admin' ? 'Administrator Portal' : 'Student Portal'}
              </p> */}
            </div>

            {/* Mobile Carousel - Only shown on mobile above user type selector */}
            <div className="unified-login__mobile-carousel">
              {carouselLoading ? (
                <div className="unified-login__carousel-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading images...</p>
                </div>
              ) : carouselImages.length > 0 ? (
                <div className="unified-login__carousel">
                  <div className="unified-login__carousel-images">
                    {carouselImages.map((image, index) => (
                      <div
                        key={image.id}
                        className={`unified-login__carousel-image ${
                          index === currentImageIndex ? 'active' : ''
                        }`}
                      >
                        <LazyImage
                          src={image.image}
                          alt={`VCBA Advertisement ${index + 1}`}
                          width={180}
                          height={180}
                          quality={85}
                          format="webp"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* User Type Selection - Removed for automatic detection */}

            {/* Error Display */}
            {error && (
              <div className="unified-login__error-banner">
                <span className="unified-login__error-text">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="unified-login__form" noValidate>
              <div className="unified-login__form-group">
                <label htmlFor="identifier" className="unified-login__label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder={inputPlaceholder}
                  className={`unified-login__input ${formErrors.identifier ? 'error' : ''}`}
                  disabled={isLoading}
                  autoComplete="username"
                  required
                />
                {formErrors.identifier && (
                  <span className="unified-login__error-text">{formErrors.identifier}</span>
                )}
              </div>

              <div className="unified-login__form-group">
                <label htmlFor="password" className="unified-login__label">Password</label>
                <div className="unified-login__password-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className={`unified-login__input ${formErrors.password ? 'error' : ''}`}
                    disabled={isLoading}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="unified-login__password-toggle"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {formErrors.password && (
                  <span className="unified-login__error-text">{formErrors.password}</span>
                )}
              </div>

                {/* I will not using the remember me */}
              {/* <div className="unified-login__remember">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  className="unified-login__checkbox"
                />
                <label htmlFor="remember" className="unified-login__remember-label">Remember me</label>
              </div> */}

              <button
                type="submit"
                className="unified-login__submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

           {/* I will not use this registration form for admin because its so risky */}
            {/* Admin Register Link - only show for admin type */}
            {/* {formData.userType === 'admin' && (
              <div className="unified-login__signup-link">
                Need an admin account? <Link to="/admin/register">Register here</Link>
              </div>
            )} */}
          </div>
        </div>

        {/* Right Panel - Image Carousel */}
        <div className="unified-login__info-section">
          <div className="unified-login__carousel-container">
            {carouselLoading ? (
              <div className="unified-login__carousel-loading">
                <div className="loading-spinner"></div>
                <p>Loading images...</p>
              </div>
            ) : carouselImages.length > 0 ? (
              <div className="unified-login__carousel">
                <div className="unified-login__carousel-images">
                  {carouselImages.map((image, index) => (
                    <div
                      key={image.id}
                      className={`unified-login__carousel-image ${
                        index === currentImageIndex ? 'active' : ''
                      }`}
                    >
                      <LazyImage
                        src={image.image}
                        alt={`VCBA Advertisement ${index + 1}`}
                        width={600}
                        height={600}
                        quality={85}
                        format="webp"
                      />
                    </div>
                  ))}
                </div>

                {/* Carousel indicators */}
                <div className="unified-login__carousel-indicators">
                  {carouselImages.map((_, index) => (
                    <button
                      key={index}
                      className={`unified-login__carousel-indicator ${
                        index === currentImageIndex ? 'active' : ''
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="unified-login__carousel-fallback">
                <div className="unified-login__info-content">
                  <p className="unified-login__info-description">
                    Welcome to Villamor College of Business and Arts, Inc. Access your personalized dashboard with announcements, events, and important updates.
                  </p>
                  <div className="unified-login__info-features">
                    <div className="unified-login__info-feature">
                      <span className="unified-login__info-feature-icon">📢</span>
                      <span>Announcements</span>
                    </div>
                    <div className="unified-login__info-feature">
                      <span className="unified-login__info-feature-icon">📅</span>
                      <span>Event Calendar</span>
                    </div>
                    <div className="unified-login__info-feature">
                      <span className="unified-login__info-feature-icon">🎓</span>
                      <span>Campus Updates</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default UnifiedLogin;