import { useState, useEffect } from 'react';
import { savePasswordFile, deletePasswordFile } from '../api/passwordApi';
import { encodePasswoodFile } from '../cryptor';
import type { PasswoodCollection, PasswoodPassword } from '../cryptor';
import EntryDialog from './EntryDialog';
import ConfirmDialog from './ConfirmDialog';
import EditorHeader from './EditorHeader';
import PasswordList from './PasswordList';
import {
    createPassword,
    addPassword,
    updatePassword,
    deletePassword as deletePasswordUtil
} from '../cryptor/utils';

interface PasswordFileEditorProps {
    filename: string;
    initialCollection: PasswoodCollection;
    initialPassword: string;
    onBack: () => void;
}

export default function PasswordFileEditor({ filename: initialFilename, initialCollection, initialPassword, onBack }: PasswordFileEditorProps) {
    const [masterPassword] = useState(initialPassword);
    const [filename] = useState(initialFilename);
    const [collection, setCollection] = useState<PasswoodCollection>(initialCollection);
    const [error, setError] = useState<string | null>(null);
    const [editingPassword, setEditingPassword] = useState<PasswoodPassword | null>(null);
    const [showEntryDialog, setShowEntryDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showSavePopup, setShowSavePopup] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        danger?: boolean;
    }>({ open: false, title: '', message: '', onConfirm: () => { } });

    // Warn before closing tab/window with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const handleSave = async () => {
        if (!masterPassword) return;

        try {
            setSaving(true);
            setError(null);

            // Update modified timestamp
            const updatedDb = { ...collection, modified: new Date().toISOString() };
            setCollection(updatedDb);

            // Encrypt and save
            const encrypted = await encodePasswoodFile(updatedDb, masterPassword);
            await savePasswordFile(filename, encrypted);

            setHasUnsavedChanges(false);
            setShowSavePopup(true);
            setTimeout(() => setShowSavePopup(false), 2000);
        } catch (err) {
            setError('Failed to save password file');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCollection = async () => {
        setConfirmDialog({
            open: true,
            title: 'Delete Collection',
            message: `Are you sure you want to delete "${filename}"? This action cannot be undone.`,
            danger: true,
            onConfirm: async () => {
                try {
                    await deletePasswordFile(filename);
                    onBack();
                } catch (err) {
                    setError('Failed to delete password file');
                    console.error(err);
                }
            }
        });
    };

    const handleSaveEntry = (data: {
        title: string;
        login: string;
        password: string;
        url?: string;
        notes?: string;
        tags?: string[];
    }) => {
        if (editingPassword) {
            // Update existing password
            setCollection(updatePassword(collection, editingPassword.id, data));
        } else {
            // Add new password
            const password = createPassword(
                data.title,
                data.login,
                data.password,
                data.url,
                data.notes,
                data.tags
            );
            setCollection(addPassword(collection, password));
        }

        setHasUnsavedChanges(true);
        setEditingPassword(null);
        setError(null);
    };

    const handleDeletePassword = (id: string) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Password',
            message: 'Are you sure you want to delete this password?',
            danger: true,
            onConfirm: () => {
                setCollection(deletePasswordUtil(collection, id));
                setHasUnsavedChanges(true);
            }
        });
    };

    const handleEditPassword = (password: PasswoodPassword) => {
        setEditingPassword(password);
        setShowEntryDialog(true);
    };

    const handleNewPassword = () => {
        setEditingPassword(null);
        setShowEntryDialog(true);
    };

    const toggleTagFilter = (tag: string) => {
        setSelectedTags(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tag)) {
                newSet.delete(tag);
            } else {
                newSet.add(tag);
            }
            return newSet;
        });
    };

    const clearTagFilters = () => {
        setSelectedTags(new Set());
    };

    // Get all unique tags from collection
    const allTags = Array.from(
        new Set(
            collection?.passwords?.flatMap(password => password.tags || []) || []
        )
    ).sort();

    const filteredPasswords = collection?.passwords?.filter(password => {
        // Text search
        const matchesSearch = !searchQuery ||
            password.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            password.login.toLowerCase().includes(searchQuery.toLowerCase()) ||
            password.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            password.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        // Tag filter
        const matchesTags = selectedTags.size === 0 ||
            password.tags?.some(tag => selectedTags.has(tag));

        return matchesSearch && matchesTags;
    }) || [];

    const handleBackClick = () => {
        if (hasUnsavedChanges) {
            setConfirmDialog({
                open: true,
                title: 'Unsaved Changes',
                message: 'You have unsaved changes. Do you want to leave without saving?',
                danger: true,
                onConfirm: onBack
            });
        } else {
            onBack();
        }
    };

    return (
        <div className="h-screen bg-neutral-950 p-8 flex flex-col overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col h-full w-full">
                <EditorHeader
                    filename={filename}
                    passwordCount={collection?.passwords?.length || 0}
                    hasUnsavedChanges={hasUnsavedChanges}
                    saving={saving}
                    onBack={handleBackClick}
                    onSave={handleSave}
                    onDeleteCollection={handleDeleteCollection}
                />

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6 flex-shrink-0">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-hidden">
                    <PasswordList
                        passwords={filteredPasswords}
                        searchQuery={searchQuery}
                        allTags={allTags}
                        selectedTags={selectedTags}
                        onSearchChange={setSearchQuery}
                        onToggleTag={toggleTagFilter}
                        onClearFilters={clearTagFilters}
                        onAddNew={handleNewPassword}
                        onEdit={handleEditPassword}
                        onDelete={handleDeletePassword}
                    />
                </div>

                {/* Save Success Popup */}
                {showSavePopup && (
                    <div
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg transition-opacity duration-300 z-[9999]"
                        style={{ opacity: showSavePopup ? 1 : 0 }}
                    >
                        Password file saved successfully!
                    </div>
                )}

                <EntryDialog
                    open={showEntryDialog}
                    onOpenChange={setShowEntryDialog}
                    password={editingPassword}
                    existingTags={allTags}
                    onSave={handleSaveEntry}
                />

                <ConfirmDialog
                    open={confirmDialog.open}
                    onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    danger={confirmDialog.danger}
                />
            </div>
        </div>
    );
}
