import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { fetchSlots, bookSlot } from '../api/client'
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
  const [childName, setChildName] = useState('')
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
      const response = await authenticatedFetch('/api/auth/children')
      if (response.ok) {
        const children = await response.json()
        // Filter children for current parent
        const myChildren = children.filter((child: Child) => child.parentId === user.id)
        setUserChildren(myChildren)
        
        // Auto-select first child if available
        if (myChildren.length > 0 && !childName) {
          setChildName(myChildren[0].name)
        }
      }
    } catch (error) {
      console.error('Failed to load children:', error)
    }
  }

  async function handleBook(slotId: string) {
    if (!childName) return alert(intl.formatMessage({ id: 'bookRdv.enterChildName' }))
    await bookSlot(slotId, childName)
    setChildName('')
    load()
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
                    onClick={() => setChildName(child.name)}
                    className={`px-2 py-1 text-xs rounded border ${
                      childName === child.name
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
          
          {/* Text input for manual entry or new child */}
          <input 
            value={childName} 
            onChange={e=>setChildName(e.target.value)} 
            placeholder={intl.formatMessage({ id: 'schedule.childName' })} 
            className="bg-gray-700 px-3 py-2 rounded-md w-full border border-gray-600 focus:border-blue-500 focus:outline-none" 
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {slots.filter(s=>!s.booked && !s.removed).map(slot => (
            <div key={slot.id} className="bg-gray-800 p-3 rounded-md">
              <div>{new Date(slot.start).toLocaleString()}</div>
              <div className="mt-2 flex gap-2">
                <button onClick={()=>handleBook(slot.id)} className="bg-green-600 px-2 py-1 rounded-md">{intl.formatMessage({ id: 'schedule.book' })}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
