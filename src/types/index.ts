export type Area = 
  | 'Matemáticas' 
  | 'Comunicación' 
  | 'Ciencia'
  | 'Ciencias Sociales' 
  | 'Inglés';

export type Dificultad = 'Bajo' | 'Medio' | 'Alto' | 'Fácil' | 'Difícil';

export interface Exercise {
  id: string;
  area: Area;
  subarea: string;
  dificultad: Dificultad;
  enunciado: string;
  opciones: string[];
  respuesta_correcta: number;
  explicacion: string;
  image_url?: string;
  explanation_image_url?: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  level: string;
  points: number;
  is_admin: boolean;
  created_at: string;
}

export interface PracticeStat {
  id: string;
  user_id: string;
  exercise_id: string;
  is_correct: boolean;
  created_at: string;
}

export interface Exam {
  id: string;
  user_id: string;
  score: number;
  total_questions: number;
  time_spent_seconds: number;
  created_at: string;
}

export interface ExamAnswer {
  id: string;
  exam_id: string;
  exercise_id: string;
  user_answer: number | null;
  is_correct: boolean;
}
