import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { downloadPasswordFile } from '../api/passwordApi';
import { decodePasswoodFile } from '../cryptor';
import type { PasswoodCollection } from '../cryptor';
import { Button } from '@/components/animate-ui/components/buttons/button';
import CustomDialog from './CustomDialog';

interface UnlockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    collectionName: string;
    onUnlocked: (collection: PasswoodCollection, password: string, collectionName: string) => void;
}

export default function UnlockDialog({ open, onOpenChange, collectionName, onUnlocked }: UnlockDialogProps) {
    const singleCollection = import.meta.env.VITE_SINGLE_COLLECTION || import.meta.env.SINGLE_COLLECTION;
    const isSingleCollection = singleCollection && singleCollection.trim() !== '';

    const [masterPassword, setMasterPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorPopupMessage, setErrorPopupMessage] = useState('');
    const [unlockSuccess, setUnlockSuccess] = useState(false);
    const [unlockError, setUnlockError] = useState(false);

    useEffect(() => {
        if (open) {
            setMasterPassword('');
            setUnlockSuccess(false);
            setUnlockError(false);
        }
    }, [open]);

    const handleUnlock = async () => {
        try {
            setLoading(true);
            const fileData = await downloadPasswordFile(collectionName);
            const db = await decodePasswoodFile(fileData, masterPassword);
            setUnlockSuccess(true);
            setTimeout(() => {
                onUnlocked(db, masterPassword, collectionName);
            }, 400);
        } catch (err) {
            setUnlockError(true);
            setTimeout(() => setUnlockError(false), 500);
            setErrorPopupMessage('Incorrect password');
            setShowErrorPopup(true);
            setTimeout(() => setShowErrorPopup(false), 2000);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <CustomDialog
                open={open}
                onOpenChange={onOpenChange}
                title="Unlock Collection"
                maxWidth="sm"
                animateSuccess={unlockSuccess}
                animateError={unlockError}
                showCloseButton={!isSingleCollection}
            >
                <Dialog.Description className="text-lg font-bold text-neutral-50 mb-6" style={{ fontFamily: 'Outfit' }}>
                    {collectionName.replace('.pass', '')}
                    <span className="text-neutral-500">.pass</span>
                </Dialog.Description>

                <div className="space-y-3">
                    <div>
                        <label className="block text-neutral-300 mb-2 text-sm flex justify-between items-center">
                            <span>Master Password</span>
                        </label>
                        <input
                            type="password"
                            value={masterPassword}
                            onChange={(e) => setMasterPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                            placeholder="Enter master password"
                            autoFocus
                        />
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleUnlock}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Unlock
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
