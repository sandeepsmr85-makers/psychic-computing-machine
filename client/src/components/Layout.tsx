import { Sidebar } from "./Sidebar";
import { ReactNode, useState } from "react";
import { Menu } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans relative">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile by default, shown via state */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto bg-zinc-950 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-lg font-bold text-white tracking-tight">AutoSys</span>
          <div className="w-10" /> {/* Spacer */}
        </header>

        <div className="p-4 md:p-8 flex-1">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
