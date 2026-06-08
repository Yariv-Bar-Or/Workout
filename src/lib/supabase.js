import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://yxpqbwiqwljtcpqurtld.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cHFid2lxd2xqdGNwcXVydGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4ODk1MzcsImV4cCI6MjA5NTQ2NTUzN30.KROwTQ5gOeUSQOnrB0s4f1TEZw4RQV7I9yUZOXWq6BI'
)
