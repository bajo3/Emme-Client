// lib/supabase.js
import 'react-native-url-polyfill/auto'
import 'react-native-get-random-values'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nkadomuqphogosdogueh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYWRvbXVxcGhvZ29zZG9ndWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NzU0MTUsImV4cCI6MjA3OTA1MTQxNX0.a9dwZDPG1kB466VsS5XAxbuf195G3dd3CHSWIocBvgU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
