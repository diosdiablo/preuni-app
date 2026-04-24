import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Exam, Area } from '@/types';
import { 
  Target, 
  Flame, 
  Calendar,
  TrendingUp,
  Brain,
  History,
  Loader2,
  Zap,
  Star,
  GraduationCap
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  LineChart,
  Line
} from 'recharts';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const DashboardPage: React.FC = () => {
  const { user, isAdmin, profile: authProfile, studentName } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [stats, setStats] = useState<{area: string, value: number, color: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      setExams(examsData || []);

      const areas: Area[] = ['Matemáticas', 'Ciencia', 'Comunicación', 'Ciencias Sociales', 'Inglés'];
      const areaColors: Record<string, string> = {
        'Matemáticas': '#3b82f6',
        'Ciencia': '#10b981',
        'Comunicación': '#f43f5e',
        'Ciencias Sociales': '#f59e0b',
        'Inglés': '#8b5cf6'
      };

      // Fetch real practice stats joined with exercises
      const { data: practiceData } = await supabase
        .from('practice_stats')
        .select('is_correct, exercise_id, exercises(area)')
        .eq('user_id', user?.id);

      const areaStats = areas.map(area => {
        const areaAttempts = (practiceData || []).filter(
          (s: any) => s.exercises?.area === area
        );
        const correct = areaAttempts.filter((s: any) => s.is_correct).length;
        const value = areaAttempts.length > 0
          ? Math.round((correct / areaAttempts.length) * 100)
          : 0;
        return {
          area: area.split(' ')[0],
          full: area,
          value,
          color: areaColors[area] || '#1a237e'
        };
      });
      setStats(areaStats);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-[#1a237e] animate-spin" />
          <Brain className="w-8 h-8 text-[#1a237e]/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-6 text-slate-500 font-bold animate-pulse">Optimizando tu ruta de aprendizaje...</p>
      </div>
    );
  }

  const getMasteryLevel = (val: number) => {
    if (val < 50) return { label: 'Principiante', color: 'text-rose-600 bg-rose-50 border-rose-100' };
    if (val < 80) return { label: 'Intermedio', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    return { label: 'Avanzado', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
  };

  const userName = studentName || user?.email?.split('@')[0] || 'Estudiante';

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section Vibrant - Institucional */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#3949ab] p-10 md:p-14 rounded-[3.5rem] text-white shadow-2xl shadow-blue-900/20"
      >
        {/* Abstract shapes for premium look */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-sm font-bold">
              <Zap className="w-4 h-4 fill-yellow-300 text-yellow-300" />
              Portal de Apoyo al Estudiante
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
              ¡Hola, {userName}! 🚀
            </h1>
            <p className="text-xl md:text-2xl opacity-90 font-medium max-w-lg">
              Sigue preparándote para alcanzar la <span className="p-1 px-3 bg-white text-[#1a237e] rounded-xl font-black">Excelencia</span>
            </p>
            <div className="flex flex-wrap gap-5 pt-4">
              <Link to="/examenes" className="px-8 py-4 bg-white text-[#1a237e] rounded-[1.5rem] font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                <Target className="w-5 h-5" />
                Iniciar Simulacro
              </Link>
              <div className="flex items-center gap-2 px-6 py-4 bg-white/10 backdrop-blur-md rounded-[1.5rem] border border-white/10">
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <span className="font-black text-2xl">{authProfile?.points || 0}</span>
                <span className="font-bold opacity-70">XP</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex justify-center relative">
             <motion.div 
               animate={{ y: [0, -15, 0] }}
               transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
               className="w-64 h-64 bg-white/5 rounded-[3rem] flex items-center justify-center border-8 border-white/5 backdrop-blur-md"
             >
                <GraduationCap className="w-32 h-32 text-white/20" />
             </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 card-premium p-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-50 text-[#1a237e] rounded-[1.5rem] border border-slate-100">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Dominio por Área</h2>
            </div>
          </div>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="area" tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 800 }} />
                <Radar
                  name="Dominio"
                  dataKey="value"
                  stroke="#1a237e"
                  fill="#1a237e"
                  fillOpacity={0.4}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', padding: '15px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-premium p-10 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
            <h3 className="text-2xl font-black text-slate-800">Camino al Éxito</h3>
          </div>
          <div className="flex-1 space-y-5">
            {stats.every(s => s.value === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 py-10 text-center">
                <Brain className="w-20 h-20 mb-4 opacity-20" />
                <p className="font-bold text-slate-400">¡Aún no hay datos!</p>
                <p className="text-sm text-slate-400 mt-1">Practica ejercicios para ver tu progreso.</p>
              </div>
            ) : (
              [...stats].sort((a,b) => b.value - a.value).map((s) => {
                const level = getMasteryLevel(s.value);
                return (
                  <div key={s.area} className="group p-5 rounded-[2rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-[#1a237e]/20 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-slate-700">{s.area}</span>
                      <span className={cn("text-[10px] font-black px-3 py-1 rounded-full uppercase border", level.color)}>
                        {level.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${s.value}%` }}
                          className="h-full rounded-full transition-all duration-1000 shadow-sm" 
                          style={{ backgroundColor: s.color }}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-500">{s.value}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 card-premium p-10">
          <div className="flex items-center gap-4 mb-10">
             <div className="p-4 bg-slate-50 text-[#1a237e] rounded-[1.5rem] border border-slate-100">
               <Calendar className="w-7 h-7" />
             </div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">Evolución Semanal</h2>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exams.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="created_at" 
                  tickFormatter={(val) => val ? new Date(val).toLocaleDateString() : ''}
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} />
                <Tooltip
                   contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#1a237e" 
                  strokeWidth={6} 
                  dot={{ r: 8, fill: '#1a237e', strokeWidth: 4, stroke: '#fff' }}
                  activeDot={{ r: 10, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 card-premium p-10 flex flex-col">
          <div className="flex items-center gap-4 mb-10">
             <div className="p-4 bg-slate-50 text-slate-600 rounded-[1.5rem] border border-slate-100">
               <History className="w-7 h-7" />
             </div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">Última Actividad</h2>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            {exams.length > 0 ? exams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-5 rounded-[2rem] bg-slate-50 border border-slate-100 hover:scale-[1.02] transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-[#1a237e] text-lg border-2 border-slate-50">
                    {exam.total_questions > 0 ? Math.round((exam.score / exam.total_questions) * 100) : 0}%
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-lg">{exam.score} / {exam.total_questions}</p>
                    <p className="text-xs text-slate-500 font-bold">{new Date(exam.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 py-10">
                 <History className="w-20 h-20 mb-4 opacity-20" />
                 <p className="font-bold">Aún no hay actividad...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
