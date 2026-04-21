import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Exercise, Area, Dificultad } from '@/types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Save, 
  AlertCircle,
  Database,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [search, setSearch] = useState('');
  
  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Exercise>>({
    area: 'Matemáticas',
    subarea: '',
    dificultad: 'Medio',
    enunciado: '',
    opciones: ['', '', '', ''],
    respuesta_correcta: 0,
    explicacion: ''
  });

  useEffect(() => {
    if (isAdmin) {
      fetchExercises();
    }
  }, [isAdmin]);

  const fetchExercises = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .order('area', { ascending: true });
    setExercises(data || []);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      if (editingId) {
        const { error } = await supabase
          .from('exercises')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        alert('Ejercicio actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('exercises')
          .insert([formData]);
        if (error) throw error;
        alert('Ejercicio creado correctamente');
      }
      
      setFormData({
        area: 'Matemáticas',
        subarea: '',
        dificultad: 'Medio',
        enunciado: '',
        opciones: ['', '', '', ''],
        respuesta_correcta: 0,
        explicacion: ''
      });
      setEditingId(null);
      setActiveTab('list');
      fetchExercises();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este ejercicio?')) return;
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchExercises();
  };

  const startEdit = (ex: Exercise) => {
    setFormData(ex);
    setEditingId(ex.id);
    setActiveTab('create');
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <div className="p-6 bg-red-50 rounded-[2.5rem] text-red-500 shadow-xl shadow-red-100">
           <AlertCircle className="w-20 h-20" />
        </div>
        <h2 className="text-4xl font-black text-slate-800">Acceso Restringido</h2>
        <p className="text-slate-500 font-medium max-w-md">No tienes permisos para acceder a esta sección. Si eres el dueño, asegúrate de activar tu rol de administrador.</p>
      </div>
    );
  }

  const filteredExercises = exercises.filter(ex => 
    ex.enunciado.toLowerCase().includes(search.toLowerCase()) ||
    ex.area.toLowerCase().includes(search.toLowerCase()) ||
    ex.subarea.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-wider">
            <Database className="w-4 h-4" />
            Panel de Control
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Administración</h1>
          <p className="text-xl text-slate-500 font-medium">Gestiona el banco de preguntas y la configuración del sistema.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-4 p-2 bg-slate-100 rounded-[2rem] w-fit">
        <button
          onClick={() => setActiveTab('list')}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black transition-all",
            activeTab === 'list' ? "bg-white text-indigo-600 shadow-xl" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <LayoutGrid className="w-5 h-5" />
          Lista de Preguntas
        </button>
        <button
          onClick={() => {
            setActiveTab('create');
            setEditingId(null);
            setFormData({
              area: 'Matemáticas',
              subarea: '',
              dificultad: 'Medio',
              enunciado: '',
              opciones: ['', '', '', ''],
              respuesta_correcta: 0,
              explicacion: ''
            });
          }}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black transition-all",
            activeTab === 'create' ? "bg-white text-indigo-600 shadow-xl" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <Plus className="w-5 h-5" />
          {editingId ? 'Editar Pregunta' : 'Añadir Nueva'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Search Bar */}
            <div className="relative group max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Buscar por enunciado, área o subárea..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-16 pr-8 py-5 rounded-[2rem] border-2 border-slate-50 bg-white outline-none focus:border-indigo-500 focus:shadow-2xl shadow-slate-200/50 transition-all text-lg font-medium"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredExercises.map((ex) => (
                <div key={ex.id} className="card-premium p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap gap-2">
                       <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">{ex.area}</span>
                       <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase">{ex.subarea}</span>
                       <span className={cn(
                         "px-3 py-1 rounded-lg text-[10px] font-black uppercase",
                         ex.dificultad === 'Bajo' ? 'bg-emerald-50 text-emerald-600' :
                         ex.dificultad === 'Medio' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                       )}>{ex.dificultad}</span>
                    </div>
                    <p className="text-xl font-bold text-slate-800 line-clamp-2">{ex.enunciado}</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => startEdit(ex)}
                      className="flex-1 md:flex-none p-4 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      <Edit3 className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => handleDelete(ex.id)}
                      className="flex-1 md:flex-none p-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card-premium p-10 md:p-16 max-w-4xl mx-auto"
          >
            <form onSubmit={handleSave} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Área Principal</label>
                  <select 
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value as Area})}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold"
                  >
                    {['Matemáticas', 'Comunicación', 'Ciencias Naturales', 'Ciencias Sociales', 'Inglés', 'Razonamiento Matemático', 'Razonamiento Verbal'].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Subárea (Específico)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: Álgebra, Sintaxis, Célula..."
                    value={formData.subarea}
                    onChange={(e) => setFormData({...formData, subarea: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Dificultad</label>
                  <div className="flex gap-3">
                    {['Bajo', 'Medio', 'Alto'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFormData({...formData, dificultad: d as Dificultad})}
                        className={cn(
                          "flex-1 py-4 rounded-2xl text-sm font-black transition-all border-2",
                          formData.dificultad === d 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-white text-slate-500 border-slate-100"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Enunciado de la Pregunta</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Escribe el problema aquí..."
                  value={formData.enunciado}
                  onChange={(e) => setFormData({...formData, enunciado: e.target.value})}
                  className="w-full px-8 py-6 rounded-[2.5rem] border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium text-lg"
                />
              </div>

              <div className="space-y-6">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Opciones de Respuesta</label>
                <div className="grid grid-cols-1 gap-4">
                  {formData.opciones?.map((opt, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                       <button
                         type="button"
                         onClick={() => setFormData({...formData, respuesta_correcta: idx})}
                         className={cn(
                           "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-md transition-all shrink-0",
                           formData.respuesta_correcta === idx 
                             ? "bg-emerald-500 text-white" 
                             : "bg-white text-slate-300 border-2 border-slate-100"
                         )}
                       >
                         {String.fromCharCode(65 + idx)}
                       </button>
                       <input 
                         type="text"
                         required
                         placeholder={`Opción ${String.fromCharCode(65 + idx)}`}
                         value={opt}
                         onChange={(e) => {
                           const newOpts = [...(formData.opciones || [])];
                           newOpts[idx] = e.target.value;
                           setFormData({...formData, opciones: newOpts});
                         }}
                         className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold"
                       />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Justificación / Explicación</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Explica por qué esa es la respuesta correcta..."
                  value={formData.explicacion}
                  onChange={(e) => setFormData({...formData, explicacion: e.target.value})}
                  className="w-full px-8 py-6 rounded-[2rem] border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium text-slate-600"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 py-6 bg-indigo-600 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all text-xl flex items-center justify-center gap-3"
                >
                  <Save className="w-6 h-6" />
                  {editingId ? 'Guardar Cambios' : 'Crear Pregunta'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setActiveTab('list');
                    }}
                    className="px-10 py-6 bg-slate-100 text-slate-500 font-black rounded-[2rem] hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
