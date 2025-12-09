/**
 * Authentication utilities for app-level password protection
 */

/**
 * Hash a password using SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Get the stored app password hash from sessionStorage
 */
export function getAppPasswordHash(): string | null {
    return sessionStorage.getItem('appPasswordHash');
}

/**
 * Set the app password hash in sessionStorage
 */
export function setAppPasswordHash(hash: string): void {
    sessionStorage.setItem('appPasswordHash', hash);
}

/**
 * Clear the app password hash from sessionStorage
 */
export function clearAppPasswordHash(): void {
    sessionStorage.removeItem('appPasswordHash');
}

/**
 * Check if app password is required
 */
export function isAppPasswordRequired(): boolean {
    const appPasswordFile = import.meta.env.VITE_APP_PASSWORD_FILE || import.meta.env.APP_PASSWORD_FILE;
    return appPasswordFile !== undefined && appPasswordFile !== null && appPasswordFile.trim() !== '';
}
