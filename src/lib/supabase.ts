import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ijbpidpsjcqggtmfqbha.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqYnBpZHBzamNxZ2d0bWZxYmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDcwNTEsImV4cCI6MjA4NjYyMzA1MX0.oDs-zpiJmX0uRUqPgN2fgAdZkylB5AopquDeGaO_6ZI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
