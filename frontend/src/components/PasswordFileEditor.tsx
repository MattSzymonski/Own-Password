import { useState, useEffect } from 'react';
import { savePasswordFile, deletePasswordFile } from '../utils/passwordApi';
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
import { getFileHandle, writeLocalFile, removeFileHandle, removeLocalFile, downloadToLocalFile } from '../utils/localFiles';
import { useOnlineStatus } from '../hooks/use-online-status';
import { BACKEND_API_URL } from '@/utils/constants';

interface PasswordFileEditorProps {
    filename: string;
    initialCollection: PasswoodCollection;
    initialPassword: string;
    isLocalFile: boolean;
    onBack: () => void;
}

export default function PasswordFileEditor({ filename: initialFilename, initialCollection, initialPassword, isLocalFile, onBack }: PasswordFileEditorProps) {
    const singleCollection = import.meta.env.VITE_SINGLE_COLLECTION_FILE || import.meta.env.SINGLE_COLLECTION_FILE;
    const isSingleCollection = singleCollection && singleCollection.trim() !== '';

    const [masterPassword, setMasterPassword] = useState(initialPassword);
    const [filename] = useState(initialFilename);
    const [collection, setCollection] = useState<PasswoodCollection>(initialCollection);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [editingPassword, setEditingPassword] = useState<PasswoodPassword | null>(null);
    const [showEntryDialog, setShowEntryDialog] = useState(false);
    const [showTagsDialog, setShowTagsDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showSavePopup, setShowSavePopup] = useState(false);
    const [showAddPopup, setShowAddPopup] = useState(false);
    const [showDownloadPopup, setShowDownloadPopup] = useState(false);
    const [showOfflinePopup, setShowOfflinePopup] = useState(false);
    const isOnline = useOnlineStatus();
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        danger?: boolean;
    }>({ open: false, title: '', message: '', onConfirm: () => { } });

    // Delay mounting PasswordList until after page transition
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 600);
        return () => clearTimeout(timer);
    }, []);

    // Sync masterPassword when initialPassword prop changes
    useEffect(() => {
        setMasterPassword(initialPassword);
    }, [initialPassword]);

    // Clear master password from memory on unmount
    useEffect(() => {
        return () => {
            setMasterPassword('');
        };
    }, []);

    // Auto-lock after 15 minutes of inactivity
    useEffect(() => {
        const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
        let inactivityTimer: number;

        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                // Clear sensitive data and go back
                setMasterPassword('');
                onBack();
            }, INACTIVITY_TIMEOUT);
        };

        // Track user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, resetTimer);
        });

        resetTimer(); // Initial timer

        return () => {
            clearTimeout(inactivityTimer);
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }, [onBack]);

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

    const checkOnlineStatus = async (): Promise<boolean> => {
        if (isLocalFile) {
            return true; // Local files don't need server
        }

        if (!isOnline) {
            return false;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const response = await fetch(`${BACKEND_API_URL}/health`, {
                method: 'HEAD',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    };

    const handleSave = async () => {
        if (!masterPassword) {
            setError('Master password is missing. Please try reopening the file.');
            return;
        }

        const online = await checkOnlineStatus();
        if (!online) {
            setShowOfflinePopup(true);
            setTimeout(() => setShowOfflinePopup(false), 2000);
            return;
        }

        try {
            setSaving(true);
            setError(null);

            // Update modified timestamp
            const updatedDb = { ...collection, modified: new Date().toISOString() };
            setCollection(updatedDb);

            // Encrypt and save
            const encrypted = await encodePasswoodFile(updatedDb, masterPassword);

            if (isLocalFile) {
                // Save to local file
                const handle = await getFileHandle(filename);
                if (handle) {
                    await writeLocalFile(handle, encrypted);
                } else {
                    throw new Error('File handle not found');
                }
            } else {
                // Save to server
                await savePasswordFile(filename, encrypted);
            }

            setHasUnsavedChanges(false);
            setShowSavePopup(true);
            setTimeout(() => setShowSavePopup(false), 2000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(`Failed to save password file: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCollection = async () => {
        const online = await checkOnlineStatus();
        if (!online) {
            setShowOfflinePopup(true);
            setTimeout(() => setShowOfflinePopup(false), 2000);
            return;
        }

        setConfirmDialog({
            open: true,
            title: 'Delete Collection',
            message: `Are you sure you want to delete "${filename}"? This action cannot be undone.`,
            danger: true,
            onConfirm: async () => {
                try {
                    if (isLocalFile) {
                        // Remove from local file list
                        await removeFileHandle(filename);
                        removeLocalFile(filename);
                    } else {
                        // Delete from server
                        await deletePasswordFile(filename);
                    }
                    onBack();
                } catch (err) {
                    setError('Failed to delete password file');
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

    const handleDownload = async () => {
        if (!masterPassword) {
            setError('Master password is missing. Please try reopening the file.');
            return;
        }

        const online = await checkOnlineStatus();
        if (!online) {
            setShowOfflinePopup(true);
            setTimeout(() => setShowOfflinePopup(false), 2000);
            return;
        }

        try {
            // Encrypt the current collection
            const encrypted = await encodePasswoodFile(collection, masterPassword);

            // Prompt user to save file
            const success = await downloadToLocalFile(filename, encrypted);

            if (success) {
                // Show download success notification
                setShowDownloadPopup(true);
                setTimeout(() => setShowDownloadPopup(false), 2000);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(`Failed to download file: ${errorMessage}`);
        }
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
        <div className="h-screen bg-neutral-950 pb-0 py-5 md:p-8 flex flex-col overflow-hidden">
            <div className="max-w-2xl mx-auto flex flex-col h-full w-full">
                <EditorHeader
                    filename={filename}
                    passwordCount={collection?.passwords?.length || 0}
                    hasUnsavedChanges={hasUnsavedChanges}
                    saving={saving}
                    isLocalFile={isLocalFile}
                    hideDelete={isLocalFile}
                    onBack={isSingleCollection ? undefined : handleBackClick}
                    onSave={handleSave}
                    onDeleteCollection={handleDeleteCollection}
                    onManageTags={handleManageTags}
                    onDownload={!isLocalFile ? handleDownload : undefined}
                />

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6 flex-shrink-0">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-hidden">
                    {mounted && (
                        <PasswordList
                            passwords={filteredPasswords}
                            searchQuery={searchQuery}
                            availableTags={collection.tags || []}
                            availableTagsForFilter={availableTagsForFilter}
                            selectedTags={selectedTags}
                            onSearchChange={setSearchQuery}
                            onToggleTag={toggleTagFilter}
                            onAddNew={handleNewPassword}
                            onEdit={handleEditPassword}
                            onDelete={handleDeletePassword}
                        />
                    )}
                </div>

                {/* Save Success Popup */}
                {showSavePopup && (
                    <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-neutral-50 text-neutral-950 px-6 py-4 rounded-lg shadow-2xl z-[9999] animate-in fade-in slide-in-from-top-4 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-4 duration-300">
                        Password collection saved successfully
                    </div>
                )}

                {/* Add Password Success Popup */}
                {showAddPopup && (
                    <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-neutral-50 text-neutral-950 px-6 py-4 rounded-lg shadow-2xl z-[9999] animate-in fade-in slide-in-from-top-4 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-4 duration-300">
                        Password added successfully
                    </div>
                )}

                {/* Download Success Popup */}
                {showDownloadPopup && (
                    <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-neutral-50 text-neutral-950 px-6 py-4 rounded-lg shadow-2xl z-[9999] animate-in fade-in slide-in-from-top-4 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-4 duration-300">
                        File downloaded successfully
                    </div>
                )}

                {/* Offline Popup */}
                {showOfflinePopup && (
                    <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-neutral-50 text-neutral-950 px-6 py-4 rounded-lg shadow-2xl z-[9999] animate-in fade-in slide-in-from-top-4 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-4 duration-300">
                        You are offline
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
