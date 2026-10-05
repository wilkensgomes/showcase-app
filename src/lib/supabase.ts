import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://vuikpnwtofcpohudmxmf.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aWtwbnd0b2ZjcG9odWRteG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NDA4NTMsImV4cCI6MjEwNTQxNjg1M30.NQvqG51BtAu486SkEL7RIoeJJiwVu-NnraiNpVSztPE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
