# Copilot Instructions for rdvapp

## Project Overview
RDV (Rendez-vous) application built with Vite + React + TypeScript + Tailwind, featuring a booking system with an Express.js backend and Prisma ORM.

## Key Architecture Components

### Frontend (`src/`)
- React SPA with internationalization (i18n) support for French (default), Dutch, and English
- Key components:
  - `App.tsx`: Main layout with nav and view management
  - `pages/`: Contains `BookRdv`, `Admin`, and `ApiDocs` views
  - `components/`: Reusable UI components (Feed, LeftNav, RightPanel, StreamCard)

### Backend (`server/`)
- Express.js API server (port 4000 by default)
- Prisma ORM with SQLite database
- Key models (`prisma/schema.prisma`):
  - `Slot`: Available time slots
  - `Booking`: Reservations linked to slots
  - `Config`: System configuration (e.g., appointment duration)

## Development Workflow

### Setup
```bash
npm install
npx prisma migrate reset --force  # Reset database
npm run dev                       # Start dev server
```

### Key API Endpoints
- `GET /api/slots`: List available slots
- `POST /api/bookings`: Create booking (transactional)
- `PUT /api/bookings/:id`: Reschedule booking
- `GET /api/bookings/:id/ics`: Generate calendar file

API documentation available at `/api/docs/ui` (Swagger UI) when running.

## Project Patterns

### State Management
- Uses React's built-in state management with useState
- No global state management library

### Database Patterns
- Soft deletes used for slots (`removed: Boolean`)
- Transactions for booking operations to ensure data consistency
- Slot status tracked via `booked` flag, not foreign key

### Internationalization
- Uses react-intl and i18next
- Translations in `src/translations/{fr,nl,en}.ts`
- French (`fr`) is the default locale

## Common Tasks

### Adding New Time Slots
```typescript
POST /api/slots/timeframe
{
  "start": "2025-10-16T10:00:00Z",
  "end": "2025-10-16T16:00:00Z"
}
```

### Making Database Changes
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name migration_name`
3. Reset with `npx prisma migrate reset --force` if needed

## File Organization
- Frontend routes/pages in `src/pages/`
- API client utilities in `src/api/`
- Shared types in `src/types/`
- Backend API in `server/index.js`
- Database schema in `prisma/schema.prisma`