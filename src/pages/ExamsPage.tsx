import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Area, Dificultad, Exercise } from '@/types';
import { 
  GraduationCap, 
  Settings2, 
  Clock, 
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
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

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

    // Shuffle and pick
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

    // Save Exam to DB
    const { data: examData } = await supabase.from('exams').insert({
      user_id: user?.id,
      score: correctCount,
      total_questions: questions.length,
      time_spent_seconds: timeSpent
    }).select().single();

    if (examData) {
      // Save answers
      const answersToInsert = questions.map(q => ({
        exam_id: examData.id,
        exercise_id: q.id,
        user_answer: answers[q.id] ?? null,
        is_correct: answers[q.id] === q.respuesta_correcta
      }));
      
      await supabase.from('exam_answers').insert(answersToInsert);

      // Update points
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

  // Timer loop
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
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-10 text-center">
          <div className="inline-flex p-4 rounded-3xl bg-primary/10 text-primary mb-4">
            <BrainCircuit className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Simulador de Admisión</h1>
          <p className="text-muted-foreground text-lg">Configura tu examen a medida para medir tu rendimiento real.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card border rounded-3xl p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-bold">
                <Settings2 className="w-5 h-5 text-primary" />
                <span>Ajustes Generales</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Número de preguntas: {config.numQuestions}</label>
                  <input 
                    type="range" min="5" max="50" step="5"
                    value={config.numQuestions}
                    onChange={(e) => setConfig({...config, numQuestions: parseInt(e.target.value)})}
                    className="w-full accent-primary" 
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center justify-between">
                    <span>Tiempo límite (min): {config.maxTime}</span>
                    <Clock className="w-4 h-4" />
                  </label>
                  <input 
                    type="range" min="5" max="120" step="5"
                    value={config.maxTime}
                    onChange={(e) => setConfig({...config, maxTime: parseInt(e.target.value)})}
                    className="w-full accent-primary" 
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Dificultad preferida</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['All', 'Bajo', 'Medio', 'Alto'].map(d => (
                      <button
                        key={d}
                        onClick={() => setConfig({...config, difficulty: d as any})}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                          config.difficulty === d ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                        )}
                      >
                        {d === 'All' ? 'Mezclado' : d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-2 text-lg font-bold">
              <HelpCircle className="w-5 h-5 text-primary" />
              <span>Áreas incluir</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                'Matemáticas', 'Comunicación', 'Ciencias Naturales', 
                'Ciencias Sociales', 'Inglés', 'Razonamiento Matemático', 'Razonamiento Verbal'
              ].map(area => {
                const isSelected = config.areas.includes(area as Area);
                return (
                  <label 
                    key={area}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                      isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    )}
                  >
                    <span className="text-sm font-medium">{area}</span>
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        const newAreas = isSelected 
                          ? config.areas.filter(a => a !== area)
                          : [...config.areas, area as Area];
                        setConfig({...config, areas: newAreas});
                      }}
                      className="w-4 h-4 accent-primary"
                    />
                  </label>
                );
              })}
            </div>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground italic text-center">
                *Si no seleccionas ninguna, se incluirán todas las áreas.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={startExam}
            className="px-12 py-5 bg-primary text-primary-foreground text-xl font-bold rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-3"
          >
            <Play className="w-6 h-6 fill-current" />
            Comenzar Simulacro
          </button>
        </div>
      </div>
    );
  }

  if (step === 'exam') {
    const q = questions[currentIndex];
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header Examen */}
        <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h2 className="font-bold hidden md:block">Simulacro en Curso</h2>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-2xl text-lg font-mono font-bold">
              <Timer className={cn("w-5 h-5", timeLeft < 60 ? "text-red-500 animate-pulse" : "text-primary")} />
              <span className={timeLeft < 60 ? "text-red-500" : ""}>{formatTime(timeLeft)}</span>
            </div>
            <button 
              onClick={() => {
                if(confirm('¿Seguro que deseas finalizar el examen ahora?')) finishExam();
              }}
              className="px-6 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all"
            >
              Finalizar
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Dashboard Lateral desktop */}
          <aside className="w-64 border-r bg-card hidden lg:flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Navegación
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 gap-2">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold border transition-all",
                      currentIndex === i ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20" : 
                      marked.has(questions[i].id) ? "border-yellow-400 bg-yellow-50 text-yellow-700" :
                      answers[questions[i].id] !== undefined ? "border-green-400 bg-green-50 text-green-700" :
                      "hover:bg-muted"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Pregunta Principal */}
          <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-12">
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="flex justify-between items-center">
                <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
                  Pregunta {currentIndex + 1} de {questions.length} • {q.area}
                </span>
                <button 
                  onClick={() => {
                    const newMarked = new Set(marked);
                    if (marked.has(q.id)) newMarked.delete(q.id);
                    else newMarked.add(q.id);
                    setMarked(newMarked);
                  }}
                  className={cn(
                    "flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border transition-all",
                    marked.has(q.id) ? "bg-yellow-100 border-yellow-400 text-yellow-700" : "hover:bg-muted"
                  )}
                >
                  <Flag className="w-4 h-4" />
                  {marked.has(q.id) ? 'Marcada para revisar' : 'Marcar para revisar'}
                </button>
              </div>

              <div className="bg-card border-2 border-primary/5 rounded-[40px] p-8 md:p-12 shadow-xl">
                <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-12">
                  {q.enunciado}
                </h3>

                <div className="space-y-4">
                  {q.opciones.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAnswers({...answers, [q.id]: idx})}
                      className={cn(
                        "w-full p-5 rounded-3xl border-2 text-left transition-all flex items-center justify-between group text-lg",
                        answers[q.id] === idx 
                          ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                          : "border-transparent bg-slate-100 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                          answers[q.id] === idx ? "bg-primary text-white" : "bg-slate-200 dark:bg-white/10"
                        )}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="font-medium">{opt}</span>
                      </div>
                      {answers[q.id] === idx && <CheckCircle className="w-6 h-6 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-8">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className="p-4 rounded-full border hover:bg-muted disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <div className="flex gap-2">
                  {[...Array(questions.length)].map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-2 h-2 rounded-full",
                        i === currentIndex ? "w-6 bg-primary" : "bg-muted-foreground/30"
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
                  className="p-4 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                >
                  <ChevronRight className="w-8 h-8" />
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
      <div className="max-w-4xl mx-auto py-12 space-y-12">
        <div className="bg-card border rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="bg-primary p-12 text-center text-primary-foreground">
            <h1 className="text-4xl font-bold mb-4">Resultado del Simulacro</h1>
            <div className="inline-block px-10 py-6 rounded-[30px] bg-white/20 backdrop-blur-md border border-white/30 mb-6">
              <span className="text-6xl font-black">{Math.round(scorePercentage)}</span>
              <span className="text-2xl font-bold opacity-80">%</span>
            </div>
            <div className="grid grid-cols-2 gap-8 max-w-md mx-auto text-sm font-bold uppercase tracking-widest mt-8">
              <div className="p-4 rounded-2xl bg-white/10">
                <p className="opacity-70 mb-1">Aciertos</p>
                <p className="text-2xl">{results.score} / {results.total}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/10">
                <p className="opacity-70 mb-1">Tiempo</p>
                <p className="text-2xl">{formatTime(results.timeSpent)}</p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-10 bg-muted/20">
            <div className="flex items-center gap-4 p-6 rounded-3xl bg-white border-2 border-primary/10">
              <div className="p-4 rounded-2xl bg-primary/10">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">¡Buen trabajo!</h3>
                <p className="text-muted-foreground">Has sumado {results.score * 5} puntos a tu perfil global.</p>
              </div>
              <button 
                onClick={() => setStep('config')}
                className="ml-auto px-8 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all"
              >
                Volver a intentarlo
              </button>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-primary" />
                Revisión Detallada
              </h2>
              {results.questions.map((q, i) => {
                const isCorrect = answers[q.id] === q.respuesta_correcta;
                return (
                  <div key={q.id} className="bg-card border p-8 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-muted-foreground">Pregunta {i + 1}</span>
                      {isCorrect ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                          <CheckCircle className="w-4 h-4" /> Correcto
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                          <AlertCircle className="w-4 h-4" /> Incorrecto
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold">{q.enunciado}</p>
                    <div className="p-4 bg-muted/50 rounded-2xl text-sm italic">
                      <span className="font-bold block not-italic mb-1">Explicación:</span>
                      {q.explicacion}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => window.location.href = '/'}
                className="text-primary font-bold hover:underline flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Ver mi Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
