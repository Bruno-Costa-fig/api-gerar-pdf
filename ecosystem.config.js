module.exports = {
  apps: [{
    name: 'app-gerador-documentos',
    script: 'index.js',
    node_args: '--expose-gc --max-old-space-size=512 --max-semi-space-size=64', // ✅ limita heap e expõe gc
    max_memory_restart: '700M',
    min_uptime: '10s',
    max_restarts: 5,
    restart_delay: 2000,
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
}