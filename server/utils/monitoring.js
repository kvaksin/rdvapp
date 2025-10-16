const promBundle = require('express-prom-bundle');
const client = require('prom-client');

// Create custom metrics
const databaseLatency = new client.Histogram({
  name: 'rdvapp_database_query_duration_seconds',
  help: 'Database query latency in seconds',
  labelNames: ['operation']
});

const activeBookings = new client.Gauge({
  name: 'rdvapp_active_bookings_total',
  help: 'Total number of active bookings'
});

const bookingOperations = new client.Counter({
  name: 'rdvapp_booking_operations_total',
  help: 'Number of booking operations',
  labelNames: ['operation', 'status']
});

// Configure prometheus middleware
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { app: 'rdvapp' },
  promClient: {
    collectDefaultMetrics: {
      timeout: 5000
    }
  }
});

module.exports = {
  metricsMiddleware,
  metrics: {
    databaseLatency,
    activeBookings,
    bookingOperations
  }
};