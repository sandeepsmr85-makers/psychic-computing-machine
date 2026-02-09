import { useRun } from "@/hooks/use-runs";
import { useRoute, Link } from "wouter";
import { TerminalLogs } from "@/components/TerminalLogs";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Globe, Clock, DollarSign, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function RunDetails() {
  const [, params] = useRoute("/runs/:id");
  const id = Number(params?.id);
  
  // Enable polling if logs aren't final
  const { data: run, isLoading, error } = useRun(id, true);

  // Derive if polling should continue based on status
  // Ideally passed to hook, but for now hook handles basic "running" check
  // or we can just let it poll blindly, but better to optimize.
  // The hook implementation I wrote takes a boolean.
  const isRunning = run?.status === "running" || run?.status === "pending";

  if (isLoading) return <div className="flex h-96 items-center justify-center"><div className="animate-spin text-emerald-500">Loading...</div></div>;
  if (error || !run) return <div className="text-center py-20 text-red-400">Failed to load run details</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">Execution #{run.id}</h1>
            <StatusBadge status={run.status} />
          </div>
          <p className="text-base sm:text-lg text-zinc-300 max-w-2xl">
            {run.instruction}
          </p>
        </div>
        
        <div className="flex items-center space-x-6 text-sm text-zinc-400 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 w-fit">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-zinc-500" />
            <span>{run.startTime ? format(new Date(run.startTime), 'HH:mm:ss') : '--:--'}</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-2 text-zinc-500" />
            <span>{run.cost ? `${run.cost}¢` : '0¢'}</span>
          </div>
        </div>
      </div>

      {run.url && (
        <div className="flex items-center text-sm text-blue-400 bg-blue-500/5 px-4 py-2 rounded border border-blue-500/10">
          <Globe className="w-4 h-4 mr-2" />
          <span className="mr-2">Target:</span>
          <a href={run.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center">
            {run.url} <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Live Logs</h3>
          <TerminalLogs logs={run.logs as string[] || []} status={run.status} />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Output / Result</h3>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 h-[500px] overflow-y-auto font-mono text-sm">
            {run.result ? (
              <pre className="text-zinc-300 whitespace-pre-wrap">
                {JSON.stringify(run.result, null, 2)}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700 mb-3 animate-spin-slow" />
                <span>Waiting for results...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
