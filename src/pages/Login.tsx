import React, { useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { useAuth } from '../contexts/AuthContext'
import { LanguageSelector } from '../i18n'

const Login: React.FC = () => {
  const intl = useIntl()
  const { login, error, loading, clearError } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    console.log('Login attempt with:', { email: formData.email, password: '***' })

    try {
      await login(formData.email, formData.password)
      console.log('Login successful, redirecting...')
      // Redirect will be handled by auth context
      window.location.href = '/'
    } catch (error) {
      console.error('Login error in component:', error)
      // Error is handled by auth context
    }
  }

  // Function to get localized error message
  const getLocalizedError = (error: string) => {
    if (error.toLowerCase().includes('invalid credentials') || error.toLowerCase().includes('login failed')) {
      return intl.formatMessage({ id: 'auth.loginError', defaultMessage: 'Login failed. Please check your credentials.' })
    }
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('fetch')) {
      return intl.formatMessage({ id: 'auth.networkError', defaultMessage: 'Network error. Please try again.' })
    }
    return error // Return original error if no specific translation found
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Language Selector in top right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white text-xl mx-auto mb-4">
              RDV
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              <FormattedMessage id="auth.signInToAccount" defaultMessage="Sign in to your account" />
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              <FormattedMessage id="auth.noAccount" defaultMessage="Don't have an account?" />{' '}
              <a
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition-colors"
              >
                <FormattedMessage id="auth.signUp" defaultMessage="Sign up" />
              </a>
            </p>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4" role="alert" id="error-message">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-red-800 text-sm">
                    <div>{getLocalizedError(error)}</div>
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-1 text-xs text-red-600">
                        Debug: {error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                <FormattedMessage id="auth.email" defaultMessage="Email address" />
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={intl.formatMessage({ id: 'auth.emailPlaceholder', defaultMessage: 'Enter your email' })}
                aria-describedby={error ? 'error-message' : undefined}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                <FormattedMessage id="auth.password" defaultMessage="Password" />
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={intl.formatMessage({ id: 'auth.passwordPlaceholder', defaultMessage: 'Enter your password' })}
                aria-describedby={error ? 'error-message' : undefined}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <FormattedMessage id="auth.signingIn" defaultMessage="Signing in..." />
              ) : (
                <FormattedMessage id="auth.signIn" defaultMessage="Sign in" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login