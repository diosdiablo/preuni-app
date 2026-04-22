import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GraduationCap, ShieldCheck, User, Lock, AlertCircle, Loader2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'student' | 'admin'>('student');
  const [identifier, setIdentifier] = useState('');
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
        email = `${identifier}@virdolores.edu`;
        finalPassword = password || identifier;

        const { data: isAuthorized } = await supabase
          .from('authorized_students')
          .select('dni')
          .eq('dni', identifier)
          .single();

        if (!isAuthorized) {
          throw new Error('DNI no autorizado. Contacta con el administrador.');
        }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: finalPassword,
      });

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Subtle Background Decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-50/50 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-50/50 rounded-full blur-[120px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-12 space-y-10 border border-slate-100">
          <div className="text-center space-y-4">
            <div className="inline-flex p-5 bg-[#1a237e]/5 rounded-3xl text-[#1a237e] mb-2">
               <GraduationCap className="w-12 h-12" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                IE Virgen de <br/> los Dolores
              </h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Feria Escolar 2026</p>
            </div>
          </div>

          {/* Selector de Modo */}
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => { setAuthMode('student'); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black transition-all text-xs",
                authMode === 'student' ? "bg-white text-[#1a237e] shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <User className="w-4 h-4" />
              Alumno
            </button>
            <button
              onClick={() => { setAuthMode('admin'); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black transition-all text-xs",
                authMode === 'admin' ? "bg-white text-[#1a237e] shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                {authMode === 'student' ? 'Número de DNI' : 'Correo Admin'}
              </label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1a237e] transition-colors">
                  {authMode === 'student' ? <User className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                </div>
                <input 
                  type={authMode === 'student' ? "text" : "email"}
                  required
                  placeholder={authMode === 'student' ? "DNI de 8 dígitos" : "correo@ejemplo.com"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-14 pr-6 py-4.5 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:bg-white focus:border-[#1a237e] transition-all font-bold placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#1a237e] transition-colors" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-4.5 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:bg-white focus:border-[#1a237e] transition-all font-bold placeholder:text-slate-300"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-3 border border-red-100"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-[#1a237e] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#1a237e]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Ingresar'}
            </button>
          </form>

          <div className="text-center">
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Acceso Protegido IE Virgen de los Dolores</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
