export const diskFull = {
  id: 'disk_full',
  title: 'Disk Full (100% on /)',
  description: 'The root filesystem is full. Diagnose and resolve the issue without bringing down the service.',
  commands: {
    "df -h": "Filesystem      Size  Used Avail Use% Mounted on\r\n/dev/root        50G   50G     0 100% /\r\ntmpfs           1.9G     0  1.9G   0% /dev/shm\r\n/dev/sda15      105M  6.1M   99M   6% /boot/efi",
    "du -sh /*": "2.1G    /usr\r\n48G     /var\r\n210M    /boot\r\n100M    /etc",
    "du -sh /var/*": "1.2G    /var/lib\r\n46G     /var/log\r\n300M    /var/cache",
    "ls -lh /var/log/app/": "total 46G\r\n-rw-r--r-- 1 app app 44G Oct 10 12:00 app.log\r\n-rw-r--r-- 1 app app 1.0G Oct 09 23:59 app.log.1\r\n-rw-r--r-- 1 app app 1.0G Oct 08 23:59 app.log.2",
    "tail /var/log/app/app.log": "127.0.0.1 - - [10/Oct/2026:11:59:58 +0000] \"GET /api/v1/status HTTP/1.1\" 200 15\r\n127.0.0.1 - - [10/Oct/2026:11:59:59 +0000] \"GET /api/v1/health HTTP/1.1\" 200 15",
    "truncate -s 0 /var/log/app/app.log": "done",
    "rm /var/log/app/app.log.1": "done",
    "rm /var/log/app/app.log.2": "done",
    "nano /etc/logrotate.d/app": "[simulated editor: configuring logrotate for /var/log/app/app.log]\r\nSaved /etc/logrotate.d/app"
  },
  fallback: (cmd, history) => {
    // Determine state based on commands
    const isTruncated = history.includes("truncate -s 0 /var/log/app/app.log");
    
    if (cmd === "df -h") {
      if (isTruncated) {
        return "Filesystem      Size  Used Avail Use% Mounted on\r\n/dev/root        50G  6.0G   44G  12% /\r\ntmpfs           1.9G     0  1.9G   0% /dev/shm\r\n/dev/sda15      105M  6.1M   99M   6% /boot/efi";
      }
      return "Filesystem      Size  Used Avail Use% Mounted on\r\n/dev/root        50G   50G     0 100% /\r\ntmpfs           1.9G     0  1.9G   0% /dev/shm\r\n/dev/sda15      105M  6.1M   99M   6% /boot/efi";
    }
    
    // Deleting the log file without stopping the app won't free space because of unlinked file descriptor, but for the simulator simplicity, if they RM it we could show it as not freeing space. Since user instructions specify truncate, let's enforce truncate.
    if (cmd === "rm /var/log/app/app.log") {
      return "removed '/var/log/app/app.log'";
    }

    if (cmd === "du -sh /var/*") {
      if (isTruncated) {
        return "1.2G    /var/lib\r\n2.0G     /var/log\r\n300M    /var/cache";
      } else {
        return "1.2G    /var/lib\r\n46G     /var/log\r\n300M    /var/cache";
      }
    }
    
    return `bash: ${cmd.split(' ')[0]}: command not found`;
  },
  isSolved: (history, lastCmd) => {
    const isTruncated = history.includes("truncate -s 0 /var/log/app/app.log");
    return lastCmd === "df -h" && isTruncated;
  }
};
