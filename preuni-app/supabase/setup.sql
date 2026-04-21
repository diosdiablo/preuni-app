-- ==========================================
-- 1. EXTENSIONES Y CONFIGURACIÓN INICIAL
-- ==========================================
-- Habilitar extensión pgcrypto para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 2. CREACIÓN DE TABLAS
-- ==========================================

-- Tabla Profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  level TEXT DEFAULT 'Principiante',
  points INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla Exercises
CREATE TABLE public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  area TEXT NOT NULL,
  subarea TEXT NOT NULL,
  dificultad TEXT NOT NULL CHECK (dificultad IN ('Bajo', 'Medio', 'Alto')),
  enunciado TEXT NOT NULL,
  opciones JSONB NOT NULL, -- Array de strings: ["A", "B", "C", "D"]
  respuesta_correcta INTEGER NOT NULL, -- Índice de la opción correcta (0 a 3)
  explicacion TEXT
);

-- Tabla Practice Stats
CREATE TABLE public.practice_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla Exams (Cabecera)
CREATE TABLE public.exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla Exam Answers (Detalle)
CREATE TABLE public.exam_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  user_answer INTEGER, -- Índice de la respuesta elegida, o NULL si la dejó en blanco
  is_correct BOOLEAN NOT NULL
);

-- ==========================================
-- 3. HABILITACIÓN DE SEGURIDAD (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

-- Reglas para Profiles (El usuario solo puede leer y actualizar su propio perfil)
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view exercises" 
  ON public.exercises FOR SELECT USING (true);

CREATE POLICY "Admins can insert exercises" 
  ON public.exercises FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update exercises" 
  ON public.exercises FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete exercises" 
  ON public.exercises FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Reglas para Practice Stats
CREATE POLICY "Users can insert own practice stats" 
  ON public.practice_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own practice stats" 
  ON public.practice_stats FOR SELECT USING (auth.uid() = user_id);

-- Reglas para Exams
CREATE POLICY "Users can insert own exams" 
  ON public.exams FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own exams" 
  ON public.exams FOR SELECT USING (auth.uid() = user_id);

-- Reglas para Exam Answers
CREATE POLICY "Users can insert own exam answers" 
  ON public.exam_answers FOR INSERT WITH CHECK (
    exam_id IN (SELECT id FROM public.exams WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view own exam answers" 
  ON public.exam_answers FOR SELECT USING (
    exam_id IN (SELECT id FROM public.exams WHERE user_id = auth.uid())
  );

-- ==========================================
-- 4. TRIGGERS PARA AUTENTICACIÓN
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, level, points, is_admin)
  VALUES (new.id, new.email, 'Principiante', 0, false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 5. SEED: 30 Ejercicios de Muestra
-- ==========================================

INSERT INTO public.exercises (area, subarea, dificultad, enunciado, opciones, respuesta_correcta, explicacion) VALUES
-- Matemáticas (5)
('Matemáticas', 'Álgebra', 'Bajo', '¿Cuál es el resultado de resolver 3x + 5 = 20?', '["x = 3", "x = 5", "x = 15", "x = 25"]', 1, 'Restando 5 de ambos lados obtenemos 3x = 15. Dividiendo entre 3, x = 5.'),
('Matemáticas', 'Geometría', 'Medio', 'En un triángulo rectángulo, si los catetos miden 3 cm y 4 cm, ¿cuánto mide la hipotenusa?', '["5 cm", "6 cm", "7 cm", "8 cm"]', 0, 'Usando el Teorema de Pitágoras: c^2 = 3^2 + 4^2 = 9 + 16 = 25. La raíz cuadrada de 25 es 5.'),
('Matemáticas', 'Aritmética', 'Bajo', '¿Cuál es el 20% de 150?', '["20", "25", "30", "35"]', 2, 'El 20% equivale a multiplicar por 0.20. 150 * 0.20 = 30.'),
('Matemáticas', 'Trigonometría', 'Alto', 'Si sen(x) = 0.5 y x está en el primer cuadrante, ¿cuál es el valor de x?', '["30°", "45°", "60°", "90°"]', 0, 'El ángulo cuyo seno es 0.5 en el primer cuadrante es 30 grados (o pi/6 radianes).'),
('Matemáticas', 'Probabilidad', 'Medio', 'Al lanzar dos dados, ¿cuál es la probabilidad de que la suma sea 7?', '["1/6", "1/12", "1/36", "1/4"]', 0, 'Hay 6 combinaciones (1,6; 2,5; 3,4; 4,3; 5,2; 6,1) de las 36 posibles (6x6). La probabilidad es 6/36 = 1/6.'),

-- Comunicación/Lenguaje (5)
('Comunicación', 'Gramática', 'Bajo', '¿Qué palabra está escrita correctamente?', '["Exelente", "Excelente", "Exselente", "Eccelente"]', 1, 'La palabra correcta es "Excelente", con "xc".'),
('Comunicación', 'Ortografía', 'Medio', '¿Cuál de las siguientes palabras es aguda y debe llevar tilde?', '["Arbol", "Cancion", "Mesa", "Reloj"]', 1, 'Canción es una palabra aguda que termina en "n", por lo que debe llevar tilde.'),
('Comunicación', 'Literatura', 'Medio', '¿Quién es el autor de "Cien Años de Soledad"?', '["Mario Vargas Llosa", "Gabriel García Márquez", "Julio Cortázar", "Pablo Neruda"]', 1, 'La obra cumbre del boom latinoamericano fue escrita por el colombiano Gabriel García Márquez en 1967.'),
('Comunicación', 'Semántica', 'Bajo', 'Un sinónimo de la palabra "Efímero" es:', '["Duradero", "Pasajero", "Eterno", "Pesado"]', 1, 'Efímero significa que dura poco tiempo, por lo que su sinónimo ideal es pasajero.'),
('Comunicación', 'Sintaxis', 'Alto', 'En la oración: "La niña compró caramelos para su hermano", ¿cuál es el Objeto Directo?', '["La niña", "compró", "caramelos", "para su hermano"]', 2, 'El Objeto Directo responde a "¿Qué compró?", en este caso, "caramelos".'),

-- Ciencias Naturales (4)
('Ciencias Naturales', 'Biología', 'Bajo', '¿Cuál es el orgánulo celular encargado de la respiración y generación de energía?', '["Núcleo", "Ribosoma", "Mitocondria", "Aparato de Golgi"]', 2, 'Las mitocondrias son conocidas como las centrales energéticas de las células.'),
('Ciencias Naturales', 'Química', 'Medio', '¿Cuál es el elemento químico más abundante en el universo?', '["Oxígeno", "Carbono", "Hidrógeno", "Helio"]', 2, 'El hidrógeno es el elemento más simple y abundante del universo, representando alrededor del 75% de su masa elemental.'),
('Ciencias Naturales', 'Física', 'Medio', 'Según la segunda ley de Newton, la fuerza es igual a la masa multiplicada por:', '["La velocidad", "La gravedad", "La aceleración", "El tiempo"]', 2, 'La ecuación fundamental de la dinámica es F = m * a (Fuerza = masa * aceleración).'),
('Ciencias Naturales', 'Ecología', 'Bajo', '¿Cómo se le llama a los organismos que fabrican su propio alimento?', '["Heterótrofos", "Autótrofos", "Descomponedores", "Parásitos"]', 1, 'Los autótrofos, como las plantas (a través de la fotosíntesis), producen su propio alimento.'),

-- Ciencias Sociales (4)
('Ciencias Sociales', 'Historia Universal', 'Medio', '¿En qué año comenzó la Primera Guerra Mundial?', '["1912", "1914", "1918", "1939"]', 1, 'Comenzó en 1914 tras el asesinato del archiduque Francisco Fernando.'),
('Ciencias Sociales', 'Geografía', 'Bajo', '¿Cuál es el río más largo del mundo?', '["Nilo", "Amazonas", "Misisipi", "Yangtsé"]', 1, 'Estudios modernos confirman que el Amazonas es el río más largo y caudaloso del mundo.'),
('Ciencias Sociales', 'Historia Antigua', 'Alto', '¿Qué antigua civilización se desarrolló entre los ríos Tigris y Éufrates?', '["Egipcia", "China", "Mesopotamia", "Romana"]', 2, 'Mesopotamia significa "tierra entre ríos" y es la cuna de las primeras civilizaciones.'),
('Ciencias Sociales', 'Economía', 'Medio', 'El desplazamiento hacia la derecha de la curva de demanda indica:', '["Aumento de la demanda", "Disminución de la demanda", "Aumento de la oferta", "Equilibrio"]', 0, 'Un desplazamiento a la derecha significa que, a cada precio, los consumidores están dispuestos a comprar más cantidad.'),

-- Inglés (4)
('Inglés', 'Grammar', 'Bajo', 'Choose the correct form: She _____ to the store every day.', '["go", "goes", "going", "gone"]', 1, 'En presente simple, para la tercera persona ("She"), se le agrega -s o -es al verbo (goes).'),
('Inglés', 'Vocabulary', 'Medio', 'Which word falls under the category of "Furniture"?', '["Apple", "Chair", "Car", "Happiness"]', 1, 'Chair (Silla) es un mueble ("Furniture").'),
('Inglés', 'Reading', 'Alto', 'If something is "mandatory", it is:', '["Optional", "Required", "Suggested", "Forbidden"]', 1, 'Mandatory significa "obligatorio", por lo tanto "Required" es la respuesta correcta.'),
('Inglés', 'Listening/Speaking context', 'Bajo', 'How do you politely ask for water?', '["Give me water", "I want water now", "Could I have some water, please?", "Water."] ', 2, 'El uso de "Could I" y "please" hace que la petición sea formal y educada.'),

-- Razonamiento Matemático (4)
('Razonamiento Matemático', 'Sucesiones', 'Bajo', '¿Qué número continúa la serie: 2, 4, 8, 16, ...?', '["20", "24", "30", "32"]', 3, 'Cada número se multiplica por 2 (Progresión geométrica). 16 * 2 = 32.'),
('Razonamiento Matemático', 'Planteo de Ecuaciones', 'Medio', 'La edad de María es el doble que la de Juan. Si ambas edades suman 30 años, ¿cuántos años tiene María?', '["10", "15", "20", "25"]', 2, 'M + J = 30; M = 2J. Entonces 3J = 30 -> J = 10. María tiene el doble: 20.'),
('Razonamiento Matemático', 'Porcentajes', 'Medio', 'Si un televisor que cuesta $400 tiene un descuento del 25%, ¿cuánto se paga finalmente?', '["$100", "$200", "$300", "$350"]', 2, 'El 25% de 400 es 100. Restando el descuento: 400 - 100 = 300.'),
('Razonamiento Matemático', 'Análisis Combinatorio', 'Alto', '¿De cuántas formas diferentes pueden sentarse 4 personas en una fila de 4 asientos libres?', '["12", "16", "24", "256"]', 2, 'Es una permutación sin repetición: 4! = 4 x 3 x 2 x 1 = 24.'),

-- Razonamiento Verbal (4)
('Razonamiento Verbal', 'Analogías', 'Bajo', 'PERRO es a LADRAR como GATO es a:', '["Maullar", "Caminar", "Morder", "Ronronear"]', 0, 'La analogía es Animal - Sonido característico. El gato maúlla.'),
('Razonamiento Verbal', 'Comprensión Lectora', 'Medio', 'Lee el texto: "El sol brillaba fuertemente, y la arena quemaba bajo sus pies." ¿Dónde se encuentra probablemente el personaje?', '["En la nieve", "En el desierto o playa", "En un bosque lluvioso", "En una ciudad en invierno"]', 1, 'Las pistas "sol fuerte" y "arena caliente" apuntan a una playa o un desierto.'),
('Razonamiento Verbal', 'Antónimos', 'Bajo', '¿Cuál es el antónimo correcto de la palabra "Cobarde"?', '["Tímido", "Miedoso", "Valiente", "Triste"]', 2, 'Un cobarde es alguien con miedo o falta de valor. Su opuesto es valiente.'),
('Razonamiento Verbal', 'Término Excluido', 'Medio', 'Marca la palabra que no guarda relación con las demás:', '["Cuchillo", "Tenedor", "Cuchara", "Plato"]', 3, 'Cuchillo, tenedor y cuchara son cubiertos (instrumentos para comer). El plato es la vajilla donde se sirve.');
