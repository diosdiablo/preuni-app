import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Exercise, Dificultad } from '@/types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Save, 
  AlertCircle,
  LayoutGrid,
  UploadCloud,
  FileCode,
  Copy,
  CheckCircle2,
  Users,
  UserPlus,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'bulk' | 'students'>('list');
  const [search, setSearch] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Student Form
  const [newStudentDni, setNewStudentDni] = useState('');
  const [newStudentName, setNewStudentName] = useState('');

  // Exercise Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Exercise>>({
    area: 'Ciencia',
    subarea: '',
    dificultad: 'Medio',
    enunciado: '',
    opciones: ['', '', '', ''],
    respuesta_correcta: 0,
    explicacion: '',
    image_url: ''
  });

  // Bulk state
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchExercises();
      fetchStudents();
    }
  }, [isAdmin]);

  const fetchExercises = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .order('area', { ascending: true });
    setExercises(data || []);
  };

  const [availableSubareas, setAvailableSubareas] = useState<string[]>([]);
  const [isCustomSubarea, setIsCustomSubarea] = useState(false);

  const fetchAvailableSubareas = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('subarea')
      .eq('area', formData.area);
    
    if (data) {
      const unique = Array.from(new Set(data.map(i => i.subarea))).filter(Boolean).sort();
      setAvailableSubareas(unique);
      // If the current subarea isn't in the list and isn't empty, it's custom
      if (formData.subarea && !unique.includes(formData.subarea)) {
        setIsCustomSubarea(true);
      } else {
        setIsCustomSubarea(false);
      }
    }
  };

  useEffect(() => {
    fetchAvailableSubareas();
  }, [formData.area, exercises]);

  // Add paste event listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== 'create') return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const file = new File([blob], "pasted-image.png", { type: blob.type });
            uploadImage(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab]);

  const uploadImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('exercises')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('exercises')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      alert('Imagen pegada y subida correctamente');
    } catch (err: any) {
      alert('Error subiendo imagen pegada: ' + err.message);
    }
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('authorized_students')
      .select('*')
      .order('created_at', { ascending: false });
    setStudents(data || []);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('authorized_students')
        .insert([{ dni: newStudentDni, full_name: newStudentName }]);
      if (error) throw error;
      
      setNewStudentDni('');
      setNewStudentName('');
      fetchStudents();
      alert('Alumno autorizado correctamente');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteStudent = async (dni: string) => {
    if (!confirm('¿Quitar autorización a este DNI?')) return;
    const { error } = await supabase.from('authorized_students').delete().eq('dni', dni);
    if (error) alert(error.message);
    else fetchStudents();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadImage(file);
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
        area: 'Ciencia',
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

  const handleBulkImport = async () => {
    try {
      const data = JSON.parse(bulkText);
      if (!Array.isArray(data)) throw new Error('El formato debe ser un arreglo de objetos [{}, {}]');
      
      const { error } = await supabase.from('exercises').insert(data);
      if (error) throw error;
      
      alert(`¡Éxito! Se han importado ${data.length} ejercicios.`);
      setBulkText('');
      setActiveTab('list');
      fetchExercises();
    } catch (err: any) {
      alert('Error de formato: ' + err.message);
    }
  };

  const copyTemplate = () => {
    const template = `[
  {
    "area": "Ciencia",
    "subarea": "Química",
    "dificultad": "Medio",
    "enunciado": "La radiactividad es la emisión espontánea de radiaciones de núcleos de átomos...",
    "opciones": ["Inestables", "Estables", "Neutros", "Gases"],
    "respuesta_correcta": 0,
    "explicacion": "La radiactividad proviene de núcleos inestables."
  }
]`;
    navigator.clipboard.writeText(template);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este ejercicio?')) return;
    try {
      const { error } = await supabase.from('exercises').delete().eq('id', id);
      if (error) throw error;
      alert('Ejercicio eliminado correctamente');
      fetchExercises();
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-900 rounded-full text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Control Institucional
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">IE Virgen de los Dolores</h1>
          <p className="text-xl text-slate-500 font-medium">Gestión de alumnos, preguntas y resultados de la feria.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-4 p-2 bg-slate-100 rounded-[2rem] w-fit">
        <button
          onClick={() => setActiveTab('list')}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black transition-all",
            activeTab === 'list' ? "bg-[#1a237e] text-white shadow-xl" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <LayoutGrid className="w-5 h-5" />
          Preguntas
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black transition-all",
            activeTab === 'students' ? "bg-[#1a237e] text-white shadow-xl" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <Users className="w-5 h-5" />
          Alumnos
        </button>
        <button
          onClick={() => {
            setActiveTab('create');
            setEditingId(null);
            setFormData({
              area: 'Ciencia',
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
            activeTab === 'create' ? "bg-[#1a237e] text-white shadow-xl" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <Plus className="w-5 h-5" />
          {editingId ? 'Editar Pregunta' : 'Nueva Pregunta'}
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black transition-all",
            activeTab === 'bulk' ? "bg-[#1a237e] text-white shadow-xl" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <UploadCloud className="w-5 h-5" />
          Carga Masiva
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'students' && (
          <motion.div 
            key="students"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 card-premium p-10 space-y-8">
                 <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                   <UserPlus className="text-blue-600" />
                   Autorizar Alumno
                 </h3>
                 <form onSubmit={handleAddStudent} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase">DNI del Alumno</label>
                      <input 
                        type="text" 
                        required
                        maxLength={8}
                        placeholder="Ej: 71234567"
                        value={newStudentDni}
                        onChange={(e) => setNewStudentDni(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent outline-none focus:bg-white focus:border-blue-600 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase">Nombre Completo</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej: Juan Pérez"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent outline-none focus:bg-white focus:border-blue-600 font-bold"
                      />
                    </div>
                    <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:scale-105 transition-all">
                      Autorizar Ingreso
                    </button>
                 </form>
              </div>

              <div className="lg:col-span-2 card-premium p-10 space-y-8">
                 <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                   <Users className="text-blue-600" />
                   Alumnos Autorizados ({students.length})
                 </h3>
                 <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {students.map(s => (
                      <div key={s.dni} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-blue-100 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 border border-slate-200">
                               {s.full_name[0]}
                            </div>
                            <div>
                               <p className="font-black text-slate-800">{s.full_name}</p>
                               <p className="text-xs font-bold text-slate-400">DNI: {s.dni}</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => handleDeleteStudent(s.dni)}
                           className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                         >
                           <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="relative group max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-[#1a237e] transition-colors" />
              <input
                type="text"
                placeholder="Buscar por enunciado, área o subárea..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-16 pr-8 py-5 rounded-[2rem] border-2 border-slate-50 bg-white outline-none focus:border-[#1a237e] focus:shadow-2xl shadow-slate-200/50 transition-all text-lg font-medium"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredExercises.map((ex) => (
                <div key={ex.id} className="card-premium p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap gap-2">
                       <span className="px-3 py-1 bg-blue-50 text-blue-900 rounded-lg text-[10px] font-black uppercase">{ex.area}</span>
                       <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase">{ex.subarea}</span>
                       <span className={cn(
                         "px-3 py-1 rounded-lg text-[10px] font-black uppercase",
                         (ex.dificultad === 'Fácil' || ex.dificultad === 'Bajo') ? 'bg-emerald-50 text-emerald-600' :
                         ex.dificultad === 'Medio' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                       )}>{ex.dificultad}</span>
                    </div>
                    <p className="text-xl font-bold text-slate-800 line-clamp-2">{ex.enunciado}</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => startEdit(ex)}
                      className="flex-1 md:flex-none p-4 rounded-2xl bg-blue-50 text-blue-900 hover:bg-[#1a237e] hover:text-white transition-all shadow-sm"
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
        )}

        {activeTab === 'create' && (
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
                    onChange={(e) => setFormData({...formData, area: e.target.value as any})}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-blue-600 transition-all font-bold"
                  >
                    {['Matemáticas', 'Ciencia', 'Comunicación', 'Ciencias Sociales', 'Inglés'].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Subárea</label>
                  {!isCustomSubarea ? (
                    <select 
                      value={formData.subarea}
                      onChange={(e) => {
                        if (e.target.value === 'ADD_NEW') {
                          setIsCustomSubarea(true);
                          setFormData({...formData, subarea: ''});
                        } else {
                          setFormData({...formData, subarea: e.target.value});
                        }
                      }}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-blue-600 transition-all font-bold"
                    >
                      <option value="">Seleccionar subárea...</option>
                      {availableSubareas.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="ADD_NEW" className="text-blue-600 font-black">+ Añadir nueva subárea...</option>
                    </select>
                  ) : (
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        placeholder="Escribe la nueva subárea..."
                        value={formData.subarea}
                        onChange={(e) => setFormData({...formData, subarea: e.target.value})}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-blue-100 bg-blue-50/30 outline-none focus:bg-white focus:border-blue-600 transition-all font-bold pr-32"
                      />
                      <button 
                        type="button"
                        onClick={() => setIsCustomSubarea(false)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-blue-600 uppercase hover:underline"
                      >
                        Ver lista
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Dificultad</label>
                  <div className="flex gap-3">
                    {['Fácil', 'Medio', 'Difícil'].map(d => (
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
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Enunciado</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Escribe el problema aquí..."
                  value={formData.enunciado}
                  onChange={(e) => setFormData({...formData, enunciado: e.target.value})}
                  className="w-full px-8 py-6 rounded-[2.5rem] border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-blue-600 transition-all font-medium text-lg"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Imagen del Ejercicio (Opcional)</label>
                <div className="flex flex-col gap-4">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label 
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center gap-4 p-10 border-4 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50 hover:bg-white hover:border-blue-100 transition-all cursor-pointer group"
                  >
                    {formData.image_url ? (
                      <div className="relative w-full aspect-video">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-contain rounded-2xl" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-2xl">
                          <span className="text-white font-black">Cambiar Imagen</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400">
                          <UploadCloud className="w-10 h-10" />
                        </div>
                        <p className="font-bold text-slate-400">Haz clic para subir la captura del ejercicio</p>
                      </>
                    )}
                  </label>
                  {formData.image_url && (
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, image_url: ''})}
                      className="text-rose-500 font-bold text-sm hover:underline"
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Opciones</label>
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
                         className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-blue-600 transition-all font-bold"
                       />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Explicación</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Justifica la respuesta..."
                  value={formData.explicacion}
                  onChange={(e) => setFormData({...formData, explicacion: e.target.value})}
                  className="w-full px-8 py-6 rounded-[2rem] border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-blue-600 transition-all font-medium text-slate-600"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 py-6 bg-blue-600 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all text-xl flex items-center justify-center gap-3"
                >
                  <Save className="w-6 h-6" />
                  {editingId ? 'Guardar Cambios' : 'Crear Pregunta'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'bulk' && (
          <motion.div 
            key="bulk"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 card-premium p-10 md:p-14 space-y-8">
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-slate-800">Carga por Lote</h3>
                  <p className="text-slate-500 font-medium">Pega aquí tus preguntas en formato JSON para subirlas todas de un golpe.</p>
                </div>
                
                <div className="space-y-4">
                  <textarea 
                    rows={15}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder='[ { "area": "Matemáticas", ... }, { ... } ]'
                    className="w-full p-8 rounded-[2.5rem] bg-slate-900 text-emerald-400 font-mono text-sm outline-none border-4 border-slate-800 focus:border-blue-500/50 transition-all shadow-inner"
                  />
                  <button
                    onClick={handleBulkImport}
                    disabled={!bulkText}
                    className="w-full py-6 bg-emerald-500 text-white font-black rounded-[2rem] shadow-2xl shadow-emerald-200 hover:scale-[1.02] active:scale-95 transition-all text-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                  >
                    <UploadCloud className="w-6 h-6" />
                    Importar Ejercicios
                  </button>
                </div>
              </div>

              <div className="card-premium p-10 bg-blue-900 text-white space-y-8 h-fit">
                <div className="p-4 bg-white/20 rounded-2xl w-fit">
                  <FileCode className="w-8 h-8" />
                </div>
                <div className="space-y-4">
                  <h4 className="text-2xl font-black italic">Formato de Ejemplo</h4>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Usa este formato para que el sistema reconozca tus preguntas. Puedes copiarlo y editarlo.
                  </p>
                </div>
                
                <div className="p-6 bg-black/20 rounded-2xl font-mono text-[10px] opacity-80 overflow-hidden">
                  <pre>{`[
  {
    "area": "Ciencia",
    "subarea": "Química",
    "dificultad": "Fácil",
    "enunciado": "La radiactividad...",
    "opciones": ["A", "B", "C", "D"],
    "respuesta_correcta": 0,
    "explicacion": "..."
  }
]`}</pre>
                </div>

                <button
                  onClick={copyTemplate}
                  className="w-full py-4 bg-white text-blue-900 font-black rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-all"
                >
                  {copySuccess ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copySuccess ? 'Copiado' : 'Copiar Plantilla'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
