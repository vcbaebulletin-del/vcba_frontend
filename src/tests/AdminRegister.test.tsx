import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import AdminRegister from '../pages/auth/AdminRegister/AdminRegister';

// Mock the hooks
jest.mock('../hooks/useRetry', () => ({
  useRetry: () => ({
    retry: jest.fn((fn) => fn()),
    isRetrying: false,
    attempts: 0,
  }),
}));

jest.mock('../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: true,
    isSlowConnection: false,
  }),
}));

// Note: useAdminRegistration hook has been removed - registration logic is now in AdminRegister component
// No mocking needed for the new implementation

// Mock the auth service
jest.mock('../services/auth.service', () => ({
  AuthService: {
    registerAdmin: jest.fn(),
    verifyOtp: jest.fn(),
    resendOtp: jest.fn(),
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AdminRegister Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration form initially', () => {
    renderWithProviders(<AdminRegister />);
    
    expect(screen.getByText('Create Admin Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    renderWithProviders(<AdminRegister />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    renderWithProviders(<AdminRegister />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  test('validates password strength', async () => {
    renderWithProviders(<AdminRegister />);
    
    const passwordInput = screen.getByLabelText(/^password/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  test('validates password confirmation', async () => {
    renderWithProviders(<AdminRegister />);
    
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  test('shows offline warning when network is down', () => {
    // Mock offline status
    jest.doMock('../hooks/useNetworkStatus', () => ({
      useNetworkStatus: () => ({
        isOnline: false,
        isSlowConnection: false,
      }),
    }));

    renderWithProviders(<AdminRegister />);
    
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
  });

  test('shows slow connection warning', () => {
    // Mock slow connection
    jest.doMock('../hooks/useNetworkStatus', () => ({
      useNetworkStatus: () => ({
        isOnline: true,
        isSlowConnection: true,
      }),
    }));

    renderWithProviders(<AdminRegister />);
    
    expect(screen.getByText(/slow connection detected/i)).toBeInTheDocument();
  });
});
