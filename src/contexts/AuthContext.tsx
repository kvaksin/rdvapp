import React, { createContext, useContext, useState, useEffect } from 'react'

// Types
export interface User {
  id: string
  email: string
  phone?: string
  createdAt: string
  isActive: boolean
  name?: string
  roles: string[]
  classAssignments: Array<{
    id: string
    classId: string
    childName?: string
    createdAt: string
  }>
}

export interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  clearError: () => void
  hasRole: (role: string) => boolean
  hasAccessToClass: (classId: string) => boolean
  getUserAccessibleClasses: () => string[] | 'all'
}

export interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  phone?: string
  roles: string[]
  classAssignments: Array<{
    classId: string
    childName?: string
  }>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token')
        const storedUser = localStorage.getItem('auth_user')

        if (storedToken && storedUser) {
          setToken(storedToken)
          
          // Verify token is still valid by fetching profile
          try {
            console.log('Verifying token with profile request...')
            const response = await fetch('/auth/profile', {
              headers: {
                'Authorization': `Bearer ${storedToken}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            })

            console.log('Profile response status:', response.status)
            console.log('Profile response headers:', Object.fromEntries(response.headers.entries()))

            if (response.ok) {
              const responseText = await response.text()
              console.log('Profile response text (first 200 chars):', responseText.substring(0, 200))
              if (responseText) {
                try {
                  const { user: currentUser } = JSON.parse(responseText)
                  setUser(currentUser)
                  console.log('Profile verification successful:', currentUser)
                } catch (parseError) {
                  console.error('Failed to parse profile response:', parseError)
                  console.error('Response was:', responseText.substring(0, 500))
                  throw new Error('Invalid profile response')
                }
              } else {
                throw new Error('Empty profile response')
              }
            } else {
              // Token invalid, clear storage
              console.log('Token validation failed, clearing storage')
              localStorage.removeItem('auth_token')
              localStorage.removeItem('auth_user')
              setToken(null)
              setUser(null)
            }
          } catch (error) {
            console.error('Error verifying token:', error)
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            setToken(null)
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Login failed'
        try {
          const errorData = await response.text()
          if (errorData) {
            try {
              const jsonError = JSON.parse(errorData)
              errorMessage = jsonError.error || errorMessage
            } catch {
              errorMessage = errorData || errorMessage
            }
          }
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      // Check if response has content
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned invalid response format')
      }

      const responseText = await response.text()
      if (!responseText) {
        throw new Error('Server returned empty response')
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (error) {
        console.error('Failed to parse JSON response:', responseText)
        throw new Error('Server returned invalid JSON')
      }

      if (!data.user || !data.token) {
        throw new Error('Invalid response format: missing user or token')
      }

      // Set user and token state
      setUser(data.user)
      setToken(data.token)
      
      // Store in localStorage for persistence
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))

      console.log('Login successful:', data.user)

    } catch (error) {
      console.error('Login error:', error)
      setError(error instanceof Error ? error.message : 'Login failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Register function
  const register = async (userData: RegisterData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setUser(data.user)
      setToken(data.token)
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    
    // Call backend logout endpoint
    fetch('/auth/logout', {
      method: 'POST'
    }).catch(console.error)
  }

  // Clear error function
  const clearError = () => {
    setError(null)
  }

  // Role checking functions
  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) || false
  }

  const hasAccessToClass = (classId: string): boolean => {
    if (!user) return false
    
    // Administrators have access to all classes
    if (hasRole('administrator')) return true
    
    // Check if user has direct access to this class
    return user.classAssignments.some(assignment => assignment.classId === classId)
  }

  const getUserAccessibleClasses = (): string[] | 'all' => {
    if (!user) return []
    
    // Administrators can access all classes
    if (hasRole('administrator')) return 'all'
    
    // Return specific class IDs the user has access to
    return user.classAssignments.map(assignment => assignment.classId)
  }

  const value: AuthContextType = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    hasRole,
    hasAccessToClass,
    getUserAccessibleClasses
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Higher-order component for route protection
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: string[]
) => {
  return (props: P) => {
    const { user, loading } = useAuth()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }

    if (!user) {
      // Redirect to login
      window.location.href = '/login'
      return null
    }

    if (requiredRoles && !requiredRoles.some(role => user.roles.includes(role))) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}

// API request helper with auth
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token')
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })

  if (response.status === 401) {
    // Token expired or invalid, logout user
    console.log('Authentication failed, clearing session')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.location.href = '/login'
  }

  return response
}