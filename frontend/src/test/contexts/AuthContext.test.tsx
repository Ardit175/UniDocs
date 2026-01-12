import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Mock the api service
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '../../services/api';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test component to access auth context
const TestComponent = () => {
  const { user, token, loading, login, logout, isAuthenticated, register } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <button onClick={() => login('test@fti.edu.al', 'password123')}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => register({ email: 'new@fti.edu.al', password: 'pass123', emri: 'Test', mbiemri: 'User', role: 'student' })}>
        Register
      </button>
    </div>
  );
};

// Component that doesn't use provider to test error
const TestWithoutProvider = () => {
  try {
    useAuth();
    return <div>No error thrown</div>;
  } catch (error: any) {
    return <div data-testid="error">{error.message}</div>;
  }
};

describe('AuthContext', () => {
  const mockUser = {
    id: '123',
    email: 'test@fti.edu.al',
    role: 'student' as const,
    emri: 'Test',
    mbiemri: 'User',
  };

  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Default mock implementations
    (api.get as any).mockResolvedValue({
      data: { data: { user: mockUser } },
    });
    
    (api.post as any).mockResolvedValue({
      data: { data: { token: mockToken, user: mockUser } },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      render(<TestWithoutProvider />);
      
      expect(screen.getByTestId('error')).toHaveTextContent(
        'useAuth must be used within an AuthProvider'
      );
    });
  });

  describe('AuthProvider', () => {
    it('should render children', () => {
      render(
        <AuthProvider>
          <div data-testid="child">Child content</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should initialize with no user when no token exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });

    it('should call api.get when token exists in localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(mockToken);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/auth/me');
      });
    });

    it('should clear token when verification fails', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');
      (api.get as any).mockRejectedValue(new Error('Invalid token'));
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  describe('login', () => {
    it('should call api.post with credentials when login is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
          email: 'test@fti.edu.al',
          password: 'password123',
        });
      });
    });

    it('should store token in localStorage after successful login', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
      });
    });

    it('should update authenticated state after login', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });
  });

  describe('register', () => {
    it('should call api.post with registration data', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByText('Register'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/auth/register', {
          email: 'new@fti.edu.al',
          password: 'pass123',
          emri: 'Test',
          mbiemri: 'User',
          role: 'student',
        });
      });
    });

    it('should store token after registration', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByText('Register'));

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
      });
    });

    it('should set authenticated state after registration', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByText('Register'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });
  });

  describe('logout', () => {
    it('should remove token from localStorage', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // First login
      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Then logout
      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      });
    });

    it('should clear authenticated state after logout', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // First login
      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Then logout
      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });
    });

    it('should clear user state after logout', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // First login
      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).not.toHaveTextContent('null');
      });

      // Then logout
      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    });
  });

  describe('isAuthenticated', () => {
    it('should be false when user is not logged in', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });

    it('should be true after successful login', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });
  });

  describe('token handling', () => {
    it('should return null token when not authenticated', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });

    it('should expose token after login', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
      });
    });
  });
});
