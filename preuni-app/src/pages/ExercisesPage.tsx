import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Exercise, Area, Dificultad } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  BookOpen,
  Trophy,
  Star,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const ExercisesPage: React.FC = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<Area | 'All'>('All');
  const [selectedDifficulty] = useState<Dificultad | 'All'>('All');
  
  // Practice Modal State
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const areas: (Area | 'All')[] = [
    'All', 
    'Matemáticas', 
    'Ciencia',
    'Comunicación',
    'Ciencias Sociales', 
    'Inglés'
  ];

  const areaColors: Record<string, string> = {
    'Matemáticas': 'bg-blue-500',
    'Ciencia': 'bg-emerald-500',
    'Comunicación': 'bg-rose-500',
    'Ciencias Sociales': 'bg-amber-500',
    'Inglés': 'bg-violet-500',
    'All': 'bg-indigo-600'
  };


  const [subareas, setSubareas] = useState<Record<string, string[]>>({});
  const [selectedSubarea, setSelectedSubarea] = useState<string | 'All'>('All');
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  useEffect(() => {
    fetchSubareas();
  }, []);

  const fetchSubareas = async () => {
    const { data } = await supabase.from('exercises').select('area, subarea');
    if (data) {
      const map: Record<string, Set<string>> = {};
      data.forEach(ex => {
        if (!map[ex.area]) map[ex.area] = new Set();
        if (ex.subarea) map[ex.area].add(ex.subarea);
      });
      const finalMap: Record<string, string[]> = {};
      Object.keys(map).forEach(key => finalMap[key] = Array.from(map[key]));
      setSubareas(finalMap);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [selectedArea, selectedSubarea, selectedDifficulty]);

  const fetchExercises = async () => {
    setLoading(true);
    let query = supabase.from('exercises').select('*');

    if (selectedArea !== 'All') {
      query = query.eq('area', selectedArea);
    }
    if (selectedSubarea !== 'All') {
      query = query.eq('subarea', selectedSubarea);
    }
    if (selectedDifficulty !== 'All') {
      query = query.eq('dificultad', selectedDifficulty);
    }

    const { data, error } = await query;
    if (error) console.error(error);
    else setExercises(data || []);
    setLoading(false);
  };

  const handleAreaClick = (area: Area | 'All') => {
    setSelectedArea(area);
    setSelectedSubarea('All');
  };

  const handleSubareaClick = (area: Area, sub: string) => {
    setSelectedArea(area);
    setSelectedSubarea(sub);
  };

  const handleAnswer = async (optionIndex: number) => {
    if (!activeExercise || showFeedback) return;
    
    setSelectedOption(optionIndex);
    setShowFeedback(true);

    const isCorrect = optionIndex === activeExercise.respuesta_correcta;

    try {
      await supabase.from('practice_stats').insert({
        user_id: user?.id,
        exercise_id: activeExercise.id,
        is_correct: isCorrect
      });

      if (isCorrect) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', user?.id)
          .single();
        
        await supabase
          .from('profiles')
          .update({ points: (profile?.points || 0) + 10 })
          .eq('id', user?.id);
      }
    } catch (err) {
      console.error('Error saving practice result:', err);
    }
  };

  const closeModal = () => {
    setActiveExercise(null);
    setSelectedOption(null);
    setShowFeedback(false);
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            Zona de Entrenamiento
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Banco de Ejercicios</h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl">Perfecciona tus habilidades resolviendo preguntas diseñadas por expertos.</p>
        </div>
        <div className="flex items-center gap-4 p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de Datos</p>
            <p className="text-3xl font-black text-slate-800">{exercises.length}</p>
          </div>
        </div>
      </div>

      {/* Modern Filter Bar with Dropdowns */}
      <div className="card-premium p-4 md:p-6 overflow-visible">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 pr-4 mr-4 border-r border-slate-100">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-black text-slate-400 uppercase tracking-tighter">Filtros</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {areas.map(area => (
              <div 
                key={area} 
                className="relative"
                onMouseEnter={() => setHoveredArea(area)}
                onMouseLeave={() => setHoveredArea(null)}
              >
                <button
                  onClick={() => handleAreaClick(area)}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                    selectedArea === area 
                      ? "bg-slate-900 text-white shadow-lg" 
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {area === 'All' ? 'Todas' : area}
                  {area !== 'All' && subareas[area]?.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  )}
                </button>

                {/* Subarea Dropdown */}
                <AnimatePresence>
                  {hoveredArea === area && area !== 'All' && subareas[area]?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 mt-2 z-50 min-w-[200px] p-2 bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl shadow-2xl shadow-slate-200"
                    >
                      <button
                        onClick={() => handleAreaClick(area)}
                        className={cn(
                          "w-full px-4 py-2 text-left text-xs font-black uppercase tracking-wider rounded-xl transition-all",
                          selectedSubarea === 'All' && selectedArea === area ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"
                        )}
                      >
                        Ver Todo {area}
                      </button>
                      <div className="h-px bg-slate-100 my-2" />
                      <div className="space-y-1">
                        {subareas[area].map(sub => (
                          <button
                            key={sub}
                            onClick={() => handleSubareaClick(area as Area, sub)}
                            className={cn(
                              "w-full px-4 py-2 text-left text-sm font-bold rounded-xl transition-all",
                              selectedSubarea === sub ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                            )}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
          </div>
          <p className="mt-6 text-slate-500 font-bold animate-pulse">Consultando el banco de reactivos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {exercises.map((ex, index) => (
              <motion.div 
                key={ex.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group card-premium p-8 flex flex-col items-start"
              >
                <div className="flex items-center justify-between w-full mb-6">
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-sm",
                    areaColors[ex.area] || 'bg-slate-500'
                  )}>
                    {ex.area}
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                    ex.dificultad === 'Bajo' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    ex.dificultad === 'Medio' ? "bg-amber-50 text-amber-600 border-amber-100" :
                    "bg-rose-50 text-rose-600 border-rose-100"
                  )}>
                    {ex.dificultad}
                  </div>
                </div>
                
                <p className="text-xl font-bold text-slate-800 leading-snug line-clamp-4 flex-1 mb-10 group-hover:text-blue-600 transition-colors">
                  {ex.enunciado}
                </p>

                <button 
                  onClick={() => setActiveExercise(ex)}
                  className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-blue-600 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
                >
                  <Star className="w-5 h-5 fill-current" />
                  Resolver Ahora
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {exercises.length === 0 && (
            <div className="col-span-full py-32 text-center card-premium">
              <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-2xl text-slate-400 font-bold text-center">No hay ejercicios que coincidan con estos criterios.</p>
            </div>
          )}
        </div>
      )}

      {/* Practice Modal - Premium Redesign */}
      {activeExercise && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden"
          >
            <div className="p-10 md:p-14">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", areaColors[activeExercise.area])} />
                  <span className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                    {activeExercise.area} • {activeExercise.subarea}
                  </span>
                </div>
                <button onClick={closeModal} className="p-3 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                  <XCircle className="w-7 h-7" />
                </button>
              </div>

              <div className="space-y-12">
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight">
                  {activeExercise.enunciado}
                </h2>

                {activeExercise.image_url && (
                  <div className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] p-6">
                    <img 
                      src={activeExercise.image_url} 
                      alt="Ejercicio" 
                      className="w-full h-auto max-h-[400px] object-contain rounded-2xl shadow-sm"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {activeExercise.opciones.map((option, idx) => (
                    <button
                      key={idx}
                      disabled={showFeedback}
                      onClick={() => handleAnswer(idx)}
                      className={cn(
                        "group w-full p-6 rounded-[2rem] border-2 text-left transition-all flex items-center justify-between",
                        !showFeedback && "border-slate-100 bg-slate-50 hover:border-blue-500 hover:bg-blue-50 hover:scale-[1.02]",
                        showFeedback && idx === activeExercise.respuesta_correcta && "bg-emerald-50 border-emerald-500 text-emerald-900 scale-[1.02]",
                        showFeedback && selectedOption === idx && idx !== activeExercise.respuesta_correcta && "bg-rose-50 border-rose-500 text-rose-900",
                        showFeedback && idx !== activeExercise.respuesta_correcta && selectedOption !== idx && "opacity-40 grayscale-[0.5]"
                      )}
                    >
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg",
                          !showFeedback && "bg-white text-slate-400 group-hover:bg-blue-500 group-hover:text-white",
                          showFeedback && idx === activeExercise.respuesta_correcta && "bg-emerald-500 text-white",
                          showFeedback && selectedOption === idx && idx !== activeExercise.respuesta_correcta && "bg-rose-500 text-white"
                        )}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="font-bold text-lg">{option}</span>
                      </div>
                      {showFeedback && idx === activeExercise.respuesta_correcta && <CheckCircle2 className="w-7 h-7 text-emerald-600" />}
                      {showFeedback && selectedOption === idx && idx !== activeExercise.respuesta_correcta && <XCircle className="w-7 h-7 text-rose-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {showFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 p-10 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 overflow-hidden relative"
                  >
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <Info className="w-6 h-6 text-indigo-600" />
                        <h4 className="text-xl font-black text-indigo-900">Explicación del Concepto</h4>
                      </div>
                      <p className="text-indigo-800/80 leading-relaxed font-medium text-lg">
                        {activeExercise.explicacion}
                      </p>
                      <button 
                        onClick={closeModal}
                        className="mt-8 w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all text-xl"
                      >
                        Continuar Entrenamiento
                      </button>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-200/50 rounded-full blur-3xl" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
