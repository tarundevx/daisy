module.exports = {
  id: 'memory_leak_detection',
  title: 'Memory Leak Investigation',
  description: 'The worker node is crashing every 30 minutes with an Out Of Memory (OOM) error. Identify the leak.',
  difficulty: 'advanced',
  commandMap: {
    'top': 'PID USER PR NI VIRT RES SHR S %CPU %MEM TIME+ COMMAND\n1024 root 20 0 12.2g 7.8g 45m S 1.0 98.0 45:12.11 node index.js',
    'htop': 'Memory: [||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||] 7.8G/8.0G',
    'ps aux --sort=-%mem': 'USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND\nroot 1024 1.5 98.2 12245m 7845m ? S 10:00 45:12 node index.js',
    'journalctl -xe': 'Apr 05 15:45:01 kernel: [3412.4] oom-kill: gfp_mask=0x1000, order=0, oom_score_adj=0\nApr 05 15:45:01 kernel: Out of memory: Killed process 1024 (node)',
    'cat server.js': 'const cache = []; \napp.get("/data", (req, res) => { cache.push(Buffer.alloc(10 * 1024 * 1024)); res.send("OK"); });',
    'sed -i "s/cache.push/\\/\\/ cache.push/" server.js': 'Code patched: Memory leak point (buffer push) commented out.',
    'systemctl restart node-app': 'Restarting node-app...\nService is now stable and memory usage is low.'
  },
  isSolved: (history) => (history.includes('sed -i "s/cache.push/\\/\\/ cache.push/" server.js') || history.includes('sed -i "s/cache.push/\\/\\/cache.push/" server.js')) && history.includes('restart')
};
