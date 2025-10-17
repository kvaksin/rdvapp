import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { fetchConfig, updateConfig, fetchSlots, createTimeframe, deleteSlot, resetAll, createClass, deleteClass, fetchClasses, resetClass } from '../api/client'
import { useIntl } from 'react-intl'
import type { Class, Slot } from '../types/api'

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
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [newClassName, setNewClassName] = useState('')
  const [newClassColor, setNewClassColor] = useState('#6366F1')

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
      const [c, s, cl] = await Promise.all([
        fetchConfig(),
        fetchSlots(undefined, undefined, selectedClass || undefined),
        fetchClasses()
      ])
      setConfig(c)
      setSlots(s)
      setClasses(cl)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(intl.formatMessage({ id: 'admin.failedLoadData' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateClass() {
    try {
      setLoading(true)
      setError(null)
      await createClass({
        name: newClassName,
        color: newClassColor
      })
      await load()
      setNewClassName('')
      setNewClassColor('#6366F1')
    } catch (err) {
      console.error('Error creating class:', err)
      setError(intl.formatMessage({ id: 'admin.failedCreateClass' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteClass(id: string) {
    if (!confirm(intl.formatMessage({ id: 'admin.deleteClassConfirm' }))) return
    try {
      setLoading(true)
      setError(null)
      await deleteClass(id)
      await load()
    } catch (err) {
      console.error('Error deleting class:', err)
      setError(intl.formatMessage({ id: 'admin.failedDeleteClass' }))
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
      setError(intl.formatMessage({ id: 'admin.failedUpdateDuration' }))
    } finally {
      setLoading(false)
    }
  }

  const addTimeframe = async () => {
    console.group('addTimeframe Execution')
    try {
      // Ensure we have all required fields
      if (!selectedDate || !startTime || !endTime) {
        throw new Error(intl.formatMessage({ id: 'admin.errorSelectDateTime' }))
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
        throw new Error(intl.formatMessage({ id: 'admin.errorEndTimeAfterStart' }))
      }

      console.log('Times validated:', { 
        start: startDate.toISOString(), 
        end: endDate.toISOString() 
      })

      setLoading(true)
      setError(null)

      // Call API
      console.log('Calling API with times...', { startDate, endDate, selectedClass })
      const result = await createTimeframe(
        startDate.toISOString(),
        endDate.toISOString(),
        selectedClass || undefined
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
      setError(intl.formatMessage({ id: 'admin.failedRemoveSlot' }))
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
        <h3 className="text-lg font-semibold mb-4">{intl.formatMessage({ id: 'admin.classManagement' })}</h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder={intl.formatMessage({ id: 'admin.className' })}
              className="flex-1 bg-gray-700 px-4 py-2 rounded-md text-white"
            />
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newClassColor}
                onChange={(e) => setNewClassColor(e.target.value)}
                className="w-12 h-10 rounded-md bg-gray-700 cursor-pointer flex-shrink-0"
              />
              <button
                onClick={handleCreateClass}
                disabled={loading || !newClassName}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-md whitespace-nowrap ${
                  loading || !newClassName
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {intl.formatMessage({ id: 'admin.addClass' })}
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {classes.map(cls => (
              <div 
                key={cls.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-md"
                style={{ backgroundColor: cls.color + '20' }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cls.color }}
                  />
                  <span className="text-white break-words">{cls.name}</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDeleteClass(cls.id)}
                    disabled={loading}
                    className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                      loading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {intl.formatMessage({ id: 'admin.deleteClass' })}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
        <h3 className="text-lg font-semibold mb-6 text-purple-300 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
          {intl.formatMessage({ id: 'admin.addTimeframe' })}
        </h3>
        <div className="flex flex-col gap-4">
          {/* Class selection moved to top */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-400 mb-1">{intl.formatMessage({ id: 'admin.class' })}</label>
            <select
              value={selectedClass}
              onChange={async e => {
                setSelectedClass(e.target.value)
                // Reload slots for selected class immediately
                setLoading(true)
                try {
                  const s = await fetchSlots(undefined, undefined, e.target.value || undefined)
                  setSlots(s)
                } catch (err) {
                  console.error('Error loading class slots:', err)
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
              className="w-full bg-gray-700 px-4 py-2 rounded-md text-white"
            >
              <option value="">{intl.formatMessage({ id: 'admin.noClass' })}</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            {selectedClass && (
              <div className="mt-2 text-xs text-purple-300 bg-gray-900 border border-purple-700 rounded p-2">
                <span className="font-semibold">{intl.formatMessage({ id: 'admin.classScheduleUrl' })}</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    readOnly
                    value={(() => {
                      const token = `${selectedClass}-manual`;
                      return `${window.location.origin}/class/${selectedClass}/${token}`;
                    })()}
                    className="flex-1 bg-gray-800 px-2 py-1 rounded text-xs text-purple-200 border border-gray-700"
                    style={{ minWidth: 0 }}
                    onFocus={e => e.target.select()}
                  />
                  <button
                    type="button"
                    className="px-2 py-1 bg-purple-700 hover:bg-purple-800 rounded text-xs text-white"
                    onClick={() => {
                      const token = `${selectedClass}-manual`;
                      const url = `${window.location.origin}/class/${selectedClass}/${token}`;
                      navigator.clipboard.writeText(url);
                    }}
                  >{intl.formatMessage({ id: 'admin.copy' })}</button>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[200px] flex-1">
              <label className="block text-xs font-medium text-gray-400 mb-1">{intl.formatMessage({ id: 'admin.date' })}</label>
              <DatePicker
                selected={selectedDate}
                onChange={setSelectedDate}
                dateFormat="EEEE, MMMM d, yyyy"
                placeholderText="Select date"
                className="bg-gray-700 px-4 py-2 rounded-md text-white w-full"
                disabled={loading}
                minDate={new Date()}
              />
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-gray-400 mb-1">{intl.formatMessage({ id: 'admin.startTime' })}</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={startTime}
                  onChange={e => validateAndUpdateTime(e.target.value, true)}
                  onKeyDown={e => handleTimeKeyDown(e, true)}
                  placeholder="HH:MM"
                  className="bg-gray-700 px-3 py-2 w-full text-white text-center rounded-md"
                  disabled={loading || !selectedDate}
                  maxLength={5}
                />
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => adjustTime(true, 'hours', true)} disabled={loading || !selectedDate} className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                  <button type="button" onClick={() => adjustTime(true, 'hours', false)} disabled={loading || !selectedDate} className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => adjustTime(true, 'minutes', true)} disabled={loading || !selectedDate} className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                  <button type="button" onClick={() => adjustTime(true, 'minutes', false)} disabled={loading || !selectedDate} className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                </div>
              </div>
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-gray-400 mb-1">{intl.formatMessage({ id: 'admin.endTime' })}</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={endTime}
                  onChange={e => validateAndUpdateTime(e.target.value, false)}
                  onKeyDown={e => handleTimeKeyDown(e, false)}
                  placeholder="HH:MM"
                  className="bg-gray-700 px-3 py-2 w-full text-white text-center rounded-md"
                  disabled={loading || !selectedDate || !startTime}
                  maxLength={5}
                />
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => adjustTime(false, 'hours', true)} disabled={loading || !selectedDate || !startTime} className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                  <button type="button" onClick={() => adjustTime(false, 'hours', false)} disabled={loading || !selectedDate || !startTime} className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => adjustTime(false, 'minutes', true)} disabled={loading || !selectedDate || !startTime} className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                  <button type="button" onClick={() => adjustTime(false, 'minutes', false)} disabled={loading || !selectedDate || !startTime} className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                </div>
              </div>
            </div>
            {/* moved class selection to top */}
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                if (!loading && selectedDate && startTime && endTime) {
                  void addTimeframe();
                }
              }}
              disabled={loading || !selectedDate || !startTime || !endTime}
              className={`px-8 py-3 rounded-md text-base font-semibold transition-colors shadow-sm ${
                loading || !selectedDate || !startTime || !endTime
                  ? 'opacity-50 cursor-not-allowed bg-gray-600'
                  : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
              }`}
            >
              {loading ? intl.formatMessage({ id: 'admin.creatingSlots' }) : intl.formatMessage({ id: 'admin.createSlotsButton' })}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg mb-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">
          {intl.formatMessage({ id: 'admin.availableSlots' })}
        </h3>
        <div className="space-y-3">
          {slots.filter(s=>!s.removed && (!selectedClass || s.classId === selectedClass)).length === 0 ? (
            <div className="text-gray-400 text-center py-8 bg-gray-900 rounded-md">
              {intl.formatMessage({ id: 'admin.noSlots' })}
            </div>
          ) : (
            slots.filter(s=>!s.removed && (!selectedClass || s.classId === selectedClass)).map(s => (
              <div 
                key={s.id} 
                className="flex items-center justify-between p-4 rounded-md"
                style={{ 
                  backgroundColor: s.classId 
                    ? (classes.find(c => c.id === s.classId)?.color + '20') || '#1F2937'
                    : '#1F2937'
                }}
              >
                <div className="flex items-center gap-4">
                  {s.classId && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: classes.find(c => c.id === s.classId)?.color 
                      }}
                    />
                  )}
                  <div className="text-white">
                    {new Date(s.start).toLocaleDateString(intl.locale, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {s.classId && (
                      <span className="ml-2 text-gray-400">
                        ({classes.find(c => c.id === s.classId)?.name})
                      </span>
                    )}
                  </div>
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
          onClick={async () => {
            if (!selectedClass) return;
            if (!confirm(intl.formatMessage({ id: 'admin.resetClassConfirm' }))) return;
            try {
              setLoading(true)
              setError(null)
              await resetClass(selectedClass)
              await load()
            } catch (err) {
              console.error('Error resetting class schedule:', err)
              setError(intl.formatMessage({ id: 'admin.failedResetClass' }))
            } finally {
              setLoading(false)
            }
          }} 
          disabled={loading || !selectedClass}
          className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
            loading || !selectedClass
              ? 'opacity-50 cursor-not-allowed bg-gray-600' 
              : 'bg-red-700 hover:bg-red-800'
          }`}
        >
          {loading ? intl.formatMessage({ id: 'admin.resettingEllipsis' }) : (selectedClass ? intl.formatMessage({ id: 'admin.resetSlotsForClass' }) : intl.formatMessage({ id: 'admin.selectClassToReset' }))}
        </button>
      </div>
    </div>
  )
}

export default Admin;