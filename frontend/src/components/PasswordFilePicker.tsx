import { useEffect, useState } from 'react';
import { Plus, Cloud, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchPasswordFiles } from '../api/passwordApi';
import type { PasswordFileInfo } from '../api/passwordApi';
import { Button } from '@/components/animate-ui/components/buttons/button';
import { pickLocalFile, saveFileHandle, addLocalFile, getLocalFilesList, isFileSystemAccessSupported, validateAllLocalFiles, removeLocalFile, removeFileHandle } from '../utils/localFiles';
import { useOnlineStatus } from '../hooks/use-online-status';

interface PasswordFilePickerProps {
    onFileSelect: (filename: string) => void;
    onCreateNew: () => void;
    onLockApp?: () => void;
}

export default function PasswordFilePicker({ onFileSelect, onCreateNew, onLockApp }: PasswordFilePickerProps) {
    const [files, setFiles] = useState<PasswordFileInfo[]>([]);
    const [localFiles, setLocalFiles] = useState<Array<string | { filename: string; modified?: string }>>([]);
    const [localFileStatus, setLocalFileStatus] = useState<Map<string, boolean>>(new Map());
    const [loading, setLoading] = useState(true);
    const [showSpinner, setShowSpinner] = useState(false);
    const [showLoadButton, setShowLoadButton] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAlreadyAddedPopup, setShowAlreadyAddedPopup] = useState(false);
    const [showOfflinePopup, setShowOfflinePopup] = useState(false);
    const [addedFilename, setAddedFilename] = useState<string>('');
    const isOnline = useOnlineStatus();

    useEffect(() => {
        // Set document title
        document.title = 'Own Password';
    }, []);

    useEffect(() => {
        loadFiles();
        loadLocalFiles();
    }, []);

    const loadLocalFiles = async () => {
        const files = getLocalFilesList();
        setLocalFiles(files);

        // Validate all local files
        if (files.length > 0) {
            const statusMap = await validateAllLocalFiles();
            setLocalFileStatus(statusMap);

            // Automatically remove unavailable files
            let hasRemovedFiles = false;
            for (const [filename, isAccessible] of statusMap.entries()) {
                if (!isAccessible) {
                    removeLocalFile(filename);
                    await removeFileHandle(filename);
                    hasRemovedFiles = true;
                }
            }

            // Reload the list if any files were removed
            if (hasRemovedFiles) {
                setLocalFiles(getLocalFilesList());
            }
        }
    };

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

    const handlePickLocalFile = async () => {
        try {
            const result = await pickLocalFile();
            if (result) {
                await saveFileHandle(result.filename, result.handle);
                const wasAdded = addLocalFile(result.filename, result.modified);

                if (!wasAdded) {
                    setAddedFilename(result.filename);
                    setShowAlreadyAddedPopup(true);
                    setTimeout(() => setShowAlreadyAddedPopup(false), 2000);
                } else {
                    await loadLocalFiles();
                }
            }
        } catch (err) {
            setError('Failed to pick local collection file: ' + (err as Error).message);
        }
    };

    const checkOnlineStatus = async (): Promise<boolean> => {
        // First check cached status
        if (!isOnline) {
            return false;
        }

        // Perform an immediate server check to be absolutely sure
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3010/api';
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'HEAD',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    };

    const handleCloudFileClick = async (filename: string) => {
        const online = await checkOnlineStatus();
        if (!online) {
            setShowOfflinePopup(true);
            setTimeout(() => setShowOfflinePopup(false), 2000);
            return;
        }
        onFileSelect(filename);
    };

    const handleCreateNewClick = async () => {
        const online = await checkOnlineStatus();
        if (!online) {
            setShowOfflinePopup(true);
            setTimeout(() => setShowOfflinePopup(false), 2000);
            return;
        }
        onCreateNew();
    };

    const hideLogo = import.meta.env.VITE_HIDE_APP_LOGO === 'true' || import.meta.env.HIDE_APP_LOGO === 'true';

    return (
        <div className="min-h-screen bg-neutral-950 p-5 md:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-neutral-900 rounded-2xl p-5 md:p-8 shadow-2xl border border-neutral-800">
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
                        <div className="flex gap-2">
                            {isFileSystemAccessSupported() && (
                                <Button
                                    onClick={handlePickLocalFile}
                                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-50 rounded-lg font-medium flex items-center gap-2"
                                >
                                    <HardDrive size={20} />
                                    <span className="hidden md:inline">Pick Local File</span>
                                </Button>
                            )}
                            <Button
                                onClick={handleCreateNewClick}
                                className="px-4 py-2 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium flex items-center gap-2"
                            >
                                <Plus size={20} />
                                <span className="hidden md:inline">New Collection</span>
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        {error ? (
                            <div className="text-center py-12">
                                <div className="text-neutral-400 text-xl mb-4">{error}</div>
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
                        ) : files.length === 0 && localFiles.length === 0 && !loading ? (
                            <div className="text-center py-12">
                                {/* Empty state - no message shown */}
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                <div className="space-y-3">
                                    {/* Local files - appear first */}
                                    {localFiles.map((file, index) => {
                                        // Handle both old format (string) and new format (object)
                                        const filename = typeof file === 'string' ? file : file.filename;
                                        const modified = typeof file === 'string' ? undefined : file.modified;
                                        const isAccessible = localFileStatus.get(filename) ?? true;

                                        return (
                                            <motion.div
                                                key={`local-${filename}`}
                                                layout
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 500,
                                                    damping: 30,
                                                    delay: index * 0.05
                                                }}
                                                onClick={() => isAccessible && onFileSelect(filename)}
                                                className={`group border rounded-xl p-5 ${isAccessible
                                                    ? 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700 cursor-pointer hover:shadow-xl'
                                                    : 'bg-neutral-900/50 border-red-900/50 cursor-not-allowed opacity-60'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <HardDrive
                                                                className={`w-5 h-5 flex-shrink-0 ${isAccessible ? 'text-green-400' : 'text-red-400'
                                                                    }`}
                                                            />
                                                            <h3 className={`text-2xl font-medium transition-colors ${isAccessible
                                                                ? 'text-neutral-50 group-hover:text-neutral-200'
                                                                : 'text-neutral-400'
                                                                }`}>
                                                                {filename.replace('.pass', '')}
                                                                <span className="text-neutral-500">.pass</span>
                                                                {!isAccessible && (
                                                                    <span className="text-red-400 text-sm ml-2">(Unavailable)</span>
                                                                )}
                                                            </h3>
                                                        </div>
                                                        <div className="flex flex-col gap-1 text-sm text-neutral-400">
                                                            {modified && <span>Modified: {formatDate(modified)}</span>}
                                                            {!isAccessible && (
                                                                <span className="text-red-400 text-xs">
                                                                    File no longer accessible. Pick it again to restore access.
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isAccessible && (
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
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {/* Server files - appear after local files */}
                                    {files.map((file, index) => (
                                        <motion.div
                                            key={file.filename}
                                            layout
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 500,
                                                damping: 30,
                                                delay: (localFiles.length * 0.05) + (index * 0.08)
                                            }}
                                            onClick={() => handleCloudFileClick(file.filename)}
                                            className="group bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 cursor-pointer hover:shadow-xl"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Cloud className="w-5 h-5 text-blue-400 flex-shrink-0" />
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
                            </AnimatePresence>
                        )}
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

            {/* Already Added Popup */}
            {showAlreadyAddedPopup && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-neutral-50 text-neutral-950 px-6 py-4 rounded-lg shadow-2xl z-[9999] animate-in fade-in slide-in-from-top-4 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-4 duration-300">
                    "{addedFilename}" is already in your list
                </div>
            )}

            {/* Offline Popup */}
            {showOfflinePopup && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-neutral-50 text-neutral-950 px-6 py-4 rounded-lg shadow-2xl z-[9999] animate-in fade-in slide-in-from-top-4 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-4 duration-300">
                    You are offline
                </div>
            )}
        </div>
    );
}

