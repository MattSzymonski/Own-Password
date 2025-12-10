import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3010/api';

export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;

        const checkServerConnection = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

                const response = await fetch(`${API_BASE_URL}/health`, {
                    method: 'HEAD',
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);
                setIsOnline(response.ok);
            } catch (error) {
                // Server is unreachable
                setIsOnline(false);
            }
        };

        // Check immediately on mount
        checkServerConnection();

        // Then check every 5 seconds
        intervalId = setInterval(checkServerConnection, 5000);

        // Also listen to browser online/offline events
        const handleOnline = () => checkServerConnection();
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}
