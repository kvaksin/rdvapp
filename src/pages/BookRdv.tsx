import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { fetchSlots } from '../api/client'
import { useAuth, authenticatedFetch } from '../contexts/AuthContext'
import type { Slot } from '../types/api'

interface Child {
  id: string
  name: string
  parentId: string
  classId: string
  createdAt: string
}

export default function BookRdv() {
  const intl = useIntl()
  const { user } = useAuth()
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [userChildren, setUserChildren] = useState<Child[]>([])

  useEffect(() => { 
    load()
    if (user) {
      loadUserChildren()
    }
  }, [user])

  async function load() {
    const s = await fetchSlots(undefined, undefined)
    setSlots(s)
  }

  async function loadUserChildren() {
    if (!user) return
    
    try {
      const baseUrl = window.location.origin
      const response = await authenticatedFetch(`${baseUrl}/api/children`)
      if (response.ok) {
        const children = await response.json()
        setUserChildren(children)
        
        // Auto-select first child if available
        if (children.length > 0 && !selectedChild) {
          setSelectedChild(children[0])
        }
      }
    } catch (error) {
      console.error('Failed to load children:', error)
    }
  }

  async function handleBook(slotId: string) {
    if (!selectedChild) {
      alert(intl.formatMessage({ 
        id: 'bookRdv.selectChild', 
        defaultMessage: 'Please select a child' 
      }))
      return
    }

    try {
      const baseUrl = window.location.origin
      const response = await authenticatedFetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slotId, 
          childName: selectedChild.name,
          childId: selectedChild.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to book slot')
      }

      alert(intl.formatMessage({ 
        id: 'bookRdv.bookingSuccess', 
        defaultMessage: 'Booking successful!' 
      }))
      load()
    } catch (error: any) {
      console.error('Booking failed:', error)
      alert(intl.formatMessage({ 
        id: 'bookRdv.bookingError', 
        defaultMessage: 'Booking failed: {error}' 
      }, { error: error.message }))
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{intl.formatMessage({ id: 'bookRdv.title' })}</h2>


      <div className="space-y-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            {intl.formatMessage({ id: 'schedule.childName' })}
          </label>
          
          {/* Show existing children as buttons */}
          {userChildren.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-400 mb-1">
                {intl.formatMessage({ id: 'bookRdv.yourChildren', defaultMessage: 'Your children:' })}
              </p>
              <div className="flex flex-wrap gap-1">
                {userChildren.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelectedChild(child)}
                    className={`px-2 py-1 text-xs rounded border ${
                      selectedChild?.id === child.id
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Selected child display */}
          {selectedChild && (
            <div className="text-sm text-gray-300">
              Selected: <span className="font-medium text-white">{selectedChild.name}</span>
            </div>
          )}
          
          {/* No children message */}
          {userChildren.length === 0 && (
            <div className="text-sm text-yellow-400">
              {intl.formatMessage({ 
                id: 'bookRdv.noChildren', 
                defaultMessage: 'No children found. Please add children in Children Management first.' 
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {slots.filter(s=>!s.booked && !s.removed).map(slot => (
            <div key={slot.id} className="bg-gray-800 p-3 rounded-md">
              <div>{new Date(slot.start).toLocaleString()}</div>
              <div className="mt-2 flex gap-2">
                <button 
                  onClick={()=>handleBook(slot.id)} 
                  disabled={!selectedChild}
                  className={`px-2 py-1 rounded-md ${
                    selectedChild 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  {intl.formatMessage({ id: 'schedule.book' })}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
