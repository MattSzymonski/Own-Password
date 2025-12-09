import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/animate-ui/components/buttons/button';
import CustomDialog from './CustomDialog';
import { hashPassword } from '../utils/auth';

interface AppUnlockDialogProps {
    open: boolean;
    onUnlocked: (passwordHash: string) => void;
}

export default function AppUnlockDialog({ open, onUnlocked }: AppUnlockDialogProps) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorPopupMessage, setErrorPopupMessage] = useState('');
    const [unlockSuccess, setUnlockSuccess] = useState(false);

    useEffect(() => {
        if (open) {
            setPassword('');
            setUnlockSuccess(false);
        }
    }, [open]);

    const handleUnlock = async () => {
        if (!password.trim()) {
            setErrorPopupMessage('Please enter a password');
            setShowErrorPopup(true);
            setTimeout(() => setShowErrorPopup(false), 2000);
            return;
        }

        try {
            setLoading(true);

            // Hash the password
            const passwordHash = await hashPassword(password);

            // Verify with backend by making a test request
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3010/api'}/password_files`, {
                headers: {
                    'x-app-password': passwordHash,
                },
            });

            if (!response.ok) {
                throw new Error('Incorrect password');
            }

            setUnlockSuccess(true);
            setTimeout(() => {
                onUnlocked(passwordHash);
            }, 400);
        } catch (err) {
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
                onOpenChange={() => { }}
                title="Unlock App"
                maxWidth="sm"
                animateSuccess={unlockSuccess}
                showCloseButton={false}
            >
                <Dialog.Description className="text-neutral-300 mb-6">
                    Enter the app password to continue
                </Dialog.Description>

                <div className="space-y-3">
                    <div>
                        <label className="block text-neutral-300 mb-2 text-sm">
                            App Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                            placeholder="Enter app password"
                            autoFocus
                        />
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleUnlock}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Unlocking...' : 'Unlock'}
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
