import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/animate-ui/components/buttons/button';

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
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900 rounded-2xl p-8 shadow-2xl border border-neutral-800 max-w-md w-full z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                    <Dialog.Title className="text-2xl font-semibold text-neutral-50 mb-6">
                        {title}
                    </Dialog.Title>

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

                    <Dialog.Close asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 flex items-center gap-2"
                            aria-label="Close"
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </Button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
