/**
 * Authentication utilities for app-level password protection
 */

/**
 * Get the stored app password from sessionStorage
 */
export function getAppPassword(): string | null {
    return sessionStorage.getItem('appPassword');
}

/**
 * Set the app password in sessionStorage
 */
export function setAppPassword(password: string): void {
    sessionStorage.setItem('appPassword', password);
}

/**
 * Clear the app password from sessionStorage
 */
export function clearAppPassword(): void {
    sessionStorage.removeItem('appPassword');
}

/**
 * Check if app password is required
 */
export function isAppPasswordRequired(): boolean {
    const requireAuth = import.meta.env.VITE_REQUIRE_APP_PASSWORD || import.meta.env.REQUIRE_APP_PASSWORD;
    return requireAuth === 'true' || requireAuth === '1';
}
