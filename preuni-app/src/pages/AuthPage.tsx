import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GraduationCap, Mail, Lock, Loader2, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Registro exitoso. ¡Bienvenido a la comunidad!');
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-slate-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-white border border-slate-100 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] overflow-hidden"
      >
        {/* Visual Side */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-indigo-700 via-blue-600 to-blue-500 text-white relative">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
               <GraduationCap className="w-8 h-8 text-white" />
             </div>
             <span className="text-2xl font-black tracking-tight">PreUni App</span>
          </div>

          <div className="space-y-8 relative z-10">
            <h2 className="text-6xl font-black leading-tight tracking-tight">
              Tu éxito <br /> 
              <span className="text-blue-200 underline decoration-blue-300 decoration-8 underline-offset-8">empieza aquí</span>
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-xl"><Sparkles className="w-5 h-5 text-yellow-300" /></div>
                <p className="font-bold text-lg opacity-90">Simulacros reales actualizados</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-xl"><ShieldCheck className="w-5 h-5 text-emerald-300" /></div>
                <p className="font-bold text-lg opacity-90">Analíticas detalladas de tu progreso</p>
              </div>
            </div>
          </div>

          <p className="text-sm font-bold opacity-60">© 2026 PreUni System. Todos los derechos reservados.</p>
          
          {/* Decorative element */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/5 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Form Side */}
        <div className="p-10 md:p-20 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-10">
            <div className="space-y-2 text-center lg:text-left">
              <h1 className="text-5xl font-black text-slate-900 tracking-tight">
                {isLogin ? '¡Hola de nuevo!' : 'Crea tu cuenta'}
              </h1>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">
                {isLogin 
                  ? 'Ingresa tus datos para continuar con tu preparación tecnológica.' 
                  : 'Únete a miles de estudiantes y prepárate para el futuro.'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-6 py-5 rounded-[1.5rem] border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/5 transition-all text-lg font-medium"
                    placeholder="estudiante@ejemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-6 py-5 rounded-[1.5rem] border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/5 transition-all text-lg font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-rose-50 text-rose-600 text-sm font-bold rounded-2xl border border-rose-100"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-slate-900 text-white font-black rounded-[1.5rem] shadow-2xl shadow-slate-200 hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-xl group"
              >
                {loading ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Entrar al Sistema' : 'Empezar ahora'}
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-slate-400 font-bold hover:text-blue-600 transition-all text-lg"
              >
                {isLogin ? (
                  <>¿Eres nuevo? <span className="text-slate-900 underline decoration-2 underline-offset-4">Crea una cuenta</span></>
                ) : (
                  <>¿Ya tienes cuenta? <span className="text-slate-900 underline decoration-2 underline-offset-4">Inicia sesión</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
