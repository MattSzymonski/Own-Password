import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/animate-ui/components/buttons/button';

interface EditorHeaderProps {
    filename: string;
    passwordCount: number;
    hasUnsavedChanges: boolean;
    saving: boolean;
    isLocalFile: boolean;
    hideDelete?: boolean;
    onBack?: () => void;
    onSave: () => void;
    onDeleteCollection: () => void;
    onManageTags: () => void;
    onDownload?: () => void;
}

export default function EditorHeader({
    filename,
    hasUnsavedChanges,
    saving,
    isLocalFile,
    hideDelete,
    onBack,
    onSave,
    onDeleteCollection,
    onManageTags,
    onDownload
}: EditorHeaderProps) {
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {onBack && (
                        <Button
                            onClick={onBack}
                            variant="ghost"
                            size="icon"
                            className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 p-2 translate-y-[2px]"
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </Button>
                    )}
                    <h1 className="text-5xl font-bold text-neutral-50">
                        {filename.replace('.pass', '')}
                        <span className="text-neutral-500">.pass</span>
                    </h1>
                </div>

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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
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
                                        {!isLocalFile && onDownload && (
                                            <Button
                                                onClick={() => {
                                                    setShowDropdown(false);
                                                    onDownload();
                                                }}
                                                variant="ghost"
                                                tapScale={1}
                                                className="w-full px-4 py-2.5 text-left text-neutral-400 hover:text-neutral-50 hover:bg-transparent rounded-t-lg flex items-center gap-2 h-auto justify-start"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                <span>Download</span>
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => {
                                                setShowDropdown(false);
                                                onManageTags();
                                            }}
                                            variant="ghost"
                                            tapScale={1}
                                            className={`w-full px-4 py-2.5 text-left text-neutral-400 hover:text-neutral-50 hover:bg-transparent flex items-center gap-2 h-auto justify-start ${!isLocalFile && onDownload ? '' : 'rounded-t-lg'}`}
                                        >
                                            <span>Manage Tags</span>
                                        </Button>
                                        {!hideDelete && (
                                            <Button
                                                onClick={() => {
                                                    setShowDropdown(false);
                                                    onDeleteCollection();
                                                }}
                                                variant="ghost"
                                                tapScale={1}
                                                className="w-full px-4 py-2.5 text-left text-red-400 hover:text-red-300 hover:bg-transparent rounded-b-lg flex items-center gap-2 h-auto justify-start"
                                            >
                                                <span>Delete Collection</span>
                                            </Button>
                                        )}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
