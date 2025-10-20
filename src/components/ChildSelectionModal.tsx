import React, { useState, useEffect } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

interface Child {
  id: string
  name?: string // Legacy field
  firstName: string
  lastName: string
  birthday?: string
  classId: string
  createdAt?: string
  updatedAt?: string
}

interface Class {
  id: string
  name: string
  color: string
  description?: string
}

interface ChildSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  classId: string
  className: string
  selectedChildren: string[]
  onSelectionChange: (selectedChildren: string[], newChildrenData?: {firstName: string, lastName: string}[]) => void
  existingChildren: Child[]
}

const ChildSelectionModal: React.FC<ChildSelectionModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
  selectedChildren,
  onSelectionChange,
  existingChildren
}) => {
  const intl = useIntl()
  const [localSelectedChildren, setLocalSelectedChildren] = useState<string[]>(selectedChildren)
  const [newChildFirstName, setNewChildFirstName] = useState('')
  const [newChildLastName, setNewChildLastName] = useState('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newlyCreatedChildren, setNewlyCreatedChildren] = useState<{firstName: string, lastName: string}[]>([])

  useEffect(() => {
    setLocalSelectedChildren(selectedChildren)
  }, [selectedChildren])

  const handleChildToggle = (childName: string) => {
    const updated = localSelectedChildren.includes(childName)
      ? localSelectedChildren.filter(name => name !== childName)
      : [...localSelectedChildren, childName]
    setLocalSelectedChildren(updated)
  }

  const handleCreateNew = () => {
    if (newChildFirstName.trim() && newChildLastName.trim()) {
      const fullName = `${newChildFirstName.trim()} ${newChildLastName.trim()}`
      const newChildData = {
        firstName: newChildFirstName.trim(),
        lastName: newChildLastName.trim()
      }
      
      // Add to selected children
      const updated = [...localSelectedChildren, fullName]
      setLocalSelectedChildren(updated)
      
      // Track newly created children
      setNewlyCreatedChildren(prev => [...prev, newChildData])
      
      // Clear form
      setNewChildFirstName('')
      setNewChildLastName('')
      setIsCreatingNew(false)
    }
  }

  const handleConfirm = () => {
    // Pass back selected children and all newly created children data
    onSelectionChange(localSelectedChildren, newlyCreatedChildren.length > 0 ? newlyCreatedChildren : undefined)
    onClose()
  }

  const handleCancel = () => {
    setLocalSelectedChildren(selectedChildren)
    setNewChildFirstName('')
    setNewChildLastName('')
    setIsCreatingNew(false)
    setNewlyCreatedChildren([])
    onClose()
  }

  if (!isOpen) return null

  // Filter existing children for this specific class
  const classChildren = existingChildren.filter(child => child.classId === classId)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          onClick={handleCancel}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg leading-6 font-medium text-white mb-2">
                  <FormattedMessage 
                    id="childSelection.title" 
                    defaultMessage="Select Children for {className}"
                    values={{ className }}
                  />
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  <FormattedMessage 
                    id="childSelection.description"
                    defaultMessage="Choose existing children or create new ones for this class"
                  />
                </p>

                {/* Existing Children */}
                {classChildren.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                      <FormattedMessage 
                        id="childSelection.existingChildren"
                        defaultMessage="Existing Children"
                      />
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {classChildren.map((child) => {
                        const displayName = child.firstName && child.lastName ? 
                          `${child.firstName} ${child.lastName}` : 
                          child.name || 'Unnamed Child'
                        
                        return (
                          <div key={child.id} className="flex items-center">
                            <input
                              id={`child-${child.id}`}
                              type="checkbox"
                              checked={localSelectedChildren.includes(displayName)}
                              onChange={() => handleChildToggle(displayName)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700 rounded"
                            />
                            <label htmlFor={`child-${child.id}`} className="ml-3 text-sm text-gray-300 cursor-pointer">
                              {displayName}
                              {child.createdAt && (
                                <span className="ml-2 text-xs text-gray-500">
                                  (Added {new Date(child.createdAt).toLocaleDateString()})
                                </span>
                              )}
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Create New Child */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-300">
                      <FormattedMessage 
                        id="childSelection.createNew"
                        defaultMessage="Create New Child"
                      />
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(!isCreatingNew)}
                      className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                    >
                      {isCreatingNew ? (
                        <FormattedMessage id="common.cancel" defaultMessage="Cancel" />
                      ) : (
                        <FormattedMessage id="childSelection.addNew" defaultMessage="+ Add New" />
                      )}
                    </button>
                  </div>

                  {isCreatingNew && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newChildFirstName}
                          onChange={(e) => setNewChildFirstName(e.target.value)}
                          className="block w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                          placeholder={intl.formatMessage({
                            id: 'childSelection.firstNamePlaceholder',
                            defaultMessage: 'First name'
                          })}
                          autoFocus
                        />
                        <input
                          type="text"
                          value={newChildLastName}
                          onChange={(e) => setNewChildLastName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleCreateNew()
                            }
                          }}
                          className="block w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                          placeholder={intl.formatMessage({
                            id: 'childSelection.lastNamePlaceholder',
                            defaultMessage: 'Last name'
                          })}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateNew}
                        disabled={!newChildFirstName.trim() || !newChildLastName.trim()}
                        className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                      >
                        <FormattedMessage id="childSelection.create" defaultMessage="Create" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Selected Children Preview */}
                {localSelectedChildren.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      <FormattedMessage 
                        id="childSelection.selectedChildren"
                        defaultMessage="Selected Children ({count})"
                        values={{ count: localSelectedChildren.length }}
                      />
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {localSelectedChildren.map((childName) => {
                        const isNewlyCreated = newlyCreatedChildren.some(child => 
                          `${child.firstName} ${child.lastName}` === childName
                        )
                        return (
                          <span
                            key={childName}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isNewlyCreated 
                                ? 'bg-green-600 text-white border border-green-500' 
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {childName}
                            {isNewlyCreated && (
                              <span className="ml-1 text-xs opacity-75">(new)</span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                // Remove from selected children
                                handleChildToggle(childName)
                                // Also remove from newly created if it's a new child
                                if (isNewlyCreated) {
                                  setNewlyCreatedChildren(prev => 
                                    prev.filter(child => `${child.firstName} ${child.lastName}` !== childName)
                                  )
                                }
                              }}
                              className={`ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full ${
                                isNewlyCreated ? 'hover:bg-green-700' : 'hover:bg-blue-700'
                              }`}
                            >
                              <span className="sr-only">Remove</span>
                              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-750 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              <FormattedMessage id="common.confirm" defaultMessage="Confirm" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              <FormattedMessage id="common.cancel" defaultMessage="Cancel" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChildSelectionModal