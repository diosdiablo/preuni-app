import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Exercise, Area, Dificultad } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Loader2,
  BookOpen,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ExercisesPage: React.FC = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<Area | 'All'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Dificultad | 'All'>('All');
  
  // Practice Modal State
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const areas: (Area | 'All')[] = [
    'All', 
    'Matemáticas', 
    'Comunicación', 
    'Ciencias Naturales', 
    'Ciencias Sociales', 
    'Inglés', 
    'Razonamiento Matemático', 
    'Razonamiento Verbal'
  ];

  const difficulties: (Dificultad | 'All')[] = ['All', 'Bajo', 'Medio', 'Alto'];

  useEffect(() => {
    fetchExercises();
  }, [selectedArea, selectedDifficulty]);

  const fetchExercises = async () => {
    setLoading(true);
    let query = supabase.from('exercises').select('*');

    if (selectedArea !== 'All') {
      query = query.eq('area', selectedArea);
    }
    if (selectedDifficulty !== 'All') {
      query = query.eq('dificultad', selectedDifficulty);
    }

    const { data, error } = await query;
    if (error) console.error(error);
    else setExercises(data || []);
    setLoading(false);
  };

  const handleAnswer = async (optionIndex: number) => {
    if (!activeExercise || showFeedback) return;
    
    setSelectedOption(optionIndex);
    setShowFeedback(true);

    const isCorrect = optionIndex === activeExercise.respuesta_correcta;

    try {
      // Save practice stat
      await supabase.from('practice_stats').insert({
        user_id: user?.id,
        exercise_id: activeExercise.id,
        is_correct: isCorrect
      });

      // Update user points if correct
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
    } finally {
      // Nothing needed here for now
    }
  };

  const closeModal = () => {
    setActiveExercise(null);
    setSelectedOption(null);
    setShowFeedback(false);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Banco de Ejercicios</h1>
          <p className="text-muted-foreground mt-1">Explora y practica con preguntas de nivel preuniversitario.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-bold">
          <BookOpen className="w-5 h-5" />
          <span>{exercises.length} Ejercicios disponibles</span>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-card p-6 rounded-3xl border shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" /> Área de Estudio
          </label>
          <select 
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value as any)}
            className="w-full p-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-primary/20"
          >
            {areas.map(area => (
              <option key={area} value={area}>{area === 'All' ? 'Todas las áreas' : area}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Dificultad
          </label>
          <select 
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as any)}
            className="w-full p-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-primary/20"
          >
            {difficulties.map(diff => (
              <option key={diff} value={diff}>{diff === 'All' ? 'Cualquier dificultad' : diff}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end flex-grow">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por enunciado..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Exercise List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="mt-4 text-muted-foreground animate-pulse">Cargando banco de preguntas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((ex) => (
            <div 
              key={ex.id}
              className="group bg-card border rounded-3xl p-6 hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                  {ex.area}
                </span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  ex.dificultad === 'Bajo' ? "bg-green-100 text-green-700" :
                  ex.dificultad === 'Medio' ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                )}>
                  {ex.dificultad}
                </span>
              </div>
              
              <p className="text-foreground font-medium line-clamp-3 flex-1 mb-6">
                {ex.enunciado}
              </p>

              <button 
                onClick={() => setActiveExercise(ex)}
                className="w-full py-3 rounded-2xl bg-muted group-hover:bg-primary group-hover:text-primary-foreground font-bold transition-all flex items-center justify-center gap-2"
              >
                Practicar ahora
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}

          {exercises.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-xl text-muted-foreground">No se encontraron ejercicios con esos filtros.</p>
            </div>
          )}
        </div>
      )}

      {/* Practice Modal */}
      {activeExercise && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold text-primary uppercase">{activeExercise.area} • {activeExercise.subarea}</span>
                <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <h2 className="text-xl font-bold mb-8 leading-relaxed">
                {activeExercise.enunciado}
              </h2>

              <div className="space-y-3">
                {activeExercise.opciones.map((option, idx) => (
                  <button
                    key={idx}
                    disabled={showFeedback}
                    onClick={() => handleAnswer(idx)}
                    className={cn(
                      "w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group",
                      !showFeedback && "hover:border-primary hover:bg-primary/5",
                      showFeedback && idx === activeExercise.respuesta_correcta && "bg-green-100 border-green-500 text-green-900",
                      showFeedback && selectedOption === idx && idx !== activeExercise.respuesta_correcta && "bg-red-100 border-red-500 text-red-900",
                      showFeedback && idx !== activeExercise.respuesta_correcta && selectedOption !== idx && "opacity-50"
                    )}
                  >
                    <span>{option}</span>
                    {showFeedback && idx === activeExercise.respuesta_correcta && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {showFeedback && selectedOption === idx && idx !== activeExercise.respuesta_correcta && <XCircle className="w-5 h-5 text-red-600" />}
                  </button>
                ))}
              </div>

              {showFeedback && (
                <div className="mt-8 p-6 rounded-2xl bg-muted/50 animate-in slide-in-from-bottom-4 duration-500">
                  <p className="font-bold mb-2 flex items-center gap-2">
                    {selectedOption === activeExercise.respuesta_correcta ? 
                      <span className="text-green-600">¡Correcto! +10 puntos</span> : 
                      <span className="text-red-600">Incorrecto</span>
                    }
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed italic">
                    <span className="font-semibold not-italic block mb-1">Explicación:</span>
                    {activeExercise.explicacion}
                  </p>
                  <button 
                    onClick={closeModal}
                    className="mt-6 w-full py-3 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Siguiente ejercicio
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
