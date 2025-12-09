import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/animate-ui/components/buttons/button';
import type { Tag } from '../cryptor';

interface TagsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tags: Tag[];
    onSave: (tags: Tag[], renamedTags: { oldName: string; newName: string }[], deletedTagNames: string[]) => void;
}

const TAG_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
];

export default function TagsDialog({ open, onOpenChange, tags, onSave }: TagsDialogProps) {
    const [editedTags, setEditedTags] = useState<Tag[]>(tags);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
    const [originalTags] = useState<Tag[]>(tags);
    const [renamedTags, setRenamedTags] = useState<{ oldName: string; newName: string }[]>([]);
    const [deletedTagNames, setDeletedTagNames] = useState<string[]>([]);
    const [showErrorPopup, setShowErrorPopup] = useState(false);

    const handleAddTag = () => {
        const newTag: Tag = {
            id: crypto.randomUUID(),
            name: 'New Tag',
            color: TAG_COLORS[0],
        };
        setEditedTags([...editedTags, newTag]);
        setEditingId(newTag.id);
    };

    const handleDeleteTag = (id: string, name: string) => {
        setDeleteConfirm({ id, name });
    };

    const confirmDeleteTag = () => {
        if (deleteConfirm) {
            setDeletedTagNames([...deletedTagNames, deleteConfirm.name]);
            setEditedTags(editedTags.filter(tag => tag.id !== deleteConfirm.id));
            setDeleteConfirm(null);
        }
    };

    const handleStartEdit = (tag: Tag) => {
        setEditingId(tag.id);
    };

    const handleNameChange = (id: string, newName: string) => {
        setEditedTags(editedTags.map(tag =>
            tag.id === id ? { ...tag, name: newName } : tag
        ));
    };

    const handleFinishEdit = (id: string) => {
        const editedTag = editedTags.find(t => t.id === id);
        const originalTag = originalTags.find(t => t.id === id);

        if (!editedTag || !editedTag.name.trim()) {
            // If empty name, revert to original or delete if new
            if (originalTag) {
                setEditedTags(editedTags.map(tag =>
                    tag.id === id ? { ...tag, name: originalTag.name } : tag
                ));

                // Show error popup
                setShowErrorPopup(true);
                setTimeout(() => setShowErrorPopup(false), 2000);
            } else {
                setEditedTags(editedTags.filter(tag => tag.id !== id));
            }
            setEditingId(null);
            return;
        }

        const trimmedName = editedTag.name.trim();

        // Check for duplicate name (compare with other tags' original state or their current name if unchanged)
        const isDuplicate = editedTags.some(t => {
            if (t.id === id) return false;
            return t.name.trim().toLowerCase() === trimmedName.toLowerCase();
        });

        if (isDuplicate) {
            // Revert to original name
            if (originalTag) {
                setEditedTags(editedTags.map(tag =>
                    tag.id === id ? { ...tag, name: originalTag.name } : tag
                ));
            } else {
                setEditedTags(editedTags.filter(tag => tag.id !== id));
            }
            setEditingId(null);

            // Show error popup
            setShowErrorPopup(true);
            setTimeout(() => setShowErrorPopup(false), 2000);
            return;
        }

        // Apply the trimmed name
        setEditedTags(editedTags.map(tag =>
            tag.id === id ? { ...tag, name: trimmedName } : tag
        ));

        if (originalTag && trimmedName !== originalTag.name) {
            setRenamedTags([...renamedTags, { oldName: originalTag.name, newName: trimmedName }]);
        }

        setEditingId(null);
    }; const handleColorChange = (id: string, color: string) => {
        setEditedTags(editedTags.map(tag =>
            tag.id === id ? { ...tag, color } : tag
        ));
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragEnd = () => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            const newTags = [...editedTags];
            const [draggedTag] = newTags.splice(draggedIndex, 1);
            newTags.splice(dragOverIndex, 0, draggedTag);
            setEditedTags(newTags);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleSave = () => {
        onSave(editedTags, renamedTags, deletedTagNames);
        onOpenChange(false);
    };

    const handleCancel = () => {
        setEditedTags(tags);
        setEditingId(null);
        onOpenChange(false);
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-neutral-900 border border-neutral-700 rounded-2xl p-8 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                    <Dialog.Title className="text-2xl font-semibold mb-6 text-neutral-50">
                        Manage Tags
                    </Dialog.Title>

                    <div className="space-y-3 mb-6 max-h-96 overflow-y-auto pr-2">
                        {editedTags.map((tag, index) => (
                            <div
                                key={tag.id}
                                draggable={editingId !== tag.id}
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center gap-3 bg-neutral-800 rounded-lg p-3 border border-neutral-700 transition-all ${draggedIndex === index ? 'opacity-50' : ''
                                    } ${dragOverIndex === index && draggedIndex !== index
                                        ? 'border-neutral-400 scale-[1.02]'
                                        : ''
                                    } ${editingId !== tag.id ? 'cursor-move' : ''}`}
                            >
                                {/* Drag handle */}
                                {editingId !== tag.id && (
                                    <div className="text-neutral-500 flex-shrink-0">
                                        <GripVertical className="w-4 h-4" />
                                    </div>
                                )}

                                {/* Color picker */}
                                <div className="relative">
                                    <div
                                        className="w-8 h-8 rounded-full cursor-pointer border-2 border-neutral-600"
                                        style={{ backgroundColor: tag.color }}
                                        onClick={() => {
                                            const colorPicker = document.getElementById(`color-${tag.id}`);
                                            if (colorPicker) {
                                                (colorPicker as HTMLInputElement).showPicker?.();
                                            }
                                        }}
                                    />
                                    <input
                                        id={`color-${tag.id}`}
                                        type="color"
                                        value={tag.color}
                                        onChange={(e) => handleColorChange(tag.id, e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>

                                {/* Tag name */}
                                {editingId === tag.id ? (
                                    <input
                                        type="text"
                                        value={tag.name}
                                        onChange={(e) => handleNameChange(tag.id, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleFinishEdit(tag.id);
                                            if (e.key === 'Escape') setEditingId(null);
                                        }}
                                        onBlur={() => handleFinishEdit(tag.id)}
                                        className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-600 rounded text-neutral-50 focus:outline-none focus:border-neutral-400"
                                        autoFocus
                                    />
                                ) : (
                                    <div
                                        onClick={() => handleStartEdit(tag)}
                                        className="flex-1 px-3 py-1.5 text-neutral-50 font-medium cursor-pointer hover:bg-neutral-700 rounded"
                                    >
                                        {tag.name}
                                    </div>
                                )}

                                {/* Delete button */}
                                <Button
                                    onClick={() => handleDeleteTag(tag.id, tag.name)}
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-700"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}

                        {editedTags.length === 0 && (
                            <div className="text-center py-12 text-neutral-500">
                                No tags yet. Click "Add Tag" to create one.
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                        <Button
                            onClick={handleAddTag}
                            className="px-4 py-2 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium shadow-lg flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Tag
                        </Button>

                        <Button
                            onClick={handleSave}
                            className="px-6 py-2 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium shadow-lg"
                        >
                            Save
                        </Button>
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

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
                <Dialog.Root open={true} onOpenChange={() => setDeleteConfirm(null)}>
                    <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                        <Dialog.Content className="fixed left-[50%] top-[50%] z-[60] w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-neutral-900 border border-neutral-700 rounded-2xl p-8 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                            <Dialog.Title className="text-xl font-semibold mb-4 text-neutral-50">
                                Delete Tag
                            </Dialog.Title>
                            <p className="text-neutral-300 mb-6">
                                Are you sure you want to delete the tag <span className="font-semibold text-neutral-50">"{deleteConfirm.name}"</span>?
                                All password entries using this tag will have it removed.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    onClick={() => setDeleteConfirm(null)}
                                    variant="secondary"
                                    className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-50 rounded-lg font-medium"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmDeleteTag}
                                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium shadow-lg"
                                >
                                    Delete
                                </Button>
                            </div>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            )}

            {/* Error Popup */}
            {showErrorPopup && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-[9999] animate-in fade-in slide-in-from-top-4 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-4 duration-300">
                    Invalid tag name!
                </div>
            )}
        </Dialog.Root>
    );
}
