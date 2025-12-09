import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/animate-ui/components/buttons/button';
import type { ReactNode } from 'react';

interface CustomDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    children: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg';
    showCloseButton?: boolean;
    zIndex?: number;
    overlayOpacity?: 'light' | 'dark';
}

const maxWidthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
};

const overlayOpacityClasses = {
    light: 'bg-black/50',
    dark: 'bg-black/80',
};

export default function CustomDialog({
    open,
    onOpenChange,
    title,
    children,
    maxWidth = 'md',
    showCloseButton = true,
    zIndex = 50,
    overlayOpacity = 'dark',
}: CustomDialogProps) {
    const zIndexClass = zIndex === 60 ? 'z-[60]' : 'z-50';

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay
                    className={`fixed inset-0 ${overlayOpacityClasses[overlayOpacity]} backdrop-blur-sm ${zIndexClass} data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300`}
                />
                <Dialog.Content
                    className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900 rounded-2xl p-8 shadow-2xl border ${overlayOpacity === 'light' ? 'border-neutral-700' : 'border-neutral-800'} ${maxWidthClasses[maxWidth]} w-[calc(100%-34px)] max-h-[calc(100vh-34px)] overflow-y-auto ${zIndexClass} resize-none focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300`}
                >
                    <div className="relative mb-6">
                        {title && (
                            <Dialog.Title className="text-2xl font-semibold text-neutral-50 pr-10">
                                {title}
                            </Dialog.Title>
                        )}

                        {showCloseButton && (
                            <Dialog.Close asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1/2 -translate-y-1/2 right-0 text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 flex items-center gap-2"
                                    aria-label="Close"
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </Button>
                            </Dialog.Close>
                        )}
                    </div>

                    {children}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
