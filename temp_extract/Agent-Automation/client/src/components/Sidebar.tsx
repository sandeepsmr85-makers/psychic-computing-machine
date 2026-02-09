import { Link, useLocation } from "wouter";
import { LayoutDashboard, Play, Database, BookOpen, Terminal, X } from "lucide-react";
import { clsx } from "clsx";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'New Run', href: '/runs/new', icon: Play },
  { name: 'Knowledge Base', href: '/actions', icon: Database },
  { name: 'Teach Mode', href: '/teach', icon: BookOpen },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-950 relative">
      <div className="flex h-16 items-center px-6 border-b border-zinc-800 justify-between">
        <div className="flex items-center">
          <Terminal className="h-6 w-6 text-emerald-500 mr-2" />
          <span className="text-lg font-bold text-white tracking-tight">AutoSys</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-zinc-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={onClose}
              className={clsx(
                isActive 
                  ? "bg-zinc-800 text-emerald-400 border-l-2 border-emerald-500" 
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white border-l-2 border-transparent",
                "group flex items-center px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-r-md"
              )}
            >
              <item.icon
                className={clsx(
                  isActive ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300",
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-zinc-800">
        <div className="rounded-lg bg-zinc-900 p-3">
          <p className="text-xs text-zinc-500 font-mono">System Status</p>
          <div className="flex items-center mt-2">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-400 font-medium">Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
