import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export function TerminalComponent({ onCommand }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const inputBufferRef = useRef('');

  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new Terminal({
      cursorBlink: true,
      theme: { background: '#111827', foreground: '#f3f4f6' }, // Tailwind gray-900
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 14,
    });
    
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(terminalRef.current);
    setTimeout(() => {
      if (terminalRef.current && terminalRef.current.clientWidth > 0) {
        try { fitAddon.fit(); } catch (e) {}
      }
    }, 50);
    xtermRef.current = xterm;

    const prompt = () => {
      xterm.write('\r\n\x1b[32mroot@sandbox\x1b[0m:\x1b[34m/\x1b[0m# ');
    };

    xterm.writeln('Welcome to Daisy Sandbox. System initialized.');
    prompt();

    const disposable = xterm.onData(e => {
      switch (e) {
        case '\r': // Enter
          const cmd = inputBufferRef.current;
          xterm.writeln('');
          if (cmd.length > 0) {
            const { output } = onCommand(cmd);
            if (output) {
               xterm.writeln(output.replace(/\n/g, '\r\n'));
            }
          }
          inputBufferRef.current = '';
          prompt();
          break;
        case '\u007F': // Backspace
          if (inputBufferRef.current.length > 0) {
            inputBufferRef.current = inputBufferRef.current.slice(0, -1);
            xterm.write('\b \b');
          }
          break;
        default:
          if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
            inputBufferRef.current += e;
            xterm.write(e);
          }
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      if (terminalRef.current && terminalRef.current.clientWidth > 0 && xtermRef.current) {
        try {
          // Additional check: xterm internal buffer should be initialized
          if (xtermRef.current.element && xtermRef.current.element.clientWidth > 0) {
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
  }, [onCommand]);

  return <div ref={terminalRef} className="w-full h-full overflow-hidden rounded-md border border-gray-800" />;
}
