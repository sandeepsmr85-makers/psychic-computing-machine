import { clsx } from "clsx";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

type Status = "pending" | "running" | "completed" | "failed" | string;

export function StatusBadge({ status }: { status: Status }) {
  const normalizedStatus = status.toLowerCase();
  
  const styles = {
    pending: "bg-zinc-800 text-zinc-400 border-zinc-700",
    running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const icons = {
    pending: <Clock className="w-3.5 h-3.5 mr-1.5" />,
    running: <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />,
    completed: <CheckCircle className="w-3.5 h-3.5 mr-1.5" />,
    failed: <XCircle className="w-3.5 h-3.5 mr-1.5" />,
  };

  const currentStyle = styles[normalizedStatus as keyof typeof styles] || styles.pending;
  const currentIcon = icons[normalizedStatus as keyof typeof icons] || icons.pending;

  return (
    <span className={clsx(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      currentStyle
    )}>
      {currentIcon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
