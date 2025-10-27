import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ciqxnpgxvuspctsaxszd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcXhucGd4dnVzcGN0c2F4c3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjE0NjksImV4cCI6MjA3MjgzNzQ2OX0.9sv-ou3tILNomPs9i7efqyt0W10DkEb8ZBmz2qLH8rw'

export const supabase = createClient(supabaseUrl, supabaseKey)
