import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { downloadPasswordFile, savePasswordFile } from '../api/passwordApi';
import { decodePasswoodFile, encodePasswoodFile } from '../cryptor';
import { createEmptyCollection } from '../cryptor/utils';
import type { PasswoodCollection } from '../cryptor';
import { Button } from '@/components/animate-ui/components/buttons/button';

const DEV = import.meta.env.DEV;
const MIN_PASSWORD_LENGTH = DEV ? 3 : 12;

interface UnlockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    collectionName: string;
    isNewFile: boolean;
    onUnlocked: (collection: PasswoodCollection, password: string, collectionName: string) => void;
}

export default function UnlockDialog({ open, onOpenChange, collectionName: initialCollectionName, isNewFile, onUnlocked }: UnlockDialogProps) {
    const [masterPassword, setMasterPassword] = useState('');
    const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
    const [collectionName, setCollectionName] = useState(initialCollectionName);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setMasterPassword('');
            setConfirmMasterPassword('');
            setCollectionName(initialCollectionName);
            setError(null);
        }
    }, [open, initialCollectionName]);

    const handleUnlock = async () => {
        if (isNewFile) {
            // Creating new file
            if (!collectionName || collectionName === 'new.pass' || !collectionName.trim()) {
                setError('Please enter a collection name');
                return;
            }
            if (!masterPassword || masterPassword.length < MIN_PASSWORD_LENGTH) {
                setError(`Master password must be at least ${MIN_PASSWORD_LENGTH} characters`);
                return;
            }
            if (masterPassword !== confirmMasterPassword) {
                setError('Passwords do not match');
                return;
            }

            try {
                setLoading(true);
                const newCol = createEmptyCollection();

                // Encrypt and save the new empty collection
                const encryptedData = await encodePasswoodFile(newCol, masterPassword);
                await savePasswordFile(collectionName, encryptedData);

                onUnlocked(newCol, masterPassword, collectionName);
                onOpenChange(false);
            } catch (err) {
                setError('Failed to create password file');
                console.error(err);
            } finally {
                setLoading(false);
            }
        } else {
            // Unlocking existing file
            try {
                setLoading(true);
                setError(null);
                const fileData = await downloadPasswordFile(collectionName);
                const db = await decodePasswoodFile(fileData, masterPassword);
                onUnlocked(db, masterPassword, collectionName);
                onOpenChange(false);
            } catch (err) {
                setError('Failed to decrypt: incorrect password or corrupted file');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900 rounded-2xl p-8 shadow-2xl border border-neutral-800 max-w-md w-full max-h-[90vh] overflow-y-auto z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                    <Dialog.Title className="text-2xl font-semibold text-neutral-50 mb-6">
                        {isNewFile ? 'Create New Collection' : 'Unlock Collection'}
                    </Dialog.Title>
                    {!isNewFile && <Dialog.Description className="text-neutral-400 mb-6 text-sm">{collectionName}</Dialog.Description>}

                    {error && (
                        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        {isNewFile && (
                            <div>
                                <label className="block text-neutral-300 mb-2 text-sm flex justify-between items-center">
                                    <span>Collection Name</span>
                                    <span className="text-neutral-600 text-xs">Required</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={collectionName === 'new.pass' ? '' : collectionName.replace('.pass', '')}
                                        onChange={(e) => {
                                            const sanitized = e.target.value.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
                                            setCollectionName(sanitized ? `${sanitized}.pass` : 'new.pass');
                                        }}
                                        className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                                        placeholder="my-passwords"
                                        autoFocus
                                    />
                                    <span className="text-neutral-400 text-sm">.pass</span>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-neutral-300 mb-2 text-sm flex justify-between items-center">
                                <span>Master Password</span>
                                <span className="text-neutral-600 text-xs">Required</span>
                            </label>
                            <input
                                type="password"
                                value={masterPassword}
                                onChange={(e) => setMasterPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                                placeholder="Enter master password"
                                autoFocus={!isNewFile}
                            />
                        </div>

                        {isNewFile && (
                            <div>
                                <label className="block text-neutral-300 mb-2 text-sm">Confirm Master Password</label>
                                <input
                                    type="password"
                                    value={confirmMasterPassword}
                                    onChange={(e) => setConfirmMasterPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                                    placeholder="Confirm master password"
                                />
                                <p className="text-xs text-neutral-400 mt-1">
                                    Minimum {MIN_PASSWORD_LENGTH} characters {DEV ? '(DEV mode)' : 'recommended'}
                                </p>
                            </div>
                        )}

                        <div className="pt-4">
                            <Button
                                onClick={handleUnlock}
                                disabled={loading}
                                className="w-full px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Loading...' : isNewFile ? 'Create & Unlock' : 'Unlock'}
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
