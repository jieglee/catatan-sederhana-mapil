import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Ganti dengan URL & anon key project Supabase lu sendiri
const supabaseUrl = 'https://mixrkazrdrhzpcqolmap.supabase.co';
const supabaseAnonKey = 'sb_publishable_TUWzl-Nk4pdarkU5qba-Zg_DC46tUxi';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});