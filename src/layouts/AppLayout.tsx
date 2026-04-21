import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, LayoutDashboard, BookOpen, GraduationCap, BarChart3, Menu, X, Sparkles } from 'lucide-react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', color: 'blue' },
    { label: 'Ejercicios', icon: BookOpen, path: '/ejercicios', color: 'emerald' },
    { label: 'Exámenes', icon: GraduationCap, path: '/examenes', color: 'violet' },
    { label: 'Progreso', icon: BarChart3, path: '/progreso', color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header - Glassmorphism */}
      <div className="md:hidden flex items-center justify-between p-4 glass-effect z-[60] sticky top-0 shadow-sm">
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-blue-600" />
          <span>PreUni App</span>
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-2 rounded-xl bg-slate-100 text-slate-700 active:scale-95 transition-all"
        >
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar - Desktop Glassmorphism */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transition-all duration-500 ease-in-out md:translate-x-0 md:static",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full m-4 bg-white/80 backdrop-blur-2xl border border-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">
          <div className="p-8 hidden md:block">
            <Link to="/" className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-2xl shadow-lg shadow-blue-200">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent tracking-tight">
                PreUni
              </span>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 rounded-3xl transition-all duration-300 group relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-200 scale-[1.02]"
                      : "hover:bg-slate-50 text-slate-500 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn("w-6 h-6", isActive ? "text-white" : "group-hover:text-blue-500")} />
                  <span className="font-bold tracking-wide">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section Premium */}
          <div className="p-6 mt-auto">
            <div className="bg-slate-50 rounded-[2rem] p-5 border border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                  {user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-800 truncate mb-0.5">{user?.email?.split('@')[0]}</p>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Estudiante Pro</span>
                  </div>
                </div>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-slate-600 font-bold text-sm border border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-h-screen overflow-y-auto">
        <div className="p-4 md:p-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
