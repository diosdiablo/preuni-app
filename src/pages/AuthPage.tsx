import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GraduationCap, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'student' | 'admin' | 'register'>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

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
      if (authMode === 'register') {
        const dni = identifier.trim();
        const { error: insertError } = await supabase
          .from('pending_registrations')
          .insert([{ nombres: nombres.trim(), apellidos: apellidos.trim(), dni }]);

        if (insertError) {
          if (insertError.message.includes('duplicate key')) {
            throw new Error('Este DNI ya ha sido registrado. Espera la aprobación del docente.');
          }
          throw insertError;
        }

        setRegistered(true);
        return;
      }

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
          const { data: pending } = await supabase
            .from('pending_registrations')
            .select('status')
            .eq('dni', identifier.trim())
            .single();

          if (pending?.status === 'pending') {
            throw new Error('Tu registro está pendiente de aprobación por el docente.');
          }

          throw new Error('DNI no registrado. Debes registrarte primero.');
        }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: finalPassword,
      });

      if (signInError) {
        if (authMode === 'student' && signInError.message.includes('Invalid login credentials')) {
           const { error: autoReg } = await supabase.auth.signUp({ email, password: finalPassword });
           if (autoReg) throw autoReg;
           const { error: retry } = await supabase.auth.signInWithPassword({ email, password: finalPassword });
           if (retry) throw retry;
        } else {
          throw signInError;
        }
      }

    } catch (err: any) {
      console.error('Auth Error:', err);
      let msg = err.message;
      if (msg.includes('Invalid login credentials')) msg = 'Datos incorrectos. Verifica tu DNI/Correo y Contraseña.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
        <div className="hidden md:flex md:w-1/2 bg-[#1a237e] relative items-center justify-center p-16 text-white overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10 max-w-lg space-y-10">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-6">
              <h2 className="text-6xl font-black leading-tight tracking-tighter">IE Virgen de <br/> los Dolores</h2>
              <p className="text-xl text-blue-100/80 font-medium leading-relaxed">
                "Excelencia y valores para forjar los líderes del mañana."
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-slate-50">
          <div className="w-full max-w-md space-y-10 text-center">
            <div className="inline-flex p-6 bg-emerald-50 rounded-[2.5rem]">
              <CheckCircle2 className="w-20 h-20 text-emerald-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-slate-800">¡Registro exitoso!</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                Tu solicitud ha sido enviada. Espera la aprobación del docente para poder ingresar.
              </p>
            </div>
            <button
              onClick={() => { setRegistered(false); setAuthMode('student'); setError(null); setIdentifier(''); setPassword(''); }}
              className="w-full py-6 bg-[#1a237e] text-white rounded-2xl font-black text-lg shadow-2xl transition-all hover:scale-[1.02]"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* Lado Izquierdo: Mensaje Institucional */}
      <div className="hidden md:flex md:w-1/2 bg-[#1a237e] relative items-center justify-center p-16 text-white overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

        <div className="relative z-10 max-w-lg space-y-10">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 flex items-center justify-center shadow-2xl">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-6">
            <h2 className="text-6xl font-black leading-tight tracking-tighter">IE Virgen de <br/> los Dolores</h2>
            <p className="text-xl text-blue-100/80 font-medium leading-relaxed">
              "Excelencia y valores para forjar los líderes del mañana."
            </p>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Formulario */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-slate-50">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">¡Bienvenido!</h1>
            <p className="text-slate-500 font-bold">
              {authMode === 'register' ? 'Crea tu cuenta de estudiante.' : 'Ingresa tus datos para continuar.'}
            </p>
          </div>

          <div className="flex p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200">
            <button
              onClick={() => { setAuthMode('student'); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black transition-all text-xs",
                authMode === 'student' ? "bg-white text-[#1a237e] shadow-lg" : "text-slate-400 hover:text-slate-600"
              )}
            >Alumno</button>
            <button
              onClick={() => { setAuthMode('register'); setError(null); setRegistered(false); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black transition-all text-xs",
                authMode === 'register' ? "bg-white text-[#1a237e] shadow-lg" : "text-slate-400 hover:text-slate-600"
              )}
            >Registrarse</button>
            <button
              onClick={() => { setAuthMode('admin'); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black transition-all text-xs",
                authMode === 'admin' ? "bg-white text-[#1a237e] shadow-lg" : "text-slate-400 hover:text-slate-600"
              )}
            >Docente</button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {authMode === 'register' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombres</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: Juan Alberto"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    className="w-full px-6 py-5 bg-white rounded-2xl border-2 border-slate-100 outline-none focus:border-[#1a237e] transition-all font-bold placeholder:text-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Apellidos</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: Pérez García"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    className="w-full px-6 py-5 bg-white rounded-2xl border-2 border-slate-100 outline-none focus:border-[#1a237e] transition-all font-bold placeholder:text-slate-300"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                {authMode === 'register' ? 'DNI' : authMode === 'student' ? 'DNI del Alumno' : 'Correo Institucional'}
              </label>
              <input 
                type={authMode === 'admin' ? "email" : "text"}
                required
                placeholder={authMode === 'register' ? "Tu DNI" : authMode === 'student' ? "Tu DNI" : "correo@ejemplo.com"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-6 py-5 bg-white rounded-2xl border-2 border-slate-100 outline-none focus:border-[#1a237e] transition-all font-bold placeholder:text-slate-300"
              />
            </div>

            {authMode !== 'register' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Contraseña</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-5 bg-white rounded-2xl border-2 border-slate-100 outline-none focus:border-[#1a237e] transition-all font-bold placeholder:text-slate-300"
                />
              </div>
            )}

            {error && (
              <div className="p-5 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-[#1a237e] text-white rounded-2xl font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : authMode === 'register' ? 'Solicitar Registro' : 'Ingresar'}
            </button>
          </form>

          {authMode === 'register' && (
            <p className="text-center text-xs font-medium text-slate-400">
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => { setAuthMode('student'); setError(null); }} className="text-[#1a237e] font-black hover:underline">
                Inicia sesión
              </button>
            </p>
          )}

          <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
            © 2026 IE Virgen de los Dolores
          </p>
        </div>
      </div>
    </div>
  );
};
