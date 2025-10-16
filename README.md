# RDV App

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646cff.svg)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)

A modern appointment booking application built with Vite, React, TypeScript, and Tailwind CSS. Features a responsive design, internationalization support, and calendar integration.

![RDV App Screenshot](./public/screenshot.png)

[Live Demo](https://rdvapp.example.com) | [Documentation](https://rdvapp.example.com/docs)

## Features

### 🌐 Internationalization
- Support for multiple languages (French, Dutch, English)
- Language persistence across sessions
- Localized date and time formats
- Native language names and flags in language selector
- RTL support ready

### 📱 Responsive Design
- Mobile-first approach
- Adaptive layout for all screen sizes
- Touch-friendly interface
- Optimized navigation for mobile devices
- Responsive components and typography

### 📅 Appointment Management
- Create and manage time slots
- Book appointments in available slots
- Calendar (.ics) file export
- Multiple reminder options
- Configurable appointment durations

### 🎨 Modern UI
- Clean, minimalist design
- Dark theme
- Smooth transitions and animations
- Accessible components
- Touch-friendly interactions

## Tech Stack

- **Frontend:**
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - react-intl & i18next for internationalization

- **Backend:**
  - Express.js
  - Prisma ORM
  - SQLite database
  - ICS calendar integration

## Getting Started

### Prerequisites
- Node.js 14+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kvaksin/rdvapp.git
   cd rdvapp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Initialize the database:
   ```bash
   npx prisma migrate reset --force
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

## Project Structure

```
rdvapp/
├── src/                    # Frontend source code
│   ├── components/         # Reusable React components
│   ├── pages/             # Page components
│   ├── translations/      # Language files
│   ├── api/              # API client utilities
│   └── types/            # TypeScript definitions
├── server/                # Backend Express.js server
├── prisma/               # Database schema and migrations
└── public/              # Static assets
```

## Development Workflow

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run start:server` - Start backend server

### Database Management

- Update schema: Edit `prisma/schema.prisma`
- Create migration: `npx prisma migrate dev --name migration_name`
- Reset database: `npx prisma migrate reset --force`

### Adding a New Language

1. Create translation file in `src/translations/`
2. Add language metadata in `src/i18n.tsx`
3. Add translations for all keys

## Environment Configuration

Required environment variables:
- `DATABASE_URL`: SQLite database path
- `PORT`: Backend server port (default: 4000)
- `BASE_URL`: Application base URL for ICS files

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Branch Protection Rules

The `main` branch is protected with the following rules:

- **Pull Request Required**
  - At least 1 reviewer approval needed
  - Stale approvals are dismissed when new commits are pushed

- **Status Checks**
  - All status checks must pass before merging:
    - Build verification
    - Test suite completion
    - Deployment checks
    - Database migration validation
  - Branches must be up-to-date with main

- **Additional Protection**
  - All conversations must be resolved
  - Direct pushes to `main` are restricted
  - Rules apply to administrators

These rules ensure code quality and maintain a stable main branch. Please ensure your pull requests meet these requirements before requesting a review.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
