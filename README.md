# RDV App

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646cff.svg)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)

A modern, multi-class appointment booking application built with Vite, React, TypeScript, and Tailwind CSS. Features class-based scheduling, responsive design, full internationalization support (French, English, Dutch), and calendar integration with ICS export.

## ✨ Features Overview

### 🎓 Class-Based Appointment System
- **Multiple Class Management**: Create and manage multiple classes with unique colors and names
- **Per-Class Scheduling**: Each class has its own dedicated schedule and booking URL
- **Class-Specific URLs**: Shareable URLs for each class schedule (e.g., `/class/{classId}/{token}`)
- **Visual Class Identification**: Color-coded slots and badges for easy class recognition
- **Isolated Class Operations**: Reset or manage slots for individual classes without affecting others

### 📅 Advanced Appointment Management
- **Flexible Time Slot Creation**: Create multiple time slots in batch using date/time ranges
- **Configurable Duration**: Set appointment durations (10, 15, 20, or 30 minutes)
- **Smart Booking System**: Prevents double-booking with real-time availability checks
- **Child Name Tracking**: Each booking records the child's name for easy identification
- **Booking Status Display**: Visual indicators for available/booked slots with child names
- **ICS Calendar Export**: Download `.ics` files for booked appointments (Google/Apple/Outlook compatible)
- **Delete Bookings**: Users can delete/cancel their appointments with confirmation dialog
- **Automatic Slot Release**: Deleted bookings immediately make slots available again
- **Duplicate Prevention**: Automatic detection and prevention of overlapping slots per class

### 🌐 Complete Internationalization (i18n)
- **Multi-Language Support**: Full UI translation in French (default), English, and Dutch
- **61 Translation Keys**: All user-facing text is translatable including:
  - Admin interface labels and messages
  - Booking modal and forms
  - Error messages and confirmations
  - Status indicators and buttons
  - Delete confirmation dialogs
- **Localized Date/Time**: Native date and time formatting for each language
- **Language Persistence**: Selected language saved in browser storage
- **Easy Language Switching**: Dropdown selector with native language names

### 🎨 Modern, Responsive UI
- **Dark Theme**: Elegant dark color scheme optimized for readability
- **Mobile-First Design**: Fully responsive layout for all screen sizes
- **Tailwind CSS**: Utility-first styling with custom color palette (purple/gray theme)
- **Interactive Components**: Smooth hover effects, transitions, and loading states
- **Accessible Design**: Semantic HTML, ARIA labels, keyboard navigation support
- **Visual Feedback**: Loading states, confirmation messages, error displays

### � Admin Dashboard
- **Class Management**:
  - Create classes with custom names and colors
  - Delete classes (slots are unlinked, not deleted)
  - Visual class list with color indicators
  - Shareable class schedule URLs with copy-to-clipboard
- **Slot Creation**:
  - Batch create slots by date and time range
  - Assign slots to specific classes or leave unassigned
  - Visual class selector moved to top for easy access
  - Date picker with time input controls (with increment/decrement buttons)
- **Slot Management**:
  - View all available slots filtered by class
  - Delete individual slots
  - Reset entire class schedules (slots + bookings)
  - Color-coded slot display matching class colors
- **Configuration**:
  - Set global appointment duration
  - Visual duration selector (10/15/20/30 minutes)
  - Persistent configuration storage

### 📊 Real-Time Data Management
- **Automatic Refresh**: Data updates after bookings/changes
- **Conflict Prevention**: Server-side validation prevents race conditions
- **Error Recovery**: Graceful error handling with user-friendly messages
- **State Synchronization**: UI reflects current server state
- **Optimistic Updates**: Immediate UI feedback with rollback on errors

### 🔗 API Features
- **RESTful API**: Clean, well-documented endpoints
- **Swagger Documentation**: Interactive API docs at `/api/docs/ui`
- **OpenAPI Spec**: Full API specification at `/api/openapi.json`
- **Health Checks**: `/api/health` and `/api/ping` endpoints
- **CORS Support**: Configurable cross-origin access
- **JSON Responses**: Consistent response format with error handling

## 🛠️ Tech Stack

### Frontend
- **React 18**: Modern hooks-based architecture
- **TypeScript 5.4**: Full type safety and IntelliSense
- **Vite 7.1**: Lightning-fast HMR and build times
- **Tailwind CSS 3.4**: Utility-first styling
- **react-intl & i18next**: Complete internationalization
- **React Router**: Client-side routing
- **react-datepicker**: Date/time selection components

### Backend
- **Express.js**: Fast, minimalist web framework
- **Node.js**: Server-side JavaScript runtime
- **File-based Storage**: JSON file database (server/db.js)
- **ICS Generation**: RFC 5545 compliant calendar files
- **Swagger UI**: Interactive API documentation
- **CORS**: Configurable cross-origin resource sharing

### Database Schema
- **Classes**: `id`, `name`, `description`, `color`, `createdAt`, `updatedAt`
- **Slots**: `id`, `start`, `end`, `booked`, `removed`, `classId`, `createdAt`, `updatedAt`
- **Bookings**: `id`, `slotId`, `childName`, `cancelled`, `originalSlotStart`, `createdAt`, `updatedAt`
- **Config**: `id`, `rdvDurationMinutes`, `createdAt`, `updatedAt`

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

## 📁 Project Structure

```
rdvapp/
├── src/                           # Frontend source code
│   ├── components/                # Reusable React components
│   │   ├── Feed.tsx              # Main content feed component
│   │   ├── LeftNav.tsx           # Navigation sidebar
│   │   ├── RightPanel.tsx        # Right sidebar panel
│   │   └── StreamCard.tsx        # Stream card component
│   ├── pages/                     # Page components
│   │   ├── Admin.tsx             # Admin dashboard (class & slot management)
│   │   ├── ApiDocs.tsx           # API documentation viewer
│   │   ├── BookRdv.tsx           # General booking page
│   │   ├── ClassSchedule.tsx     # Class-specific schedule & booking
│   │   └── Home.tsx              # Landing page
│   ├── translations/              # i18n language files
│   │   ├── fr.ts                 # French translations (default)
│   │   ├── en.ts                 # English translations
│   │   └── nl.ts                 # Dutch translations
│   ├── api/                       # API client utilities
│   │   └── client.ts             # API methods (fetch, book, create, etc.)
│   ├── types/                     # TypeScript type definitions
│   │   └── api.ts                # API response types
│   ├── i18n.tsx                   # i18n configuration & language hook
│   ├── App.tsx                    # Main app component with routing
│   └── main.tsx                   # React app entry point
├── server/                        # Backend Express.js server
│   ├── index.js                  # Express app & API endpoints
│   └── db.js                     # File-based database operations
├── data/                          # JSON database files
│   ├── classes.json              # Class data
│   ├── slots.json                # Time slot data
│   ├── bookings.json             # Booking data
│   └── config.json               # App configuration
├── prisma/                        # Database schema (reference)
│   └── schema.prisma             # Prisma schema definition
├── public/                        # Static assets
├── openapi.yaml                   # OpenAPI/Swagger specification
├── vite.config.ts                # Vite configuration
├── tailwind.config.cjs           # Tailwind CSS configuration
└── package.json                   # Dependencies and scripts
```

## 🚀 API Endpoints

### Classes
- `GET /api/classes` - List all classes
- `POST /api/classes` - Create new class (body: `{ name, color, description? }`)
- `DELETE /api/classes/:id` - Delete class (unlinks slots)

### Slots
- `GET /api/slots` - List slots (query: `from`, `to`, `classId`)
- `POST /api/slots/timeframe` - Create multiple slots (body: `{ start, end, classId? }`)
- `DELETE /api/slots/:id` - Delete (soft remove) a slot

### Bookings
- `GET /api/bookings` - List all bookings
- `POST /api/bookings` - Create booking (body: `{ slotId, childName }`)
- `PUT /api/bookings/:id` - Reschedule booking (body: `{ slotId, childName }`)
- `DELETE /api/bookings/:id` - Cancel/delete booking (releases slot automatically)
- `GET /api/bookings/:id/ics` - Download ICS calendar file

### Configuration
- `GET /api/config` - Get current config
- `PUT /api/config` - Update config (body: `{ rdvDurationMinutes }`)

### Admin
- `POST /api/reset` - Reset entire database (body: `{ confirm: true }`)
- `POST /api/reset-class` - Reset class schedule (body: `{ classId, confirm: true }`)

### System
- `GET /api/health` - Health check endpoint
- `GET /api/ping` - Ping endpoint
- `GET /api/docs` - API documentation (JSON)
- `GET /api/docs/ui` - Swagger UI
- `GET /api/openapi.json` - OpenAPI specification

## 💻 Development Workflow

### Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server (frontend) - Port 5174
npm run start:server     # Start Express backend - Port 4000
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
node test-api.mjs       # Run E2E API tests
```

### Development Ports
- **Frontend**: http://localhost:5174 (Vite dev server)
- **Backend**: http://localhost:4000 (Express API)
- **API Docs**: http://localhost:4000/api/docs/ui (Swagger UI)

### Database Management

The app uses file-based JSON storage in the `data/` directory:

```bash
# Files are automatically created on first run
data/classes.json       # Class definitions
data/slots.json        # Time slots
data/bookings.json     # Bookings
data/config.json       # App configuration

# Reset entire database via API
curl -X POST http://localhost:4000/api/reset \
  -H "Content-Type: application/json" \
  -d '{"confirm": true}'

# Reset specific class schedule
curl -X POST http://localhost:4000/api/reset-class \
  -H "Content-Type: application/json" \
  -d '{"classId": "class-id", "confirm": true}'
```

### Adding a New Language

1. **Create translation file** in `src/translations/`:
   ```typescript
   // src/translations/es.ts
   export default {
     'app.title': 'Citas',
     'nav.home': 'Inicio',
     // ... add all 57 translation keys
   }
   ```

2. **Register language** in `src/i18n.tsx`:
   ```typescript
   const languages = [
     { code: 'fr', name: 'Français', flag: '🇫🇷' },
     { code: 'en', name: 'English', flag: '🇬🇧' },
     { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
     { code: 'es', name: 'Español', flag: '🇪🇸' }, // Add here
   ]
   ```

3. **Import translations** in `src/i18n.tsx`:
   ```typescript
   import esTranslations from './translations/es'
   // Add to messages object
   ```

### Common Development Tasks

#### Create a New Class
```bash
curl -X POST http://localhost:4000/api/classes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Yoga Class",
    "color": "#8B5CF6",
    "description": "Morning yoga sessions"
  }'
```

#### Create Time Slots for a Class
```bash
curl -X POST http://localhost:4000/api/slots/timeframe \
  -H "Content-Type: application/json" \
  -d '{
    "start": "2025-10-20T09:00:00Z",
    "end": "2025-10-20T12:00:00Z",
    "classId": "class-id-here"
  }'
```

#### Book an Appointment
```bash
curl -X POST http://localhost:4000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "slot-id-here",
    "childName": "Emma Smith"
  }'
```

### Testing the Application

Run the E2E test suite:
```bash
node test-api.mjs
```

This tests:
- ✅ Server connectivity
- ✅ Configuration management
- ✅ Class creation and deletion
- ✅ Slot creation and deletion
- ✅ Booking creation and cancellation
- ✅ ICS file generation
- ✅ Database reset functionality

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=4000                           # Backend server port
NODE_ENV=development                # Environment (development/production)

# Database
DATA_DIR=./data                     # Directory for JSON database files

# Application
BASE_URL=http://localhost:5174      # Frontend URL (for ICS files)
VITE_API_URL=                       # API URL (empty for same-origin in dev)

# CORS (optional)
CORS_ORIGIN=http://localhost:5174   # Allowed CORS origin
```

### Application Configuration

The appointment duration can be configured via:
1. **Admin UI**: Select from 10, 15, 20, or 30 minutes
2. **API**: `PUT /api/config` with `{ rdvDurationMinutes: 15 }`
3. **Direct Edit**: Modify `data/config.json`

### Vite Configuration

Key settings in `vite.config.ts`:
- **Dev Server Port**: 5174
- **API Proxy**: `/api` → `http://localhost:4000`
- **Build Output**: `dist/`
- **Public Path**: `/`

### Tailwind Configuration

Custom theme in `tailwind.config.cjs`:
- **Colors**: Purple/gray dark theme
- **Fonts**: System font stack
- **Breakpoints**: Standard responsive breakpoints

## Deployment

The application can be deployed in several ways depending on your needs:

### Option 1: Platform as a Service (Recommended for quick setup)

#### Deploying to Railway
1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Configure environment variables:
   ```
   DATABASE_URL=postgresql://... (Railway will provide this)
   PORT=4000
   BASE_URL=https://your-app-url
   ```
4. Deploy will automatically trigger on push to main

#### Deploying to Heroku
1. Install Heroku CLI: `brew install heroku`
2. Login: `heroku login`
3. Create app: `heroku create rdvapp-production`
4. Add PostgreSQL: `heroku addons:create heroku-postgresql:hobby-dev`
5. Configure environment:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set BASE_URL=$(heroku info -s | grep web_url | cut -d= -f2)
   ```
6. Deploy: `git push heroku main`

### Option 2: Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t rdvapp .
   ```

2. Run with Docker Compose:
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "4000:4000"
       environment:
         - DATABASE_URL=postgresql://db:5432/rdvapp
         - BASE_URL=http://localhost:4000
       depends_on:
         - db
     db:
       image: postgres:14
       environment:
         - POSTGRES_DB=rdvapp
         - POSTGRES_PASSWORD=yourpassword
   ```

3. Start services:
   ```bash
   docker-compose up -d
   ```

### Option 3: Traditional VPS Deployment

1. Prepare the server:
   ```bash
   # Install Node.js and PM2
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

2. Clone and setup:
   ```bash
   git clone https://github.com/kvaksin/rdvapp.git
   cd rdvapp
   npm install
   npm run build
   ```

3. Configure PM2:
   ```bash
   # ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'rdvapp',
       script: 'server/index.js',
       env: {
         NODE_ENV: 'production',
         DATABASE_URL: 'file:../prisma/production.db',
         PORT: 4000,
         BASE_URL: 'https://your-domain.com'
       }
     }]
   }
   ```

4. Start the application:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

5. Setup Nginx reverse proxy:
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:4000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
   }
   ```

### Production Setup

1. **Environment Configuration**
   ```bash
   # Create production environment file
   cp .env.example .env.production
   
   # Configure production values
   nano .env.production
   ```

2. **Database Setup**
   ```bash
   # Initialize PostgreSQL
   docker run -d --name rdvapp-db \
     -e POSTGRES_DB=rdvapp \
     -e POSTGRES_USER=rdvapp \
     -e POSTGRES_PASSWORD=your-password \
     -v pgdata:/var/lib/postgresql/data \
     postgres:14
   
   # Run migrations
   DATABASE_URL=postgresql://rdvapp:your-password@localhost:5432/rdvapp \
   npx prisma migrate deploy
   ```

3. **SSL Certificate**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Generate certificate
   sudo certbot --nginx -d your-domain.com
   ```

4. **Application Deployment**

   a. Using Render.com (Recommended):
   ```bash
   # Deploy to Render.com
   git push origin main
   ```
   The application will automatically deploy when changes are pushed to the main branch.
   You can also deploy manually from the Render dashboard.

   b. Using Docker:
   ```bash
   # Deploy with Docker
   ./scripts/deploy-docker.sh
   ```

   c. Using PM2:
   ```bash
   # Deploy with PM2
   ./scripts/deploy.sh
   ```

### Monitoring Setup

1. **Logging Configuration**
   ```bash
   # Create logs directory
   mkdir -p logs
   
   # Set permissions
   chmod 755 logs
   ```

2. **Prometheus Setup**
   ```bash
   # Install Prometheus
   wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
   tar xvf prometheus-2.45.0.linux-amd64.tar.gz
   
   # Copy configuration
   sudo cp monitoring/prometheus.yml /etc/prometheus/
   
   # Start Prometheus
   sudo systemctl start prometheus
   ```

3. **Grafana Setup**
   ```bash
   # Install Grafana
   sudo apt-get install -y apt-transport-https
   sudo apt-get install -y software-properties-common wget
   wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
   echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
   sudo apt-get update
   sudo apt-get install grafana
   
   # Import dashboard
   curl -X POST -H "Content-Type: application/json" -d @monitoring/grafana-dashboard.json \
     http://admin:admin@localhost:3000/api/dashboards/db
   ```

4. **Metrics and Alerts**
   - Access metrics: `http://your-domain.com/metrics`
   - Grafana dashboard: `http://your-domain.com:3000`
   - Prometheus: `http://your-domain.com:9090`

### Health Monitoring

1. **Application Health**
   - Endpoint: `/api/health`
   - Metrics: `/metrics`
   - Logs: `logs/application-*.log`

2. **Key Metrics**
   - Active bookings
   - API response times
   - Database query latency
   - Error rates
   - Resource usage

3. **Alert Configuration**
   - High error rate: > 5% of requests
   - API latency: > 500ms
   - Database latency: > 200ms
   - CPU usage: > 80%
   - Memory usage: > 90%

### Backup Strategy

1. **Database Backups**
   ```bash
   # Daily backup script
   ./scripts/backup-db.sh
   
   # Configure cron job
   0 0 * * * /path/to/rdvapp/scripts/backup-db.sh
   ```

2. **Log Rotation**
   - Logs are automatically rotated daily
   - Kept for 14 days
   - Compressed after rotation

### Security Measures

1. **Application Security**
   - Rate limiting: 100 requests/min per IP
   - CORS: Configured for specific domains
   - HTTPS: Enforced with HSTS
   - Security headers: CSP, XSS protection

2. **Infrastructure Security**
   - Firewall rules
   - Regular security updates
   - Access logging
   - Fail2ban configuration

### Performance Optimization

1. **Caching Strategy**
   - Static assets: 30 days
   - API responses: Varies by endpoint
   - Database queries: Redis cache

2. **CDN Configuration**
   - Static assets served via CDN
   - Cache invalidation on deploy
   - Geographic distribution

## 🎯 Usage Guide

### For Administrators

1. **Access Admin Dashboard**: Navigate to `/admin` or click "Admin" in navigation

2. **Create a Class**:
   - Enter class name (e.g., "Kindergarten A")
   - Choose a color (click the color picker)
   - Click "Add Class"
   - Copy the generated class schedule URL to share with parents

3. **Create Time Slots**:
   - Select a class from the dropdown at the top
   - Choose a date using the date picker
   - Set start and end times (use arrow buttons or type)
   - Click "Create Slots" - the system creates slots based on configured duration

4. **Manage Slots**:
   - View all slots for the selected class
   - Each slot shows date, time, and class name
   - Delete individual slots if needed
   - Reset entire class schedule using "Reset Slots for Selected Class" button

5. **Configure Settings**:
   - Set appointment duration (10, 15, 20, or 30 minutes)
   - Changes apply to newly created slots

### For Parents/Users

1. **Access Class Schedule**:
   - Use the class-specific URL provided by admin
   - Format: `/class/{classId}/{token}`

2. **Book an Appointment**:
   - View available time slots (shown in green)
   - Click "Book" on desired slot
   - Enter child's name in the modal
   - Click "Book" to confirm
   - Booked slots show "Booked — [Child Name]"

3. **Download Calendar Event**:
   - For booked appointments, click "Add to Calendar"
   - Downloads `.ics` file compatible with:
     - Google Calendar
     - Apple Calendar
     - Microsoft Outlook
     - Any RFC 5545 compliant calendar app

4. **Delete a Booking**:
   - For booked appointments, click the red "Delete" button
   - Confirm deletion in the dialog
   - The slot immediately becomes available again
   - All data is removed and cannot be recovered

5. **Change Language**:
   - Click language selector in navigation
   - Choose from French (🇫🇷), English (🇬🇧), or Dutch (🇳🇱)
   - Language preference is saved in browser

## 🔧 Troubleshooting

### Common Issues

**Problem**: Frontend can't connect to backend
```bash
# Solution: Check if backend is running
npm run start:server

# Verify backend is accessible
curl http://localhost:4000/api/ping
```

**Problem**: Slots not showing after creation
```bash
# Solution: Check browser console for errors
# Verify slots were created
curl http://localhost:4000/api/slots

# Clear browser cache and reload
```

**Problem**: Double-booking occurring
```bash
# Solution: This should not happen due to server-side validation
# Check data/slots.json and data/bookings.json for inconsistencies
# Reset if needed: POST /api/reset with {"confirm": true}
```

**Problem**: ICS file download not working
```bash
# Solution: Check backend logs
# Verify booking exists
curl http://localhost:4000/api/bookings

# Try accessing ICS URL directly
curl http://localhost:4000/api/bookings/{booking-id}/ics
```

**Problem**: Language not persisting
```bash
# Solution: Check browser localStorage
# Open DevTools > Application > Local Storage
# Look for 'language' key

# Clear if corrupted
localStorage.removeItem('language')
```

### Debug Mode

Enable debug logging:
```bash
# Start backend with debug output
DEBUG=express:* npm run start:server

# Or set in .env
DEBUG=express:*
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/rdvapp.git
   cd rdvapp
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Add translations for new UI text
   - Update types if modifying API
   - Test thoroughly

4. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Provide clear description of changes
   - Reference any related issues
   - Ensure all checks pass

### Development Guidelines

- **Code Style**: Follow existing TypeScript/React patterns
- **Translations**: Add keys to all language files (fr, en, nl)
- **Types**: Maintain type safety, update `src/types/api.ts` as needed
- **API**: Document new endpoints in `openapi.yaml`
- **Testing**: Run `node test-api.mjs` before submitting PR

### Branch Protection Rules

The `main` branch is protected:

- ✅ Pull Request required (no direct pushes)
- ✅ At least 1 reviewer approval needed
- ✅ All status checks must pass
- ✅ Branches must be up-to-date
- ✅ Conversations must be resolved
- ✅ Rules apply to administrators

## 📝 Changelog

### Recent Updates

**October 2025 - Latest**
- ✨ **NEW**: Delete booking functionality with confirmation dialogs
- ✨ **NEW**: Automatic slot release when bookings are deleted
- ✨ Added complete i18n support (French, English, Dutch - 61 translation keys)
- ✨ Implemented class-based appointment system
- ✨ Added ICS calendar export for bookings
- ✨ Per-class schedule URLs and management
- ✨ Child name tracking on bookings
- ✨ Updated Render.com deployment configuration (persistent storage, port 10000)
- 🐛 Fixed slot duplication issues
- 🐛 Improved error handling and user feedback
- 🎨 Enhanced UI with better visual feedback and delete buttons
- 📚 Updated documentation with comprehensive guides

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
