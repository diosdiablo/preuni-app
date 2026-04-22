import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap, ShieldCheck, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const AuthPage: React.FC = () => {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Transform DNI to institutional email format
    const email = dni.includes('@') ? dni : `${dni}@virdolores.edu`;
    const finalPassword = password || dni;

    try {
      // 1. Check if it's an admin email (jm8270@gmail.com)
      // If it's a DNI, check if it's authorized
      if (!dni.includes('@')) {
        const { data: isAuthorized } = await supabase
          .from('authorized_students')
          .select('dni')
          .eq('dni', dni)
          .single();

        if (!isAuthorized) {
          throw new Error('DNI no autorizado. Contacta con el administrador de la feria.');
        }
      }

      // 2. Try to Sign In
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: finalPassword,
      });

      // 3. If user doesn't exist but is a DNI, try to Auto-Register
      if (signInError && signInError.message === 'Invalid login credentials' && !dni.includes('@')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: finalPassword,
          options: {
            data: { dni }
          }
        });
        if (signUpError) throw signUpError;
        
        // Try sign in again after auto-signup
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password: finalPassword,
        });
        if (retryError) throw retryError;
      } else if (signInError) {
        throw signInError;
      }

    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'DNI o contraseña incorrectos' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a237e] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 space-y-10 relative border border-white/20">
          <div className="text-center space-y-4">
            <div className="inline-flex p-5 bg-blue-50 rounded-[2rem] text-[#1a237e] mb-2 animate-float">
               <GraduationCap className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
              IE Virgen de <br/> los Dolores
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Feria Escolar 2026</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-4">Usuario / DNI</label>
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#1a237e] transition-colors" />
                <input 
                  type="text" 
                  required
                  placeholder="Ingresa tu DNI"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:bg-white focus:border-[#1a237e] focus:shadow-xl transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-4">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#1a237e] transition-colors" />
                <input 
                  type="password" 
                  required
                  placeholder="Tu DNI es tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:bg-white focus:border-[#1a237e] focus:shadow-xl transition-all font-bold"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3 border border-red-100"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-[#1a237e] text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Ingresar a la Plataforma'}
            </button>
          </form>

          <div className="pt-4 text-center">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Acceso Institucional Protegido</span>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
