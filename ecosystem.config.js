module.exports = {
  apps: [{
    name: 'rdvapp',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 4000,
      BASE_URL: 'http://localhost:4000'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000,
      BASE_URL: 'https://rdvapp.example.com'
    }
  }]
};