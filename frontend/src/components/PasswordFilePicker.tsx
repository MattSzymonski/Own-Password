import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchPasswordFiles } from '../api/passwordApi';
import type { PasswordFileInfo } from '../api/passwordApi';
import { Button } from '@/components/animate-ui/components/buttons/button';

interface PasswordFilePickerProps {
    onFileSelect: (filename: string) => void;
    onCreateNew: () => void;
}

export default function PasswordFilePicker({ onFileSelect, onCreateNew }: PasswordFilePickerProps) {
    const [files, setFiles] = useState<PasswordFileInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Set document title based on environment variable
        document.title = import.meta.env.VITE_APP_NAME || 'Own Password';
    }, []);

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchPasswordFiles();
            setFiles(response.files);
        } catch (err) {
            setError('Failed to load password files');
            console.error(err);
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-neutral-700 border-t-neutral-50 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950">
                <div className="text-center">
                    <div className="text-red-400 text-xl mb-4">{error}</div>
                    <Button
                        onClick={loadFiles}
                        className="px-6 py-2 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-12">
                    {import.meta.env.VITE_APP_NAME ? (
                        <h1 className="text-5xl font-black text-neutral-50 mb-4 uppercase tracking-wide" style={{ fontFamily: 'Outfit' }}>
                            {import.meta.env.VITE_APP_NAME}
                        </h1>
                    ) : (
                        <img
                            src="/images/own_password_logo.svg"
                            alt="Own Password"
                            className="w-full max-w-[300px] mx-auto"
                        />
                    )}
                </div>

                <div className="bg-neutral-900 rounded-2xl p-8 shadow-2xl border border-neutral-800">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-neutral-50">
                            Password Collections
                        </h2>
                        <Button
                            onClick={onCreateNew}
                            className="px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium shadow-lg flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            New Collection
                        </Button>
                    </div>

                    {files.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-neutral-400 text-lg mb-4">
                                No password collections found
                            </div>
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
                                                <h3 className="text-lg font-medium text-neutral-50 group-hover:text-neutral-200 transition-colors">
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
        </div>
    );
}

