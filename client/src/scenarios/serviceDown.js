export const serviceDown = {
  id: 'service_down',
  title: 'Service Won\'t Start',
  description: 'The api.service fails to start. Find the missing dependency and start the service.',
  commands: {
    "systemctl start api": "Job for api.service failed. See journalctl.",
    "journalctl -u api": "Oct 10 12:00:01 server systemd[1]: Starting API Service...\r\nOct 10 12:00:01 server systemd[1]: api.service: Failed to load environment files: No such file or directory\r\nOct 10 12:00:01 server systemd[1]: api.service: Failed with result 'exit-code'.\r\nOct 10 12:00:01 server systemd[1]: Failed to start API Service.",
    "journalctl -u api -n 50": "EnvironmentFile=/etc/api/env: No such file",
    "ls /etc/api/": "api.service  env.example",
    "cat /etc/api/env.example": "PORT=4000\r\nDB_HOST=localhost\r\nDB_PORT=5432",
    "cp /etc/api/env.example /etc/api/env": "done",
    "cp env.example env": "done"
  },
  fallback: (cmd, history) => {
    // Check if env has been copied
    const hasCopiedEnv = history.some(c => c.includes("cp /etc/api/env.example /etc/api/env") || (c.includes("cp env.example env") && history.includes("cd /etc/api/")));
    
    if (cmd === "systemctl start api") {
      if (hasCopiedEnv) {
        return "● api.service - active (running)";
      } else {
        return "Job for api.service failed. See journalctl.";
      }
    }

    if (cmd === "systemctl status api") {
      if (hasCopiedEnv && history.lastIndexOf("systemctl start api") > history.findIndex(c => c.includes("cp"))) {
         return "● api.service - active (running)";
      }
      return "● api.service - failed\r\n   Active: failed (Result: exit-code)";
    }
    
    if (cmd === "ls /etc/api/") {
      if (hasCopiedEnv) return "api.service  env.example  env";
      return "api.service  env.example";
    }

    if (cmd === "cat /etc/api/env") {
       if (hasCopiedEnv) return "PORT=4000\r\nDB_HOST=localhost\r\nDB_PORT=5432";
       return "cat: /etc/api/env: No such file or directory";
    }

    return `bash: ${cmd.split(' ')[0]}: command not found`;
  },
  isSolved: (history, lastCmd) => {
    const hasCopiedEnv = history.some(c => c.includes("cp /etc/api/env.example /etc/api/env") || (c.includes("cp env.example env") && history.includes("cd /etc/api/")));
    return lastCmd === "systemctl start api" && hasCopiedEnv;
  }
};
