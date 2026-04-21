import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Area, Dificultad, Exercise } from '@/types';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Settings2, 
  HelpCircle, 
  BrainCircuit,
  Play,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Timer,
  CheckCircle,
  Flag,
  AlertCircle,
  Trophy,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export const ExamsPage: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<'config' | 'exam' | 'results'>('config');
  
  // Config state
  const [config, setConfig] = useState({
    numQuestions: 10,
    areas: [] as Area[],
    difficulty: 'All' as Dificultad | 'All',
    maxTime: 15 // minutes
  });

  // Exam state
  const [questions, setQuestions] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Results state
  const [results, setResults] = useState<{
    score: number,
    total: number,
    timeSpent: number,
    questions: Exercise[]
  } | null>(null);

  const startExam = async () => {
    let query = supabase.from('exercises').select('*');
    
    if (config.areas.length > 0) {
      query = query.in('area', config.areas);
    }
    if (config.difficulty !== 'All') {
      query = query.eq('dificultad', config.difficulty);
    }

    const { data, error } = await query;
    if (error || !data) return;

    const shuffled = [...data].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, config.numQuestions);

    setQuestions(selected);
    setCurrentIndex(0);
    setAnswers({});
    setMarked(new Set());
    setStartTime(Date.now());
    setTimeLeft(config.maxTime * 60);
    setStep('exam');
  };

  const finishExam = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    let correctCount = 0;
    
    questions.forEach(q => {
      if (answers[q.id] === q.respuesta_correcta) {
        correctCount++;
      }
    });

    const { data: examData } = await supabase.from('exams').insert({
      user_id: user?.id,
      score: correctCount,
      total_questions: questions.length,
      time_spent_seconds: timeSpent
    }).select().single();

    if (examData) {
      const answersToInsert = questions.map(q => ({
        exam_id: examData.id,
        exercise_id: q.id,
        user_answer: answers[q.id] ?? null,
        is_correct: answers[q.id] === q.respuesta_correcta
      }));
      
      await supabase.from('exam_answers').insert(answersToInsert);

      const { data: profile } = await supabase.from('profiles').select('points').eq('id', user?.id).single();
      await supabase.from('profiles').update({ points: (profile?.points || 0) + (correctCount * 5) }).eq('id', user?.id);
    }

    setResults({
      score: correctCount,
      total: questions.length,
      timeSpent,
      questions
    });
    setStep('results');
  };

  React.useEffect(() => {
    if (step !== 'exam') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (step === 'config') {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex p-6 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200 animate-float">
            <BrainCircuit className="w-14 h-14" />
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tight">Simulador de Admisión</h1>
          <p className="text-2xl text-slate-500 font-medium max-w-2xl mx-auto">Pon a prueba tus conocimientos en un entorno real y cronometrado.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card-premium p-10 space-y-10">
            <div className="flex items-center gap-4 text-2xl font-black text-slate-800">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Settings2 className="w-6 h-6" />
              </div>
              <span>Configuración</span>
            </div>
            
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-black text-slate-400 uppercase tracking-widest">
                  <span>Cant. de preguntas</span>
                  <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{config.numQuestions}</span>
                </div>
                <input 
                  type="range" min="5" max="50" step="5"
                  value={config.numQuestions}
                  onChange={(e) => setConfig({...config, numQuestions: parseInt(e.target.value)})}
                  className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600 transition-all" 
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-black text-slate-400 uppercase tracking-widest">
                  <span>Tiempo límite (min)</span>
                  <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{config.maxTime}</span>
                </div>
                <input 
                  type="range" min="5" max="120" step="5"
                  value={config.maxTime}
                  onChange={(e) => setConfig({...config, maxTime: parseInt(e.target.value)})}
                  className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 transition-all" 
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest block">Nivel de Dificultad</label>
                <div className="flex flex-wrap gap-3">
                  {['All', 'Bajo', 'Medio', 'Alto'].map(d => (
                    <button
                      key={d}
                      onClick={() => setConfig({...config, difficulty: d as any})}
                      className={cn(
                        "flex-1 px-6 py-4 rounded-2xl text-sm font-black border-2 transition-all",
                        config.difficulty === d 
                          ? "bg-slate-900 text-white border-slate-900 shadow-xl" 
                          : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                      )}
                    >
                      {d === 'All' ? 'Mixto' : d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card-premium p-10 space-y-10 flex flex-col">
            <div className="flex items-center gap-4 text-2xl font-black text-slate-800">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <HelpCircle className="w-6 h-6" />
              </div>
              <span>Áreas a evaluar</span>
            </div>
            <div className="flex-1 grid grid-cols-1 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {[
                'Matemáticas', 'Comunicación', 'Ciencias Naturales', 
                'Ciencias Sociales', 'Inglés', 'Razonamiento Matemático', 'Razonamiento Verbal'
              ].map(area => {
                const isSelected = config.areas.includes(area as Area);
                return (
                  <label 
                    key={area}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all",
                      isSelected 
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md scale-[1.02]" 
                        : "border-slate-100 bg-slate-50 hover:border-slate-200"
                    )}
                  >
                    <span className="text-lg font-bold">{area}</span>
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        const newAreas = isSelected 
                          ? config.areas.filter(a => a !== area)
                          : [...config.areas, area as Area];
                        setConfig({...config, areas: newAreas});
                      }}
                      className="w-6 h-6 rounded-lg accent-emerald-600"
                    />
                  </label>
                );
              })}
            </div>
            <div className="pt-4 p-5 bg-blue-50 rounded-2xl flex items-center gap-4">
              <Zap className="w-6 h-6 text-blue-600 fill-blue-600" />
              <p className="text-sm font-bold text-blue-800">Si no marcas ninguna, evaluaremos todas las áreas aleatoriamente.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <button
            onClick={startExam}
            className="group px-16 py-6 bg-indigo-600 text-white text-2xl font-black rounded-[2.5rem] shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
          >
            <Play className="w-8 h-8 fill-current" />
            Empezar Reto
          </button>
        </div>
      </div>
    );
  }

  if (step === 'exam') {
    const q = questions[currentIndex];
    return (
      <div className="fixed inset-0 bg-slate-50 z-[100] flex flex-col">
        {/* Header Examen Premium */}
        <header className="glass-effect px-8 py-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4 group">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="font-black text-xl text-slate-800 leading-none">Examen de Admisión</h2>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Simulacro Oficial</p>
            </div>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-4 px-8 py-4 bg-white rounded-3xl shadow-md border border-slate-100">
              <Timer className={cn("w-7 h-7", timeLeft < 60 ? "text-rose-500 animate-pulse" : "text-indigo-600")} />
              <span className={cn("text-3xl font-black font-mono", timeLeft < 60 ? "text-rose-600" : "text-slate-800")}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <button 
              onClick={() => { if(confirm('¿Seguro que deseas finalizar el examen ahora?')) finishExam(); }}
              className="px-8 py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 shadow-xl shadow-rose-100 transition-all text-lg"
            >
              Finalizar
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Navigation drawer updated */}
          <aside className="w-80 border-r bg-white hidden lg:flex flex-col p-8 space-y-8">
            <div className="flex items-center gap-3 text-slate-400">
              <Settings2 className="w-5 h-5" />
              <h3 className="font-black text-xs uppercase tracking-[0.2em]">Mapa del Examen</h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-4 gap-3">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "w-full aspect-square rounded-2xl flex items-center justify-center text-sm font-black border-2 transition-all",
                      currentIndex === i ? "border-indigo-600 bg-indigo-50 text-indigo-700 scale-105 shadow-md" : 
                      marked.has(questions[i].id) ? "border-amber-400 bg-amber-50 text-amber-700" :
                      answers[questions[i].id] !== undefined ? "border-emerald-400 bg-emerald-50 text-emerald-700" :
                      "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-xs font-bold text-slate-500">Respondida</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span className="text-xs font-bold text-slate-500">Para revisar</span>
              </div>
            </div>
          </aside>

          {/* Main Question Area updated */}
          <main className="flex-1 overflow-y-auto p-4 md:p-14 bg-slate-50/50">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                   <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em]">Pregunta {currentIndex + 1} de {questions.length}</p>
                   <h4 className="text-2xl font-black text-slate-800">{q.area} • <span className="text-slate-400 font-bold">{q.subarea}</span></h4>
                </div>
                <button 
                  onClick={() => {
                    const newMarked = new Set(marked);
                    if (marked.has(q.id)) newMarked.delete(q.id);
                    else newMarked.add(q.id);
                    setMarked(newMarked);
                  }}
                  className={cn(
                    "flex items-center gap-3 font-black text-sm px-6 py-3 rounded-2xl border-2 transition-all",
                    marked.has(q.id) 
                      ? "bg-amber-500 border-amber-500 text-white shadow-lg" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-amber-200 hover:text-amber-600"
                  )}
                >
                  <Flag className="w-5 h-5" />
                  {marked.has(q.id) ? 'Marcada para revisión' : 'Marcar para revisión'}
                </button>
              </div>

              <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 md:p-16 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                <h3 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight mb-16 relative z-10">
                  {q.enunciado}
                </h3>

                <div className="grid grid-cols-1 gap-5 relative z-10">
                  {q.opciones.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAnswers({...answers, [q.id]: idx})}
                      className={cn(
                        "w-full p-6 rounded-[2rem] border-2 text-left transition-all flex items-center justify-between group",
                        answers[q.id] === idx 
                          ? "border-indigo-600 bg-indigo-50 shadow-lg scale-[1.01]" 
                          : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-all",
                          answers[q.id] === idx ? "bg-indigo-600 text-white" : "bg-white text-slate-400 border border-slate-100 group-hover:border-slate-300"
                        )}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className={cn("text-xl font-bold", answers[q.id] === idx ? "text-indigo-900" : "text-slate-600")}>
                          {opt}
                        </span>
                      </div>
                      <AnimatePresence>
                        {answers[q.id] === idx && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-2 bg-indigo-600 rounded-full text-white">
                            <CheckCircle className="w-6 h-6" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-10">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className="flex items-center gap-3 px-8 py-5 rounded-[2rem] border-2 border-slate-200 text-slate-500 font-black hover:bg-slate-100 disabled:opacity-20 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                  Anterior
                </button>
                <div className="hidden sm:flex gap-2">
                  {questions.map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        i === currentIndex ? "w-10 bg-indigo-600" : "w-2 bg-slate-200"
                      )} 
                    />
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (currentIndex < questions.length - 1) {
                      setCurrentIndex(prev => prev + 1);
                    } else {
                      if(confirm('Has terminado todas las preguntas. ¿Deseas finalizar el simulacro?')) finishExam();
                    }
                  }}
                  className="flex items-center gap-3 px-10 py-5 rounded-[2rem] bg-slate-900 text-white font-black hover:bg-indigo-600 hover:scale-105 active:scale-95 shadow-xl transition-all"
                >
                  {currentIndex === questions.length - 1 ? 'Finalizar Examen' : 'Siguiente'}
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (step === 'results' && results) {
    const scorePercentage = (results.score / results.total) * 100;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto py-12"
      >
        <div className="card-premium overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)]">
          <div className="bg-gradient-to-br from-indigo-800 to-blue-600 p-16 md:p-24 text-center ">
            <h1 className="text-3xl font-black text-white/60 mb-6 uppercase tracking-[0.5em]">Score General</h1>
            <div className="relative inline-block mb-10">
              <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-110 animate-pulse" />
              <div className="relative w-56 h-56 rounded-full border-8 border-white/20 flex flex-col items-center justify-center bg-white/10 backdrop-blur-xl">
                 <span className="text-8xl font-black text-white leading-none">{Math.round(scorePercentage)}</span>
                 <span className="text-xl font-bold text-white/70">%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="p-6 bg-white/10 rounded-[2rem] border border-white/10">
                 <p className="text-[10px] font-black text-white/50 uppercase mb-2">Aciertos</p>
                 <p className="text-3xl font-black text-white">{results.score} <span className="text-lg font-bold opacity-40">/ {results.total}</span></p>
              </div>
              <div className="p-6 bg-white/10 rounded-[2rem] border border-white/10">
                 <p className="text-[10px] font-black text-white/50 uppercase mb-2">Tiempo total</p>
                 <p className="text-3xl font-black text-white">{formatTime(results.timeSpent)}</p>
              </div>
              <div className="p-6 bg-white/20 rounded-[2rem] border border-white/20">
                 <p className="text-[10px] font-black text-white/50 uppercase mb-2">XP Ganada</p>
                 <p className="text-3xl font-black text-yellow-300">+{results.score * 5}</p>
              </div>
            </div>
          </div>

          <div className="p-10 md:p-20 bg-slate-50 space-y-12">
            <div className="flex flex-col md:flex-row items-center gap-8 p-10 bg-white rounded-[3rem] border-2 border-slate-100 shadow-xl">
              <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center">
                <Trophy className="w-12 h-12" />
              </div>
              <div className="text-center md:text-left flex-1">
                <h3 className="text-3xl font-black text-slate-800 mb-2">Simulacro Finalizado</h3>
                <p className="text-slate-500 font-medium text-lg italic">"Cada error es una oportunidad de aprendizaje. Sigue reforzando tus áreas débiles."</p>
              </div>
              <button 
                onClick={() => setStep('config')}
                className="px-10 py-5 bg-indigo-600 text-white font-black rounded-[1.5rem] hover:scale-105 active:scale-95 transition-all text-xl shadow-2xl shadow-indigo-200"
              >
                Nuevo Intento
              </button>
            </div>

            <div className="space-y-8">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                <HelpCircle className="w-10 h-10 text-indigo-600" />
                Revisión Detallada
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {results.questions.map((q, i) => {
                  const isCorrect = answers[q.id] === q.respuesta_correcta;
                  return (
                    <div key={q.id} className="bg-white border border-slate-100 p-10 rounded-[3rem] space-y-6 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Reactivo {i + 1} • {q.area}</span>
                        {isCorrect ? (
                          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full font-black text-xs border border-emerald-100">
                            <CheckCircle className="w-4 h-4" /> ACIERTO
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-full font-black text-xs border border-rose-100">
                            <AlertCircle className="w-4 h-4" /> ERROR
                          </div>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-slate-800 leading-tight">{q.enunciado}</p>
                      <div className="p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100/50">
                        <div className="flex items-center gap-2 mb-3 text-blue-800 font-black text-sm uppercase">
                          <Info className="w-4 h-4" /> Justificación Técnica
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">{q.explicacion}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center pt-10">
              <Link to="/" className="flex items-center gap-3 text-slate-400 font-black hover:text-indigo-600 transition-all text-lg">
                <ArrowLeft className="w-6 h-6" /> Regresar al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};

// Simple Info icon replacement if missing from lucide
function Info(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
