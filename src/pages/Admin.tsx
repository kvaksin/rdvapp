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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(()=>{ load() }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const c = await fetchConfig()
      setConfig(c)
      const s = await fetchSlots()
      setSlots(s)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function saveDuration(mins:number) {
    try {
      setLoading(true)
      setError(null)
      await updateConfig({ rdvDurationMinutes: mins })
      await load()
    } catch (err) {
      console.error('Error saving duration:', err)
      setError('Failed to update duration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function addTimeframe() {
    if (!from || !to) {
      setError('Please select both start and end times')
      return
    }
    try {
      setLoading(true)
      setError(null)
      await createTimeframe(from.toISOString(), to.toISOString())
      await load()
      setFrom(null)
      setTo(null)
    } catch (err) {
      console.error('Error creating timeframe:', err)
      setError('Failed to create slots. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function removeSlot(id:string) {
    try {
      setLoading(true)
      setError(null)
      await deleteSlot(id)
      await load()
    } catch (err) {
      console.error('Error removing slot:', err)
      setError('Failed to remove slot. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function doReset() {
    if (!confirm('Reset schedule and delete ALL slots and bookings?')) return
    try {
      setLoading(true)
      setError(null)
      await resetAll(true)
      await load()
    } catch (err) {
      console.error('Error resetting schedule:', err)
      setError('Failed to reset schedule. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Admin</h2>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="bg-gray-800 p-4 rounded-md mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm">Duration:</label>
          {[10,15,20,30].map(d => (
            <button 
              key={d} 
              onClick={()=>saveDuration(d)} 
              disabled={loading}
              className={`px-3 py-1 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${config.rdvDurationMinutes===d ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-md mb-4">
        <h3 className="font-semibold">Add available timeframe</h3>
        <div className="flex gap-2 items-center mt-2">
          <DatePicker 
            selected={from} 
            onChange={(d:Date)=>setFrom(d)} 
            showTimeSelect 
            dateFormat="Pp" 
            placeholderText="Start" 
            className="bg-gray-700 px-2 py-1 rounded-md"
            disabled={loading}
          />
          <DatePicker 
            selected={to} 
            onChange={(d:Date)=>setTo(d)} 
            showTimeSelect 
            dateFormat="Pp" 
            placeholderText="End" 
            className="bg-gray-700 px-2 py-1 rounded-md"
            disabled={loading} 
          />
          <button 
            onClick={addTimeframe} 
            disabled={loading || !from || !to}
            className={`px-3 py-1 rounded-md ${loading || !from || !to ? 'opacity-50 cursor-not-allowed bg-gray-600' : 'bg-green-600'}`}
          >
            {loading ? 'Creating...' : 'Create Slots'}
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-md">
        <h3 className="font-semibold">Available slots</h3>
        <div className="mt-2 space-y-2">
          {slots.filter(s=>!s.removed).length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              No slots available. Create some using the form above.
            </div>
          ) : (
            slots.filter(s=>!s.removed).map(s => (
              <div key={s.id} className="flex items-center justify-between bg-gray-900 p-2 rounded-md">
                <div>{new Date(s.start).toLocaleString()}</div>
                <div className="flex gap-2">
                  <button 
                    onClick={()=>removeSlot(s.id)} 
                    disabled={loading}
                    className={`px-2 py-1 rounded-md ${loading ? 'opacity-50 cursor-not-allowed bg-gray-600' : 'bg-red-600'}`}
                  >
                    {loading ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4">
        <button 
          onClick={doReset} 
          disabled={loading}
          className={`px-4 py-2 rounded-md ${loading ? 'opacity-50 cursor-not-allowed bg-gray-600' : 'bg-red-700'}`}
        >
          {loading ? 'Resetting...' : 'Reset schedule (delete all)'}
        </button>
      </div>
    </div>
  )
}
