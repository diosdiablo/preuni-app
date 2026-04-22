import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Exercise, Area, Dificultad } from '@/types';
import { 
  Play, 
  Timer, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  Clock,
  Target,
  History,
  Stethoscope,
  Cpu,
  Gavel,
  BadgeDollarSign,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

type BlockId = 'A' | 'B' | 'C' | 'D';

interface BlockConfig {
  id: BlockId;
  name: string;
  description: string;
  icon: any;
  color: string;
  distribution: Partial<Record<Area, number>>; // Porcentajes
}

const BLOCKS: BlockConfig[] = [
  {
    id: 'A',
    name: 'Salud',
    description: 'Medicina, Farmacia, Odontología',
    icon: Stethoscope,
    color: 'emerald',
    distribution: { 'Biología': 20, 'Química': 20, 'Física': 10, 'Razonamiento Verbal': 20, 'Razonamiento Matemático': 15, 'Comunicación': 15 }
  },
  {
    id: 'B',
    name: 'Ingenierías',
    description: 'Sistemas, Civil, Mecánica',
    icon: Cpu,
    color: 'blue',
    distribution: { 'Matemáticas': 30, 'Física': 20, 'Química': 15, 'Razonamiento Matemático': 20, 'Razonamiento Verbal': 15 }
  },
  {
    id: 'C',
    name: 'Letras / Sociales',
    description: 'Derecho, Psicología, Educación',
    icon: Gavel,
    color: 'rose',
    distribution: { 'Razonamiento Verbal': 30, 'Ciencias Sociales': 25, 'Comunicación': 20, 'Razonamiento Matemático': 15, 'Inglés': 10 }
  },
  {
    id: 'D',
    name: 'Económicas',
    description: 'Admin, Contabilidad, Economía',
    icon: BadgeDollarSign,
    color: 'amber',
    distribution: { 'Razonamiento Matemático': 30, 'Ciencias Sociales': 20, 'Matemáticas': 15, 'Razonamiento Verbal': 20, 'Comunicación': 15 }
  }
];

export const ExamsPage: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<'setup' | 'block' | 'exam' | 'results'>('setup');
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<{ score: number, total: number, time: number } | null>(null);
  const [time, setTime] = useState(0);
  
  const [settings, setSettings] = useState({
    count: 20,
    timeLimit: 30,
    blockId: 'B' as BlockId,
    difficulty: 'All' as Dificultad | 'All'
  });

  useEffect(() => {
    let timer: any;
    if (step === 'exam') {
      timer = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const startExam = async () => {
    setLoading(true);
    const selectedBlock = BLOCKS.find(b => b.id === settings.blockId)!;
    let allQuestions: Exercise[] = [];

    try {
      // Fetch questions area by area based on distribution
      for (const [area, percentage] of Object.entries(selectedBlock.distribution)) {
        const countForArea = Math.ceil((settings.count * (percentage as number)) / 100);
        
        const { data } = await supabase
          .from('exercises')
          .select('*')
          .or(`area.eq."${area}",subarea.eq."${area}"`);
        
        let filtered = data || [];
        if (settings.difficulty !== 'All') {
          filtered = filtered.filter(ex => 
            ex.dificultad === settings.difficulty || 
            (settings.difficulty === 'Fácil' && ex.dificultad === 'Bajo') ||
            (settings.difficulty === 'Difícil' && ex.dificultad === 'Alto')
          );
        }
        
        allQuestions = [...allQuestions, ...filtered.sort(() => Math.random() - 0.5).slice(0, countForArea)];
      }

      // Shuffle and trim to exact count
      allQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, settings.count);
      
      // If not enough questions, fill with random ones
      if (allQuestions.length < settings.count) {
        const { data: extra } = await supabase
          .from('exercises')
          .select('*')
          .limit(settings.count - allQuestions.length);
        if (extra) allQuestions = [...allQuestions, ...extra];
      }

      setExercises(allQuestions);
      setStep('exam');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const finishExam = async () => {
    let score = 0;
    exercises.forEach((ex) => {
      if (userAnswers[ex.id] === ex.respuesta_correcta) {
        score++;
      }
    });

    const finalResults = {
      score,
      total: exercises.length,
      time
    };

    setResults(finalResults);
    setStep('results');

    // Save to Supabase
    if (user) {
      const { data: examData } = await supabase
        .from('exams')
        .insert([{
          user_id: user.id,
          score,
          total_questions: exercises.length,
          time_spent_seconds: time
        }])
        .select()
        .single();

      if (examData) {
        const answers = exercises.map(ex => ({
          exam_id: examData.id,
          exercise_id: ex.id,
          user_answer: userAnswers[ex.id] ?? null,
          is_correct: userAnswers[ex.id] === ex.respuesta_correcta
        }));
        await supabase.from('exam_answers').insert(answers);
        
        // Reward points
        const points = score * 10;
        await supabase.rpc('increment_points', { user_id: user.id, amount: points });
      }
    }
  };

  if (step === 'setup') {
    return (
      <div className="space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Simulador de Admisión</h1>
          <p className="text-xl text-slate-500 font-medium">Configura tu experiencia de examen oficial.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          <div className="card-premium p-10 space-y-8">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Target className="text-blue-600" />
              Cantidad de Preguntas
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[10, 20, 50, 100].map(n => (
                <button
                  key={n}
                  onClick={() => setSettings({...settings, count: n})}
                  className={cn(
                    "py-4 rounded-2xl font-black transition-all border-2",
                    settings.count === n 
                      ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200" 
                      : "bg-white text-slate-500 border-slate-100 hover:border-blue-200"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="card-premium p-10 space-y-8">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Clock className="text-orange-500" />
              Tiempo Límite (min)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[15, 30, 60, 180].map(m => (
                <button
                  key={m}
                  onClick={() => setSettings({...settings, timeLimit: m})}
                  className={cn(
                    "py-4 rounded-2xl font-black transition-all border-2",
                    settings.timeLimit === m 
                      ? "bg-orange-500 text-white border-orange-500 shadow-xl shadow-orange-200" 
                      : "bg-white text-slate-500 border-slate-100 hover:border-orange-200"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="card-premium p-10 space-y-8">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <History className="text-indigo-500" />
              Nivel de Dificultad
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {['All', 'Fácil', 'Medio', 'Difícil'].map(d => (
                <button
                  key={d}
                  onClick={() => setSettings({...settings, difficulty: d as any})}
                  className={cn(
                    "py-4 rounded-2xl font-black transition-all border-2",
                    settings.difficulty === d 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200" 
                      : "bg-white text-slate-500 border-slate-100 hover:border-blue-200"
                  )}
                >
                  {d === 'All' ? 'Todos' : d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={() => setStep('block')}
            className="px-12 py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl hover:scale-105 transition-all flex items-center gap-4 text-xl"
          >
            Siguiente Paso
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'block') {
    return (
      <div className="space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
           <button onClick={() => setStep('setup')} className="text-blue-600 font-bold flex items-center gap-2 mx-auto hover:gap-3 transition-all mb-4">
             <ChevronLeft className="w-5 h-5" /> Volver a configuración
           </button>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Elige tu Bloque</h1>
          <p className="text-xl text-slate-500 font-medium">Las preguntas se distribuirán según tu carrera elegida.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {BLOCKS.map((block) => (
            <button
              key={block.id}
              onClick={() => setSettings({...settings, blockId: block.id})}
              className={cn(
                "card-premium p-8 text-left space-y-6 transition-all border-4",
                settings.blockId === block.id 
                  ? "border-blue-500 shadow-2xl shadow-blue-100 scale-105" 
                  : "border-transparent opacity-80 hover:opacity-100"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg",
                block.id === 'A' ? "bg-emerald-500 text-white" :
                block.id === 'B' ? "bg-blue-500 text-white" :
                block.id === 'C' ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
              )}>
                <block.icon className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-800">Bloque {block.id}</h4>
                <p className="font-bold text-slate-600">{block.name}</p>
              </div>
              <p className="text-sm text-slate-400 font-medium">{block.description}</p>
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <button 
            onClick={startExam}
            disabled={loading}
            className="px-16 py-6 bg-blue-600 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-200 hover:scale-105 transition-all flex items-center gap-4 text-2xl"
          >
            {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Play className="w-8 h-8 fill-white" />}
            Empezar Simulacro
          </button>
        </div>
      </div>
    );
  }

  if (step === 'exam') {
    const question = exercises[currentQuestion];
    const progress = ((currentQuestion + 1) / exercises.length) * 100;

    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 glass-effect p-8 rounded-[2.5rem] shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl font-black">
              {currentQuestion + 1} / {exercises.length}
            </div>
            <div className="w-48 h-3 bg-slate-100 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progress}%` }}
                 className="h-full bg-blue-500" 
               />
            </div>
          </div>
          
          <div className={cn(
            "flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xl",
            time > settings.timeLimit * 60 ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-900 text-white"
          )}>
            <Timer className="w-6 h-6" />
            {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="card-premium p-10 md:p-16 space-y-10"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-wider">
                {question.area} • {question.subarea}
              </div>
              <h2 className="text-3xl font-bold text-slate-800 leading-tight">
                {question.enunciado}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {question.opciones.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setUserAnswers({ ...userAnswers, [question.id]: idx })}
                  className={cn(
                    "flex items-center gap-6 p-6 rounded-[1.5rem] text-left transition-all group border-2",
                    userAnswers[question.id] === idx
                      ? "bg-blue-600 text-white border-blue-600 shadow-xl scale-[1.02]"
                      : "bg-white text-slate-600 border-slate-100 hover:border-blue-200 hover:bg-blue-50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 transition-all",
                    userAnswers[question.id] === idx ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-blue-100"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-lg font-bold">{opt}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="p-6 rounded-3xl bg-white text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-all shadow-sm"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          {currentQuestion === exercises.length - 1 ? (
            <button
              onClick={finishExam}
              className="px-12 py-6 bg-emerald-500 text-white font-black rounded-[2rem] shadow-2xl shadow-emerald-200 hover:scale-105 transition-all text-xl"
            >
              Finalizar Examen
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(prev => Math.min(exercises.length - 1, prev + 1))}
              className="p-6 rounded-3xl bg-blue-600 text-white hover:scale-105 transition-all shadow-xl shadow-blue-200"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'results' && results) {
    const scorePercentage = (results.score / results.total) * 100;
    
    return (
      <div className="max-w-4xl mx-auto space-y-10 py-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card-premium p-12 text-center space-y-8 overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-indigo-500" />
          
          <div className="space-y-2">
            <h2 className="text-5xl font-black text-slate-900">Resultados del Simulacro</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Bloque {BLOCKS.find(b => b.id === settings.blockId)?.name}</p>
          </div>

          <div className="flex justify-center relative">
            <div className="w-64 h-64 rounded-full border-[12px] border-slate-50 flex flex-col items-center justify-center relative">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="text-6xl font-black text-slate-800"
               >
                 {Math.round(scorePercentage)}%
               </motion.div>
               <div className="text-slate-400 font-bold uppercase text-xs tracking-tighter">Puntaje Total</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
             <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
               <div className="text-3xl font-black text-slate-800">{results.score}</div>
               <div className="text-xs font-bold text-slate-400 uppercase">Correctas</div>
             </div>
             <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
               <div className="text-3xl font-black text-slate-800">{results.total - results.score}</div>
               <div className="text-xs font-bold text-slate-400 uppercase">Incorrectas</div>
             </div>
             <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
               <div className="text-3xl font-black text-slate-800">{Math.floor(results.time / 60)}m</div>
               <div className="text-xs font-bold text-slate-400 uppercase">Tiempo</div>
             </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center pt-6">
            <button 
              onClick={() => {
                setStep('setup');
                setExercises([]);
                setUserAnswers({});
                setTime(0);
              }}
              className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all"
            >
              Nuevo Simulacro
            </button>
            <Link 
              to="/"
              className="px-10 py-5 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
            >
              Ir al Dashboard
            </Link>
          </div>
        </motion.div>

        <div className="space-y-6">
          <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 px-4">
            <History className="text-indigo-500" />
            Revisión Detallada
          </h3>
          <div className="space-y-4">
            {exercises.map((ex, idx) => (
              <div key={ex.id} className="card-premium p-8 space-y-6">
                <div className="flex justify-between items-start gap-4">
                   <div className="flex items-center gap-3">
                     <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-500">{idx + 1}</span>
                     <span className="text-sm font-black text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full">{ex.area}</span>
                   </div>
                   {userAnswers[ex.id] === ex.respuesta_correcta ? (
                     <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black flex items-center gap-2 border border-emerald-100">
                       <CheckCircle2 className="w-4 h-4" /> CORRECTA
                     </span>
                   ) : (
                     <span className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-xs font-black flex items-center gap-2 border border-rose-100">
                       <AlertCircle className="w-4 h-4" /> INCORRECTA
                     </span>
                   )}
                </div>
                <p className="text-xl font-bold text-slate-800">{ex.enunciado}</p>
                <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-indigo-500 italic text-slate-600">
                  <span className="font-black text-indigo-600 block mb-1 not-italic uppercase text-xs">Explicación:</span>
                  {ex.explicacion}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
