import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { fetchConfig, updateConfig, fetchSlots, createTimeframe, deleteSlot, resetAll, createClass, deleteClass, fetchClasses, resetClass } from '../api/client'
import { useIntl, FormattedMessage } from 'react-intl'
import { useAuth } from '../contexts/AuthContext'
import ClassAssignmentRequests from '../components/ClassAssignmentRequests'
import type { Class, Slot } from '../types/api'

interface Child {
  id: string
  name?: string // Legacy field
  firstName: string
  lastName: string
  birthday?: string // Date string (YYYY-MM-DD format)
  parentId?: string
  classId: string
  createdAt: string
}

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
  
  // Children management state
  const [classChildren, setClassChildren] = useState<Child[]>([])
  const [loadingChildren, setLoadingChildren] = useState(false)

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

  async function loadChildren() {
    try {
      setLoadingChildren(true)
      const response = await fetch('/api/children')
      if (!response.ok) throw new Error('Failed to fetch children')
      const allChildren: Child[] = await response.json()
      
      if (isClassLead) {
        // Filter children to show only those assigned to class lead's classes
        const userClassIds = currentUser?.classAssignments?.map((ca: any) => ca.classId) || []
        const filteredChildren = allChildren.filter((child: Child) => 
          userClassIds.includes(child.classId)
        )
        setClassChildren(filteredChildren)
      } else {
        // Admins can see all children
        setClassChildren(allChildren)
      }
    } catch (err) {
      console.error('Error loading children:', err)
      setError(intl.formatMessage({ id: 'admin.failedLoadChildren' }))
    } finally {
      setLoadingChildren(false)
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

  async function saveDuration(minutes: number) {
    try {
      setLoading(true)
      setError(null)
      const newConfig = { ...config, rdvDurationMinutes: minutes }
      setConfig(newConfig)
      await updateConfig(newConfig)
      await load()
    } catch (err) {
      console.error('Error saving duration:', err)
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

  async function handleResetClassSchedule() {
    if (!selectedClass) {
      setError(intl.formatMessage({ id: 'admin.selectClassToReset' }))
      return
    }
    
    const selectedClassName = getAccessibleClasses().find(cls => cls.id === selectedClass)?.name || selectedClass
    if (!confirm(intl.formatMessage({ id: 'admin.confirmResetClassSchedule' }, { className: selectedClassName }))) return
    
    try {
      setLoading(true)
      setError(null)
      await resetClass(selectedClass)
      await load()
    } catch (err) {
      console.error('Error resetting class schedule:', err)
      setError(intl.formatMessage({ id: 'admin.failedResetClassSchedule' }))
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

      {/* Configuration Section - Admin and Class Lead */}
      {(isAdmin || isClassLead) && (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg mb-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-white">Appointment Duration</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-300 min-w-[80px]">
                Duration:
              </label>
              <div className="flex flex-wrap gap-3">
                {[10, 15, 20, 30].map(duration => (
                  <button
                    key={duration}
                    onClick={() => saveDuration(duration)}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 min-w-[120px] ${
                      loading
                        ? 'opacity-50 cursor-not-allowed'
                        : config.rdvDurationMinutes === duration
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg transform scale-105'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                    }`}
                  >
                    {duration} minutes
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Management Section - Admin Only */}
      {isAdmin && (
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
                    onClick={() => handleDeleteClass(cls.id)}
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
      )}

      {/* Children Management Section - Class Leads and Admins */}
      {(isAdmin || isClassLead) && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">
              <FormattedMessage id="admin.childrenManagement" />
            </h3>
            <button
              onClick={loadChildren}
              disabled={loadingChildren}
              className={`px-4 py-2 rounded-md ${
                loadingChildren
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loadingChildren ? (
                <FormattedMessage id="admin.loading" />
              ) : (
                <FormattedMessage id="admin.loadChildren" />
              )}
            </button>
          </div>

          {classChildren.length > 0 ? (
            <div className="space-y-2">
              {classChildren.map(child => {
                const childClass = classes.find(cls => cls.id === child.classId)
                return (
                  <div key={child.id} className="bg-gray-700 rounded-md p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-white font-medium">
                          {child.firstName && child.lastName ? 
                            `${child.firstName} ${child.lastName}` : 
                            child.name || 'No name'
                          }
                        </div>
                        <div className="text-gray-300 text-sm">
                          {childClass ? (
                            <span className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: childClass.color }}
                              />
                              {childClass.name}
                            </span>
                          ) : (
                            `Class ID: ${child.classId}`
                          )}
                        </div>
                        <div className="text-gray-400 text-xs">
                          <FormattedMessage id="admin.registeredAt" />: {new Date(child.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-400 text-sm">
                          ID: {child.id}
                        </div>
                        {child.parentId && (
                          <div className="text-gray-400 text-xs">
                            <FormattedMessage id="admin.parentId" />: {child.parentId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-8">
              <FormattedMessage id={isClassLead ? "admin.noChildrenAssigned" : "admin.noChildrenRegistered"} />
            </div>
          )}
        </div>
      )}

      {/* Class Assignment Requests Section - Admin Only */}
      {isAdmin && (
        <div className="bg-green-500/20 border border-green-500 text-green-300 p-4 rounded-lg mb-4">
          ✅ Debug: Admin user detected - ClassAssignmentRequests component should render below
        </div>
      )}
      {isAdmin && <ClassAssignmentRequests />}

      {/* Appointment Creation Section - Admin and Class Leads */}
      {(isAdmin || isClassLead) && (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg mb-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{intl.formatMessage({ id: 'admin.createAppointments' })}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Class Selection */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  {intl.formatMessage({ id: 'admin.selectClass' })}
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-gray-700 px-3 py-2 rounded-md text-white"
                >
                  <option value="">{intl.formatMessage({ id: 'admin.selectClass' })}</option>
                  {getAccessibleClasses().map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  {intl.formatMessage({ id: 'admin.selectDate' })}
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  minDate={new Date()}
                  className="w-full bg-gray-700 px-3 py-2 rounded-md text-white"
                  placeholderText={intl.formatMessage({ id: 'admin.selectDate' })}
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  {intl.formatMessage({ id: 'admin.startTime' })}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => validateAndUpdateTime(e.target.value, true)}
                    onKeyDown={(e) => handleTimeKeyDown(e, true)}
                    placeholder="HH:MM"
                    className="w-full bg-gray-700 px-3 py-2 rounded-md text-white"
                  />
                  <div className="absolute right-2 top-2 flex flex-col">
                    <button
                      type="button"
                      onClick={() => adjustTime(true, 'hours', true)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustTime(true, 'hours', false)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  {intl.formatMessage({ id: 'admin.endTime' })}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => validateAndUpdateTime(e.target.value, false)}
                    onKeyDown={(e) => handleTimeKeyDown(e, false)}
                    placeholder="HH:MM"
                    className="w-full bg-gray-700 px-3 py-2 rounded-md text-white"
                  />
                  <div className="absolute right-2 top-2 flex flex-col">
                    <button
                      type="button"
                      onClick={() => adjustTime(false, 'hours', true)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustTime(false, 'hours', false)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateTimeframe}
              disabled={loading || !selectedDate || !startTime || !endTime || !selectedClass}
              className={`w-full px-4 py-3 rounded-md font-medium ${
                loading || !selectedDate || !startTime || !endTime || !selectedClass
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {intl.formatMessage({ id: 'admin.createTimeframe' })}
            </button>
          </div>
        </div>
      )}

      {/* Slot Management Section - Admin and Class Leads */}
      {(isAdmin || isClassLead) && (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg mb-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{intl.formatMessage({ id: 'admin.manageSlots' })}</h3>
          <div className="space-y-4">
            {/* Class Filter */}
            <div className="flex items-center gap-4">
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value)
                  load()
                }}
                className="bg-gray-700 px-3 py-2 rounded-md text-white"
              >
                <option value="">{intl.formatMessage({ id: 'admin.allClasses' })}</option>
                {getAccessibleClasses().map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              <button
                onClick={load}
                disabled={loading}
                className={`px-4 py-2 rounded-md font-medium ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {intl.formatMessage({ id: 'admin.refresh' })}
              </button>
            </div>

            {/* Slots List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {slots.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  {intl.formatMessage({ id: 'admin.noSlots' })}
                </p>
              ) : (
                slots.map(slot => {
                  const slotClass = classes.find(c => c.id === slot.classId)
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 rounded-md bg-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        {slotClass && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: slotClass.color }}
                          />
                        )}
                        <div>
                          <div className="text-white font-medium">
                            {new Date(slot.start).toLocaleDateString()} - {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {slotClass?.name || slot.classId} 
                            {slot.booked && <span className="text-orange-400 ml-2">({intl.formatMessage({ id: 'admin.booked' })})</span>}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={loading || slot.booked}
                        className={`px-3 py-1 rounded-md text-sm ${
                          loading || slot.booked
                            ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {intl.formatMessage({ id: 'admin.delete' })}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset Schedule Section - Class Leads Only */}
      {isClassLead && !isAdmin && (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg mb-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-orange-300">{intl.formatMessage({ id: 'admin.resetSchedule' })}</h3>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-1">
                <label className="block text-sm text-gray-300 mb-2">
                  {intl.formatMessage({ id: 'admin.selectClassToReset' })}
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-gray-700 px-3 py-2 rounded-md text-white"
                >
                  <option value="">{intl.formatMessage({ id: 'admin.selectClass' })}</option>
                  {getAccessibleClasses().map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleResetClassSchedule}
                disabled={loading || !selectedClass}
                className={`px-4 py-2 rounded-md font-medium whitespace-nowrap ${
                  loading || !selectedClass
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {intl.formatMessage({ id: 'admin.resetSchedule' })}
              </button>
            </div>
            <p className="text-gray-400 text-sm">
              {intl.formatMessage({ id: 'admin.resetScheduleWarning' })}
            </p>
          </div>
        </div>
      )}

      {/* Reset Section - Admin Only */}
      {isAdmin && (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-red-300">{intl.formatMessage({ id: 'admin.dangerZone' })}</h3>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleResetClass}
                disabled={loading || !selectedClass}
                className={`px-4 py-2 rounded-md font-medium ${
                  loading || !selectedClass
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {intl.formatMessage({ id: 'admin.resetSelectedClass' })}
              </button>
              <button
                onClick={handleResetAll}
                disabled={loading}
                className={`px-4 py-2 rounded-md font-medium ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {intl.formatMessage({ id: 'admin.resetAll' })}
              </button>
            </div>
            <p className="text-gray-400 text-sm">
              {intl.formatMessage({ id: 'admin.resetWarning' })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin;
