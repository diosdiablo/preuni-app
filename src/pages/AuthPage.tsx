import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GraduationCap, ShieldCheck, User, AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'student' | 'admin'>('student');
  const [isRegistering, setIsRegistering] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Si ya hay usuario, mandarlo al dashboard
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let email = identifier.trim();
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
          throw new Error('DNI no autorizado.');
        }
      }

      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: finalPassword,
        });
        if (signUpError) throw signUpError;
        alert('Cuenta creada. Ya puedes ingresar.');
        setIsRegistering(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: finalPassword,
        });

        if (signInError) {
          if (authMode === 'student' && signInError.message.includes('Invalid login credentials')) {
             await supabase.auth.signUp({ email, password: finalPassword });
             await supabase.auth.signInWithPassword({ email, password: finalPassword });
          } else {
            throw signInError;
          }
        }
        // El useEffect se encargará de navegar cuando el user cambie
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      <div className="hidden md:flex md:w-1/2 bg-[#1a237e] relative items-center justify-center p-16 text-white overflow-hidden">
        <div className="relative z-10 max-w-lg space-y-6">
          <GraduationCap className="w-20 h-20" />
          <h2 className="text-5xl font-black">IE Virgen de los Dolores</h2>
          <p className="text-xl text-blue-100">"Excelencia académica para el futuro."</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-800">{isRegistering ? 'Registro' : 'Ingresar'}</h1>
            <p className="text-slate-500 font-bold">Plataforma Feria Escolar 2026</p>
          </div>

          <div className="flex p-1.5 bg-slate-200/50 rounded-2xl">
            <button
              onClick={() => { setAuthMode('student'); setIsRegistering(false); }}
              className={cn("flex-1 py-4 rounded-xl font-black text-xs", authMode === 'student' ? "bg-white text-[#1a237e] shadow-lg" : "text-slate-400")}
            >Alumno</button>
            <button
              onClick={() => setAuthMode('admin')}
              className={cn("flex-1 py-4 rounded-xl font-black text-xs", authMode === 'admin' ? "bg-white text-[#1a237e] shadow-lg" : "text-slate-400")}
            >Docente</button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <input 
                type={authMode === 'student' ? "text" : "email"}
                required
                placeholder={authMode === 'student' ? "DNI" : "correo@ejemplo.com"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-6 py-5 bg-white rounded-2xl border-2 border-slate-100 outline-none focus:border-[#1a237e] font-bold"
              />
              <input 
                type="password" 
                required
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-5 bg-white rounded-2xl border-2 border-slate-100 outline-none focus:border-[#1a237e] font-bold"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-[#1a237e] text-white rounded-2xl font-black text-lg shadow-2xl transition-all"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (isRegistering ? 'Crear Cuenta' : 'Entrar')}
            </button>
          </form>

          {authMode === 'admin' && (
            <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-xs font-black text-[#1a237e] hover:underline">
              {isRegistering ? 'Volver al login' : '¿No tienes cuenta? Regístrate aquí'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
