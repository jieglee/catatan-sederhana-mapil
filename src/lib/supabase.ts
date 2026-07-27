import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Ganti dengan URL & anon key project Supabase lu sendiri
const supabaseUrl = 'https://gqhhpfacfjhlmtejeson.supabase.co';
const supabaseAnonKey = 'sb_publishable_9dRKbQ7o4CAr2xPJp_3MXw_Eip-dyMw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Web: biarin undefined -> supabase-js otomatis pakai localStorage browser.
        // Native (iOS/Android): wajib AsyncStorage, gak ada localStorage di RN.
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
    
});