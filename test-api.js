const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4000/api';

async function testApi() {
  try {
    console.log('🧪 Testing RDV API endpoints...\n');

    // 1. Test ping
    console.log('Testing /ping...');
    const pingRes = await fetch(`${API_BASE}/ping`);
    console.log('Ping response:', await pingRes.json(), '\n');

    // 2. Test config
    console.log('Testing /config...');
    const configRes = await fetch(`${API_BASE}/config`);
    const config = await configRes.json();
    console.log('Initial config:', config);

    const newConfig = await fetch(`${API_BASE}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rdvDurationMinutes: 20 })
    }).then(r => r.json());
    console.log('Updated config:', newConfig, '\n');

    // 3. Test timeframe creation
    console.log('Testing /slots/timeframe...');
    const now = new Date();
    const later = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
    const timeframeRes = await fetch(`${API_BASE}/slots/timeframe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: now.toISOString(),
        end: later.toISOString()
      })
    });
    const slots = await timeframeRes.json();
    console.log('Created slots:', slots);

    // 4. Test listing slots
    console.log('\nTesting GET /slots...');
    const allSlots = await fetch(`${API_BASE}/slots`).then(r => r.json());
    console.log('All slots:', allSlots);

    // 5. Test booking creation
    if (allSlots.length > 0) {
      console.log('\nTesting POST /bookings...');
      const bookingRes = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: allSlots[0].id,
          childName: 'Test Child'
        })
      });
      const booking = await bookingRes.json();
      console.log('Created booking:', booking);

      // 6. Test listing bookings
      console.log('\nTesting GET /bookings...');
      const bookings = await fetch(`${API_BASE}/bookings`).then(r => r.json());
      console.log('All bookings:', bookings);

      // 7. Test booking cancellation
      console.log('\nTesting DELETE /bookings/:id...');
      const cancelRes = await fetch(`${API_BASE}/bookings/${booking.booking.id}`, {
        method: 'DELETE'
      });
      console.log('Booking cancelled:', await cancelRes.json());
    }

    // 8. Test slot deletion
    if (allSlots.length > 0) {
      console.log('\nTesting DELETE /slots/:id...');
      const deleteSlotRes = await fetch(`${API_BASE}/slots/${allSlots[0].id}`, {
        method: 'DELETE'
      });
      console.log('Slot deleted:', await deleteSlotRes.json());
    }

    // 9. Test reset
    console.log('\nTesting POST /reset...');
    const resetRes = await fetch(`${API_BASE}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true })
    });
    console.log('Reset result:', await resetRes.json());

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Error during tests:', error);
  }
}

// Run tests
testApi();