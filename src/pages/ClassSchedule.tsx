import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import DatePicker from 'react-datepicker';
import { fetchSlots, fetchClasses, bookSlot, fetchBookings, cancelBooking } from '../api/client';
import type { Slot, Class } from '../types/api';

interface ClassScheduleProps {
  classId: string;
}

interface BookingModalProps {
  slot: Slot | null;
  open: boolean;
  onClose: () => void;
  onBook: (slotId: string, childName: string) => Promise<void>;
  loading: boolean;
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

  // BookingModal component
  function BookingModal({ slot, open, onClose, onBook, loading }: BookingModalProps) {
    const [childName, setChildName] = useState('');
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
      setChildName('');
      setError(null);
    }, [slot, open]);
    if (!open || !slot) return null;
    const handleBook = async () => {
      if (!childName.trim()) {
        setError(intl.formatMessage({ id: 'schedule.childNameRequired' }));
        return;
      }
      try {
        await onBook(slot.id, childName.trim());
      } catch (e: any) {
        const msg = typeof e?.message === 'string' ? e.message : intl.formatMessage({ id: 'schedule.failedBookSlot' });
        setError(msg);
      }
    };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-purple-200">{intl.formatMessage({ id: 'schedule.bookAppointment' })}</h2>
          <div className="mb-2 text-gray-300">
            <span className="font-semibold">{intl.formatMessage({ id: 'schedule.time' })}</span> {new Date(slot.start).toLocaleString()}<br/>
            <span className="font-semibold">{intl.formatMessage({ id: 'schedule.duration' })}</span> {Math.round((new Date(slot.end).getTime() - new Date(slot.start).getTime())/60000)} {intl.formatMessage({ id: 'schedule.min' })}
          </div>
          <label className="block text-sm font-medium text-gray-400 mb-1 mt-4">{intl.formatMessage({ id: 'schedule.childName' })}</label>
          <input
            type="text"
            value={childName}
            onChange={e => setChildName(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 mb-2"
            placeholder={intl.formatMessage({ id: 'schedule.enterChildName' })}
            disabled={loading}
          />
          {error && <div className="text-red-400 text-xs mb-2">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600">{intl.formatMessage({ id: 'schedule.cancel' })}</button>
            <button
              onClick={handleBook}
              className={`px-4 py-2 rounded bg-green-600 text-white font-semibold ${loading ? 'opacity-60' : 'hover:bg-green-700'}`}
              disabled={loading}
            >{loading ? intl.formatMessage({ id: 'schedule.booking' }) : intl.formatMessage({ id: 'schedule.book' })}</button>
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
      const map: Record<string, { childName: string; bookingId: string }> = {};
      (allBookings as any[]).forEach((b: any) => {
        if (!b.cancelled) map[b.slotId] = { childName: b.childName, bookingId: b.id };
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
        onClose={() => setBookingSlot(null)}
        onBook={async (slotId: string, name: string) => {
          setBookingLoading(true);
          try {
            await bookSlot(slotId, name);
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