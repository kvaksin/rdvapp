import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { fetchConfig, updateConfig, fetchSlots, createTimeframe, deleteSlot, resetAll, createClass, deleteClass, fetchClasses, resetClass } from '../api/client'
import { useIntl, FormattedMessage } from 'react-intl'
import { useAuth } from '../contexts/AuthContext'
import type { Class, Slot } from '../types/api'

function Admin() {
  const intl = useIntl()
  const { user: currentUser } = useAuth()
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
  const [newClassDescription, setNewClassDescription] = useState('')
  const [newClassColor, setNewClassColor] = useState('#6366F1')

  // Helper functions for user permissions
  const isAdmin = currentUser?.roles?.includes('administrator') || false
  const isClassLead = currentUser?.roles?.includes('class_lead') || false
  
  // Get classes accessible to current user
  const getAccessibleClasses = () => {
    if (isAdmin) {
      return classes // Admins can access all classes
    }
    if (isClassLead) {
      // Class leads can only access their assigned classes
      const userClassIds = currentUser?.classAssignments?.map(ca => ca.classId) || []
      return classes.filter(cls => userClassIds.includes(cls.id))
    }
    return []
  }

  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return { hours, minutes }
  }

  const formatTime = (hours: number, minutes: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const validateAndUpdateTime = (newTime: string, isStart: boolean) => {
    if (newTime.length > 0 && !/^\d{0,2}(:\d{0,2})?$/.test(newTime)) return;
    
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
          const startDate = new Date(2025, 0, 1, hours, minutes)
          const endDate = new Date(startDate)
          endDate.setMinutes(endDate.getMinutes() + 1)
          setEndTime(formatTime(endDate.getHours(), endDate.getMinutes()))
        }
      } else {
        if (startTime && formattedTime <= startTime) return
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
      
      const cursorPosition = input.selectionStart || 0;
      const isHours = cursorPosition <= 2;
      
      if (isHours) {
        e.key === 'ArrowUp' ? date.setHours(date.getHours() + 1) : date.setHours(date.getHours() - 1);
      } else {
        e.key === 'ArrowUp' ? date.setMinutes(date.getMinutes() + 1) : date.setMinutes(date.getMinutes() - 1);
      }
      
      const newTime = formatTime(date.getHours(), date.getMinutes());
      validateAndUpdateTime(newTime, isStart);
      
      setTimeout(() => {
        input.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    }
  };

  const adjustTime = (isStart: boolean, field: 'hours' | 'minutes', increment: boolean) => {
    const timeStr = isStart ? startTime : endTime
    if (!timeStr) {
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
        description: newClassDescription,
        color: newClassColor
      })
      await load()
      setNewClassName('')
      setNewClassDescription('')
      setNewClassColor('#6366F1')
    } catch (err) {
      console.error('Error creating class:', err)
      setError(intl.formatMessage({ id: 'admin.failedCreateClass' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateConfig() {
    try {
      setLoading(true)
      setError(null)
      await updateConfig(config)
      await load()
    } catch (err) {
      console.error('Error updating config:', err)
      setError(intl.formatMessage({ id: 'admin.failedUpdateConfig' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTimeframe() {
    if (!selectedDate || !startTime || !endTime || !selectedClass) {
      setError(intl.formatMessage({ id: 'admin.fillAllFields' }))
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const startDateTime = new Date(selectedDate)
      const [startHours, startMinutes] = startTime.split(':').map(Number)
      startDateTime.setHours(startHours, startMinutes, 0, 0)
      
      const endDateTime = new Date(selectedDate)
      const [endHours, endMinutes] = endTime.split(':').map(Number)
      endDateTime.setHours(endHours, endMinutes, 0, 0)
      
      await createTimeframe(
        startDateTime.toISOString(),
        endDateTime.toISOString(),
        selectedClass
      )
      
      await load()
      setSelectedDate(null)
      setStartTime('')
      setEndTime('')
    } catch (err) {
      console.error('Error creating timeframe:', err)
      setError(intl.formatMessage({ id: 'admin.failedCreateTimeframe' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteSlot(slotId: string) {
    try {
      setLoading(true)
      setError(null)
      await deleteSlot(slotId)
      await load()
    } catch (err) {
      console.error('Error deleting slot:', err)
      setError(intl.formatMessage({ id: 'admin.failedDeleteSlot' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteClass(classId: string) {
    try {
      setLoading(true)
      setError(null)
      await deleteClass(classId)
      await load()
    } catch (err) {
      console.error('Error deleting class:', err)
      setError(intl.formatMessage({ id: 'admin.failedDeleteClass' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetAll() {
    if (!confirm(intl.formatMessage({ id: 'admin.confirmResetAll' }))) return
    
    try {
      setLoading(true)
      setError(null)
      await resetAll(true)
      await load()
    } catch (err) {
      console.error('Error resetting all:', err)
      setError(intl.formatMessage({ id: 'admin.failedResetAll' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetClass() {
    if (!selectedClass) {
      setError(intl.formatMessage({ id: 'admin.selectClassToReset' }))
      return
    }
    
    if (!confirm(intl.formatMessage({ id: 'admin.confirmResetClass' }))) return
    
    try {
      setLoading(true)
      setError(null)
      await resetClass(selectedClass)
      await load()
    } catch (err) {
      console.error('Error resetting class:', err)
      setError(intl.formatMessage({ id: 'admin.failedResetClass' }))
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

      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg mb-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">{intl.formatMessage({ id: 'admin.classManagement' })}</h3>
        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder={intl.formatMessage({ id: 'admin.className' })}
              className="w-full bg-gray-700 px-4 py-2 rounded-md text-white"
            />
            <textarea
              value={newClassDescription}
              onChange={(e) => setNewClassDescription(e.target.value)}
              placeholder={intl.formatMessage({ id: 'admin.classDescription' })}
              rows={3}
              className="w-full bg-gray-700 px-4 py-2 rounded-md text-white resize-none"
            />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <span className="whitespace-nowrap">Color:</span>
                <input
                  type="color"
                  value={newClassColor}
                  onChange={(e) => setNewClassColor(e.target.value)}
                  className="w-12 h-10 rounded-md bg-gray-700 cursor-pointer flex-shrink-0"
                />
              </label>
              <button
                onClick={handleCreateClass}
                disabled={loading || !newClassName}
                className={`flex-1 px-4 py-2 rounded-md font-medium ${
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
                className="flex items-start justify-between gap-2 p-3 rounded-md"
                style={{ backgroundColor: cls.color + '20' }}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: cls.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{cls.name}</div>
                    {cls.description && (
                      <div className="text-gray-300 text-sm mt-1">{cls.description}</div>
                    )}
                  </div>
                </div>
                <button
                  disabled={loading}
                  className={`px-3 py-1 rounded-md text-sm whitespace-nowrap flex-shrink-0 ${
                    loading
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {intl.formatMessage({ id: 'admin.deleteClass' })}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin;
