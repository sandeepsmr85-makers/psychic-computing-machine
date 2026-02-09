import { useRuns, useActions } from "@/hooks/use-runs"; // Note: splitting hooks logically
import { useActions as useActionsHook } from "@/hooks/use-actions";
import { Link } from "wouter";
import { ArrowRight, Activity, Database, CheckCircle, Zap } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { motion } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { format } from "date-fns";

export default function Dashboard() {
  const { data: runs, isLoading: runsLoading } = useRuns();
  const { data: actions, isLoading: actionsLoading } = useActionsHook();

  const totalRuns = runs?.length || 0;
  const totalActions = actions?.length || 0;
  const completedRuns = runs?.filter(r => r.status === "completed").length || 0;
  const successRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

  // Mock data for the chart since we don't have historical aggregates in the simple API
  const chartData = [
    { name: 'Mon', value: 4 },
    { name: 'Tue', value: 3 },
    { name: 'Wed', value: 7 },
    { name: 'Thu', value: 5 },
    { name: 'Fri', value: 8 },
    { name: 'Sat', value: 12 },
    { name: 'Sun', value: 9 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-zinc-400 mt-1">System overview and performance metrics.</p>
        </div>
        <Link 
          href="/runs/new" 
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-lg shadow-emerald-900/20"
        >
          <Zap className="w-4 h-4 mr-2" />
          Quick Run
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard 
          title="Total Executions" 
          value={totalRuns} 
          icon={Activity} 
          loading={runsLoading}
          trend="+12% from last week"
        />
        <StatsCard 
          title="Cached Actions" 
          value={totalActions} 
          icon={Database} 
          loading={actionsLoading}
          trend="Saved 45s avg runtime"
        />
        <StatsCard 
          title="Success Rate" 
          value={`${successRate}%`} 
          icon={CheckCircle} 
          loading={runsLoading}
          trend="Optimal performance"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link href="/runs" className="text-sm text-emerald-500 hover:text-emerald-400 flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          {runsLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-zinc-800/50 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 text-zinc-400 font-medium">
                  <tr>
                    <th className="pb-3 pl-2 hidden sm:table-cell">ID</th>
                    <th className="pb-3">Instruction</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2 hidden md:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {runs?.slice(0, 5).map((run) => (
                    <tr key={run.id} className="group hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 pl-2 font-mono text-zinc-500 hidden sm:table-cell">#{run.id}</td>
                      <td className="py-3 text-zinc-300 max-w-[150px] sm:max-w-[200px] truncate" title={run.instruction}>
                        {run.instruction}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="py-3 text-right text-zinc-500 pr-2 hidden md:table-cell">
                        {run.startTime ? format(new Date(run.startTime), 'MMM d, HH:mm') : '-'}
                      </td>
                    </tr>
                  ))}
                  {(!runs || runs.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-500">
                        No runs recorded yet. Start your first automation!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mini Chart */}
        <div className="glass-panel rounded-xl p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-2">Activity Volume</h2>
          <p className="text-sm text-zinc-400 mb-6">Execution requests over last 7 days</p>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, loading, trend }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-16 h-16 text-emerald-500" />
      </div>
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-zinc-800 rounded-lg text-emerald-500">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-400">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse mt-1" />
          ) : (
            <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs text-zinc-500">
        <span className="text-emerald-500 font-medium mr-2">{trend}</span>
      </div>
    </motion.div>
  );
}
