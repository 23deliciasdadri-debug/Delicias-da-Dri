import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://htxhzdlvqegygovrpuih.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0eGh6ZGx2cWVneWdvdnJwdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzU3ODgsImV4cCI6MjA3ODA1MTc4OH0.ehus87wBrlS1Hb5pNlySVv1mQNMeirtO4gAdx96fX9c';
const supabase = createClient(supabaseUrl, supabaseKey);
const { data, error, count } = await supabase
  .from('clients')
  .select('id', { count: 'exact', head: true })
  .gte('created_at', '2025-10-16T00:00:00');
console.log({ data, error, count });
