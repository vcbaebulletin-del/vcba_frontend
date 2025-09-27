import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminAuthService } from '../../../services/admin-auth.service';
import './AdminRegister.css';

interface FormData {
  firstName: string;
  lastName: string;
  middleName: string;
  suffix: string;
  email: string;
  phoneNumber: string;
  department: string;
  position: string;
  gradeLevel: string;
  password: string;
  confirmPassword: string;
}

interface OtpData {
  email: string;
  otp: string;
}

const AdminRegister: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'registration' | 'otp' | 'success'>('registration');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    middleName: '',
    suffix: '',
    email: '',
    phoneNumber: '',
    department: '',
    position: '',
    gradeLevel: '',
    password: '',
    confirmPassword: ''
  });

  const [otpData, setOtpData] = useState<OtpData>({
    email: '',
    otp: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setOtpData(prev => ({
      ...prev,
      otp: cleanValue
    }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.department.trim()) {
      setError('Department is required');
      return false;
    }
    if (!formData.position.trim()) {
      setError('Position is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    // Check for uppercase, lowercase, and number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submit started');
    
    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Calling AdminAuthService with form data:', formData);

      // Transform form data to match AdminRegistrationData interface
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || undefined,
        suffix: formData.suffix || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        department: formData.department || undefined,
        position: formData.position || undefined,
        gradeLevel: formData.gradeLevel && formData.gradeLevel.trim() !== '' ? formData.gradeLevel.trim() : undefined
      };

      console.log('Transformed registration data:', registrationData);
      console.log('Grade level being sent:', registrationData.gradeLevel, 'Type:', typeof registrationData.gradeLevel);

      const response = await AdminAuthService.registerAdmin(registrationData);
      console.log('API Response:', response);

      if (response.success) {
        console.log('SUCCESS - Moving to OTP step');
        setOtpData(prev => ({ ...prev, email: formData.email }));
        setCurrentStep('otp');
        setSuccess('Registration initiated! Please check your email for the OTP.');
      } else {
        console.log('API Error:', response.message);
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Network Error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpData.otp || otpData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Submitting OTP:', otpData);

      const response = await AdminAuthService.verifyOtp(otpData);
      console.log('OTP Response:', response);

      if (response.success) {
        setCurrentStep('success');
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/admin/login');
        }, 3000);
      } else {
        setError(response.message || 'OTP verification failed. Please try again.');
      }
    } catch (err: any) {
      console.error('OTP Error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await AdminAuthService.resendOtp(otpData.email);

      if (response.success) {
        setSuccess('OTP resent successfully! Please check your email.');
      } else {
        setError(response.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('Resend Error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  console.log('CURRENT STEP:', currentStep);
  console.log('OTP EMAIL:', otpData.email);

  return (
    <div className="admin-register">
      <div className="register-container">
        <div className="register-header">
          <img src="/logo/vcba1.png" alt="VCBA Logo" className="logo" />
          <h1>Create Admin Account</h1>
          <p>Fill in the details to register as an administrator</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        {success && (
          <div className="success-message">
            <span>✅ {success}</span>
          </div>
        )}

        {currentStep === 'registration' && (
          <form onSubmit={handleRegistrationSubmit} className="register-form">
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="middleName">Middle Name</label>
                  <input
                    type="text"
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="suffix">Suffix</label>
                  <input
                    type="text"
                    id="suffix"
                    name="suffix"
                    value={formData.suffix}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Contact Information</h3>
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  onInput={(e) => {
                    // Allow only numbers and limit to 11 digits
                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 11);
                  }}
                  placeholder="09XXXXXXXXX"
                  maxLength={11}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Professional Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="department">Department *</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="position">Position *</label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="gradeLevel">Assigned Grade Level</label>
                <select
                  id="gradeLevel"
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">System Admin (All Grades)</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
                <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  Leave empty for system admin access to all grades, or select a specific grade to restrict access.
                </small>
              </div>
            </div>

            <div className="form-section">
              <h3>Security</h3>
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <small className="password-hint">
                  Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.
                </small>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {currentStep === 'otp' && (
          <div className="otp-section">
            <h3>OTP Verification</h3>
            <p>We've sent a 6-digit code to <strong>{otpData.email}</strong></p>

            <form onSubmit={handleOtpSubmit} className="otp-form">
              <div className="form-group">
                <label htmlFor="otp">Enter OTP</label>
                <input
                  type="text"
                  id="otp"
                  value={otpData.otp}
                  onChange={handleOtpChange}
                  placeholder="000000"
                  maxLength={6}
                  className="otp-input"
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <div className="otp-actions">
              <button
                type="button"
                onClick={handleResendOtp}
                className="resend-btn"
                disabled={loading}
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep('registration')}
                className="back-btn"
              >
                Back to Registration
              </button>
            </div>
          </div>
        )}

        {currentStep === 'success' && (
          <div className="success-section">
            <div className="success-icon">✅</div>
            <h3>Account Created Successfully!</h3>
            <p>Your admin account has been created. You will be redirected to the login page shortly.</p>
            <Link to="/admin/login" className="login-link">
              Go to Login
            </Link>
          </div>
        )}

        <div className="register-footer">
          <p>Already have an account? <Link to="/admin/login">Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
