import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/animate-ui/components/buttons/button';

interface EditorHeaderProps {
    filename: string;
    passwordCount: number;
    hasUnsavedChanges: boolean;
    saving: boolean;
    onBack: () => void;
    onSave: () => void;
    onDeleteCollection: () => void;
}

export default function EditorHeader({
    filename,
    passwordCount,
    hasUnsavedChanges,
    saving,
    onBack,
    onSave,
    onDeleteCollection
}: EditorHeaderProps) {
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <Button
                    onClick={onBack}
                    variant="ghost"
                    className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to collections
                </Button>

                <div className="flex items-center gap-3">
                    {hasUnsavedChanges && (
                        <Button
                            onClick={onSave}
                            disabled={saving}
                            className="px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    )}

                    <div className="relative">
                        <Button
                            onClick={() => setShowDropdown(!showDropdown)}
                            variant="secondary"
                            className="px-3 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-50 rounded-lg font-medium"
                        >
                            ⋯
                        </Button>

                        <AnimatePresence>
                            {showDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowDropdown(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-20"
                                    >
                                        <Button
                                            onClick={() => {
                                                setShowDropdown(false);
                                                onDeleteCollection();
                                            }}
                                            variant="ghost"
                                            className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-900/30 rounded-lg flex items-center gap-2 h-auto"
                                        >
                                            <span>Delete Collection</span>
                                        </Button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div>
                <h1 className="text-5xl font-bold text-neutral-50">{filename}</h1>
                <p className="text-neutral-400 mt-1">
                    {passwordCount} {passwordCount === 1 ? 'password' : 'passwords'}
                </p>
            </div>
        </div>
    );
}
