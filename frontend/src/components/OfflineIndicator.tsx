import { motion, AnimatePresence } from 'motion/react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/use-online-status';

export default function OfflineIndicator() {
    const isOnline = useOnlineStatus();

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 50, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="bg-neutral-700 text-neutral-100 flex items-center justify-center gap-2 text-base font-medium shadow-lg overflow-hidden"
                >
                    <WifiOff size={20} />
                    <span>Offline</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
