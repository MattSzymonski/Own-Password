import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { savePasswordFile, deletePasswordFile } from '../api/passwordApi';
import { encodePasswoodFile } from '../cryptor';
import type { PasswoodCollection, PasswoodEntry } from '../cryptor';
import EntryDialog from './EntryDialog';
import ConfirmDialog from './ConfirmDialog';
import {
    createEntry,
    addEntry,
    updateEntry,
    deleteEntry as deleteEntryUtil
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
    const [editingEntry, setEditingEntry] = useState<PasswoodEntry | null>(null);
    const [showEntryDialog, setShowEntryDialog] = useState(false);
    const [showPassword, setShowPassword] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showSavePopup, setShowSavePopup] = useState(false);
    const [showCopyPopup, setShowCopyPopup] = useState(false);
    const [copyPopupMessage, setCopyPopupMessage] = useState('');
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
        username: string;
        password: string;
        url?: string;
        notes?: string;
        tags?: string[];
    }) => {
        if (editingEntry) {
            // Update existing entry
            setCollection(updateEntry(collection, editingEntry.id, data));
        } else {
            // Add new entry
            const entry = createEntry(
                data.title,
                data.username,
                data.password,
                data.url,
                data.notes,
                data.tags
            );
            setCollection(addEntry(collection, entry));
        }

        setHasUnsavedChanges(true);
        setEditingEntry(null);
        setError(null);
    };

    const handleDeleteEntry = (id: string) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Entry',
            message: 'Are you sure you want to delete this entry?',
            danger: true,
            onConfirm: () => {
                setCollection(deleteEntryUtil(collection, id));
                setHasUnsavedChanges(true);
            }
        });
    };

    const handleEditEntry = (entry: PasswoodEntry) => {
        setEditingEntry(entry);
        setShowEntryDialog(true);
    };

    const handleNewEntry = () => {
        setEditingEntry(null);
        setShowEntryDialog(true);
    };

    const toggleShowPassword = (entryId: string) => {
        setShowPassword(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entryId)) {
                newSet.delete(entryId);
            } else {
                newSet.add(entryId);
            }
            return newSet;
        });
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopyPopupMessage(`${label} copied to clipboard!`);
        setShowCopyPopup(true);
        setTimeout(() => setShowCopyPopup(false), 2000);
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
            collection?.entries.flatMap(entry => entry.tags || []) || []
        )
    ).sort();

    const filteredEntries = collection?.entries.filter(entry => {
        // Text search filter
        const matchesSearch = !searchQuery || (
            entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        // Tag filter
        const matchesTags = selectedTags.size === 0 ||
            entry.tags?.some(tag => selectedTags.has(tag));

        return matchesSearch && matchesTags;
    }) || [];

    return (
        <div className="min-h-screen bg-neutral-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <button
                            onClick={() => {
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
                            }}
                            className="text-neutral-300 hover:text-neutral-50 flex items-center gap-2"
                        >
                            ← Back to collections
                        </button>
                        <h1 className="text-4xl font-bold text-neutral-50 mt-2">{filename}</h1>
                        <p className="text-neutral-400 mt-1">
                            {collection?.entries.length} {collection?.entries.length === 1 ? 'entry' : 'entries'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {hasUnsavedChanges && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        )}

                        {/* Three dots menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="px-3 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-50 rounded-lg font-medium transition-colors"
                            >
                                ⋯
                            </button>

                            {showDropdown && (
                                <>
                                    {/* Backdrop to close dropdown */}
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowDropdown(false)}
                                    />

                                    {/* Dropdown menu */}
                                    <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-20">
                                        <button
                                            onClick={() => {
                                                setShowDropdown(false);
                                                handleDeleteCollection();
                                            }}
                                            className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <span>Delete Collection</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Add Entry Button */}
                <div className="mb-6">
                    <button
                        onClick={handleNewEntry}
                        className="px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Entry
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Entries List */}
                    <div>
                        <div className="bg-neutral-900 rounded-2xl p-6 shadow-xl border border-neutral-800">
                            <h3 className="text-2xl font-semibold text-neutral-50 mb-6">
                                Passwords
                            </h3>

                            {/* Search Bar */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search entries..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                                />
                            </div>

                            {/* Tags Filter */}
                            {allTags.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-neutral-300">Filter by tags:</h3>
                                        {selectedTags.size > 0 && (
                                            <button
                                                onClick={clearTagFilters}
                                                className="text-xs text-neutral-400 hover:text-neutral-50 underline"
                                            >
                                                Clear filters
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.map((tag) => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTagFilter(tag)}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedTags.has(tag)
                                                    ? 'bg-neutral-50 text-neutral-950 shadow-lg scale-105'
                                                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedTags.size > 0 && (
                                        <div className="mt-3 text-sm text-neutral-300">
                                            Showing {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} with selected tags
                                        </div>
                                    )}
                                </div>
                            )}

                            {filteredEntries.length === 0 ? (
                                <div className="text-center py-12 text-neutral-400">
                                    {searchQuery || selectedTags.size > 0
                                        ? 'No entries match your filters'
                                        : 'No entries yet. Add your first password!'}
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                                    {filteredEntries.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:bg-neutral-800 hover:border-neutral-600 transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <h4 className="text-xl font-semibold text-neutral-50 mb-2">
                                                        {entry.title}
                                                    </h4>
                                                    {entry.url && (
                                                        <a
                                                            href={entry.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-400 hover:text-blue-300 text-sm truncate block mb-3"
                                                        >
                                                            {entry.url}
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditEntry(entry)}
                                                        className="px-4 py-2 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 text-sm rounded-lg font-medium transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEntry(entry.id)}
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-neutral-50 text-sm rounded-lg font-medium transition-all"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {/* Username/Login */}
                                                <div className="flex items-center justify-between py-2">
                                                    <div className="flex-1">
                                                        <div className="text-xs text-neutral-400 mb-1">Username</div>
                                                        <div className="text-neutral-50 font-medium">{entry.username || 'N/A'}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => copyToClipboard(entry.username, 'Username')}
                                                        className="px-3 py-1.5 text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 rounded transition-all text-sm"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>

                                                {/* Password */}
                                                <div className="flex items-center justify-between py-2 border-t border-neutral-800">
                                                    <div className="flex-1">
                                                        <div className="text-xs text-neutral-400 mb-1">Password</div>
                                                        <code className="text-neutral-50 font-mono text-sm">
                                                            {showPassword.has(entry.id) ? entry.password : '••••••••••••'}
                                                        </code>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => toggleShowPassword(entry.id)}
                                                            className="px-3 py-1.5 text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 rounded transition-all text-sm"
                                                        >
                                                            {showPassword.has(entry.id) ? 'Hide' : 'Show'}
                                                        </button>
                                                        <button
                                                            onClick={() => copyToClipboard(entry.password, 'Password')}
                                                            className="px-3 py-1.5 text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 rounded transition-all text-sm"
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Notes */}
                                                {entry.notes && (
                                                    <div className="py-2 border-t border-neutral-800">
                                                        <div className="text-xs text-neutral-400 mb-1">Notes</div>
                                                        <p className="text-neutral-300 text-sm">{entry.notes}</p>
                                                    </div>
                                                )}

                                                {/* Tags */}
                                                {entry.tags && entry.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-800">
                                                        {entry.tags.map((tag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-3 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-full border border-neutral-700"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-800">
                                                    Modified: {new Date(entry.modified).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
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

                {/* Copy Success Popup */}
                {showCopyPopup && (
                    <div
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-lg transition-opacity duration-300 z-[9999]"
                        style={{ opacity: showCopyPopup ? 1 : 0 }}
                    >
                        {copyPopupMessage}
                    </div>
                )}

                {/* Entry Dialog */}
                <EntryDialog
                    open={showEntryDialog}
                    onOpenChange={setShowEntryDialog}
                    entry={editingEntry}
                    existingTags={allTags}
                    onSave={handleSaveEntry}
                />

                {/* Confirmation Dialog */}
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
