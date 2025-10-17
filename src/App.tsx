import React, { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { createBrowserRouter, RouterProvider, Navigate, useNavigate, useParams } from 'react-router-dom';
import { LanguageProvider, LanguageSelector } from './i18n';
import { isValidClassToken } from './utils/routes';
import { fetchClasses } from './api/client';

// Pages - using dynamic imports to handle module loading issues
const Admin = React.lazy(() => import('./pages/Admin'));
const Home = React.lazy(() => import('./pages/Home'));
const ClassSchedule = React.lazy(() => import('./pages/ClassSchedule'));

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
          <LanguageSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {children}
      </div>
    </div>
  );
}

function ProtectedAdmin() {
  const navigate = useNavigate();
  const { token } = useParams();
  const savedToken = localStorage.getItem('rdv-admin-token');

  useEffect(() => {
    if (!token || token !== savedToken) {
      navigate('/');
    }
  }, [token, savedToken, navigate]);

  if (!token || token !== savedToken) return null;

  return (
    <Layout>
      <ErrorBoundary>
        <Admin />
      </ErrorBoundary>
    </Layout>
  );
}

function ProtectedClassSchedule() {
  const navigate = useNavigate();
  const { classId, token } = useParams();
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    async function validateAccess() {
      if (!classId || !token) {
        navigate('/');
        return;
      }

      try {
        if (!isValidClassToken(token, classId)) {
          navigate('/');
          return;
        }

        const classes = await fetchClasses();
        const classExists = classes.some((c: { id: string }) => c.id === classId);
        
        if (!classExists) {
          navigate('/');
          return;
        }

        setIsValid(true);
      } catch (err) {
        console.error('Error validating class access:', err);
        navigate('/');
      }
    }

    validateAccess();
  }, [classId, token, navigate]);

  if (!isValid) return null;

  return (
    <Layout>
      <ErrorBoundary>
        <ClassSchedule classId={classId!} />
      </ErrorBoundary>
    </Layout>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><ErrorBoundary><Home /></ErrorBoundary></Layout>
  },
  {
    path: '/admin/:token',
    element: <ProtectedAdmin />
  },
  {
    path: '/class/:classId/:token',
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
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}
