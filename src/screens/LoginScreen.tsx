import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

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
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.container}>
                <View style={styles.headerWrap}>
                    
                    <Text style={styles.title}>{isSignUp ? 'Buat Akun' : 'Selamat Datang'}</Text>
                    <Text style={styles.subtitle}>
                        {isSignUp
                            ? 'Daftar dulu buat mulai nyatet'
                            : 'Login buat lanjutin catatan'}
                    </Text>
                </View>

                <View style={styles.form}>
                    <View
                        style={[
                            styles.inputWrap,
                            focusedField === 'email' && styles.inputWrapFocused,
                        ]}
                    >
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#c98aa6"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    <View
                        style={[
                            styles.inputWrap,
                            focusedField === 'password' && styles.inputWrapFocused,
                        ]}
                    >
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#c98aa6"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {isSignUp ? 'Sign Up' : 'Login'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setIsSignUp(!isSignUp)}
                        style={styles.switchMode}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.switchText}>
                            {isSignUp ? 'Udah punya akun? ' : 'Belum punya akun? '}
                            <Text style={styles.switchTextBold}>
                                {isSignUp ? 'Login' : 'Sign Up'}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const PINK = '#e0578e';
const PINK_DARK = '#c9407a';
const PINK_LIGHT = '#fdf2f6';
const PINK_BORDER = '#f4c9db';

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: PINK_LIGHT,
    },
    headerWrap: {
        alignItems: 'center',
        marginBottom: 32,
    },
    badge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: PINK,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: PINK_DARK,
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    badgeText: { color: '#fff', fontSize: 24, fontWeight: '700' },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#3a1f2b',
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#9c7086',
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputWrap: {
        borderWidth: 1.5,
        borderColor: PINK_BORDER,
        borderRadius: 14,
        backgroundColor: '#fff',
        marginBottom: 14,
        shadowColor: PINK_DARK,
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    inputWrapFocused: {
        borderColor: PINK,
        shadowOpacity: 0.15,
    },
    input: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#3a1f2b',
    },
    button: {
        backgroundColor: PINK,
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: PINK_DARK,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    switchMode: { marginTop: 20, alignItems: 'center' },
    switchText: { color: '#9c7086', fontSize: 14 },
    switchTextBold: { color: PINK_DARK, fontWeight: '700' },
});