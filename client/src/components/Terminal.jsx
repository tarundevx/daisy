import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export function TerminalComponent({ onCommand }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const inputBufferRef = useRef('');
  const commandHistoryRef = useRef([]);
  const historyIndexRef = useRef(0);
  const onCommandRef = useRef(onCommand);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new Terminal({
      cursorBlink: true,
      theme: { background: '#111827', foreground: '#f3f4f6' }, // Tailwind gray-900
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 14,
      scrollback: 1000,
      rows: 24,
      cols: 80,
      convertEol: true,
      allowTransparency: true,
      cursorStyle: 'block'
    });
    
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xtermRef.current = xterm;

    // Enable Copy to clipboard on selection
    xterm.onSelectionChange(() => {
      const selection = xterm.getSelection();
      if (selection) {
        // Many browsers allow this if it's within a user interaction
        // but xterm usually handles the 'Copy' shortcut fine if we don't intercept it.
      }
    });

    const prompt = () => {
      xterm.write('\x1b[32mroot@sandbox\x1b[0m:\x1b[34m/\x1b[0m# ');
    };

    xterm.writeln('Welcome to Daisy Sandbox. System initialized.');
    xterm.writeln('Hint: Standard Copy (Ctrl+Shift+C/Cmd+C) and Paste (Ctrl+V/Cmd+V) are supported.');
    prompt();

    let hasOpened = false;

    const disposable = xterm.onData(e => {
      // Handle special keys first
      if (e === '\r') { // Enter
        const cmd = inputBufferRef.current;
        xterm.writeln('');
        if (cmd.length > 0) {
          commandHistoryRef.current.push(cmd);
          const { output } = onCommandRef.current(cmd);
          if (output) {
             xterm.writeln(output.replace(/\n/g, '\r\n'));
          }
        }
        historyIndexRef.current = commandHistoryRef.current.length;
        inputBufferRef.current = '';
        prompt();
        return;
      }

      if (e === '\u007F') { // Backspace
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          xterm.write('\b \b');
        }
        return;
      }

      if (e === '\x1b[A') { // Up Arrow
        if (historyIndexRef.current > 0) {
          historyIndexRef.current -= 1;
          const prevCmd = commandHistoryRef.current[historyIndexRef.current];
          xterm.write('\x1b[2K\r'); // Clear entire line
          xterm.write('\x1b[32mroot@sandbox\x1b[0m:\x1b[34m/\x1b[0m# ' + prevCmd);
          inputBufferRef.current = prevCmd;
        }
        return;
      }

      if (e === '\x1b[B') { // Down Arrow
        if (historyIndexRef.current < commandHistoryRef.current.length) {
          historyIndexRef.current += 1;
          const nextCmd = historyIndexRef.current === commandHistoryRef.current.length ? '' : commandHistoryRef.current[historyIndexRef.current];
          xterm.write('\x1b[2K\r');
          xterm.write('\x1b[32mroot@sandbox\x1b[0m:\x1b[34m/\x1b[0m# ' + nextCmd);
          inputBufferRef.current = nextCmd;
        }
        return;
      }

      if (e === '\f' || e === '\u000c') { // Ctrl+L
        xterm.write('\x1b[2J\x1b[3J\x1b[H');
        xterm.write('\x1b[32mroot@sandbox\x1b[0m:\x1b[34m/\x1b[0m# ' + inputBufferRef.current);
        return;
      }

      // Handle normal characters and pasted text (multi-char strings)
      // Check if e is printable text or a sequence of them
      const isPrintable = Array.from(e).every(char => {
         const code = char.charCodeAt(0);
         return (code >= 0x20 && code <= 0x7E) || code >= 0xA0;
      });

      if (isPrintable) {
        inputBufferRef.current += e;
        xterm.write(e);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      if (terminalRef.current && terminalRef.current.clientWidth > 0 && xtermRef.current) {
        if (!hasOpened) {
          try {
            xterm.open(terminalRef.current);
            hasOpened = true;
          } catch (e) {
            console.warn('Xterm open failed on first tick:', e);
            return; // Wait for next tick
          }
        }
        
        try {
          if (xtermRef.current._core && xtermRef.current._core._renderService) {
            fitAddon.fit();
          } else if (xtermRef.current.element && xtermRef.current.element.clientWidth > 0) {
             fitAddon.fit();
          }
        } catch (e) {
          console.warn('Xterm fit failed:', e);
        }
      }
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      disposable.dispose();
      try {
        xterm.dispose();
      } catch (e) {}
    };
  }, []);

  return <div ref={terminalRef} className="w-full h-full overflow-hidden rounded-md border border-gray-800" />;
}
