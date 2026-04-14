// ============================================================
//  SUPABASE CONFIG
//  Reemplaza estos valores con los de tu proyecto en Supabase
//  Dashboard → Settings → API
// ============================================================

const SUPABASE_URL = 'https://wjfbegtelplvyarrsjst.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZmJlZ3RlbHBsdnlhcnJzanN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzgyNzQsImV4cCI6MjA5MTc1NDI3NH0.dNVWyk_-Qj-N68dh59Xh3nMeVddXpOBumQM3pkLEH-E';

// Inicializar cliente Supabase
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Nombre del bucket de Storage (créalo en Supabase → Storage)
const STORAGE_BUCKET = 'portfolio-files';
