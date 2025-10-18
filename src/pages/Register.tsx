import React, { useState, useEffect } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { useAuth } from '../contexts/AuthContext'
import { authenticatedFetch } from '../contexts/AuthContext'
import { LanguageSelector } from '../i18n'

interface Class {
  id: string
  name: string
  description?: string
  color: string
}

interface ClassAssignment {
  classId: string
  childName: string
}

const Register: React.FC = () => {
  const intl = useIntl()
  const { register, error, loading, clearError } = useAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    roles: [] as string[],
    classAssignments: [] as ClassAssignment[]
  })

  // Load available classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await fetch('/api/classes/public')
        if (response.ok) {
          const classData = await response.json()
          setClasses(classData)
        }
      } catch (error) {
        console.error('Failed to load classes:', error)
      }
    }
    loadClasses()
  }, [])

  const getLocalizedError = (error: string) => {
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('fetch')) {
      return intl.formatMessage({ id: 'auth.networkError', defaultMessage: 'Network error. Please try again.' })
    }
    if (error.toLowerCase().includes('registration') || error.toLowerCase().includes('register')) {
      return intl.formatMessage({ id: 'auth.registerError', defaultMessage: 'Registration failed. Please try again.' })
    }
    return error
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    // Validation
    if (formData.password !== formData.confirmPassword) {
      alert(intl.formatMessage({ id: 'auth.passwordMismatch', defaultMessage: 'Passwords do not match' }))
      return
    }

    if (formData.password.length < 6) {
      alert(intl.formatMessage({ id: 'auth.passwordTooShort', defaultMessage: 'Password must be at least 6 characters' }))
      return
    }

    if (formData.roles.length === 0) {
      alert(intl.formatMessage({ id: 'auth.selectRole', defaultMessage: 'Please select at least one role' }))
      return
    }

    // Validate parent role requires child names
    if (formData.roles.includes('parent')) {
      for (const assignment of formData.classAssignments) {
        if (!assignment.childName.trim()) {
          alert(intl.formatMessage({ id: 'auth.childNameRequired', defaultMessage: 'Child name is required for parent role' }))
          return
        }
      }
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone || undefined,
        roles: formData.roles,
        classAssignments: formData.classAssignments.map(assignment => ({
          classId: assignment.classId,
          childName: assignment.childName || undefined
        }))
      })
      // Redirect will be handled by auth context
      window.location.href = '/'
    } catch (error) {
      // Error is handled by auth context
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, value]
        : prev.roles.filter(role => role !== value)
    }))
  }

  const handleClassSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    setFormData(prev => ({
      ...prev,
      classAssignments: checked
        ? [...prev.classAssignments, { classId: value, childName: '' }]
        : prev.classAssignments.filter(assignment => assignment.classId !== value)
    }))
  }

  const handleChildNameChange = (classId: string, childName: string) => {
    setFormData(prev => ({
      ...prev,
      classAssignments: prev.classAssignments.map(assignment =>
        assignment.classId === classId
          ? { ...assignment, childName }
          : assignment
      )
    }))
  }

  const selectedClassIds = formData.classAssignments.map(a => a.classId)
  const isParentRole = formData.roles.includes('parent')

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Language Selector */}
      <div className="fixed top-4 right-4 z-10">
        <LanguageSelector />
      </div>

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Logo */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-center">
              <FormattedMessage id="home.welcome" defaultMessage="Welcome to RDV Scheduling" />
            </h1>
          </div>

          <div>
            <h2 className="mt-6 text-center text-2xl font-semibold text-gray-300">
              <FormattedMessage id="auth.createAccount" defaultMessage="Create your account" />
            </h2>
            
            <p className="mt-4 text-center text-sm text-gray-400">
              <FormattedMessage id="auth.alreadyHaveAccount" defaultMessage="Already have an account?" />{' '}
              <a
                href="/login"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                <FormattedMessage id="auth.signIn" defaultMessage="Sign in" />
              </a>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div id="error-message" className="bg-red-600 text-white p-4 rounded-md shadow-sm" role="alert" aria-live="polite">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-200" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <div className="text-red-100 text-sm">{getLocalizedError(error)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-white mb-4">
                <FormattedMessage id="auth.basicInfo" defaultMessage="Basic Information" />
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
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
                    className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white placeholder-gray-400"
                    placeholder={intl.formatMessage({ id: 'auth.emailPlaceholder', defaultMessage: 'Enter your email' })}
                    aria-describedby={error ? "error-message" : undefined}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                    <FormattedMessage id="auth.phone" defaultMessage="Phone (optional)" />
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white placeholder-gray-400"
                    placeholder={intl.formatMessage({ id: 'auth.phonePlaceholder', defaultMessage: 'Enter your phone number' })}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    <FormattedMessage id="auth.password" defaultMessage="Password" />
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white placeholder-gray-400"
                    placeholder={intl.formatMessage({ id: 'auth.passwordPlaceholder', defaultMessage: 'Enter your password' })}
                    aria-describedby={error ? "error-message" : undefined}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                    <FormattedMessage id="auth.confirmPassword" defaultMessage="Confirm password" />
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white placeholder-gray-400"
                    placeholder={intl.formatMessage({ id: 'auth.confirmPasswordPlaceholder', defaultMessage: 'Confirm your password' })}
                    aria-describedby={error ? "error-message" : undefined}
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-white mb-4">
                <FormattedMessage id="auth.selectRoles" defaultMessage="Select Your Role(s)" />
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="role-administrator"
                    type="checkbox"
                    value="administrator"
                    checked={formData.roles.includes('administrator')}
                    onChange={handleRoleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700 rounded"
                  />
                  <label htmlFor="role-administrator" className="ml-3">
                    <span className="text-sm font-medium text-gray-300">
                      <FormattedMessage id="auth.roleAdministrator" defaultMessage="Administrator" />
                    </span>
                    <span className="block text-xs text-gray-400">
                      <FormattedMessage id="auth.roleAdministratorDesc" defaultMessage="Full control over the system" />
                    </span>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="role-class-lead"
                    type="checkbox"
                    value="class_lead"
                    checked={formData.roles.includes('class_lead')}
                    onChange={handleRoleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700 rounded"
                  />
                  <label htmlFor="role-class-lead" className="ml-3">
                    <span className="text-sm font-medium text-gray-300">
                      <FormattedMessage id="auth.roleClassLead" defaultMessage="Class Lead" />
                    </span>
                    <span className="block text-xs text-gray-400">
                      <FormattedMessage id="auth.roleClassLeadDesc" defaultMessage="Create RDV and reset scheduling for assigned classes" />
                    </span>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="role-parent"
                    type="checkbox"
                    value="parent"
                    checked={formData.roles.includes('parent')}
                    onChange={handleRoleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700 rounded"
                  />
                  <label htmlFor="role-parent" className="ml-3">
                    <span className="text-sm font-medium text-gray-300">
                      <FormattedMessage id="auth.roleParent" defaultMessage="Parent" />
                    </span>
                    <span className="block text-xs text-gray-400">
                      <FormattedMessage id="auth.roleParentDesc" defaultMessage="Book appointments for your children" />
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Class Selection */}
            {formData.roles.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-white mb-4">
                  <FormattedMessage id="auth.selectClasses" defaultMessage="Select Classes" />
                </h3>
                
                {classes.length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    <FormattedMessage id="auth.noClassesAvailable" defaultMessage="No classes available" />
                  </p>
                ) : (
                  <div className="space-y-4">
                    {classes.map((cls) => (
                      <div key={cls.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                        <div className="flex items-center mb-2">
                          <input
                            id={`class-${cls.id}`}
                            type="checkbox"
                            value={cls.id}
                            checked={selectedClassIds.includes(cls.id)}
                            onChange={handleClassSelection}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-600 rounded"
                          />
                          <label htmlFor={`class-${cls.id}`} className="ml-3 flex items-center">
                            <div
                              className="w-4 h-4 rounded mr-2"
                              style={{ backgroundColor: cls.color }}
                            ></div>
                            <span className="text-sm font-medium text-gray-300">{cls.name}</span>
                            {cls.description && (
                              <span className="ml-2 text-xs text-gray-400">({cls.description})</span>
                            )}
                          </label>
                        </div>
                        
                        {/* Child name input for parents */}
                        {selectedClassIds.includes(cls.id) && isParentRole && (
                          <div className="mt-2 ml-7">
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              <FormattedMessage 
                                id="auth.childNameForClass" 
                                defaultMessage="Child's name for {className}:"
                                values={{ className: cls.name }}
                              />
                            </label>
                            <input
                              type="text"
                              value={formData.classAssignments.find(a => a.classId === cls.id)?.childName || ''}
                              onChange={(e) => handleChildNameChange(cls.id, e.target.value)}
                              className="block w-full px-3 py-2 text-sm bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                              placeholder={intl.formatMessage({ 
                                id: 'auth.enterChildName', 
                                defaultMessage: 'Enter child\'s name' 
                              })}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <FormattedMessage id="auth.creatingAccount" defaultMessage="Creating account..." />
                ) : (
                  <FormattedMessage id="auth.createAccount" defaultMessage="Create account" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register