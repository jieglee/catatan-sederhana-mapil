import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!email || !password) {
            Alert.alert('Error', 'Email dan password wajib diisi');
            return;
        }

        setLoading(true);

        if (isSignUp) {
            const { error } = await supabase.auth.signUp({ email, password });
            setLoading(false);

            if (error) {
                Alert.alert('Sign Up Gagal', error.message);
                return;
            }

            Alert.alert(
                'Sign Up Berhasil',
                'Cek email lu buat konfirmasi (kalau confirm email aktif), atau langsung login.'
            );
            setIsSignUp(false);
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);

        if (error) {
            Alert.alert('Login Gagal', error.message);
            return;
        }

        // replace, bukan push -> user gak bisa balik ke Login pake tombol back
        router.replace('/notes' as any);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{isSignUp ? 'Buat Akun' : 'Login'}</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Login'}</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.switchMode}>
                <Text style={styles.switchText}>
                    {isSignUp ? 'Udah punya akun? Login' : 'Belum punya akun? Sign Up'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#2563eb',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    switchMode: { marginTop: 16, alignItems: 'center' },
    switchText: { color: '#2563eb' },
});