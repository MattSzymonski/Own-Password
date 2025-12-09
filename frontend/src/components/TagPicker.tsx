import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/animate-ui/components/buttons/button';
import type { Tag } from '../cryptor';

interface TagPickerProps {
    availableTags: Tag[];
    selectedTagIds: string[];
    onTagsChange: (tagIds: string[]) => void;
}

export default function TagPicker({ availableTags, selectedTagIds, onTagsChange }: TagPickerProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [alignRight, setAlignRight] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

    const selectedTags = availableTags.filter(tag => selectedTagIds.includes(tag.id));
    const unselectedTags = availableTags.filter(tag => !selectedTagIds.includes(tag.id));

    useEffect(() => {
        if (showPicker && buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const dropdownWidth = 256; // w-64 = 16rem = 256px

            // Find the dialog container (closest element with max-w- class or fixed positioning)
            let dialogElement = buttonRef.current.closest('[class*="max-w-"]');

            if (dialogElement) {
                const dialogRect = dialogElement.getBoundingClientRect();
                // Check if dropdown would overflow the dialog on the right
                const dropdownRight = buttonRect.left + dropdownWidth;
                const dialogRight = dialogRect.right - 32; // Account for dialog padding (p-8 = 32px)

                setAlignRight(dropdownRight > dialogRight);
            } else {
                // Fallback to viewport check
                const viewportWidth = window.innerWidth;
                const wouldOverflow = buttonRect.left + dropdownWidth > viewportWidth - 32;
                setAlignRight(wouldOverflow);
            }
        }
    }, [showPicker]);

    const handleAddTag = (tagId: string) => {
        onTagsChange([...selectedTagIds, tagId]);
    };

    const handleRemoveTag = (tagId: string) => {
        onTagsChange(selectedTagIds.filter(id => id !== tagId));
    };

    return (
        <div className="space-y-2">
            {/* Selected tags display */}
            <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                    <div
                        key={tag.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: tag.color }}
                    >
                        <span>{tag.name}</span>
                        <button
                            onClick={() => handleRemoveTag(tag.id)}
                            className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}

                {/* Add tag button */}
                <div className="relative" ref={buttonRef}>
                    <Button
                        onClick={() => setShowPicker(!showPicker)}
                        variant="ghost"
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-full text-sm flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tag</span>
                    </Button>

                    <AnimatePresence>
                        {showPicker && unselectedTags.length > 0 && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowPicker(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    className={`absolute ${alignRight ? 'right-0' : 'left-0'} bottom-full mb-2 w-64 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-20 overflow-hidden`}
                                    style={{ maxHeight: '176px' }}
                                >
                                    <div className="p-2 space-y-1 overflow-y-auto" style={{ maxHeight: '176px' }}>
                                        {unselectedTags.map(tag => (
                                            <button
                                                key={tag.id}
                                                onClick={() => {
                                                    handleAddTag(tag.id);
                                                    setShowPicker(false);
                                                }}
                                                className="w-full px-3 py-2 text-left rounded hover:bg-neutral-800 flex items-center gap-2"
                                            >
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: tag.color }}
                                                />
                                                <span className="text-neutral-50 text-sm">{tag.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {availableTags.length === 0 && (
                <p className="text-sm text-neutral-500">
                    No tags available. Create tags in collection settings.
                </p>
            )}
        </div>
    );
}
