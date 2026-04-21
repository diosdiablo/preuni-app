import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Profile, Exam, Area } from '@/types';
import { 
  Trophy, 
  Target, 
  Flame, 
  Calendar,
  ChevronRight,
  TrendingUp,
  Brain,
  History,
  Loader2
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

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [stats, setStats] = useState<{area: string, value: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      setProfile(profileData);

      // Fetch Exams
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      setExams(examsData || []);

      // Calculate Domain by Area (Mocking some stats based on exam answers if we had more logic, 
      // but for now let's derive something from practice_stats or exam_answers)
      await supabase
        .from('exam_answers')
        .select('*, exercises(area)')
        .eq('exam_id', examsData?.[0]?.id || 'none');

      // Aggregate stats logic (simplified for demo)
      const areas: Area[] = ['Matemáticas', 'Comunicación', 'Ciencias Naturales', 'Ciencias Sociales', 'Inglés', 'Razonamiento Matemático', 'Razonamiento Verbal'];
      const areaStats = areas.map(area => ({
        area: area.split(' ')[0], // Short name
        full: area,
        value: 40 + Math.floor(Math.random() * 50) // Random for now as placeholder for real logic
      }));
      setStats(areaStats);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground">Analizando tu progreso...</p>
      </div>
    );
  }

  const getMasteryLevel = (val: number) => {
    if (val < 50) return { label: 'Principiante', color: 'text-red-500 bg-red-100' };
    if (val < 80) return { label: 'Intermedio', color: 'text-yellow-500 bg-yellow-100' };
    return { label: 'Avanzado', color: 'text-green-500 bg-green-100' };
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header / Hero */}
      <div className="relative overflow-hidden bg-primary p-8 md:p-12 rounded-[40px] text-primary-foreground shadow-2xl shadow-primary/30">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black">¡Hola, {profile?.email.split('@')[0]}!</h1>
            <p className="text-xl opacity-90 font-medium">Estás en nivel <span className="underline decoration-4 underline-offset-4">{profile?.level}</span>. ¡Faltan 250 puntos para el siguiente nivel!</p>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="px-6 py-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-300" />
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-70">Puntos Totales</p>
                  <p className="text-xl font-black">{profile?.points}</p>
                </div>
              </div>
              <div className="px-6 py-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center gap-3">
                <Target className="w-6 h-6 text-orange-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-70">Exámenes Realizados</p>
                  <p className="text-xl font-black">{exams.length}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
             <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center border-8 border-white/5 animate-pulse">
                <Brain className="w-24 h-24 opacity-20" />
             </div>
          </div>
        </div>
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-primary-900/50 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Radar Chart: Dominio por Área */}
        <div className="lg:col-span-2 bg-card border rounded-[40px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Dominio por Área</h2>
            </div>
            <Link to="/ejercicios" className="text-primary font-bold hover:underline flex items-center gap-1 text-sm">
              Reforzar áreas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="area" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                <Radar
                  name="Dominio"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.4}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Level breakdown list */}
        <div className="bg-card border rounded-[40px] p-8">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Niveles actuales
          </h3>
          <div className="space-y-4">
            {stats.sort((a,b) => b.value - a.value).map((s) => {
              const level = getMasteryLevel(s.value);
              return (
                <div key={s.area} className="p-4 rounded-2xl border bg-muted/20 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{s.area}</span>
                    <span className={cn("text-[10px] font-black px-2 py-1 rounded-lg uppercase", level.color)}>
                      {level.label}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Evolution Chart */}
        <div className="bg-card border rounded-[40px] p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
             <Calendar className="w-6 h-6 text-primary" />
             Evolución de Puntajes
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exams.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="created_at" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString()}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                   contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Exams */}
        <div className="bg-card border rounded-[40px] p-8 shadow-sm flex flex-col">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
             <History className="w-6 h-6 text-primary" />
             Historial Reciente
          </h2>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2">
            {exams.length > 0 ? exams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {Math.round((exam.score / exam.total_questions) * 100)}%
                  </div>
                  <div>
                    <p className="font-bold">{exam.score} correctas de {exam.total_questions}</p>
                    <p className="text-xs text-muted-foreground">{new Date(exam.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{Math.floor(exam.time_spent_seconds / 60)}m {exam.time_spent_seconds % 60}s</p>
                  <p className="text-[10px] uppercase font-bold text-primary">Completado</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-2">
                 <History className="w-12 h-12" />
                 <p>No hay exámenes realizados aún.</p>
              </div>
            )}
          </div>
          {exams.length > 0 && (
            <Link to="/examenes" className="mt-6 w-full py-4 text-center border-2 border-dashed border-primary/20 rounded-2xl hover:border-primary/50 text-primary font-bold transition-all">
               Iniciar nuevo simulacro
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
