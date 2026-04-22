import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, LayoutDashboard, BookOpen, GraduationCap, BarChart3, Menu, X, Sparkles, ShieldCheck, KeyRound, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const AppLayout: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState('');
  const [isChanging, setIsChanging] = React.useState(false);
  const [msg, setMsg] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', color: 'blue' },
    { label: 'Ejercicios', icon: BookOpen, path: '/ejercicios', color: 'emerald' },
    { label: 'Exámenes', icon: GraduationCap, path: '/examenes', color: 'violet' },
    { label: 'Progreso', icon: BarChart3, path: '/progreso', color: 'orange' },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin', icon: ShieldCheck, path: '/admin', color: 'indigo' });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header - Glassmorphism */}
      <div className="md:hidden flex items-center justify-between p-4 glass-effect z-[60] sticky top-0 shadow-sm">
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-blue-600" />
          <span>Virgen de los Dolores</span>
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
              <span className="text-xl font-black bg-gradient-to-br from-blue-900 to-blue-700 bg-clip-text text-transparent tracking-tight leading-tight">
                IE Virgen de <br/> los Dolores
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
                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-tighter">
                      {isAdmin ? 'Administrador IE' : 'Estudiante'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 mb-2 rounded-2xl bg-white text-blue-600 font-bold text-sm border border-blue-100 hover:bg-blue-50 transition-all"
              >
                <KeyRound className="w-4 h-4" />
                Cambiar clave
              </button>
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

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowPasswordModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-800">Nueva Contraseña</h3>
                <p className="text-slate-500 text-sm font-medium">Ingresa tu nueva clave de acceso.</p>
              </div>

              <div className="space-y-4">
                <input 
                  type="password"
                  placeholder="Escribe tu nueva clave"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-600 focus:bg-white font-bold transition-all"
                />
                
                {msg && (
                  <div className={cn(
                    "p-4 rounded-xl text-xs font-black flex items-center gap-2",
                    msg.type === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {msg.text}
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancelar
                  </button>
                  <button 
                    disabled={isChanging || !newPassword}
                    onClick={async () => {
                      setIsChanging(true);
                      setMsg(null);
                      const { error } = await supabase.auth.updateUser({ password: newPassword });
                      if (error) setMsg({ type: 'error', text: error.message });
                      else {
                        setMsg({ type: 'success', text: '¡Contraseña actualizada!' });
                        setTimeout(() => setShowPasswordModal(false), 2000);
                      }
                      setIsChanging(false);
                    }}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    {isChanging ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Actualizar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
