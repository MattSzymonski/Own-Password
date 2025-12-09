import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/animate-ui/components/buttons/button';
import CustomDialog from './CustomDialog';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    danger?: boolean;
}

export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    danger = false
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    return (
        <CustomDialog open={open} onOpenChange={onOpenChange} title={title} maxWidth="sm">
            <Dialog.Description className="text-neutral-300 mb-6 leading-relaxed text-sm">
                {message}
            </Dialog.Description>

            <div className="flex gap-3 pt-4">
                <Button
                    onClick={handleConfirm}
                    variant={danger ? 'destructive' : 'default'}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium ${danger
                        ? 'bg-red-600 hover:bg-red-700 text-neutral-50'
                        : 'bg-neutral-50 hover:bg-neutral-200 text-neutral-950'
                        }`}
                >
                    {confirmLabel}
                </Button>
                <Button
                    onClick={() => onOpenChange(false)}
                    variant="secondary"
                    className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-50 rounded-lg font-medium"
                >
                    {cancelLabel}
                </Button>
            </div>
        </CustomDialog>
    );
}
