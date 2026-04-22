import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GraduationCap, ShieldCheck, User, Lock, AlertCircle, Loader2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'student' | 'admin'>('student');
  const [identifier, setIdentifier] = useState(''); // DNI or Email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let email = identifier;
      let finalPassword = password;

      if (authMode === 'student') {
        // Student logic: DNI to Email
        email = `${identifier}@virdolores.edu`;
        finalPassword = password || identifier; // Password is DNI by default

        // Check if DNI is authorized
        const { data: isAuthorized } = await supabase
          .from('authorized_students')
          .select('dni')
          .eq('dni', identifier)
          .single();

        if (!isAuthorized) {
          throw new Error('Tu DNI no está en la lista de alumnos autorizados. Contacta a tu profesor.');
        }
      }

      // Try to Sign In
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: finalPassword,
      });

      // If student account doesn't exist yet, auto-register
      if (signInError && signInError.message === 'Invalid login credentials' && authMode === 'student') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: finalPassword,
          options: { data: { dni: identifier } }
        });
        if (signUpError) throw signUpError;
        
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password: finalPassword,
        });
        if (retryError) throw retryError;
      } else if (signInError) {
        throw signInError;
      }

    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Premium Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/30 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/30 rounded-full blur-[150px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="glass-effect bg-white/10 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden">
          
          <div className="p-10 md:p-14 space-y-10">
            {/* Header section */}
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse" />
                <div className="relative p-6 bg-white/5 rounded-3xl border border-white/10 shadow-2xl text-white">
                  <GraduationCap className="w-12 h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
                  IE Virgen de <br/> los Dolores
                </h1>
                <p className="text-blue-300/60 font-bold uppercase tracking-[0.2em] text-[10px]">Sistema Institucional de Apoyo al Estudiante</p>
              </div>
            </div>

            {/* Auth Mode Tabs */}
            <div className="flex p-1.5 bg-black/20 rounded-2xl border border-white/5">
              <button
                onClick={() => { setAuthMode('student'); setError(null); setIdentifier(''); setPassword(''); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black transition-all text-sm",
                  authMode === 'student' ? "bg-white text-[#1a237e] shadow-lg" : "text-white/40 hover:text-white"
                )}
              >
                <User className="w-4 h-4" />
                Estudiante (DNI)
              </button>
              <button
                onClick={() => { setAuthMode('admin'); setError(null); setIdentifier(''); setPassword(''); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black transition-all text-sm",
                  authMode === 'admin' ? "bg-white text-[#1a237e] shadow-lg" : "text-white/40 hover:text-white"
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                Docente (Email)
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-4">
                    {authMode === 'student' ? 'Número de DNI' : 'Correo Electrónico'}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors">
                      {authMode === 'student' ? <User className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                    </div>
                    <input 
                      type={authMode === 'student' ? "text" : "email"}
                      required
                      placeholder={authMode === 'student' ? "Ej: 71234567" : "admin@ejemplo.com"}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 bg-white/5 rounded-2xl border border-white/10 outline-none focus:bg-white/10 focus:border-white/30 text-white font-bold transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-4">Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-white transition-colors" />
                    <input 
                      type="password" 
                      required
                      placeholder={authMode === 'student' ? "Tu DNI es tu contraseña" : "••••••••"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 bg-white/5 rounded-2xl border border-white/10 outline-none focus:bg-white/10 focus:border-white/30 text-white font-bold transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-5 bg-rose-500/10 border border-rose-500/20 text-rose-200 rounded-2xl text-xs font-bold flex items-center gap-3"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-white text-[#1a237e] rounded-2xl font-black text-lg shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Ingresar al Portal'}
              </button>
            </form>

            <div className="pt-4 flex justify-center">
               <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Servidor Institucional Activo</span>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
