import { useEffect, useState } from 'react';
import { fetchPasswordFiles } from '../api/passwordApi';
import type { PasswordFileInfo } from '../api/passwordApi';

interface PasswordFilePickerProps {
    onFileSelect: (filename: string) => void;
    onCreateNew: () => void;
}

export default function PasswordFilePicker({ onFileSelect, onCreateNew }: PasswordFilePickerProps) {
    const [files, setFiles] = useState<PasswordFileInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950">
                <div className="text-neutral-50 text-xl">Loading password files...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950">
                <div className="text-center">
                    <div className="text-red-400 text-xl mb-4">{error}</div>
                    <button
                        onClick={loadFiles}
                        className="px-6 py-2 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg transition-colors">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-neutral-50 mb-4">
                        Passwood
                    </h1>
                    <p className="text-neutral-300 text-lg">
                        Secure password manager with encrypted storage
                    </p>
                </div>

                <div className="bg-neutral-900 rounded-2xl p-8 shadow-2xl border border-neutral-800">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-neutral-50">
                            Your Password Files
                        </h2>
                        <button
                            onClick={onCreateNew}
                            className="px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                        >
                            + Create New
                        </button>
                    </div>

                    {files.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-neutral-300 text-lg mb-4">
                                No password files found
                            </div>
                            <p className="text-neutral-400 mb-6">
                                Create your first password database to get started
                            </p>
                            <button
                                onClick={onCreateNew}
                                className="px-8 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium transition-colors"
                            >
                                Create Your First File
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {files.map((file) => (
                                <div
                                    key={file.filename}
                                    onClick={() => onFileSelect(file.filename)}
                                    className="group bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 rounded-xl p-5 cursor-pointer transition-all transform hover:scale-[1.02] hover:shadow-xl"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-medium text-neutral-50 group-hover:text-neutral-200 transition-colors">
                                                    {file.filename}
                                                </h3>
                                            </div>
                                            <div className="flex gap-6 text-sm text-neutral-400">
                                                <span>Size: {formatFileSize(file.size)}</span>
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center text-neutral-500 text-sm">
                    <p>All password files are encrypted with AES-256-GCM</p>
                </div>
            </div>
        </div>
    );
}

