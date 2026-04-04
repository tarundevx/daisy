import { useState, useEffect } from 'react';

export function useTerminal(scenarioMap) {
  const [history, setHistory] = useState([]);
  const [commandsUsed, setCommandsUsed] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [solved, setSolved] = useState(false);
  const [duration, setDuration] = useState(0);

  // Reset state when scenario changes
  useEffect(() => {
    setHistory([]);
    setCommandsUsed([]);
    setStartTime(null);
    setSolved(false);
    setDuration(0);
  }, [scenarioMap.id]);

  useEffect(() => {
    let interval;
    if (startTime && !solved) {
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, solved]);

  const handleCommand = (cmd) => {
    if (!startTime) setStartTime(Date.now());
    
    // Trim and normalize command space
    const normalizedCmd = cmd.trim().replace(/\s+/g, ' ');
    if (!normalizedCmd) return { output: '' };

    const updatedCommands = [...commandsUsed, normalizedCmd];
    setCommandsUsed(updatedCommands);
    setHistory(prev => [...prev, { command: normalizedCmd, timestamp: Date.now() }]);

    // Evaluate against scenarioMap
    let response = scenarioMap.commands[normalizedCmd];

    if (!response) {
       if (typeof scenarioMap.fallback === 'function') {
         response = scenarioMap.fallback(normalizedCmd, updatedCommands);
       } else {
         response = `bash: ${normalizedCmd.split(' ')[0]}: command not found`;
       }
    }

    if (scenarioMap.isSolved && scenarioMap.isSolved(updatedCommands, normalizedCmd)) {
      setSolved(true);
      if (response && response !== "done") response += '\r\n\r\n\x1b[32m[SCENARIO SOLVED]\x1b[0m';
      else response = '\x1b[32m[SCENARIO SOLVED]\x1b[0m';
    } else if (response === "done") {
      response = "";
    }

    return { output: response || '' };
  };

  return {
    handleCommand,
    commandsUsed,
    history,
    duration,
    solved,
    startTime
  };
}
