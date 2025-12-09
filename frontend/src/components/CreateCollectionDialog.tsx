import { useState, useEffect } from 'react';
import { savePasswordFile } from '../api/passwordApi';
import { encodePasswoodFile } from '../cryptor';
import { createEmptyCollection } from '../cryptor/utils';
import type { PasswoodCollection } from '../cryptor';
import { Button } from '@/components/animate-ui/components/buttons/button';
import CustomDialog from './CustomDialog';

const DEV = import.meta.env.DEV;
const MIN_PASSWORD_LENGTH = DEV ? 3 : 12;

interface CreateCollectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (collection: PasswoodCollection, password: string, collectionName: string) => void;
}

export default function CreateCollectionDialog({ open, onOpenChange, onCreated }: CreateCollectionDialogProps) {
    const [masterPassword, setMasterPassword] = useState('');
    const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
    const [collectionName, setCollectionName] = useState('new.pass');
    const [loading, setLoading] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorPopupMessage, setErrorPopupMessage] = useState('');

    useEffect(() => {
        if (open) {
            setMasterPassword('');
            setConfirmMasterPassword('');
            setCollectionName('new.pass');
        }
    }, [open]);

    const handleCreate = async () => {
        if (!collectionName || collectionName === 'new.pass' || !collectionName.trim()) {
            setErrorPopupMessage('Please enter a collection name');
            setShowErrorPopup(true);
            setTimeout(() => setShowErrorPopup(false), 2000);
            return;
        }
        if (!masterPassword || masterPassword.length < MIN_PASSWORD_LENGTH) {
            setErrorPopupMessage(`Master password must be at least ${MIN_PASSWORD_LENGTH} characters`);
            setShowErrorPopup(true);
            setTimeout(() => setShowErrorPopup(false), 2000);
            return;
        }
        if (masterPassword !== confirmMasterPassword) {
            setErrorPopupMessage('Passwords do not match');
            setShowErrorPopup(true);
            setTimeout(() => setShowErrorPopup(false), 2000);
            return;
        }

        try {
            setLoading(true);
            const newCol = createEmptyCollection();

            // Encrypt and save the new empty collection
            const encryptedData = await encodePasswoodFile(newCol, masterPassword);
            await savePasswordFile(collectionName, encryptedData);

            onCreated(newCol, masterPassword, collectionName);
        } catch (err) {
            setErrorPopupMessage('Failed to create password file');
            setShowErrorPopup(true);
            setTimeout(() => setShowErrorPopup(false), 2000);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <CustomDialog open={open} onOpenChange={onOpenChange} title="Create New Collection" maxWidth="sm">
                <div className="space-y-3">
                    <div>
                        <label className="block text-neutral-300 mb-2 text-sm flex justify-between items-center">
                            <span>Collection Name</span>
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

                    <div>
                        <label className="block text-neutral-300 mb-2 text-sm flex justify-between items-center">
                            <span>Master Password</span>
                        </label>
                        <input
                            type="password"
                            value={masterPassword}
                            onChange={(e) => setMasterPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                            placeholder="Enter master password"
                        />
                    </div>

                    <div>
                        <label className="block text-neutral-300 mb-2 text-sm">Confirm Master Password</label>
                        <input
                            type="password"
                            value={confirmMasterPassword}
                            onChange={(e) => setConfirmMasterPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                            placeholder="Confirm master password"
                        />
                        <p className="text-xs text-neutral-400 mt-1">
                            Minimum {MIN_PASSWORD_LENGTH} characters {DEV ? '(DEV mode)' : 'recommended'}
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleCreate}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Collection'}
                        </Button>
                    </div>
                </div>
            </CustomDialog>

            {/* Error Popup */}
            {showErrorPopup && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-[9999] animate-in fade-in slide-in-from-top-4 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-4 duration-300">
                    {errorPopupMessage}
                </div>
            )}
        </>
    );
}
