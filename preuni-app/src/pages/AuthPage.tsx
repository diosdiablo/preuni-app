import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GraduationCap, ShieldCheck, User, AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
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
        email = `${identifier.trim()}@virdolores.edu`;
        finalPassword = password || identifier;

        const { data: isAuthorized } = await supabase
          .from('authorized_students')
          .select('dni')
          .eq('dni', identifier.trim())
          .single();

        if (!isAuthorized) {
          throw new Error('DNI no autorizado en la base de datos de la feria.');
        }
      } else {
        email = identifier.trim();
      }

      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: finalPassword,
        });
        if (signUpError) throw signUpError;
        alert('¡Cuenta creada con éxito! Ahora intenta ingresar.');
        setIsRegistering(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: finalPassword,
        });

        if (signInError) {
          // If student and not found, try auto-register
          if (authMode === 'student' && signInError.message.includes('Invalid login credentials')) {
             const { error: autoReg } = await supabase.auth.signUp({ email, password: finalPassword });
             if (autoReg) throw autoReg;
             const { error: retry } = await supabase.auth.signInWithPassword({ email, password: finalPassword });
             if (retry) throw retry;
          } else {
            throw signInError;
          }
        }
      }

    } catch (err: any) {
      console.error('Auth Error:', err);
      // Detailed error messages
      let msg = err.message;
      if (msg.includes('Invalid login credentials')) msg = 'DNI o Contraseña incorrectos. Verifica tus datos.';
      if (msg.includes('Email not confirmed')) msg = 'El correo no ha sido confirmado. (Revisa la pestaña Providers en Supabase).';
      setError(msg);
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-20 h-20 bg-white/10 rounded-3xl border border-white/20 flex items-center justify-center">
            <GraduationCap className="w-10 h-10 text-white" />
          </motion.div>
          <div className="space-y-6">
            <h2 className="text-5xl font-black leading-tight tracking-tighter">IE Virgen de los Dolores</h2>
            <p className="text-xl text-blue-100/80 font-medium">"Excelencia académica y valores para el futuro."</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-slate-50">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">
              {isRegistering ? 'Crear Cuenta' : 'Ingresar'}
            </h1>
            <p className="text-slate-500 font-bold">Portal de la Feria Escolar 2026</p>
          </div>

          <div className="flex p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200">
            <button
              onClick={() => { setAuthMode('student'); setError(null); setIsRegistering(false); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black transition-all text-xs",
                authMode === 'student' ? "bg-white text-[#1a237e] shadow-lg" : "text-slate-400"
              )}
            >
              <User className="w-4 h-4" /> Alumno
            </button>
            <button
              onClick={() => { setAuthMode('admin'); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black transition-all text-xs",
                authMode === 'admin' ? "bg-white text-[#1a237e] shadow-lg" : "text-slate-400"
              )}
            >
              <ShieldCheck className="w-4 h-4" /> Docente
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                {authMode === 'student' ? 'DNI del Alumno' : 'Correo Docente'}
              </label>
              <div className="relative">
                <input 
                  type={authMode === 'student' ? "text" : "email"}
                  required
                  placeholder={authMode === 'student' ? "DNI" : "correo@ejemplo.com"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-6 py-5 bg-white rounded-2xl border-2 border-slate-100 outline-none focus:border-[#1a237e] transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Contraseña</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-5 bg-white rounded-2xl border-2 border-slate-100 outline-none focus:border-[#1a237e] transition-all font-bold"
                />
              </div>
            </div>

            {error && (
              <div className="p-5 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-[#1a237e] text-white rounded-2xl font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isRegistering ? 'Registrarme ahora' : 'Entrar')}
            </button>
          </form>

          {authMode === 'admin' && (
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full text-xs font-black text-[#1a237e] hover:underline flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {isRegistering ? 'Ya tengo cuenta, volver al login' : '¿No tienes cuenta? Regístrate aquí'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
