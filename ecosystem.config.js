module.exports = {
  apps: [{
    name: 'app-gerador-documentos',
    script: 'index.js',
    node_args: '--expose-gc --max-old-space-size=512', // ✅ limita heap e expõe gc
    max_memory_restart: '600MB'
  }]
}