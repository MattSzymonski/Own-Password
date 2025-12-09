import { useState, useEffect } from 'react';
import { savePasswordFile, deletePasswordFile } from '../api/passwordApi';
import { encodePasswoodFile } from '../cryptor';
import type { PasswoodCollection, PasswoodPassword, Tag } from '../cryptor';
import EntryDialog from './EntryDialog';
import ConfirmDialog from './ConfirmDialog';
import TagsDialog from './TagsDialog';
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
    const [showTagsDialog, setShowTagsDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showSavePopup, setShowSavePopup] = useState(false);
    const [showAddPopup, setShowAddPopup] = useState(false);
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
            // Check if anything actually changed
            const tagsChanged = JSON.stringify(editingPassword.tags?.sort() || []) !== JSON.stringify(data.tags?.sort() || []);
            const hasChanges =
                editingPassword.title !== data.title ||
                editingPassword.login !== data.login ||
                editingPassword.password !== data.password ||
                (editingPassword.url || '') !== (data.url || '') ||
                (editingPassword.notes || '') !== (data.notes || '') ||
                tagsChanged;

            if (!hasChanges) {
                // Nothing changed, just close the dialog
                setEditingPassword(null);
                return;
            }

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

            // Show success popup
            setShowAddPopup(true);
            setTimeout(() => setShowAddPopup(false), 2000);
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

    const handleManageTags = () => {
        setShowTagsDialog(true);
    };

    const handleSaveTags = (tags: Tag[], renamedTags: { oldName: string; newName: string }[], deletedTagNames: string[]) => {
        let updatedPasswords = [...collection.passwords];

        // Update passwords for renamed tags
        renamedTags.forEach(({ oldName, newName }) => {
            updatedPasswords = updatedPasswords.map(password => ({
                ...password,
                tags: password.tags?.map(tag => tag === oldName ? newName : tag)
            }));
        });

        // Remove deleted tags from passwords
        deletedTagNames.forEach(deletedName => {
            updatedPasswords = updatedPasswords.map(password => ({
                ...password,
                tags: password.tags?.filter(tag => tag !== deletedName)
            }));
        });

        setCollection({ ...collection, tags, passwords: updatedPasswords });
        setHasUnsavedChanges(true);
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

    // Get all unique tag names from passwords
    const allTags = Array.from(
        new Set(
            collection?.passwords?.flatMap(password => password.tags || []) || []
        )
    ).sort();

    // Get Tag objects that have at least one password entry (preserve user's order)
    const availableTagsForFilter = (collection.tags || [])
        .filter(tag => allTags.includes(tag.name));

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
            <div className="max-w-2xl mx-auto flex flex-col h-full w-full">
                <EditorHeader
                    filename={filename}
                    passwordCount={collection?.passwords?.length || 0}
                    hasUnsavedChanges={hasUnsavedChanges}
                    saving={saving}
                    onBack={handleBackClick}
                    onSave={handleSave}
                    onDeleteCollection={handleDeleteCollection}
                    onManageTags={handleManageTags}
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
                        availableTags={collection.tags || []}
                        availableTagsForFilter={availableTagsForFilter}
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
                    <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-neutral-50 text-neutral-950 px-6 py-4 rounded-lg shadow-2xl z-[9999] animate-in fade-in slide-in-from-top-4 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-4 duration-300">
                        Password collection saved successfully!
                    </div>
                )}

                {/* Add Password Success Popup */}
                {showAddPopup && (
                    <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-neutral-50 text-neutral-950 px-6 py-4 rounded-lg shadow-2xl z-[9999] animate-in fade-in slide-in-from-top-4 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-4 duration-300">
                        Password added successfully!
                    </div>
                )}

                <EntryDialog
                    open={showEntryDialog}
                    onOpenChange={setShowEntryDialog}
                    password={editingPassword}
                    availableTags={collection.tags || []}
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

                <TagsDialog
                    open={showTagsDialog}
                    onOpenChange={setShowTagsDialog}
                    tags={collection.tags || []}
                    onSave={handleSaveTags}
                />
            </div>
        </div>
    );
}
