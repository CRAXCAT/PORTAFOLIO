// ============================================================
//  SUPABASE CONFIG
//  Reemplaza estos valores con los de tu proyecto en Supabase
//  Dashboard → Settings → API
// ============================================================

const SUPABASE_URL = 'https://wjfbegtelplvyarrsjst.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VNucvhVZoKkLx-UnZ0P7dw_y8c0ve-q';

// Inicializar cliente Supabase
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Nombre del bucket de Storage (créalo en Supabase → Storage)
const STORAGE_BUCKET = 'portfolio-files';
