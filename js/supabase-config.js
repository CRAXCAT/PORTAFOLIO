// ============================================================
//  SUPABASE CONFIG
//  Reemplaza estos valores con los de tu proyecto en Supabase
//  Dashboard → Settings → API
// ============================================================

const SUPABASE_URL = 'https://TU-PROJECT-ID.supabase.co';
const SUPABASE_ANON_KEY = 'TU-ANON-KEY-AQUI';

// Inicializar cliente Supabase
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Nombre del bucket de Storage (créalo en Supabase → Storage)
const STORAGE_BUCKET = 'portfolio-files';
