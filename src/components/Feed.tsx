import { useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { fetchBookings, cancelBooking } from '../api/client'

interface GroupedBookings {
  [key: string]: Array<{
    id: string;
    childName: string;
    originalSlotStart: string;
    time: string;
  }>;
}

export default function Feed() {
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => { load() }, [])

  async function load() {
    const b = await fetchBookings()
    setBookings(b)
  }

  async function handleCancel(id: string) {
    await cancelBooking(id)
    load()
  }

  const intl = useIntl()
  const locale = intl.locale

  const groupedBookings = bookings
    .filter(b => !b.cancelled)
    .reduce((groups: GroupedBookings, booking) => {
      const date = new Date(booking.originalSlotStart)
      const dateStr = date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      const timeStr = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
      
      if (!groups[dateStr]) {
        groups[dateStr] = []
      }
      
      groups[dateStr].push({
        ...booking,
        time: timeStr
      })
      
      // Sort bookings within each day by time
      groups[dateStr].sort((a, b) => 
        new Date(a.originalSlotStart).getTime() - new Date(b.originalSlotStart).getTime()
      )
      
      return groups
    }, {})

  // Sort days chronologically
  const sortedDays = Object.keys(groupedBookings).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  const activeBookings = bookings.filter(b => !b.cancelled)
  const bookingCount = activeBookings.length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-lg font-semibold">
          <FormattedMessage id="bookings.title" defaultMessage="Appointments" />
        </h2>
        <div className="text-sm text-gray-400">
          {bookingCount === 0 && <FormattedMessage id="bookings.none" defaultMessage="No appointments" />}
          {bookingCount === 1 && <FormattedMessage id="bookings.countSingular" defaultMessage="One appointment" />}
          {bookingCount > 1 && (
            <FormattedMessage 
              id="bookings.countPlural" 
              defaultMessage="{count} appointments" 
              values={{ count: bookingCount }} 
            />
          )}
        </div>
      </div>

      <div className="space-y-6">
        {sortedDays.map(day => (
          <div key={day} className="space-y-3">
            <h3 className="text-md font-medium text-gray-300">{day}</h3>
            {groupedBookings[day].map(b => (
              <div key={b.id} className="bg-gray-800 p-3 rounded-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="font-semibold">{b.childName}</div>
                    <div className="text-sm text-gray-400">
                      <FormattedMessage 
                        id="bookings.time" 
                        defaultMessage="{time}" 
                        values={{ time: b.time }} 
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a 
                      className="text-sm text-blue-300 hover:text-blue-200 transition-colors" 
                      href={`http://localhost:4000/api/bookings/${b.id}/ics`} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      <FormattedMessage id="bookings.addToCalendar" defaultMessage="Add to calendar" />
                    </a>
                    <button 
                      onClick={() => handleCancel(b.id)} 
                      className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md text-sm transition-colors"
                    >
                      <FormattedMessage id="bookings.cancel" defaultMessage="Cancel" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
