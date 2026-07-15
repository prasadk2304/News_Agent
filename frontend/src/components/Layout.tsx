import { ReactNode, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, BookOpen, FileText, Moon, Sun } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';

export function Layout({ children }: { children: ReactNode }) {
  const { isDarkMode, toggleDarkMode } = useAppStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/articles', label: 'Articles', icon: BookOpen },
    { to: '/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-transparent transition-colors duration-500 print:h-auto print:bg-white">
      <Toaster position="bottom-right" toastOptions={{ 
        style: { background: isDarkMode ? '#18181b' : '#fff', color: isDarkMode ? '#fff' : '#1e293b' }
      }} />
      <aside className="w-64 h-[calc(100vh-2rem)] shrink-0 glass-panel border-r border-slate-200/50 dark:border-white/10 flex flex-col m-4 rounded-2xl shadow-xl overflow-hidden z-10 transition-colors duration-500 print:hidden">
        <div className="p-6 shrink-0">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 transition-colors">
            <span className="bg-gradient-to-tr from-blue-600 to-purple-600 p-2 rounded-xl text-white shadow-lg">
              <Search size={18} />
            </span>
            News Tracker
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    isActive
                      ? 'bg-blue-600 shadow-md text-white scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-[1.02]'
                  }`
                }
              >
                <Icon size={20} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-200/50 dark:border-white/10 transition-colors shrink-0">
          <button 
            onClick={toggleDarkMode}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200 font-medium text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto no-scrollbar z-10 p-4 pl-0 print:p-0 print:overflow-visible">
        <div className="h-full glass-panel no-scrollbar rounded-2xl shadow-xl overflow-auto border border-white/40 dark:border-white/10 transition-colors duration-500 print:shadow-none print:border-none print:bg-transparent">
          <div className="p-8 max-w-7xl mx-auto min-h-full print:p-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
