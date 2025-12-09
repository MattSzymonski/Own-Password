import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { downloadPasswordFile, savePasswordFile } from '../api/passwordApi';
import { decodePasswoodFile, encodePasswoodFile } from '../cryptor';
import { createEmptyCollection } from '../cryptor/utils';
import type { PasswoodCollection } from '../cryptor';
import { Button } from '@/components/animate-ui/components/buttons/button';
import CustomDialog from './CustomDialog';

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
            } catch (err) {
                setError('Failed to decrypt: incorrect password or corrupted file');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <CustomDialog open={open} onOpenChange={onOpenChange} title={isNewFile ? 'Create New Collection' : 'Unlock Collection'} maxWidth="sm">
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
        </CustomDialog>
    );
}
