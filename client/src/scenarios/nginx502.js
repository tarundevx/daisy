export const nginx502 = {
  id: 'nginx_502',
  title: 'NGINX 502 Bad Gateway',
  description: 'The candidate must diagnose a broken nginx upstream config causing a 502 error on localhost.',
  commands: {
    "ls /etc/nginx/": "nginx.conf  sites-available/  sites-enabled/",
    "cat /etc/nginx/nginx.conf": "user www-data; worker_processes auto; pid /run/nginx.pid;",
    "cat /etc/nginx/sites-enabled/app.conf": "upstream backend { server 127.0.0.1:3001; }\r\nserver { listen 80; location / { proxy_pass http://backend; } }",
    "systemctl status nginx": "● nginx.service - active (running)",
    "curl localhost:3001": "curl: (7) Failed to connect: Connection refused",
    "systemctl status app": "● app.service - failed\r\n   Active: failed (Result: exit-code)",
    "journalctl -u app -n 20": "Error: MONGODB_URI environment variable not set\r\nProcess exited with code 1",
    "cat /etc/app/.env": "PORT=3001\r\nNODE_ENV=production\r\n# MONGODB_URI=<missing>",
    "nano /etc/app/.env": "[simulated editor: adds MONGODB_URI line]\r\nSaved /etc/app/.env",
  },
  fallback: (cmd, history) => {
    const hasEditedEnv = history.includes("nano /etc/app/.env");
    const hasRestartedApp = hasEditedEnv && history.lastIndexOf("systemctl restart app") > history.lastIndexOf("nano /etc/app/.env");
    
    if (cmd === "nginx -t") {
      if (hasRestartedApp) {
         return "nginx: configuration file test is successful";
      } else {
         return "nginx: [emerg] no live upstreams while connecting to upstream [app] ... test failed";
      }
    }
    if (cmd === "systemctl restart app") {
      if (hasEditedEnv) {
        return "● app.service restarted successfully";
      } else {
        return "Job for app.service failed. See journalctl.";
      }
    }
    if (cmd === "curl localhost") {
      if (hasRestartedApp) {
        return '{"status": "ok", "message": "App running"}';
      } else {
        return "<html>502 Bad Gateway</html>";
      }
    }
    
    return `bash: ${cmd.split(' ')[0]}: command not found`;
  },
  isSolved: (history, lastCmd) => {
    const hasEditedEnv = history.includes("nano /etc/app/.env");
    const hasRestartedApp = hasEditedEnv && history.lastIndexOf("systemctl restart app") > history.lastIndexOf("nano /etc/app/.env");
    return lastCmd === "curl localhost" && hasRestartedApp;
  }
};
