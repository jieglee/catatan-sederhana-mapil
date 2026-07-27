import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

interface Note {
    id: string;
    user_id: string;
    title: string;
    content: string | null;
    created_at: string;
}

export default function NotesScreen() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    // --- Load data saat screen dibuka, dengan cleanup biar gak "memory leak" ---
    useEffect(() => {
        let isMounted = true;

        async function loadInitialData() {
            const { data: userData } = await supabase.auth.getUser();
            const uid = userData?.user?.id ?? null;

            if (!isMounted) return; // screen udah di-unmount sebelum request selesai
            setUserId(uid);

            if (uid) {
                await fetchNotes(uid, isMounted);
            } else if (isMounted) {
                setLoading(false);
            }
        }

        loadInitialData();

        return () => {
            isMounted = false; // cleanup: cegah setState setelah unmount
        };
    }, []);

    async function fetchNotes(uid: string, isMountedFlag = true) {
        setLoading(true);
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });

        if (!isMountedFlag) return;

        if (error) {
            Alert.alert('Gagal ambil data', error.message);
        } else {
            setNotes(data as Note[]);
        }
        setLoading(false);
    }

    const refresh = useCallback(() => {
        if (userId) fetchNotes(userId);
    }, [userId]);

    function openAddModal() {
        setEditingId(null);
        setTitle('');
        setContent('');
        setModalVisible(true);
    }

    function openEditModal(item: Note) {
        setEditingId(item.id);
        setTitle(item.title);
        setContent(item.content ?? '');
        setModalVisible(true);
    }

    async function handleSave() {
        if (!title.trim()) {
            Alert.alert('Error', 'Judul gak boleh kosong');
            return;
        }
        if (!userId) return;

        if (editingId) {
            const { error } = await supabase
                .from('notes')
                .update({ title, content })
                .eq('id', editingId)
                .eq('user_id', userId);

            if (error) {
                Alert.alert('Gagal update', error.message);
                return;
            }
        } else {
            const { error } = await supabase
                .from('notes')
                .insert({ title, content, user_id: userId });

            if (error) {
                Alert.alert('Gagal nambah catatan', error.message);
                return;
            }
        }

        setModalVisible(false);
        refresh();
    }

    function handleDelete(item: Note) {
        Alert.alert('Hapus Catatan', `Yakin mau hapus "${item.title}"?`, [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase
                        .from('notes')
                        .delete()
                        .eq('id', item.id)
                        .eq('user_id', userId ?? '');

                    if (error) {
                        Alert.alert('Gagal hapus', error.message);
                        return;
                    }
                    refresh();
                },
            },
        ]);
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        router.replace('/' as any);
    }

    function renderItem({ item }: { item: Note }) {
        return (
            <TouchableOpacity style={styles.noteCard} onPress={() => openEditModal(item)}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.noteTitle}>{item.title}</Text>
                    {!!item.content && (
                        <Text style={styles.noteContent} numberOfLines={2}>
                            {item.content}
                        </Text>
                    )}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                    <Text style={styles.deleteText}>Hapus</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Catatan Gua</Text>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logout}>Logout</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={notes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={
                        <Text style={styles.empty}>Belum ada catatan. Tap tombol + buat nambah.</Text>
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={openAddModal}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>
                            {editingId ? 'Edit Catatan' : 'Catatan Baru'}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Judul"
                            value={title}
                            onChangeText={setTitle}
                        />
                        <TextInput
                            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                            placeholder="Isi catatan"
                            value={content}
                            onChangeText={setContent}
                            multiline
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSave}
                            >
                                <Text style={{ color: '#fff' }}>Simpan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    logout: { color: '#dc2626', fontWeight: '600' },
    noteCard: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        padding: 14,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    noteTitle: { fontSize: 16, fontWeight: '600' },
    noteContent: { color: '#555', marginTop: 4 },
    deleteBtn: { paddingHorizontal: 8 },
    deleteText: { color: '#dc2626' },
    empty: { textAlign: 'center', marginTop: 40, color: '#888' },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 32,
        backgroundColor: '#2563eb',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    fabText: { color: '#fff', fontSize: 30, lineHeight: 32 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 24,
    },
    modalBox: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    modalButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
    cancelButton: { backgroundColor: '#e5e7eb' },
    saveButton: { backgroundColor: '#2563eb' },
});