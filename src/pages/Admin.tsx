import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { fetchConfig, updateConfig, fetchSlots, createTimeframe, deleteSlot, resetAll } from '../api/client'
import type { Slot } from '../types/api'

export default function Admin() {
  const [config, setConfig] = useState<{rdvDurationMinutes:number}>({ rdvDurationMinutes: 15 })
  const [from, setFrom] = useState<Date | null>(null)
  const [to, setTo] = useState<Date | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])

  useEffect(()=>{ load() }, [])

  async function load() {
    const c = await fetchConfig()
    setConfig(c)
    const s = await fetchSlots()
    setSlots(s)
  }

  async function saveDuration(mins:number) {
    await updateConfig({ rdvDurationMinutes: mins })
    load()
  }

  async function addTimeframe() {
    if (!from || !to) return alert('choose times')
    await createTimeframe(from.toISOString(), to.toISOString())
    load()
  }

  async function removeSlot(id:string) {
    await deleteSlot(id)
    load()
  }

  async function doReset() {
    if (!confirm('Reset schedule and delete ALL slots and bookings?')) return
    await resetAll(true)
    load()
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Admin</h2>

      <div className="bg-gray-800 p-4 rounded-md mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm">Duration:</label>
          {[10,15,20,30].map(d => (
            <button key={d} onClick={()=>saveDuration(d)} className={`px-3 py-1 rounded-md ${config.rdvDurationMinutes===d ? 'bg-purple-600' : 'bg-gray-700'}`}>{d}m</button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-md mb-4">
        <h3 className="font-semibold">Add available timeframe</h3>
        <div className="flex gap-2 items-center mt-2">
          <DatePicker selected={from} onChange={(d:Date)=>setFrom(d)} showTimeSelect dateFormat="Pp" placeholderText="Start" className="bg-gray-700 px-2 py-1 rounded-md" />
          <DatePicker selected={to} onChange={(d:Date)=>setTo(d)} showTimeSelect dateFormat="Pp" placeholderText="End" className="bg-gray-700 px-2 py-1 rounded-md" />
          <button onClick={addTimeframe} className="bg-green-600 px-3 py-1 rounded-md">Create Slots</button>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-md">
        <h3 className="font-semibold">Available slots</h3>
        <div className="mt-2 space-y-2">
          {slots.filter(s=>!s.removed).map(s => (
            <div key={s.id} className="flex items-center justify-between bg-gray-900 p-2 rounded-md">
              <div>{new Date(s.start).toLocaleString()}</div>
              <div className="flex gap-2">
                <button onClick={()=>removeSlot(s.id)} className="bg-red-600 px-2 py-1 rounded-md">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <button onClick={doReset} className="bg-red-700 px-4 py-2 rounded-md">Reset schedule (delete all)</button>
      </div>
    </div>
  )
}
