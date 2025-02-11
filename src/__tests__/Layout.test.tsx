import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the auth context
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Layout Component', () => {
  it('renders navigation items', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Applications')).toBeInTheDocument();
    expect(screen.getByText('Resumes')).toBeInTheDocument();
  });

  it('displays the app title', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('JobTracker')).toBeInTheDocument();
  });

  it('has a working sign out button', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </BrowserRouter>
    );

    const signOutButton = screen.getByText('Sign out');
    expect(signOutButton).toBeInTheDocument();
    fireEvent.click(signOutButton);
  });
});