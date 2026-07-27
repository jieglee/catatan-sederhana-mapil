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

    // --- Load data when the screen mounts, with cleanup to avoid a "memory leak" ---
    useEffect(() => {
        let isMounted = true;

        async function loadInitialData() {
            const { data: userData } = await supabase.auth.getUser();
            const uid = userData?.user?.id ?? null;

            if (!isMounted) return; // screen was unmounted before the request finished
            setUserId(uid);

            if (uid) {
                await fetchNotes(uid, isMounted);
            } else if (isMounted) {
                setLoading(false);
            }
        }

        loadInitialData();

        return () => {
            isMounted = false; // cleanup: prevent setState after unmount
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
            Alert.alert('Failed to load notes', error.message);
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
            Alert.alert('Error', 'Title cannot be empty');
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
                Alert.alert('Failed to update', error.message);
                return;
            }
        } else {
            const { error } = await supabase
                .from('notes')
                .insert({ title, content, user_id: userId });

            if (error) {
                Alert.alert('Failed to add note', error.message);
                return;
            }
        }

        setModalVisible(false);
        refresh();
    }

    function handleDelete(item: Note) {
        Alert.alert('Delete Note', `Are you sure you want to delete "${item.title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase
                        .from('notes')
                        .delete()
                        .eq('id', item.id)
                        .eq('user_id', userId ?? '');

                    if (error) {
                        Alert.alert('Failed to delete', error.message);
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
            <TouchableOpacity
                style={styles.noteCard}
                onPress={() => openEditModal(item)}
                activeOpacity={0.8}
            >
                <View style={styles.noteAccent} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.noteTitle}>{item.title}</Text>
                    {!!item.content && (
                        <Text style={styles.noteContent} numberOfLines={2}>
                            {item.content}
                        </Text>
                    )}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>My Notes</Text>
                    <Text style={styles.headerSubtitle}>
                        {notes.length > 0
                            ? `${notes.length} note${notes.length > 1 ? 's' : ''} saved`
                            : 'Nothing here yet'}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logout}>Logout</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#EC4899" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={notes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>🗒️</Text>
                            <Text style={styles.empty}>No notes yet</Text>
                            <Text style={styles.emptySubtext}>
                                Tap the + button below to create your first one
                            </Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.85}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>
                            {editingId ? 'Edit Note' : 'New Note'}
                        </Text>

                        <Text style={styles.inputLabel}>Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Give it a title"
                            placeholderTextColor="#B0AAB0"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text style={styles.inputLabel}>Content</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Write something..."
                            placeholderTextColor="#B0AAB0"
                            value={content}
                            onChangeText={setContent}
                            multiline
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSave}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF8FA' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 56,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F5E4EC',
    },
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#2B2130' },
    headerSubtitle: { fontSize: 13, color: '#A78B9A', marginTop: 2 },
    logoutBtn: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: '#FDECEC',
    },
    logout: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
    noteCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#D6A4BE',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
    },
    noteAccent: {
        width: 4,
        height: '80%',
        borderRadius: 4,
        backgroundColor: '#EC4899',
        marginRight: 12,
    },
    noteTitle: { fontSize: 16, fontWeight: '600', color: '#2B2130' },
    noteContent: { color: '#8A7A87', marginTop: 4, fontSize: 13, lineHeight: 18 },
    deleteBtn: { paddingHorizontal: 8, paddingVertical: 4 },
    deleteText: { color: '#DC2626', fontSize: 13, fontWeight: '500' },
    emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyEmoji: { fontSize: 40, marginBottom: 12 },
    empty: { textAlign: 'center', color: '#2B2130', fontSize: 16, fontWeight: '600' },
    emptySubtext: {
        textAlign: 'center',
        marginTop: 6,
        color: '#A78B9A',
        fontSize: 13,
        lineHeight: 18,
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 32,
        backgroundColor: '#EC4899',
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    fabText: { color: '#fff', fontSize: 30, lineHeight: 32, fontWeight: '300' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(43,33,48,0.45)',
        justifyContent: 'center',
        padding: 24,
    },
    modalBox: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    modalTitle: { fontSize: 19, fontWeight: '700', marginBottom: 18, color: '#2B2130' },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8A7A87',
        marginBottom: 6,
        marginTop: 4,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#F0DCE6',
        borderRadius: 10,
        padding: 12,
        marginBottom: 14,
        fontSize: 15,
        color: '#2B2130',
        backgroundColor: '#FFFBFC',
    },
    textArea: { height: 110, textAlignVertical: 'top' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
    modalButton: {
        paddingVertical: 11,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    cancelButton: { backgroundColor: '#F5EEF2' },
    cancelButtonText: { color: '#6B5A64', fontWeight: '600' },
    saveButton: { backgroundColor: '#EC4899' },
    saveButtonText: { color: '#fff', fontWeight: '600' },
});