import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api';

async function testEndpoint(name, fn) {
    try {
        console.log(`\n🧪 Testing ${name}...`);
        const result = await fn();
        console.log('✅ Success:', result);
        return result;
    } catch (error) {
        console.error(`❌ Failed ${name}:`, error.message);
        throw error;
    }
}

async function runTests() {
    try {
        // 1. Test ping
        await testEndpoint('GET /ping', async () => {
            const res = await fetch(`${API_BASE}/ping`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        });

        // 2. Test config
        const config = await testEndpoint('GET /config', async () => {
            const res = await fetch(`${API_BASE}/config`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        });

        await testEndpoint('PUT /config', async () => {
            const res = await fetch(`${API_BASE}/config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rdvDurationMinutes: 20 })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        });

        // 3. Create timeframe
        const now = new Date();
        const later = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later

        const timeframeResult = await testEndpoint('POST /slots/timeframe', async () => {
            const res = await fetch(`${API_BASE}/slots/timeframe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start: now.toISOString(),
                    end: later.toISOString()
                })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        });

        // 4. List slots
        const slots = await testEndpoint('GET /slots', async () => {
            const res = await fetch(`${API_BASE}/slots`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        });

        if (slots.length === 0) {
            throw new Error('No slots available for testing bookings');
        }

        // 5. Create booking
        const booking = await testEndpoint('POST /bookings', async () => {
            const res = await fetch(`${API_BASE}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slotId: slots[0].id,
                    childName: 'Test Child'
                })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        });

        // 6. List bookings
        await testEndpoint('GET /bookings', async () => {
            const res = await fetch(`${API_BASE}/bookings`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        });

        // 7. Download ICS
        await testEndpoint('GET /bookings/:id/ics', async () => {
            const res = await fetch(`${API_BASE}/bookings/${booking.booking.id}/ics`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.headers.get('content-type');
        });

        // 8. Cancel booking
        await testEndpoint('DELETE /bookings/:id', async () => {
            const res = await fetch(`${API_BASE}/bookings/${booking.booking.id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        });

        // 9. Delete slot
        await testEndpoint('DELETE /slots/:id', async () => {
            const res = await fetch(`${API_BASE}/slots/${slots[0].id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        });

        // 10. Reset everything
        await testEndpoint('POST /reset', async () => {
            const res = await fetch(`${API_BASE}/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirm: true })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        });

        console.log('\n✅ All tests passed successfully!\n');

    } catch (error) {
        console.error('\n❌ Tests failed:', error.message);
        process.exit(1);
    }
}

// Add a check to ensure server is running
fetch(`${API_BASE}/ping`)
    .then(() => {
        console.log('🚀 Server is running, starting tests...\n');
        runTests();
    })
    .catch((error) => {
        console.error('❌ Server is not running. Please start the server first:');
        console.error('   npm run start:server');
        process.exit(1);
    });