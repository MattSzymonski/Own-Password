import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import PasswordFilePicker from './PasswordFilePicker';
import PasswordFileEditor from './PasswordFileEditor';
import UnlockDialog from './UnlockDialog';
import CreateCollectionDialog from './CreateCollectionDialog';
import AppUnlockDialog from './AppUnlockDialog';
import type { PasswoodCollection } from '../cryptor';
import { isAppPasswordRequired, setAppPassword, getAppPassword, clearAppPassword } from '../utils/auth';
import { getLocalFilesList } from '../utils/localFiles';

export default function MainPage() {
    const singleCollection = import.meta.env.VITE_SINGLE_COLLECTION || import.meta.env.SINGLE_COLLECTION;
    const hasSingleCollection = singleCollection && singleCollection.trim() !== '';
    const hideLogo = import.meta.env.VITE_HIDE_APP_LOGO === 'true' || import.meta.env.HIDE_APP_LOGO === 'true';

    const [appUnlocked, setAppUnlocked] = useState(!isAppPasswordRequired() || !!getAppPassword());
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [isLocalFile, setIsLocalFile] = useState(false);
    const [collection, setCollection] = useState<PasswoodCollection | null>(null);
    const [masterPassword, setMasterPassword] = useState('');
    const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [dialogCollectionName, setDialogCollectionName] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Auto-open unlock dialog for single collection when app unlocks
    useEffect(() => {
        if (appUnlocked && hasSingleCollection && !selectedFile && !unlockDialogOpen) {
            setDialogCollectionName(singleCollection);
            setUnlockDialogOpen(true);
        }
    }, [appUnlocked, hasSingleCollection, singleCollection, selectedFile, unlockDialogOpen]);

    const handleFileSelect = (filename: string) => {
        const localFiles = getLocalFilesList();
        setIsLocalFile(localFiles.some(f => {
            const fname = typeof f === 'string' ? f : f.filename;
            return fname === filename;
        }));
        setDialogCollectionName(filename);
        setUnlockDialogOpen(true);
    };

    const handleCreateNew = () => {
        setCreateDialogOpen(true);
    };

    const handleUnlocked = (col: PasswoodCollection, password: string, filename: string) => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCollection(col);
            setMasterPassword(password);
            setSelectedFile(filename);
            setUnlockDialogOpen(false);
            setCreateDialogOpen(false);
        }, 250);
        setTimeout(() => setIsTransitioning(false), 500);
    };

    const handleBack = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setSelectedFile(null);
            setIsLocalFile(false);
            setCollection(null);
            setMasterPassword(''); // Clear from state
            setIsTransitioning(false);
        }, 250);
    };

    const handleAppUnlocked = (password: string) => {
        setIsTransitioning(true);
        setTimeout(() => {
            setAppPassword(password);
            setAppUnlocked(true);
            setIsTransitioning(false);
        }, 250);
    };

    const handleLockApp = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            clearAppPassword();
            setAppUnlocked(false);
            setSelectedFile(null);
            setCollection(null);
            setMasterPassword('');
            setIsTransitioning(false);
        }, 250);
    };

    // Show app unlock dialog if app password is required and not yet unlocked
    if (!appUnlocked) {
        return (
            <div className="bg-black min-h-screen relative flex flex-col">
                <AppUnlockDialog open={true} onUnlocked={handleAppUnlocked} />

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

                {/* Fade overlay */}
                <AnimatePresence>
                    {isTransitioning && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="fixed inset-0 bg-black z-[9999] pointer-events-none"
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="bg-black min-h-screen relative">
            <AnimatePresence mode="wait">
                {selectedFile && collection && masterPassword ? (
                    <motion.div
                        key="editor"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                        <PasswordFileEditor
                            filename={selectedFile}
                            initialCollection={collection}
                            initialPassword={masterPassword}
                            isLocalFile={isLocalFile}
                            onBack={handleBack}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="picker"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                        {!hasSingleCollection && appUnlocked && (
                            <PasswordFilePicker
                                onFileSelect={handleFileSelect}
                                onCreateNew={handleCreateNew}
                                onLockApp={isAppPasswordRequired() ? handleLockApp : undefined}
                            />
                        )}
                        <UnlockDialog
                            open={unlockDialogOpen}
                            onOpenChange={setUnlockDialogOpen}
                            collectionName={dialogCollectionName}
                            onUnlocked={handleUnlocked}
                        />
                        <CreateCollectionDialog
                            open={createDialogOpen}
                            onOpenChange={setCreateDialogOpen}
                            onCreated={handleUnlocked}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fade overlay */}
            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="fixed inset-0 bg-black z-[9999] pointer-events-none"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
