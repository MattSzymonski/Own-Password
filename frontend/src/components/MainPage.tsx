import { useState } from 'react';
import PasswordFilePicker from './PasswordFilePicker';
import PasswordFileEditor from './PasswordFileEditor';
import UnlockDialog from './UnlockDialog';
import type { PasswoodDatabase } from '../cryptor';

export default function MainPage() {
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [database, setDatabase] = useState<PasswoodDatabase | null>(null);
    const [masterPassword, setMasterPassword] = useState('');
    const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
    const [dialogFilename, setDialogFilename] = useState('');
    const [isNewFile, setIsNewFile] = useState(false);

    const handleFileSelect = (filename: string) => {
        setDialogFilename(filename);
        setIsNewFile(false);
        setUnlockDialogOpen(true);
    };

    const handleCreateNew = () => {
        setDialogFilename('new.passwood');
        setIsNewFile(true);
        setUnlockDialogOpen(true);
    };

    const handleUnlocked = (db: PasswoodDatabase, password: string, filename: string) => {
        setDatabase(db);
        setMasterPassword(password);
        setSelectedFile(filename);
    };

    const handleBack = () => {
        setSelectedFile(null);
        setDatabase(null);
        setMasterPassword('');
    };

    if (selectedFile && database && masterPassword) {
        return <PasswordFileEditor
            filename={selectedFile}
            initialDatabase={database}
            initialPassword={masterPassword}
            onBack={handleBack}
        />;
    }

    return (
        <>
            <PasswordFilePicker onFileSelect={handleFileSelect} onCreateNew={handleCreateNew} />
            <UnlockDialog
                open={unlockDialogOpen}
                onOpenChange={setUnlockDialogOpen}
                filename={dialogFilename}
                isNewFile={isNewFile}
                onUnlocked={handleUnlocked}
            />
        </>
    );
}
