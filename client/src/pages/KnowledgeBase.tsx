import { useActions, useDeleteAction } from "@/hooks/use-actions";
import { Database, Trash2, Search, Zap } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function KnowledgeBase() {
  const { data: actions, isLoading } = useActions();
  const { mutate: deleteAction } = useDeleteAction();
  const [search, setSearch] = useState("");

  const filteredActions = actions?.filter(action => 
    action.name.toLowerCase().includes(search.toLowerCase()) || 
    action.website.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Knowledge Base</h1>
          <p className="text-zinc-400 mt-1">Reusable actions cached by the system.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search actions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-zinc-800/50 rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Action Name</th>
                  <th className="px-6 py-4 hidden md:table-cell">Target Website</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredActions?.map((action) => (
                  <tr key={action.id} className="group hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center">
                      <Zap className="w-3 h-3 text-yellow-500 mr-2" />
                      {action.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-mono text-xs hidden md:table-cell">
                      {action.website}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        action.type === 'act' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                      }`}>
                        {action.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 hidden sm:table-cell">
                      {format(new Date(Number(action.timestamp)), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteAction(action.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded"
                        title="Delete cached action"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredActions?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500">
                      No actions found. Actions are cached automatically when you run automations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
