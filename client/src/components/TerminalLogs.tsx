import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface TerminalLogsProps {
  logs: string[];
  status: string;
}

export function TerminalLogs({ logs, status }: TerminalLogsProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col h-[500px]">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
          <span className="ml-3 text-xs font-mono text-zinc-500">live_execution_logs.sh</span>
        </div>
        {status === "running" && (
          <div className="flex items-center">
            <span className="flex h-2 w-2 relative mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-500 font-mono">LIVE</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 bg-black relative">
        {status === "running" && <div className="animate-scanline" />}
        
        {logs.length === 0 ? (
          <div className="text-zinc-600 italic">Waiting for logs...</div>
        ) : (
          logs.map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="break-all"
            >
              <span className="text-zinc-500 select-none mr-3">
                {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={log.includes("Error") ? "text-red-400" : "text-emerald-500"}>
                {log}
              </span>
            </motion.div>
          ))
        )}
        
        {status === "running" && (
          <div className="animate-pulse text-emerald-500 mt-2">_</div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
