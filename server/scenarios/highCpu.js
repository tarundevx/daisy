module.exports = {
  id: "high_cpu",
  title: "CPU Spike — Server Crawling",
  difficulty: "hard",
  timeLimit: 1200,
  brief: "PagerDuty: CPU at 99% for last 12 minutes on prod-05. Application response times degraded from 45ms to 8000ms. Some requests timing out. This is a HARD scenario — the root cause is non-obvious. Find and fix it without restarting the app (data loss risk). Logged in as deploy on prod-05.",
  successCommand: "kill 9891", // logic dynamic 
  commandMap: {
    "top": "top - 11:42:03 up 14 days, 2:41,  1 user,  load average: 7.84, 7.91, 7.88\nTasks: 142 total,   4 running, 138 sleeping\n%Cpu(s): 98.2 us,  0.9 sy,  0.0 ni,  0.4 id\nMiB Mem:   7962.4 total,    412.3 free,   6891.2 used\n\n  PID USER     PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n 9234 app      20   0  897248 782344  12312 R  96.2  9.6  12:34.78 node\n 1234 nginx    20   0   55296   4096   2048 S   0.4  0.1   0:01.23 nginx\n 1001 root     20   0   16952   1540   1280 S   0.0  0.0   0:00.01 systemd",
    "htop": "top - 11:42:03 up 14 days, 2:41,  1 user,  load average: 7.84, 7.91, 7.88\nTasks: 142 total,   4 running, 138 sleeping\n%Cpu(s): 98.2 us,  0.9 sy,  0.0 ni,  0.4 id\nMiB Mem:   7962.4 total,    412.3 free,   6891.2 used\n\n  PID USER     PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n 9234 app      20   0  897248 782344  12312 R  96.2  9.6  12:34.78 node\n 1234 nginx    20   0   55296   4096   2048 S   0.4  0.1   0:01.23 nginx\n 1001 root     20   0   16952   1540   1280 S   0.0  0.0   0:00.01 systemd",
    "ps aux --sort=-%cpu": "USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\napp       9234 96.2  9.6 897248 782344 ?   Ssl  09:00  12:34 node /opt/app/server.js\nnginx     1234  0.4  0.1  55296   4096 ?   Ss   09:00   0:01 nginx: master process",
    "strace -p 9234 -c": "strace: Process 9234 attached\n% time     seconds  usecs/call     calls    errors syscall\n------ ----------- ----------- --------- --------- ----------------\n 99.1    12.443892         124    100352           write\n  0.5     0.062341           6      9876           gettimeofday\n  0.4     0.048921           5      9821           clock_gettime\n------ ----------- ----------- --------- --------- ----------------\n100.0    12.555154                 120049           total\n(process is writing extremely frequently — likely tight loop logging)",
    "strace -p 9234": "strace: Process 9234 attached\n% time     seconds  usecs/call     calls    errors syscall\n------ ----------- ----------- --------- --------- ----------------\n 99.1    12.443892         124    100352           write\n  0.5     0.062341           6      9876           gettimeofday\n  0.4     0.048921           5      9821           clock_gettime\n------ ----------- ----------- --------- --------- ----------------\n100.0    12.555154                 120049           total\n(process is writing extremely frequently — likely tight loop logging)",
    "cat /var/log/app/app.log | grep -c 'ERROR'": "847291",
    "tail -f /var/log/app/app.log": "2024-01-15T11:41:59.001Z [DEBUG] Health check: ok\n2024-01-15T11:41:59.002Z [DEBUG] Health check: ok\n2024-01-15T11:41:59.003Z [DEBUG] Health check: ok\n2024-01-15T11:41:59.004Z [DEBUG] Health check: ok\n... (repeating hundreds of times per second)",
    "crontab -l": "* * * * * /opt/app/scripts/health_monitor.sh >> /var/log/app/app.log 2>&1",
    "crontab -l -u app": "* * * * * /opt/app/scripts/health_monitor.sh >> /var/log/app/app.log 2>&1",
    "cat /opt/app/scripts/health_monitor.sh": "#!/bin/bash\n# Health monitor - runs every minute\nwhile true; do\n  curl -s localhost:3001/health >> /var/log/app/app.log\n  sleep 0\ndone\n# BUG: sleep 0 causes infinite loop, should be sleep 60",
    "ps aux | grep health_monitor": "app       9891 96.1  0.1  4128  832 ?  S  11:29  12:31 bash /opt/app/scripts/health_monitor.sh",
    "kill 9891": "",
    "kill -9 9891": "",
    "crontab -e -u app": "[Simulated editor opened: crontab for app user]\n[Current entry: * * * * * /opt/app/scripts/health_monitor.sh >> /var/log/app/app.log 2>&1]\n[You changed it to: */5 * * * * /opt/app/scripts/health_monitor.sh >> /var/log/app/app.log 2>&1]\n[Crontab saved]",
    "nano /opt/app/scripts/health_monitor.sh": "[Simulated editor: you fixed 'sleep 0' to 'sleep 60']\n[File saved]",
    "vim /opt/app/scripts/health_monitor.sh": "[Simulated editor: you fixed 'sleep 0' to 'sleep 60']\n[File saved]"
  }
};
