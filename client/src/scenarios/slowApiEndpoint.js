export const slowApiEndpoint = {
  id: 'slow_api_endpoint',
  title: 'Performance Bottleneck',
  description: `Users are complaining that the /api/products endpoint is exceptionally slow (~4–5 seconds of latency). Initial diagnostics point to a database bottleneck. You have full access to inspect the logs and system states. Identify the hidden N+1 query issue.\n\n**Available Resources**\n- Service: Java Spring Boot API\n- Logs: logs/performance.log\n- DB query logs: logs/db.log`,
  commands: {
    "curl -w \"%{time_total}\" http://localhost:8080/api/products": "4.82",
    "cat logs/performance.log": "→ GET /api/products - 4820ms\r\n→ GET /api/products - 5102ms",
    "cat logs/db.log": "→ SELECT * FROM products;\r\n→ SELECT * FROM reviews WHERE product_id=1;\r\n→ SELECT * FROM reviews WHERE product_id=2;\r\n→ SELECT * FROM reviews WHERE product_id=3;\r\n→ ...",
    "top": "→ CPU: low usage\r\n→ Memory: normal"
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
    return lastCmd === "top";
  }
};
