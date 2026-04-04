export const prodApiOutage = {
  id: 'prod_api_outage',
  title: 'Production API Outage',
  description: `Your backend service has unexpectedly failed in production following a recent rapid deployment. Users are heavily reporting that the /api/orders endpoint is returning 500 errors and our alerting systems are firing. Gain access to the environment, investigate the issue, and successfully restart the service once mitigated.\n\n**Available Resources**\n- Service: Node.js API running on port 8080\n- Database: PostgreSQL (external)\n- Logs: /var/log/app.log\n- Config: .env file`,
  commands: {
    "cat /var/log/app.log": "ERROR: connect ECONNREFUSED 127.0.0.1:5432\r\n→ at TCPConnectWrap.afterConnect",
    "curl http://localhost:8080/api/orders": "500 Internal Server Error",
    "env": "DB_HOST=localhost\r\nDB_PORT=5432\r\nNODE_ENV=production",
    "ps aux": "node server.js (running)",
    "netstat -tulnp": "8080 LISTEN\r\n5432 NOT LISTENING",
    "cat .env": "DB_HOST=localhost\r\nDB_USER=prod_user"
  },
  fallback: (cmd, history) => {
    if (cmd.startsWith("cat ")) {
       return `cat: ${cmd.substring(4)}: No such file or directory`;
    }
    if (cmd.startsWith("ls ")) {
       return `ls: cannot access '${cmd.substring(3)}': No such file or directory`;
    }
    return `bash: ${cmd.split(' ')[0]}: command not found`;
  },
  isSolved: (history, lastCmd) => {
    return lastCmd === "cat .env";
  }
};
