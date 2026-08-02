// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'shop-api',
    script: './dist/main.js',
    cwd: '/home/kenzings/shop/be-nestjs',
    instances: 1,          // Cluster mode: tận dụng tất cả CPU cores
    exec_mode: 'cluster',      // QUAN TRỌNG: NestJS hỗ trợ cluster
    autorestart: true,
    watch: false,               // TẮT watch trên production
    max_memory_restart: '512M',   // Auto restart nếu rò rỉ bộ nhớ
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    // Logs
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: 'home/kenzings/.pm2/var/log/pm2/shop-api-error.log',
    out_file: 'home/kenzings/.pm2/var/log/pm2/shop-api-out.log',
    merge_logs: true,
  }]
}
