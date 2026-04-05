module.exports = {
  id: 'db_connection_pool_exhaustion',
  title: 'Database Connection Pool Exhaustion',
  description: 'Your API endpoints are becoming extremely slow (latency > 5s). Investigate the database connections.',
  difficulty: 'intermediate',
  commandMap: {
    'ls': 'app/ models/ node_modules/ package.json server.js utils/',
    'df -h': 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        80G   12G   68G  15% /',
    'free -m': '              total        used        free      shared  buff/cache   available\nMem:           8192        2048        4096         128        2048        5120\nSwap:          4096         512        3584',
    'journalctl -u api-server': '-- Logs begin at Mon 2026-04-05 10:00:00 UTC --\nApr 05 15:30:22 api-server: [WRN] Connection pool limit reached (max: 10). Requests queued.\nApr 05 15:30:25 api-server: [ERR] Timeout waiting for connection from pool: 5000ms\nApr 05 15:31:01 api-server: [INF] Active connections: 10, Queued: 45',
    'pg_isready': '/var/run/postgresql:5432 - accepting connections',
    'cat server.js': 'const pool = new Pool({ max: 10, idleTimeoutMillis: 30000 });\nmodule.exports = { query: (text, params) => pool.query(text, params) };',
    'sed -i "s/max: 10/max: 50/" server.js': 'Config updated: system-wide connection pool limit increased to 50.',
    'systemctl restart api-server': 'Restarting api-server...\nAPI server is now online with updated pool configuration.'
  },
  isSolved: (history) => history.includes('sed -i "s/max: 10/max: 50/" server.js') || history.includes('sed -i \'s/max: 10/max: 50/\' server.js')
};
