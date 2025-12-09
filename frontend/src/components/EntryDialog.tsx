import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { PasswoodPassword } from '../cryptor';
import { generatePassword, calculatePasswordStrength } from '../cryptor/utils';
import { Button } from '@/components/animate-ui/components/buttons/button';

interface EntryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    password?: PasswoodPassword | null;
    existingTags: string[];
    onSave: (data: {
        title: string;
        login: string;
        password: string;
        url?: string;
        notes?: string;
        tags?: string[];
    }) => void;
}

export default function EntryDialog({ open, onOpenChange, password, existingTags, onSave }: EntryDialogProps) {
    const [formData, setFormData] = useState({
        title: '',
        login: '',
        password: '',
        url: '',
        notes: '',
        tags: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (password) {
            setFormData({
                title: password.title,
                login: password.login,
                password: password.password,
                url: password.url || '',
                notes: password.notes || '',
                tags: password.tags?.join(', ') || ''
            });
        } else {
            setFormData({
                title: '',
                login: '',
                password: '',
                url: '',
                notes: '',
                tags: ''
            });
        }
        setError(null);
    }, [password, open]);

    const handleGeneratePassword = () => {
        const newPassword = generatePassword(16);
        setFormData(prev => ({ ...prev, password: newPassword }));
    };

    const handleSave = () => {
        if (!formData.title || !formData.password) {
            setError('Title and password are required');
            return;
        }

        const tags = formData.tags
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);

        onSave({
            title: formData.title,
            login: formData.login,
            password: formData.password,
            url: formData.url || undefined,
            notes: formData.notes || undefined,
            tags: tags.length > 0 ? tags : undefined
        });

        onOpenChange(false);
    };

    const handleTagInputChange = (value: string) => {
        setFormData(prev => ({ ...prev, tags: value }));
        const lastCommaIndex = value.lastIndexOf(',');
        const currentTag = value.slice(lastCommaIndex + 1).trim();
        setTagInput(currentTag);
        setShowTagSuggestions(currentTag.length > 0);
    };

    const handleTagSelect = (tag: string) => {
        const lastCommaIndex = formData.tags.lastIndexOf(',');
        const beforeLastTag = lastCommaIndex >= 0 ? formData.tags.slice(0, lastCommaIndex + 1) + ' ' : '';
        const newValue = beforeLastTag + tag + ', ';
        setFormData(prev => ({ ...prev, tags: newValue }));
        setShowTagSuggestions(false);
        setTagInput('');
    };

    const filteredSuggestions = existingTags.filter(tag =>
        tag.toLowerCase().includes(tagInput.toLowerCase()) &&
        !formData.tags.split(',').map(t => t.trim()).includes(tag)
    );

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900 rounded-2xl p-8 shadow-2xl border border-neutral-800 max-w-md w-full max-h-[90vh] overflow-y-auto z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                    <Dialog.Title className="text-2xl font-semibold text-neutral-50 mb-6">
                        {password ? 'Edit Password' : 'Add New Password'}
                    </Dialog.Title>

                    {error && (
                        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        <div>
                            <label className="block text-neutral-300 mb-2 text-sm flex justify-between items-center">
                                <span>Title</span>
                                <span className="text-neutral-600 text-xs">Required</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter title"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-neutral-300 mb-2 text-sm">Login</label>
                            <input
                                type="text"
                                placeholder="Enter login"
                                value={formData.login}
                                onChange={(e) => setFormData(prev => ({ ...prev, login: e.target.value }))}
                                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                            />
                        </div>

                        <div>
                            <label className="block text-neutral-300 mb-2 text-sm flex justify-between items-center">
                                <span>Password</span>
                                <span className="text-neutral-600 text-xs">Required</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full px-4 py-3 pr-28 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                                />
                                <Button
                                    type="button"
                                    onClick={handleGeneratePassword}
                                    size="sm"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 text-xs rounded font-medium h-auto"
                                >
                                    Generate
                                </Button>
                            </div>
                            {formData.password && (
                                <div className="mt-2">
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
                        </div>

                        <div>
                            <label className="block text-neutral-300 mb-2 text-sm">URL</label>
                            <input
                                type="text"
                                placeholder="https://example.com"
                                value={formData.url}
                                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                            />
                        </div>

                        <div>
                            <label className="block text-neutral-300 mb-2 text-sm">Notes</label>
                            <textarea
                                placeholder="Additional notes..."
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                rows={3}
                                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50 resize-none"
                            />
                        </div>

                        <div className="relative">
                            <label className="block text-neutral-300 mb-2 text-sm">Tags</label>
                            <input
                                type="text"
                                placeholder="work, personal, banking"
                                value={formData.tags}
                                onChange={(e) => handleTagInputChange(e.target.value)}
                                onFocus={() => setShowTagSuggestions(tagInput.length > 0)}
                                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                            />
                            <p className="text-xs text-neutral-400 mt-1">Separate tags with commas. Type to see existing tags or create new ones.</p>

                            {showTagSuggestions && filteredSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                    {filteredSuggestions.map((tag) => (
                                        <Button
                                            key={tag}
                                            type="button"
                                            onClick={() => handleTagSelect(tag)}
                                            variant="ghost"
                                            className="w-full text-left px-4 py-2 hover:bg-neutral-800 text-neutral-50 first:rounded-t-lg last:rounded-b-lg h-auto justify-start"
                                        >
                                            <span className="font-medium">{tag}</span>
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleSave}
                                className="flex-1 px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium"
                            >
                                {password ? 'Update' : 'Add Password'}
                            </Button>
                            <Button
                                onClick={() => onOpenChange(false)}
                                variant="secondary"
                                className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-50 rounded-lg font-medium"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>

                    <Dialog.Close asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 flex items-center gap-2"
                            aria-label="Close"
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </Button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
