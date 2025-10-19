import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import DatePicker from 'react-datepicker';
import { fetchSlots, fetchClasses, bookSlot, fetchBookings, cancelBooking } from '../api/client';
import { useAuth, authenticatedFetch } from '../contexts/AuthContext';
import type { Slot, Class } from '../types/api';

interface ClassScheduleProps {
  classId: string;
}

interface BookingModalProps {
  slot: Slot | null;
  open: boolean;
  onClose: () => void;
  onBook: (slotId: string, childId: string) => Promise<void>;
  loading: boolean;
  classId: string;
}

interface Child {
  id: string;
  name?: string; // Legacy field
  firstName?: string;
  lastName?: string;
  parentId?: string;
  classId: string;
  createdAt: string;
}

export default function ClassSchedule({ classId }: ClassScheduleProps) {
  const navigate = useNavigate();
  const intl = useIntl();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [classDetails, setClassDetails] = useState<Class | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<Slot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingsBySlot, setBookingsBySlot] = useState<Record<string, { childName: string; bookingId: string }>>({});
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);

  // Helper function to get display name for a child
  const getChildDisplayName = (child: Child): string => {
    if (child.firstName && child.lastName) {
      return `${child.firstName} ${child.lastName}`;
    }
    return child.name || 'No name';
  };

  // BookingModal component
  function BookingModal({ slot, open, onClose, onBook, loading, classId }: BookingModalProps) {
    const { user } = useAuth();
    const [selectedChild, setSelectedChild] = useState<Child | null>(null);
    const [availableChildren, setAvailableChildren] = useState<Child[]>([]);
    const [loadingChildren, setLoadingChildren] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
      setSelectedChild(null);
      setError(null);
      if (open && user && classId) {
        loadAvailableChildren();
      }
    }, [slot, open, user, classId]);

    const loadAvailableChildren = async () => {
      if (!user) return;
      
      try {
        setLoadingChildren(true);
        const response = await authenticatedFetch('/api/children');
        
        if (response.ok) {
          const allChildren = await response.json();
          // Filter children who are enrolled in this specific class
          const childrenInClass = allChildren.filter((child: Child) => child.classId === classId);
          setAvailableChildren(childrenInClass);
          
          // Auto-select first child if available
          if (childrenInClass.length > 0) {
            setSelectedChild(childrenInClass[0]);
          }
        } else {
          throw new Error('Failed to fetch children');
        }
      } catch (err) {
        console.error('Error loading children:', err);
        setError(intl.formatMessage({ 
          id: 'schedule.failedLoadChildren', 
          defaultMessage: 'Failed to load your children' 
        }));
      } finally {
        setLoadingChildren(false);
      }
    };
    
    if (!open || !slot) return null;
    
    const handleBook = async () => {
      if (!selectedChild) {
        setError(intl.formatMessage({ 
          id: 'schedule.childRequired', 
          defaultMessage: 'Please select a child' 
        }));
        return;
      }
      
      try {
        await onBook(slot.id, selectedChild.id);
      } catch (e: any) {
        const msg = typeof e?.message === 'string' ? e.message : intl.formatMessage({ id: 'schedule.failedBookSlot' });
        setError(msg);
      }
    };
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-purple-200">
            {intl.formatMessage({ id: 'schedule.bookAppointment', defaultMessage: 'Book Appointment' })}
          </h2>
          
          <div className="mb-4 text-gray-300">
            <div className="mb-1">
              <span className="font-semibold">{intl.formatMessage({ id: 'schedule.time', defaultMessage: 'Time' })}</span> {new Date(slot.start).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold">{intl.formatMessage({ id: 'schedule.duration', defaultMessage: 'Duration' })}</span> {Math.round((new Date(slot.end).getTime() - new Date(slot.start).getTime())/60000)} {intl.formatMessage({ id: 'schedule.min', defaultMessage: 'min' })}
            </div>
          </div>
          
          <label className="block text-sm font-medium text-gray-400 mb-2">
            {intl.formatMessage({ id: 'schedule.childName', defaultMessage: 'Child Name' })}
          </label>
          
          {loadingChildren ? (
            <div className="text-center py-4 text-gray-400">
              {intl.formatMessage({ id: 'schedule.loadingChildren', defaultMessage: 'Loading your children...' })}
            </div>
          ) : availableChildren.length === 0 ? (
            <div className="text-yellow-400 text-sm mb-4 p-3 bg-yellow-900/20 rounded border border-yellow-600/30">
              {intl.formatMessage({ 
                id: 'schedule.noChildrenInClass', 
                defaultMessage: 'No children found enrolled in this class. Please contact your administrator.' 
              })}
            </div>
          ) : (
            <div className="mb-4">
              <div className="grid gap-2">
                {availableChildren.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelectedChild(child)}
                    className={`p-3 text-left rounded border transition-colors ${
                      selectedChild?.id === child.id
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                    disabled={loading}
                  >
                    <div className="font-medium">{getChildDisplayName(child)}</div>
                    <div className="text-xs opacity-75">
                      {intl.formatMessage({ 
                        id: 'schedule.enrolledInClass', 
                        defaultMessage: 'Enrolled in this class' 
                      })}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {error && (
            <div className="text-red-400 text-sm mb-4 p-2 bg-red-900/20 rounded border border-red-600/30">
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
              disabled={loading}
            >
              {intl.formatMessage({ id: 'schedule.cancel', defaultMessage: 'Cancel' })}
            </button>
            <button
              onClick={handleBook}
              className={`px-4 py-2 rounded bg-green-600 text-white font-semibold ${
                loading || !selectedChild || availableChildren.length === 0
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:bg-green-700'
              }`}
              disabled={loading || !selectedChild || availableChildren.length === 0}
            >
              {loading 
                ? intl.formatMessage({ id: 'schedule.booking', defaultMessage: 'Booking...' })
                : intl.formatMessage({ id: 'schedule.book', defaultMessage: 'Book' })
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper variables (define only once)
  const scheduleUrl = classDetails
    ? `${window.location.origin}/class/${classDetails.id}/${classDetails.id}-manual`
    : '';
  const groupedSlots: Record<string, Slot[]> = slots.reduce((acc: Record<string, Slot[]>, slot: Slot) => {
    const dateStr = new Date(slot.start).toLocaleDateString();
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(slot);
    return acc;
  }, {});
  const visibleDates: string[] = selectedDate
    ? [selectedDate.toLocaleDateString()]
    : Object.keys(groupedSlots).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [classId]);

  // bookingsBySlot declared above

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const classes = await fetchClasses();
      const currentClass = classes.find((c: Class) => c.id === classId);
      if (!currentClass) throw new Error(intl.formatMessage({ id: 'schedule.classNotFound' }));
      setClassDetails(currentClass);
      const [allSlots, allBookings] = await Promise.all([
        fetchSlots(undefined, undefined, classId),
        fetchBookings()
      ]);
      setSlots((allSlots as Slot[]).filter((s: Slot) => s.classId === classId && !s.removed));
      
      // Fetch children data to get full names for bookings
      let childrenData: Child[] = [];
      try {
        const childrenResponse = await authenticatedFetch('/api/children');
        if (childrenResponse.ok) {
          childrenData = await childrenResponse.json();
        }
      } catch (err) {
        console.log('Could not fetch children data for full names');
      }
      
      const map: Record<string, { childName: string; bookingId: string }> = {};
      (allBookings as any[]).forEach((b: any) => {
        if (!b.cancelled) {
          // Try to find the child to get full name, fall back to stored childName
          let displayName = b.childName;
          if (b.childId) {
            const child = childrenData.find(c => c.id === b.childId);
            if (child) {
              displayName = getChildDisplayName(child);
            }
          }
          map[b.slotId] = { childName: displayName, bookingId: b.id };
        }
      });
      setBookingsBySlot(map);
    } catch (err) {
      console.error('Error loading class schedule:', err);
      setError(intl.formatMessage({ id: 'schedule.failedLoadSchedule' }));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteBooking(bookingId: string) {
    if (!confirm(intl.formatMessage({ id: 'schedule.deleteBookingConfirm' }))) {
      return;
    }
    try {
      setDeletingBookingId(bookingId);
      await cancelBooking(bookingId);
      await loadData();
    } catch (err) {
      console.error('Error deleting booking:', err);
      setError(intl.formatMessage({ id: 'schedule.failedDeleteBooking' }));
    } finally {
      setDeletingBookingId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-purple-300 mb-6 mt-8">{classDetails ? classDetails.name : intl.formatMessage({ id: 'schedule.title' })}</h1>
      {error && <div className="text-red-400 text-center mb-4">{error}</div>}
      {loading ? (
        <div className="text-center text-gray-400">{intl.formatMessage({ id: 'schedule.loadingSchedule' })}</div>
      ) : null}
      {!loading && (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{intl.formatMessage({ id: 'schedule.scheduleUrl' })}</span>
              <input
                className="bg-gray-800 text-gray-200 px-2 py-1 rounded border border-gray-700 w-64 text-xs"
                value={scheduleUrl}
                readOnly
                onFocus={e => e.target.select()}
              />
              <button
                className="ml-2 px-2 py-1 rounded bg-purple-700 text-white text-xs hover:bg-purple-800"
                onClick={() => {
                  navigator.clipboard.writeText(scheduleUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
              >{copied ? intl.formatMessage({ id: 'schedule.copied' }) : intl.formatMessage({ id: 'schedule.copy' })}</button>
            </div>
            {null}
          </div>
          {(visibleDates.length === 0 || slots.length === 0) ? (
            <div className="text-center text-gray-400 mt-12">{intl.formatMessage({ id: 'schedule.noAppointments' })}</div>
          ) : (
            visibleDates.map((dateStr: string) => (
              <div key={dateStr} className="mb-8">
                <h2 className="text-lg font-semibold text-purple-200 mb-2">{dateStr}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedSlots[dateStr]?.length ? groupedSlots[dateStr].map((slot: Slot) => (
                    <div key={slot.id} className="bg-gray-800 rounded-lg p-4 flex flex-col gap-2 shadow-md border border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-200 font-medium">{new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {slot.booked ? (
                          <span className="text-xs px-2 py-1 rounded bg-red-700 text-white">
                            {intl.formatMessage({ id: 'schedule.booked' })}{bookingsBySlot[slot.id] ? ` — ${bookingsBySlot[slot.id].childName}` : ''}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded bg-green-700 text-white">{intl.formatMessage({ id: 'schedule.available' })}</span>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        {slot.booked && bookingsBySlot[slot.id] ? (
                          <>
                            <a
                              href={`/api/bookings/${bookingsBySlot[slot.id].bookingId}/ics`}
                              download
                              className="px-3 py-1 rounded bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {intl.formatMessage({ id: 'schedule.addToCalendar' })}
                            </a>
                            <button
                              onClick={() => handleDeleteBooking(bookingsBySlot[slot.id].bookingId)}
                              disabled={deletingBookingId === bookingsBySlot[slot.id].bookingId}
                              className={`px-3 py-1 rounded text-white text-sm font-semibold flex items-center gap-1 ${
                                deletingBookingId === bookingsBySlot[slot.id].bookingId
                                  ? 'bg-red-400 cursor-not-allowed'
                                  : 'bg-red-600 hover:bg-red-700'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              {deletingBookingId === bookingsBySlot[slot.id].bookingId
                                ? intl.formatMessage({ id: 'schedule.deleting' })
                                : intl.formatMessage({ id: 'schedule.deleteBooking' })}
                            </button>
                          </>
                        ) : !slot.booked ? (
                          <button
                            className="px-3 py-1 rounded bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
                            onClick={() => setBookingSlot(slot)}
                          >{intl.formatMessage({ id: 'schedule.book' })}</button>
                        ) : null}
                      </div>
                    </div>
                  )) : (
                    <div className="text-gray-400 col-span-2 text-center">{intl.formatMessage({ id: 'schedule.noSlotsForDate' })}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </>
      )}
      <BookingModal
        slot={bookingSlot}
        open={!!bookingSlot}
        classId={classId}
        onClose={() => setBookingSlot(null)}
        onBook={async (slotId: string, childId: string) => {
          setBookingLoading(true);
          try {
            await bookSlot(slotId, childId);
            setBookingSlot(null);
            await loadData();
          } catch (err: any) {
            // Refresh to reflect current status (slot may have been booked by someone else)
            await loadData();
            // Re-throw so the modal can show the message
            const message = typeof err?.message === 'string' ? err.message : intl.formatMessage({ id: 'schedule.failedBookSlot' });
            throw new Error(message);
          } finally {
            setBookingLoading(false);
          }
        }}
        loading={bookingLoading}
      />
    </div>
  );
}