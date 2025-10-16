import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { fetchConfig, updateConfig, fetchSlots, createTimeframe, deleteSlot, resetAll } from '../api/client'
import type { Slot } from '../types/api'
import { useIntl } from 'react-intl'

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

const TimeInput: React.FC<TimeInputProps> = ({ value, onChange, onKeyDown, disabled }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={onKeyDown}
    placeholder="HH:MM"
    className="bg-transparent px-3 py-2 w-full text-white text-center"
    disabled={disabled}
    maxLength={5}
  />
)

interface TimeControlsProps {
  onIncrement: () => void;
  onDecrement: () => void;
  disabled: boolean;
}

const TimeControls: React.FC<TimeControlsProps> = ({ onIncrement, onDecrement, disabled }) => (
  <div className="flex flex-col gap-1">
    <button
      type="button"
      onClick={onIncrement}
      disabled={disabled}
      className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"
    >
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
    <button
      type="button"
      onClick={onDecrement}
      disabled={disabled}
      className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"
    >
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  </div>
)

const Admin = () => {
  const intl = useIntl()
  const [config, setConfig] = useState<{rdvDurationMinutes:number}>({ rdvDurationMinutes: 15 })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate time options for the select dropdowns (every 15 minutes)
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return { hours, minutes }
  }

  const formatTime = (hours: number, minutes: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const validateAndUpdateTime = (newTime: string, isStart: boolean) => {
    // Handle partial input while typing
    if (newTime.length > 0 && !/^\d{0,2}(:\d{0,2})?$/.test(newTime)) return;
    
    // Allow partial input while typing
    if (newTime.length < 5) {
      if (isStart) setStartTime(newTime);
      else setEndTime(newTime);
      return;
    }

    const { hours, minutes } = parseTime(newTime)
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      const formattedTime = formatTime(hours, minutes)
      if (isStart) {
        setStartTime(formattedTime)
        if (endTime && formattedTime >= endTime) {
          // Update end time to be at least 1 minute after start time
          const startDate = new Date(2025, 0, 1, hours, minutes)
          const endDate = new Date(startDate)
          endDate.setMinutes(endDate.getMinutes() + 1)
          setEndTime(formatTime(endDate.getHours(), endDate.getMinutes()))
        }
      } else {
        if (startTime && formattedTime <= startTime) return // End time must be after start time
        setEndTime(formattedTime)
      }
    }
  }

  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, isStart: boolean) => {
    const input = e.currentTarget;
    const value = input.value;
    
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const { hours, minutes } = parseTime(value || '00:00');
      const date = new Date(2025, 0, 1, hours, minutes);
      
      // Determine if cursor is in hours or minutes position
      const cursorPosition = input.selectionStart || 0;
      const isHours = cursorPosition <= 2;
      
      if (isHours) {
        e.key === 'ArrowUp' ? date.setHours(date.getHours() + 1) : date.setHours(date.getHours() - 1);
      } else {
        e.key === 'ArrowUp' ? date.setMinutes(date.getMinutes() + 1) : date.setMinutes(date.getMinutes() - 1);
      }
      
      const newTime = formatTime(date.getHours(), date.getMinutes());
      validateAndUpdateTime(newTime, isStart);
      
      // Maintain cursor position
      setTimeout(() => {
        input.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    }
  };

  const adjustTime = (isStart: boolean, field: 'hours' | 'minutes', increment: boolean) => {
    const timeStr = isStart ? startTime : endTime
    if (!timeStr) {
      // If no time set, start with current time
      const now = new Date()
      const newTime = formatTime(now.getHours(), now.getMinutes())
      validateAndUpdateTime(newTime, isStart)
      return
    }

    const { hours, minutes } = parseTime(timeStr)
    const date = new Date(2025, 0, 1, hours, minutes)
    
    if (field === 'hours') {
      increment ? date.setHours(date.getHours() + 1) : date.setHours(date.getHours() - 1)
    } else {
      increment ? date.setMinutes(date.getMinutes() + 1) : date.setMinutes(date.getMinutes() - 1)
    }

    const newTime = formatTime(date.getHours(), date.getMinutes())
    validateAndUpdateTime(newTime, isStart)
  }

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
      console.log('Saving duration:', mins)
      setLoading(true)
      setError(null)
      const result = await updateConfig({ rdvDurationMinutes: mins })
      console.log('Save duration result:', result)
      await load()
    } catch (err) {
      console.error('Error saving duration:', err)
      setError('Failed to update duration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addTimeframe = async () => {
    console.group('addTimeframe Execution')
    try {
      // Ensure we have all required fields
      if (!selectedDate || !startTime || !endTime) {
        throw new Error('Please select date and times')
      }

      // Create Date objects for start and end times
      const [startHour, startMinute] = startTime.split(':').map(Number)
      const [endHour, endMinute] = endTime.split(':').map(Number)

      const startDate = new Date(selectedDate)
      startDate.setHours(startHour, startMinute, 0, 0)

      const endDate = new Date(selectedDate)
      endDate.setHours(endHour, endMinute, 0, 0)

      // Validate times
      if (endDate <= startDate) {
        throw new Error('End time must be after start time')
      }

      console.log('Times validated:', { 
        start: startDate.toISOString(), 
        end: endDate.toISOString() 
      })

      setLoading(true)
      setError(null)

      // Call API
      console.log('Calling API with times...')
      const result = await createTimeframe(
        startDate.toISOString(),
        endDate.toISOString()
      )
      console.log('API call successful:', result)

      // Refresh data
      await load()
      
      // Reset form
      setSelectedDate(null)
      setStartTime('')
      setEndTime('')

      // Show success message
      console.log('Slots created successfully')
      
    } catch (err) {
      console.error('Error in addTimeframe:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
      console.groupEnd()
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
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">
        {intl.formatMessage({ id: 'admin.dashboard' })}
      </h2>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6 shadow-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-800 p-6 rounded-lg mb-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">
          {intl.formatMessage({ id: 'admin.appointmentDuration' })}
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <label className="text-sm text-gray-300 min-w-[80px] flex-shrink-0">
            {intl.formatMessage({ id: 'admin.duration' })}
          </label>
          <div className="flex flex-wrap gap-2">
            {[10,15,20,30].map(d => (
              <button 
                key={d} 
                onClick={()=>saveDuration(d)} 
                disabled={loading}
                className={`min-w-[100px] px-4 py-2 rounded-md transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  config.rdvDurationMinutes===d 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {intl.formatMessage({ id: 'admin.minutes' }, { duration: d })}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg mb-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">
          {intl.formatMessage({ id: 'admin.addTimeframe' })}
        </h3>
        <div className="space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {intl.formatMessage({ id: 'admin.selectDate' })}
              </label>
              <DatePicker 
                selected={selectedDate}
                onChange={(date: Date | null) => {
                  console.log('Date selected:', date);
                  setSelectedDate(date);
                }}
                dateFormat="EEEE, MMMM d, yyyy"
                placeholderText={intl.formatMessage({ id: 'admin.selectDatePlaceholder' })}
                className="bg-gray-700 px-4 py-2 rounded-md text-white w-full"
                disabled={loading}
                minDate={new Date()}
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {intl.formatMessage({ id: 'admin.start' })}
              </label>
              <div className="flex items-center gap-1">
                <div className="flex-1 bg-gray-700 rounded-md overflow-hidden">
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => validateAndUpdateTime(e.target.value, true)}
                    onKeyDown={(e) => handleTimeKeyDown(e, true)}
                    placeholder="HH:MM"
                    className="bg-transparent px-3 py-2 w-full text-white text-center"
                    disabled={loading || !selectedDate}
                    maxLength={5}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => adjustTime(true, 'hours', true)}
                    disabled={loading || !selectedDate}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustTime(true, 'hours', false)}
                    disabled={loading || !selectedDate}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => adjustTime(true, 'minutes', true)}
                    disabled={loading || !selectedDate}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustTime(true, 'minutes', false)}
                    disabled={loading || !selectedDate}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {intl.formatMessage({ id: 'admin.end' })}
              </label>
              <div className="flex items-center gap-1">
                <div className="flex-1 bg-gray-700 rounded-md overflow-hidden">
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => validateAndUpdateTime(e.target.value, false)}
                    onKeyDown={(e) => handleTimeKeyDown(e, false)}
                    placeholder="HH:MM"
                    className="bg-transparent px-3 py-2 w-full text-white text-center"
                    disabled={loading || !selectedDate || !startTime}
                    maxLength={5}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => adjustTime(false, 'hours', true)}
                    disabled={loading || !selectedDate || !startTime}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustTime(false, 'hours', false)}
                    disabled={loading || !selectedDate || !startTime}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => adjustTime(false, 'minutes', true)}
                    disabled={loading || !selectedDate || !startTime}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustTime(false, 'minutes', false)}
                    disabled={loading || !selectedDate || !startTime}
                    className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              console.log('Create slots clicked', { selectedDate, startTime, endTime });
              if (!loading && selectedDate && startTime && endTime) {
                void addTimeframe();
              }
            }}
            disabled={loading || !selectedDate || !startTime || !endTime}
            className={`w-full px-6 py-3 rounded-md text-sm font-medium transition-colors ${
              loading || !selectedDate || !startTime || !endTime
                ? 'opacity-50 cursor-not-allowed bg-gray-600' 
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
            }`}
          >
            {loading ? 
              intl.formatMessage({ id: 'admin.creatingSlots' }) : 
              intl.formatMessage({ id: 'admin.createSlots' })}
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg mb-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">
          {intl.formatMessage({ id: 'admin.availableSlots' })}
        </h3>
        <div className="space-y-3">
          {slots.filter(s=>!s.removed).length === 0 ? (
            <div className="text-gray-400 text-center py-8 bg-gray-900 rounded-md">
              {intl.formatMessage({ id: 'admin.noSlots' })}
            </div>
          ) : (
            slots.filter(s=>!s.removed).map(s => (
              <div key={s.id} className="flex items-center justify-between bg-gray-900 p-4 rounded-md">
                <div className="text-white">
                  {new Date(s.start).toLocaleDateString(intl.locale, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <button 
                  onClick={()=>removeSlot(s.id)} 
                  disabled={loading}
                  className={`px-4 py-2 rounded-md text-sm transition-colors ${
                    loading 
                      ? 'opacity-50 cursor-not-allowed bg-gray-600' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {loading ? 
                    intl.formatMessage({ id: 'admin.removing' }) : 
                    intl.formatMessage({ id: 'admin.remove' })}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <button 
          onClick={doReset} 
          disabled={loading}
          className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
            loading 
              ? 'opacity-50 cursor-not-allowed bg-gray-600' 
              : 'bg-red-700 hover:bg-red-800'
          }`}
        >
          {loading ? 
            intl.formatMessage({ id: 'admin.resetting' }) : 
            intl.formatMessage({ id: 'admin.reset' })}
        </button>
      </div>
    </div>
  )
}

export default Admin;