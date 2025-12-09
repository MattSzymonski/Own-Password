import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { downloadPasswordFile, savePasswordFile } from '../api/passwordApi';
import { decodePasswoodFile, encodePasswoodFile } from '../cryptor';
import { createEmptyCollection } from '../cryptor/utils';
import type { PasswoodCollection } from '../cryptor';

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
                <Dialog.Overlay className="fixed inset-0 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-neutral-900 rounded-2xl p-8 shadow-2xl border border-neutral-800 max-w-md w-full max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                    <Dialog.Title className="text-3xl font-bold text-neutral-50 mb-2">
                        {isNewFile ? 'Create New Collection' : 'Unlock Collection'}
                    </Dialog.Title>
                    {!isNewFile && <Dialog.Description className="text-neutral-300 mb-6">{collectionName}</Dialog.Description>}

                    {error && (
                        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {isNewFile && (
                            <div>
                                <label className="block text-neutral-300 mb-2">Collection Name</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={collectionName === 'new.pass' ? '' : collectionName.replace('.pass', '')}
                                        onChange={(e) => {
                                            const sanitized = e.target.value.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
                                            setCollectionName(sanitized ? `${sanitized}.pass` : 'new.pass');
                                        }}
                                        className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-neutral-50"
                                        placeholder="my-passwords"
                                        autoFocus
                                    />
                                    <span className="text-neutral-400">.pass</span>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-neutral-300 mb-2">Master Password</label>
                            <input
                                type="password"
                                value={masterPassword}
                                onChange={(e) => setMasterPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-neutral-50"
                                placeholder="Enter master password"
                                autoFocus={!isNewFile}
                            />
                        </div>

                        {isNewFile && (
                            <div>
                                <label className="block text-neutral-300 mb-2">Confirm Master Password</label>
                                <input
                                    type="password"
                                    value={confirmMasterPassword}
                                    onChange={(e) => setConfirmMasterPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-neutral-50"
                                    placeholder="Confirm master password"
                                />
                                <p className="text-sm text-neutral-400 mt-2">
                                    Minimum {MIN_PASSWORD_LENGTH} characters {DEV ? '(DEV mode)' : 'recommended'}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleUnlock}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Loading...' : isNewFile ? 'Create & Unlock' : 'Unlock'}
                        </button>
                    </div>

                    <Dialog.Close className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-50 transition-colors">
                        <span className="text-2xl">&times;</span>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
