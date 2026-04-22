import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GraduationCap, ShieldCheck, User, Lock, AlertCircle, Loader2, Mail, Sparkles, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'student' | 'admin'>('student');
  const [isRegistering, setIsRegistering] = useState(false);
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
          throw new Error('DNI no autorizado. Contacta con tu profesor.');
        }
      }

      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: finalPassword,
          options: { data: { dni: authMode === 'student' ? identifier : null } }
        });
        if (signUpError) throw signUpError;
        alert('Registro completado. ¡Ya puedes ingresar!');
        setIsRegistering(false);
      } else {
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
      }

    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'DNI o contraseña incorrectos' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      
      <div className="hidden md:flex md:w-1/2 bg-[#1a237e] relative items-center justify-center p-16 text-white overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

        <div className="relative z-10 max-w-lg space-y-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 flex items-center justify-center shadow-2xl"
          >
            <GraduationCap className="w-12 h-12 text-white" />
          </motion.div>
          
          <div className="space-y-6">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl font-black leading-tight tracking-tighter"
            >
              IE Virgen de <br/> los Dolores
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-blue-100/80 font-medium leading-relaxed"
            >
              "Forjando líderes con valores y excelencia académica para transformar el futuro."
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4 p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm"
          >
            <div className="p-3 bg-white/10 rounded-2xl">
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-widest">Feria Escolar 2026</p>
              <p className="text-xs text-blue-200/60 font-bold">Plataforma de Apoyo al Estudiante</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md space-y-10"
        >
          <div className="md:hidden text-center space-y-4 mb-8">
             <div className="inline-flex p-4 bg-[#1a237e] text-white rounded-2xl shadow-xl">
                <GraduationCap className="w-8 h-8" />
             </div>
             <h3 className="text-2xl font-black text-[#1a237e]">IE Virgen de los Dolores</h3>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">
              {isRegistering ? 'Crear Cuenta' : '¡Bienvenido!'}
            </h1>
            <p className="text-slate-500 font-bold">
              {isRegistering ? 'Regístrate como docente administrador.' : 'Ingresa tus datos para continuar.'}
            </p>
          </div>

          <div className="flex p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200">
            <button
              onClick={() => { setAuthMode('student'); setError(null); setIsRegistering(false); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black transition-all text-xs",
                authMode === 'student' ? "bg-white text-[#1a237e] shadow-lg" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <User className="w-4 h-4" />
              Alumno
            </button>
            <button
              onClick={() => { setAuthMode('admin'); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black transition-all text-xs",
                authMode === 'admin' ? "bg-white text-[#1a237e] shadow-lg" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              Docente
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                {authMode === 'student' ? 'DNI del Alumno' : 'Correo Institucional'}
              </label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1a237e] transition-colors">
                  {authMode === 'student' ? <User className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                </div>
                <input 
                  type={authMode === 'student' ? "text" : "email"}
                  required
                  placeholder={authMode === 'student' ? "Ingresa tu DNI" : "correo@ejemplo.com"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white rounded-2xl border-2 border-slate-100 outline-none focus:border-[#1a237e] focus:shadow-xl transition-all font-bold placeholder:text-slate-300"
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
                  className="w-full pl-14 pr-6 py-5 bg-white rounded-2xl border-2 border-slate-100 outline-none focus:border-[#1a237e] focus:shadow-xl transition-all font-bold placeholder:text-slate-300"
                />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-[#1a237e] text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isRegistering ? 'Crear mi Cuenta' : 'Ingresar a la Plataforma')}
            </button>
          </form>

          {authMode === 'admin' && (
            <div className="text-center">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs font-black text-[#1a237e] hover:underline flex items-center justify-center gap-2 mx-auto"
              >
                <UserPlus className="w-4 h-4" />
                {isRegistering ? 'Ya tengo cuenta, quiero ingresar' : 'No tengo cuenta, quiero registrarme'}
              </button>
            </div>
          )}

          <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
            © 2026 IE Virgen de los Dolores
          </p>
        </motion.div>
      </div>
    </div>
  );
};
