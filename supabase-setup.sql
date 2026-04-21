-- ============================================================
--  SUPABASE DATABASE SETUP
--  Copia y pega esto en: Supabase → SQL Editor → Run
-- ============================================================

-- 1. TABLA: profiles (usuarios con roles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: units (unidades del curso)
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: weeks (semanas dentro de cada unidad)
CREATE TABLE IF NOT EXISTS weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: week_files (archivos adjuntos por semana)
CREATE TABLE IF NOT EXISTS week_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID REFERENCES weeks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_files ENABLE ROW LEVEL SECURITY;

-- PROFILES: usuario puede ver su propio perfil, admin ve todos
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- UNITS: todos los autenticados pueden leer
CREATE POLICY "units_select" ON units
  FOR SELECT TO authenticated USING (true);

-- UNITS: solo admin puede insertar/editar/borrar
CREATE POLICY "units_insert" ON units
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE POLICY "units_delete" ON units
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- WEEKS: todos los autenticados pueden leer
CREATE POLICY "weeks_select" ON weeks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "weeks_insert" ON weeks
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE POLICY "weeks_delete" ON weeks
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- WEEK_FILES: todos los autenticados pueden leer
CREATE POLICY "week_files_select" ON week_files
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "week_files_insert" ON week_files
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE POLICY "week_files_delete" ON week_files
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- ============================================================
--  NOTA: Crear bucket en Storage
--  Supabase → Storage → New Bucket
--  Nombre: portfolio-files
--  Public: SI (para que los archivos sean descargables)
-- ============================================================
