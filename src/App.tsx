import React, { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { createBrowserRouter, RouterProvider, Navigate, useNavigate, useParams } from 'react-router-dom';
import { LanguageProvider, LanguageSelector } from './i18n';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isValidClassToken } from './utils/routes';
import { fetchClasses } from './api/client';

// Pages - using dynamic imports to handle module loading issues
const Admin = React.lazy(() => import('./pages/Admin'));
const Home = React.lazy(() => import('./pages/Home'));
const ClassSchedule = React.lazy(() => import('./pages/ClassSchedule'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
    </div>
  );
}

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      console.error('Error caught by boundary:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  if (hasError) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500">
        Something went wrong. Please try refreshing the page.
      </div>
    );
  }

  return <React.Suspense fallback={<LoadingSpinner />}>{children}</React.Suspense>;
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white rounded-md hover:bg-gray-800"
      >
        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
          {user.email.charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:block">{user.email}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-900 border-b">
            <div className="font-medium">{user.email}</div>
            <div className="text-gray-500 text-xs">
              {user.roles.join(', ')}
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <FormattedMessage id="auth.logout" defaultMessage="Logout" />
          </button>
        </div>
      )}
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="border-b border-gray-800 py-4 px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">RD</div>
            <h1 className="text-xl font-semibold">
              <FormattedMessage id="app.title" defaultMessage="rdvapp" />
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {children}
      </div>
    </div>
  );
}

function ProtectedRoute({ children, requiredRoles }: { children: React.ReactNode; requiredRoles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.some(role => user.roles.includes(role))) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              <FormattedMessage id="auth.accessDenied" defaultMessage="Access Denied" />
            </h2>
            <p className="text-gray-400">
              <FormattedMessage id="auth.insufficientPermissions" defaultMessage="You don't have permission to access this page" />
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}

function ProtectedAdmin() {
  const navigate = useNavigate();
  const { token } = useParams();
  const { user } = useAuth();
  const savedToken = localStorage.getItem('rdv-admin-token');

  useEffect(() => {
    // Legacy token-based access OR new role-based access
    const hasLegacyAccess = token && token === savedToken;
    const hasRoleAccess = user && (user.roles.includes('administrator') || user.roles.includes('class_lead'));

    if (!hasLegacyAccess && !hasRoleAccess) {
      navigate('/');
    }
  }, [token, savedToken, user, navigate]);

  return (
    <ProtectedRoute requiredRoles={['administrator', 'class_lead']}>
      <ErrorBoundary>
        <Admin />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}

function ProtectedClassSchedule() {
  const navigate = useNavigate();
  const { classId, token } = useParams();
  const { user } = useAuth();
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    async function validateAccess() {
      if (!classId) {
        navigate('/');
        return;
      }

      try {
        // Check if user has access to this class through authentication
        if (user) {
          // Administrators can access all classes
          if (user.roles.includes('administrator')) {
            setIsValid(true);
            return;
          }

          // Check if user has access to this specific class
          const hasClassAccess = user.classAssignments.some(assignment => assignment.classId === classId);
          if (hasClassAccess) {
            setIsValid(true);
            return;
          }
        }

        // Fallback to legacy token-based access
        if (token && isValidClassToken(token, classId)) {
          const classes = await fetchClasses();
          const classExists = classes.some((c: { id: string }) => c.id === classId);
          
          if (classExists) {
            setIsValid(true);
            return;
          }
        }

        navigate('/');
      } catch (err) {
        console.error('Error validating class access:', err);
        navigate('/');
      }
    }

    validateAccess();
  }, [classId, token, user, navigate]);

  if (!isValid) return null;

  return (
    <Layout>
      <ErrorBoundary>
        <ClassSchedule classId={classId!} />
      </ErrorBoundary>
    </Layout>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <ErrorBoundary>
          <Home />
        </ErrorBoundary>
      </ProtectedRoute>
    )
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <ErrorBoundary>
          <Login />
        </ErrorBoundary>
      </PublicRoute>
    )
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <ErrorBoundary>
          <Register />
        </ErrorBoundary>
      </PublicRoute>
    )
  },
  {
    path: '/admin/:token?',
    element: <ProtectedAdmin />
  },
  {
    path: '/class/:classId/:token?',
    element: <ProtectedClassSchedule />
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </LanguageProvider>
  );
}
