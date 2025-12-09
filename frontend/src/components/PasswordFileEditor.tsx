import { useState, useEffect } from 'react';
import { savePasswordFile, deletePasswordFile } from '../api/passwordApi';
import { encodePasswoodFile } from '../cryptor';
import type { PasswoodDatabase, PasswoodEntry } from '../cryptor';
import {
    createEntry,
    addEntry,
    updateEntry,
    deleteEntry as deleteEntryUtil,
    generatePassword,
    calculatePasswordStrength
} from '../cryptor/utils';

interface PasswordFileEditorProps {
    filename: string;
    initialDatabase: PasswoodDatabase;
    initialPassword: string;
    onBack: () => void;
}

export default function PasswordFileEditor({ filename: initialFilename, initialDatabase, initialPassword, onBack }: PasswordFileEditorProps) {
    const [masterPassword] = useState(initialPassword);
    const [filename] = useState(initialFilename);
    const [database, setDatabase] = useState<PasswoodDatabase>(initialDatabase);
    const [error, setError] = useState<string | null>(null);
    const [editingEntry, setEditingEntry] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showSavePopup, setShowSavePopup] = useState(false);

    // Form state for new/edit entry
    const [formData, setFormData] = useState({
        title: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        tags: ''
    });

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
            const updatedDb = { ...database, modified: new Date().toISOString() };
            setDatabase(updatedDb);

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

    const handleDeleteDatabase = async () => {
        if (!confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await deletePasswordFile(filename);
            onBack(); // Return to file picker
        } catch (err) {
            setError('Failed to delete password file');
            console.error(err);
        }
    };

    const handleAddEntry = () => {
        if (!formData.title || !formData.password) {
            setError('Title and password are required');
            return;
        }

        const tags = formData.tags
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);

        const entry = createEntry(
            formData.title,
            formData.username,
            formData.password,
            formData.url || undefined,
            formData.notes || undefined,
            tags.length > 0 ? tags : undefined
        );

        setDatabase(addEntry(database, entry));
        setHasUnsavedChanges(true);
        resetForm();
        setError(null);
    };

    const handleUpdateEntry = (entryId: string) => {
        if (!formData.title || !formData.password) {
            setError('Title and password are required');
            return;
        }

        const tags = formData.tags
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);

        setDatabase(updateEntry(database, entryId, {
            title: formData.title,
            username: formData.username,
            password: formData.password,
            url: formData.url || undefined,
            notes: formData.notes || undefined,
            tags: tags.length > 0 ? tags : undefined
        }));

        setHasUnsavedChanges(true);
        setEditingEntry(null);
        resetForm();
        setError(null);
    };

    const handleDeleteEntry = (id: string) => {
        if (confirm('Are you sure you want to delete this entry?')) {
            setDatabase(deleteEntryUtil(database, id));
            setHasUnsavedChanges(true);
        }
    };

    const handleEditEntry = (entry: PasswoodEntry) => {
        setEditingEntry(entry.id);
        setFormData({
            title: entry.title,
            username: entry.username,
            password: entry.password,
            url: entry.url || '',
            notes: entry.notes || '',
            tags: entry.tags?.join(', ') || ''
        });
    };

    const resetForm = () => {
        setFormData({
            title: '',
            username: '',
            password: '',
            url: '',
            notes: '',
            tags: ''
        });
        setEditingEntry(null);
    };

    const handleGeneratePassword = () => {
        const newPassword = generatePassword(20, {
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true
        });
        setFormData(prev => ({ ...prev, password: newPassword }));
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
        alert(`${label} copied to clipboard!`);
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

    // Get all unique tags from database
    const allTags = Array.from(
        new Set(
            database?.entries.flatMap(entry => entry.tags || []) || []
        )
    ).sort();

    const filteredEntries = database?.entries.filter(entry => {
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
                                    if (confirm('You have unsaved changes. Do you want to leave without saving?')) {
                                        onBack();
                                    }
                                } else {
                                    onBack();
                                }
                            }}
                            className="text-neutral-300 hover:text-neutral-50 flex items-center gap-2"
                        >
                            ← Back to Files
                        </button>
                        <h1 className="text-4xl font-bold text-neutral-50 mt-2">{filename}</h1>
                        <p className="text-neutral-400 mt-1">
                            {database?.entries.length} {database?.entries.length === 1 ? 'entry' : 'entries'}
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
                                                handleDeleteDatabase();
                                            }}
                                            className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <span>Delete Database</span>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Entry Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-neutral-900 rounded-2xl p-6 shadow-xl border border-neutral-800">
                            <h3 className="text-2xl font-semibold text-neutral-50 mb-6">
                                {editingEntry ? 'Edit Entry' : 'Add New Entry'}
                            </h3>

                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Title *"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                                />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={formData.username}
                                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full px-4 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                                />
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Password *"
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full px-4 py-2 pr-24 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                                    />
                                    <button
                                        onClick={handleGeneratePassword}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 text-xs rounded transition-colors"
                                    >
                                        Generate
                                    </button>
                                </div>
                                {formData.password && (
                                    <div className="text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${calculatePasswordStrength(formData.password) >= 80
                                                        ? 'bg-green-500'
                                                        : calculatePasswordStrength(formData.password) >= 50
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${calculatePasswordStrength(formData.password)}%` }}
                                                />
                                            </div>
                                            <span className="text-neutral-400 text-xs">
                                                {calculatePasswordStrength(formData.password)}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="text"
                                    placeholder="URL"
                                    value={formData.url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                    className="w-full px-4 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                                />
                                <textarea
                                    placeholder="Notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50 resize-none"
                                />
                                <input
                                    type="text"
                                    placeholder="Tags (comma-separated)"
                                    value={formData.tags}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                                    className="w-full px-4 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                                />

                                <div className="flex gap-2 pt-2">
                                    {editingEntry ? (
                                        <>
                                            <button
                                                onClick={() => handleUpdateEntry(editingEntry)}
                                                className="flex-1 px-4 py-2 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium transition-colors"
                                            >
                                                Update
                                            </button>
                                            <button
                                                onClick={resetForm}
                                                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-50 rounded-lg font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleAddEntry}
                                            className="w-full px-4 py-2 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium transition-all"
                                        >
                                            + Add Entry
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Entries List */}
                    <div className="lg:col-span-2">
                        <div className="bg-neutral-900 rounded-2xl p-6 shadow-xl border border-neutral-800">
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
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-semibold text-neutral-50 mb-1">
                                                        {entry.title}
                                                    </h4>
                                                    <p className="text-neutral-300 text-sm">{entry.username}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditEntry(entry)}
                                                        className="px-3 py-1 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 text-sm rounded transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEntry(entry.id)}
                                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-neutral-50 text-sm rounded transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-neutral-400 w-24">Password:</span>
                                                    <code className="flex-1 px-3 py-1 bg-neutral-950 rounded text-neutral-50 font-mono">
                                                        {showPassword.has(entry.id) ? entry.password : '••••••••••••'}
                                                    </code>
                                                    <button
                                                        onClick={() => toggleShowPassword(entry.id)}
                                                        className="px-2 py-1 text-neutral-400 hover:text-neutral-50"
                                                    >
                                                        {showPassword.has(entry.id) ? 'Hide' : 'Show'}
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(entry.password, 'Password')}
                                                        className="px-2 py-1 text-neutral-400 hover:text-neutral-50"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>

                                                {entry.url && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-neutral-400 w-24">URL:</span>
                                                        <a
                                                            href={entry.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 text-blue-400 hover:text-blue-300 truncate"
                                                        >
                                                            {entry.url}
                                                        </a>
                                                    </div>
                                                )}

                                                {entry.notes && (
                                                    <div className="flex gap-2">
                                                        <span className="text-neutral-400 w-24">Notes:</span>
                                                        <p className="flex-1 text-neutral-300">{entry.notes}</p>
                                                    </div>
                                                )}

                                                {entry.tags && entry.tags.length > 0 && (
                                                    <div className="flex gap-2 items-center">
                                                        <span className="text-neutral-400 w-24">Tags:</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {entry.tags.map((tag, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2 py-0.5 bg-neutral-800 text-neutral-300 text-xs rounded-full"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="text-xs text-neutral-500 mt-2">
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
            </div>
        </div>
    );
}
