const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

async function readJSON(filename) {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function writeJSON(filename, data) {
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
}

class JsonDB {
  async findSlots(where = {}) {
    const { slots } = await readJSON('slots.json') || { slots: [] };
    return slots.filter(slot => {
      if (where.start?.gte && new Date(slot.start) < new Date(where.start.gte)) return false;
      if (where.end?.lte && new Date(slot.end) > new Date(where.end.lte)) return false;
      return !slot.removed;
    }).sort((a, b) => new Date(a.start) - new Date(b.start));
  }

  async createSlot(data) {
    const { slots } = await readJSON('slots.json') || { slots: [] };
    const id = Math.random().toString(36).substr(2, 9);
    const slot = { id, ...data, booked: false, removed: false };
    slots.push(slot);
    await writeJSON('slots.json', { slots });
    return slot;
  }

  async updateSlot(id, data) {
    const { slots } = await readJSON('slots.json') || { slots: [] };
    const index = slots.findIndex(s => s.id === id);
    if (index === -1) return null;
    slots[index] = { ...slots[index], ...data };
    await writeJSON('slots.json', { slots });
    return slots[index];
  }

  async findBookings() {
    const { bookings } = await readJSON('bookings.json') || { bookings: [] };
    return bookings.filter(b => !b.cancelled).sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
  }

  async createBooking(data) {
    const { bookings } = await readJSON('bookings.json') || { bookings: [] };
    const id = Math.random().toString(36).substr(2, 9);
    const booking = { 
      id, 
      ...data, 
      bookedAt: new Date().toISOString(),
      cancelled: false 
    };
    bookings.push(booking);
    await writeJSON('bookings.json', { bookings });
    return booking;
  }

  async findBookingById(id) {
    const { bookings } = await readJSON('bookings.json') || { bookings: [] };
    return bookings.find(b => b.id === id);
  }

  async updateBooking(id, data) {
    const { bookings } = await readJSON('bookings.json') || { bookings: [] };
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) return null;
    bookings[index] = { ...bookings[index], ...data };
    await writeJSON('bookings.json', { bookings });
    return bookings[index];
  }

  async getConfig() {
    const config = await readJSON('config.json');
    return config || { appointmentDuration: 30 };
  }

  async updateConfig(data) {
    await writeJSON('config.json', data);
    return data;
  }

  async reset() {
    await writeJSON('slots.json', { slots: [] });
    await writeJSON('bookings.json', { bookings: [] });
    await writeJSON('config.json', { appointmentDuration: 30 });
  }
}

module.exports = { JsonDB };