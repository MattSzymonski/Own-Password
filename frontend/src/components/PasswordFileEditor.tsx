import { useState, useEffect } from 'react';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { savePasswordFile, deletePasswordFile } from '../api/passwordApi';
import { encodePasswoodFile } from '../cryptor';
import type { PasswoodCollection, PasswoodPassword } from '../cryptor';
import EntryDialog from './EntryDialog';
import ConfirmDialog from './ConfirmDialog';
import { Button } from '@/components/animate-ui/components/buttons/button';
import { CopyButton } from '@/components/animate-ui/components/buttons/copy';
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
    const [showPassword, setShowPassword] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
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

    const toggleShowPassword = (passwordId: string) => {
        setShowPassword(prev => {
            const newSet = new Set(prev);
            if (newSet.has(passwordId)) {
                newSet.delete(passwordId);
            } else {
                newSet.add(passwordId);
            }
            return newSet;
        });
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

    return (
        <div className="min-h-screen bg-neutral-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <Button
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
                            variant="ghost"
                            className="text-neutral-300 hover:text-neutral-50 flex items-center gap-2 h-auto p-0"
                        >
                            ← Back to collections
                        </Button>
                        <h1 className="text-4xl font-bold text-neutral-50 mt-2">{filename}</h1>
                        <p className="text-neutral-400 mt-1">
                            {collection?.passwords?.length || 0} {collection?.passwords?.length === 1 ? 'password' : 'passwords'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {hasUnsavedChanges && (
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        )}

                        {/* Three dots menu */}
                        <div className="relative">
                            <Button
                                onClick={() => setShowDropdown(!showDropdown)}
                                variant="secondary"
                                className="px-3 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-50 rounded-lg font-medium"
                            >
                                ⋯
                            </Button>

                            {showDropdown && (
                                <>
                                    {/* Backdrop to close dropdown */}
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowDropdown(false)}
                                    />

                                    {/* Dropdown menu */}
                                    <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-20">
                                        <Button
                                            onClick={() => {
                                                setShowDropdown(false);
                                                handleDeleteCollection();
                                            }}
                                            variant="ghost"
                                            className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-900/30 rounded-lg flex items-center gap-2 h-auto"
                                        >
                                            <span>Delete Collection</span>
                                        </Button>
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

                <div className="grid grid-cols-1 gap-8">
                    {/* Passwords List */}
                    <div>
                        <div className="bg-neutral-900 rounded-2xl p-6 shadow-xl border border-neutral-800">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-semibold text-neutral-50">
                                    Passwords
                                </h3>
                                <Button
                                    onClick={handleNewPassword}
                                    className="px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium shadow-lg flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    New Password
                                </Button>
                            </div>

                            {/* Search Bar */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search passwords..."
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
                                            <Button
                                                onClick={clearTagFilters}
                                                variant="ghost"
                                                className="text-xs text-neutral-400 hover:text-neutral-50 underline h-auto p-0"
                                            >
                                                Clear filters
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.map((tag) => (
                                            <Button
                                                key={tag}
                                                onClick={() => toggleTagFilter(tag)}
                                                variant={selectedTags.has(tag) ? 'default' : 'secondary'}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium h-auto ${selectedTags.has(tag)
                                                    ? 'bg-neutral-50 text-neutral-950 shadow-lg'
                                                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700'
                                                    }`}
                                            >
                                                {tag}
                                            </Button>
                                        ))}
                                    </div>
                                    {selectedTags.size > 0 && (
                                        <div className="mt-3 text-sm text-neutral-300">
                                            Showing {filteredPasswords.length} {filteredPasswords.length === 1 ? 'password' : 'passwords'} with selected tags
                                        </div>
                                    )}
                                </div>
                            )}

                            {filteredPasswords.length === 0 ? (
                                <div className="text-center py-12 text-neutral-400">
                                    {searchQuery || selectedTags.size > 0
                                        ? 'No passwords match your filters'
                                        : 'No passwords yet. Add your first password!'}
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                                    {filteredPasswords.map((password) => (
                                        <div
                                            key={password.id}
                                            className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:bg-neutral-800 hover:border-neutral-600 transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <h4 className="text-xl font-semibold text-neutral-50 mb-2">
                                                        {password.title}
                                                    </h4>
                                                    {password.url && (
                                                        <a
                                                            href={password.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-400 hover:text-blue-300 text-sm truncate block mb-3"
                                                        >
                                                            {password.url}
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleEditPassword(password)}
                                                        size="sm"
                                                        className="px-4 py-2 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 text-sm rounded-lg font-medium"
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeletePassword(password.id)}
                                                        variant="destructive"
                                                        size="sm"
                                                        className="px-4 py-2 text-sm rounded-lg font-medium"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {/* Login */}
                                                {password.login && (
                                                    <div className="flex items-center justify-between py-2">
                                                        <div className="flex-1">
                                                            <div className="text-xs text-neutral-400 mb-1">Login</div>
                                                            <div className="text-neutral-50 font-medium">{password.login}</div>
                                                        </div>
                                                        <CopyButton
                                                            content={password.login}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800"
                                                        />
                                                    </div>
                                                )}

                                                {/* Password */}
                                                <div className="flex items-center justify-between py-2 border-t border-neutral-800">
                                                    <div className="flex-1">
                                                        <div className="text-xs text-neutral-400 mb-1">Password</div>
                                                        <code className="text-neutral-50 font-mono text-sm">
                                                            {showPassword.has(password.id) ? password.password : '••••••••••••'}
                                                        </code>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => toggleShowPassword(password.id)}
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800"
                                                        >
                                                            {showPassword.has(password.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </Button>
                                                        <CopyButton
                                                            content={password.password}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Notes */}
                                                {password.notes && (
                                                    <div className="py-2 border-t border-neutral-800">
                                                        <div className="text-xs text-neutral-400 mb-1">Notes</div>
                                                        <p className="text-neutral-300 text-sm">{password.notes}</p>
                                                    </div>
                                                )}

                                                {/* Tags */}
                                                {password.tags && password.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-800">
                                                        {password.tags.map((tag, idx) => (
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
                                                    Modified: {new Date(password.modified).toLocaleString()}
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

                {/* Password Dialog */}
                <EntryDialog
                    open={showEntryDialog}
                    onOpenChange={setShowEntryDialog}
                    password={editingPassword}
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
