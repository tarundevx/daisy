module.exports = {
  id: "permission_denied",
  title: "Upload Service Failing — Permission Denied",
  difficulty: "standard",
  timeLimit: 900,
  brief: "Support ticket from 30 minutes ago: 'All file uploads returning 500 error. Error log says permission denied.' The upload service runs as user 'uploads_svc'. You need to diagnose and fix the filesystem permissions without breaking security. Do NOT use chmod 777. Logged in as deploy on prod-04.",
  successCommand: "systemctl restart uploads",
  commandMap: {
    "tail -n 50 /var/log/app/error.log": "2024-01-15T11:15:23.456Z [ERROR] Failed to save upload: EACCES: permission denied, open '/var/data/uploads/1705316123_document.pdf'\n2024-01-15T11:15:24.891Z [ERROR] Failed to save upload: EACCES: permission denied, open '/var/data/uploads/1705316124_image.jpg'\n2024-01-15T11:15:25.234Z [ERROR] Failed to save upload: EACCES: permission denied, open '/var/data/uploads/1705316125_report.xlsx'",
    "cat /var/log/app/error.log": "2024-01-15T11:15:25.234Z [ERROR] Failed to save upload: EACCES: permission denied, open '/var/data/uploads/1705316125_report.xlsx'",
    "ls -la /var/data/": "total 16\ndrwxr-xr-x 3 root         root  4096 Jan 10 09:00 .\ndrwxr-xr-x 8 root         root  4096 Jan 10 09:00 ..\ndrwxr-x--- 2 deploy_svc   www   4096 Jan 15 09:00 uploads",
    "ls -la /var/data/uploads/": "total 8\ndrwxr-x--- 2 deploy_svc www  4096 Jan 15 09:00 .\ndrwxr-xr-x 3 root       root 4096 Jan 10 09:00 ..",
    "id": "uid=1003(deploy) gid=1003(deploy) groups=1003(deploy),27(sudo),1010(www)",
    "ps aux | grep upload": "uploads_svc   9234  0.1  2.3  512MB  94MB ?  Ssl  09:00   0:23 /usr/bin/node /opt/uploads/server.js",
    "ps aux | grep uploads_svc": "uploads_svc   9234  0.1  2.3  512MB  94MB ?  Ssl  09:00   0:23 /usr/bin/node /opt/uploads/server.js",
    "cat /etc/systemd/system/uploads.service": "[Service]\nUser=uploads_svc\nGroup=uploads_svc\nWorkingDirectory=/opt/uploads\nExecStart=/usr/bin/node /opt/uploads/server.js",
    "chown uploads_svc:uploads_svc /var/data/uploads/": "",
    "chmod 755 /var/data/uploads/": "",
    "chmod 777 /var/data/uploads/": "Warning: chmod 777 applied. This is a security risk — world-writable directories allow any user to write to or delete files in this directory. Consider using chmod 755 with proper ownership instead.",
    "systemctl restart uploads": "● uploads.service - still failing (permission denied)", // overwritten dynamically in logic
    "systemctl restart uploads.service": "● uploads.service - still failing (permission denied)",
    "curl localhost:4000/health": '{"status":"ok","uploadDir":"/var/data/uploads","writable":false}',
    "getent passwd uploads_svc": "uploads_svc:x:1008:1008:Upload Service User:/home/uploads_svc:/bin/false",
    "groups uploads_svc": "uploads_svc : uploads_svc"
  }
};
