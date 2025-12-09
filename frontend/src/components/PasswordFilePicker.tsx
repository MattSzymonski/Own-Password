import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchPasswordFiles } from '../api/passwordApi';
import type { PasswordFileInfo } from '../api/passwordApi';
import { Button } from '@/components/animate-ui/components/buttons/button';

interface PasswordFilePickerProps {
    onFileSelect: (filename: string) => void;
    onCreateNew: () => void;
    onLockApp?: () => void;
}

export default function PasswordFilePicker({ onFileSelect, onCreateNew, onLockApp }: PasswordFilePickerProps) {
    const [files, setFiles] = useState<PasswordFileInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSpinner, setShowSpinner] = useState(false);
    const [showLoadButton, setShowLoadButton] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Set document title based on environment variable
        document.title = import.meta.env.VITE_APP_NAME || import.meta.env.APP_NAME || 'Own Password';
    }, []);

    useEffect(() => {
        loadFiles();
    }, []);

    useEffect(() => {
        // Show spinner only after 3 seconds of loading
        if (loading) {
            const spinnerTimer = setTimeout(() => {
                setShowSpinner(true);
            }, 3000);

            // Show load button after 5 seconds of spinner being visible
            const buttonTimer = setTimeout(() => {
                setShowLoadButton(true);
            }, 8000); // 3s for spinner + 5s more = 8s total

            return () => {
                clearTimeout(spinnerTimer);
                clearTimeout(buttonTimer);
            };
        } else {
            setShowSpinner(false);
            setShowLoadButton(false);
        }
    }, [loading]);

    const loadFiles = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchPasswordFiles();
            setFiles(response.files);
        } catch (err) {
            setError('Failed to load password files. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    };

    const hideLogo = import.meta.env.VITE_HIDE_APP_LOGO === 'true' || import.meta.env.HIDE_APP_LOGO === 'true';

    return (
        <div className="min-h-screen bg-neutral-950 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-neutral-900 rounded-2xl p-8 shadow-2xl border border-neutral-800">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            {onLockApp && (
                                <Button
                                    onClick={onLockApp}
                                    variant="ghost"
                                    size="icon"
                                    className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 p-2 translate-y-[2px]"
                                >
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="15 18 9 12 15 6"></polyline>
                                    </svg>
                                </Button>
                            )}
                            <h2 className="text-2xl font-semibold text-neutral-50">
                                Password Collections
                            </h2>
                        </div>
                        <Button
                            onClick={onCreateNew}
                            className="px-4 py-2 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium flex items-center gap-2"
                        >
                            <Plus size={20} />
                            <span className="hidden md:inline">New Collection</span>
                        </Button>
                    </div>

                    <div className="relative">
                        {error ? (
                            <div className="text-center py-12">
                                <div className="text-red-400 text-xl mb-4">{error}</div>
                                <Button
                                    onClick={loadFiles}
                                    className="px-6 py-2 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg">
                                    Retry
                                </Button>
                            </div>
                        ) : showSpinner && loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-6">
                                <div className="w-12 h-12 border-4 border-neutral-700 border-t-neutral-50 rounded-full animate-spin"></div>
                                {showLoadButton && (
                                    <Button
                                        onClick={loadFiles}
                                        className="px-6 py-2 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg">
                                        Load
                                    </Button>
                                )}
                            </div>
                        ) : files.length === 0 && !loading ? (
                            <div className="text-center py-12">
                                {/* Empty state - no message shown */}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {files.map((file, index) => (
                                    <motion.div
                                        key={file.filename}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2, delay: 0.3 + index * 0.1 }}
                                        onClick={() => onFileSelect(file.filename)}
                                        className="group bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 cursor-pointer transition-all transform hover:scale-[1.02] hover:shadow-xl"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-2xl font-medium text-neutral-50 group-hover:text-neutral-200 transition-colors">
                                                        {file.filename.replace('.pass', '')}
                                                        <span className="text-neutral-500">.pass</span>
                                                    </h3>
                                                </div>
                                                <div className="flex gap-6 text-sm text-neutral-400">
                                                    <span>Modified: {formatDate(file.modified)}</span>
                                                </div>
                                            </div>
                                            <div className="text-neutral-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-6 w-6"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5l7 7-7 7"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Logo at bottom of page */}
                {!hideLogo && (
                    <div className="fixed bottom-8 left-0 right-0 flex justify-center z-[100]">
                        <img
                            src="/images/own_password_logo.svg"
                            alt="Logo"
                            className="w-20 opacity-30"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

