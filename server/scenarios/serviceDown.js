module.exports = {
  id: "service_down",
  title: "API Service Refuses to Start",
  difficulty: "standard",
  timeLimit: 900,
  brief: "After a deployment 8 minutes ago, the api.service refuses to start. The previous engineer left a note: 'deployed v2.4.1, something broke'. The staging deploy worked fine. Production is returning 503 errors on all endpoints. Fix it. Logged in as deploy on prod-03.",
  successCommand: "systemctl start api", // The logic expects the fix to be applied and start successful
  commandMap: {
    "systemctl status api": "● api.service - REST API Service\n   Loaded: loaded (/etc/systemd/system/api.service; enabled)\n   Active: failed (Result: exit-code) since Mon 2024-01-15 11:20:00 UTC; 8min ago\n  Process: 7821 ExecStart=/usr/bin/python3 /opt/api/app.py (code=exited, status=1/FAILURE)\n\nJan 15 11:20:00 prod-03 systemd[1]: api.service: Main process exited, code=exited, status=1/FAILURE\nJan 15 11:20:00 prod-03 systemd[1]: Failed to start REST API Service.",
    "systemctl start api": "Job for api.service failed because the control process exited with error code.\nSee 'journalctl -xe' for details.",
    "journalctl -u api": "-- Logs begin at Mon 2024-01-15 09:00:00 UTC --\nJan 15 11:20:00 prod-03 python3[7821]: Traceback (most recent call last):\nJan 15 11:20:00 prod-03 python3[7821]:   File \"/opt/api/app.py\", line 4, in <module>\nJan 15 11:20:00 prod-03 python3[7821]:     from config import settings\nJan 15 11:20:00 prod-03 python3[7821]:   File \"/opt/api/config.py\", line 12, in <module>\nJan 15 11:20:00 prod-03 python3[7821]:     DATABASE_URL = os.environ['DATABASE_URL']\nJan 15 11:20:00 prod-03 python3[7821]: KeyError: 'DATABASE_URL'\nJan 15 11:20:00 prod-03 systemd[1]: api.service: Main process exited, code=exited, status=1/FAILURE",
    "journalctl -u api -n 50": "-- Logs begin at Mon 2024-01-15 09:00:00 UTC --\nJan 15 11:20:00 prod-03 python3[7821]: Traceback (most recent call last):\nJan 15 11:20:00 prod-03 python3[7821]: KeyError: 'DATABASE_URL'\nJan 15 11:20:00 prod-03 systemd[1]: api.service: Main process exited, code=exited, status=1/FAILURE",
    "cat /etc/systemd/system/api.service": "[Unit]\nDescription=REST API Service\nAfter=network.target postgresql.service\n\n[Service]\nType=simple\nUser=api\nWorkingDirectory=/opt/api\nEnvironmentFile=/etc/api/production.env\nExecStart=/usr/bin/python3 /opt/api/app.py\nRestart=on-failure\nRestartSec=5\n\n[Install]\nWantedBy=multi-user.target",
    "ls /etc/api/": "production.env.bak  staging.env  production.env.example",
    "cat /etc/api/production.env.example": "DATABASE_URL=postgresql://api_user:password@localhost:5432/apidb\nREDIS_URL=redis://localhost:6379\nSECRET_KEY=change-me-in-production\nDEBUG=false\nPORT=8000\nALLOWED_HOSTS=api.company.com,localhost",
    "cat /etc/api/staging.env": "DATABASE_URL=postgresql://api_user:stagingpass@staging-db:5432/apidb_staging\nREDIS_URL=redis://staging-redis:6379\nSECRET_KEY=staging-secret-key-not-for-prod\nDEBUG=true\nPORT=8000\nALLOWED_HOSTS=staging-api.company.com,localhost",
    "cat /etc/api/production.env.bak": "DATABASE_URL=postgresql://api_user:Pr0d_S3cur3_Pass@prod-db-01:5432/apidb_prod\nREDIS_URL=redis://prod-redis-01:6379\nSECRET_KEY=prod-secret-key-8f3h2k\nDEBUG=false\nPORT=8000\nALLOWED_HOSTS=api.company.com",
    "cp /etc/api/production.env.bak /etc/api/production.env": "",
    "cp /etc/api/production.env.example /etc/api/production.env": "",
    "curl localhost:8000/health": "curl: (7) Failed to connect to localhost port 8000: Connection refused",
    "ls -la /etc/api/": "total 24\ndrwxr-xr-x 2 root root 4096 Jan 15 11:20 .\ndrwxr-xr-x 85 root root 4096 Jan 10 09:00 ..\n-rw-r--r-- 1 api  api   312 Jan 14 16:00 production.env.bak\n-rw-r--r-- 1 api  api   298 Jan 10 09:00 production.env.example\n-rw-r--r-- 1 api  api   301 Jan 15 09:00 staging.env",
    "git log --oneline -5": "a3f9c21 v2.4.1 - add Redis caching layer\n8b2e445 v2.4.0 - refactor config loading\nb1c3d78 fix: memory leak in session handler\nc9a1f32 v2.3.9 - update dependencies\nd4e5f67 feat: add rate limiting",
    "git -C /opt/api log --oneline -5": "a3f9c21 v2.4.1 - add Redis caching layer\n8b2e445 v2.4.0 - refactor config loading\nb1c3d78 fix: memory leak in session handler\nc9a1f32 v2.3.9 - update dependencies\nd4e5f67 feat: add rate limiting",
    "git -C /opt/api diff HEAD~1 HEAD -- config.py": "--- a/config.py\n+++ b/config.py\n@@ -9,7 +9,8 @@\n import os\n \n class Settings:\n-    DATABASE_URL: str = os.getenv('DATABASE_URL', 'sqlite:///./local.db')\n+    DATABASE_URL: str = os.environ['DATABASE_URL']  # required in v2.4.1\n+    REDIS_URL: str = os.environ['REDIS_URL']  # required in v2.4.1\n     SECRET_KEY: str = os.getenv('SECRET_KEY', 'dev-key')"
  }
};
