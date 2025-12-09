import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import PasswordFilePicker from './PasswordFilePicker';
import PasswordFileEditor from './PasswordFileEditor';
import UnlockDialog from './UnlockDialog';
import CreateCollectionDialog from './CreateCollectionDialog';
import type { PasswoodCollection } from '../cryptor';

export default function MainPage() {
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [collection, setCollection] = useState<PasswoodCollection | null>(null);
    const [masterPassword, setMasterPassword] = useState('');
    const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [dialogCollectionName, setDialogCollectionName] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleFileSelect = (filename: string) => {
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
            setCollection(null);
            setMasterPassword('');
            setIsTransitioning(false);
        }, 250);
    };

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
                            onBack={handleBack}
                        />
                    </motion.div>
                ) : (
                    <div key="picker">
                        <PasswordFilePicker onFileSelect={handleFileSelect} onCreateNew={handleCreateNew} />
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
                    </div>
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
