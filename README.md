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
