import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import PasswordFilePicker from './PasswordFilePicker';
import PasswordFileEditor from './PasswordFileEditor';
import UnlockDialog from './UnlockDialog';
import type { PasswoodCollection } from '../cryptor';

export default function MainPage() {
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [collection, setCollection] = useState<PasswoodCollection | null>(null);
    const [masterPassword, setMasterPassword] = useState('');
    const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
    const [dialogCollectionName, setDialogCollectionName] = useState('');
    const [isNewFile, setIsNewFile] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleFileSelect = (filename: string) => {
        setDialogCollectionName(filename);
        setIsNewFile(false);
        setUnlockDialogOpen(true);
    };

    const handleCreateNew = () => {
        setDialogCollectionName('new.pass');
        setIsNewFile(true);
        setUnlockDialogOpen(true);
    };

    const handleUnlocked = (col: PasswoodCollection, password: string, filename: string) => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCollection(col);
            setMasterPassword(password);
            setSelectedFile(filename);
        }, 300);
        setTimeout(() => setIsTransitioning(false), 600);
    };

    const handleBack = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setSelectedFile(null);
            setCollection(null);
            setMasterPassword('');
        }, 300);
        setTimeout(() => setIsTransitioning(false), 600);
    };

    return (
        <div className="bg-black min-h-screen">
            <AnimatePresence mode="wait">
                {selectedFile && collection && masterPassword ? (
                    <motion.div
                        key="editor"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isTransitioning ? 0 : 1 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        <PasswordFileEditor
                            filename={selectedFile}
                            initialCollection={collection}
                            initialPassword={masterPassword}
                            onBack={handleBack}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="picker"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isTransitioning ? 0 : 1 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        <PasswordFilePicker onFileSelect={handleFileSelect} onCreateNew={handleCreateNew} />
                        <UnlockDialog
                            open={unlockDialogOpen}
                            onOpenChange={setUnlockDialogOpen}
                            collectionName={dialogCollectionName}
                            isNewFile={isNewFile}
                            onUnlocked={handleUnlocked}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
