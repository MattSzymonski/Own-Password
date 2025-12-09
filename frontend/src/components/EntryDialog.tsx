import { useState, useEffect } from 'react';
import type { PasswoodPassword, Tag } from '../cryptor';
import { generatePassword, calculatePasswordStrength } from '../cryptor/utils';
import { Button } from '@/components/animate-ui/components/buttons/button';
import TagPicker from './TagPicker';
import CustomDialog from './CustomDialog';

interface EntryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    password?: PasswoodPassword | null;
    availableTags: Tag[];
    onSave: (data: {
        title: string;
        login: string;
        password: string;
        url?: string;
        notes?: string;
        tags?: string[];
    }) => void;
}

export default function EntryDialog({ open, onOpenChange, password, availableTags, onSave }: EntryDialogProps) {
    const [formData, setFormData] = useState({
        title: '',
        login: '',
        password: '',
        url: '',
        notes: '',
        tagIds: [] as string[]
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (password) {
            // Convert tag names to tag IDs
            const tagIds = password.tags
                ?.map(tagName => availableTags.find(t => t.name === tagName)?.id)
                .filter((id): id is string => id !== undefined) || [];

            setFormData({
                title: password.title,
                login: password.login,
                password: password.password,
                url: password.url || '',
                notes: password.notes || '',
                tagIds
            });
        } else {
            setFormData({
                title: '',
                login: '',
                password: '',
                url: '',
                notes: '',
                tagIds: []
            });
        }
        setError(null);
    }, [password, open, availableTags]);

    const handleGeneratePassword = () => {
        const newPassword = generatePassword(16);
        setFormData(prev => ({ ...prev, password: newPassword }));
    };

    const handleSave = () => {
        if (!formData.title || !formData.password) {
            setError('Title and password are required');
            return;
        }

        // Convert tag IDs back to tag names
        const tags = formData.tagIds
            .map(id => availableTags.find(t => t.id === id)?.name)
            .filter((name): name is string => name !== undefined);

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

    return (
        <CustomDialog open={open} onOpenChange={onOpenChange} title={password ? 'Edit Password' : 'Add New Password'} maxWidth="lg">
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

                <div>
                    <label className="block text-neutral-300 mb-2 text-sm">Tags</label>
                    <TagPicker
                        availableTags={availableTags}
                        selectedTagIds={formData.tagIds}
                        onTagsChange={(tagIds) => setFormData(prev => ({ ...prev, tagIds }))}
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        onClick={handleSave}
                        className="flex-1 px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium"
                    >
                        {password ? 'Update' : 'Add Password'}
                    </Button>
                </div>
            </div>
        </CustomDialog>
    );
}
