import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { fetchSlots, bookSlot } from '../api/client'
import type { Slot } from '../types/api'

export default function BookRdv() {
  const intl = useIntl()
  const [slots, setSlots] = useState<Slot[]>([])
  const [childName, setChildName] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const s = await fetchSlots(undefined, undefined)
    setSlots(s)
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
        <div className="flex items-center gap-2">
          <input value={childName} onChange={e=>setChildName(e.target.value)} placeholder={intl.formatMessage({ id: 'schedule.childName' })} className="bg-gray-700 px-2 py-1 rounded-md" />
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
