/**
 * Utility functions for Passwood
 */

import type { PasswoodCollection, PasswoodPassword } from './types';
import { encodePasswoodFile, decodePasswoodFile } from './format';

// Type alias for backward compatibility
type PasswoodDatabase = PasswoodCollection;

/**
 * Create a new empty Passwood collection
 */
export function createEmptyCollection(): PasswoodCollection {
    const now = new Date().toISOString();
    return {
        version: '1.0.0',
        created: now,
        modified: now,
        passwords: []
    };
}

// Backward compatibility alias
export const createEmptyDatabase = createEmptyCollection;

/**
 * Generate a unique ID for a password
 */
export function generatePasswordId(): string {
    return crypto.randomUUID();
}

/**
 * Create a new password
 */
export function createPassword(
    title: string,
    login: string,
    password: string,
    url?: string,
    notes?: string,
    tags?: string[]
): PasswoodPassword {
    const now = new Date().toISOString();
    return {
        id: generatePasswordId(),
        title,
        login,
        password,
        url,
        notes,
        tags,
        created: now,
        modified: now
    };
}

/**
 * Add a password to the database
 */
export function addPassword(database: PasswoodDatabase, password: PasswoodPassword): PasswoodDatabase {
    return {
        ...database,
        modified: new Date().toISOString(),
        passwords: [...database.passwords, password]
    };
}

/**
 * Update a password in the database
 */
export function updatePassword(
    database: PasswoodDatabase,
    passwordId: string,
    updates: Partial<Omit<PasswoodPassword, 'id' | 'created'>>
): PasswoodDatabase {
    const now = new Date().toISOString();
    return {
        ...database,
        modified: now,
        passwords: database.passwords.map(password =>
            password.id === passwordId
                ? { ...password, ...updates, modified: now }
                : password
        )
    };
}

/**
 * Delete a password from the database
 */
export function deletePassword(database: PasswoodDatabase, passwordId: string): PasswoodDatabase {
    return {
        ...database,
        modified: new Date().toISOString(),
        passwords: database.passwords.filter(password => password.id !== passwordId)
    };
}

/**
 * Search passwords by title, login, or tags
 */
export function searchPasswords(database: PasswoodDatabase, query: string): PasswoodPassword[] {
    const lowerQuery = query.toLowerCase();
    return database.passwords.filter(password =>
        password.title.toLowerCase().includes(lowerQuery) ||
        password.login.toLowerCase().includes(lowerQuery) ||
        password.url?.toLowerCase().includes(lowerQuery) ||
        password.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
}

/**
 * Export database to .passwood file (returns Blob for download)
 */
export async function exportToFile(
    database: PasswoodDatabase,
    masterPassword: string
): Promise<Blob> {
    const fileData = await encodePasswoodFile(database, masterPassword);
    return new Blob([fileData as BlobPart], { type: 'application/octet-stream' });
}

/**
 * Import database from .passwood file
 */
export async function importFromFile(
    file: File,
    masterPassword: string
): Promise<PasswoodDatabase> {
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);
    return await decodePasswoodFile(fileData, masterPassword);
}

/**
 * Download a .passwood file
 */
export function downloadPasswoodFile(blob: Blob, filename: string = 'passwords.pass'): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Generate a random password
 */
export function generatePassword(
    length: number = 16,
    options: {
        uppercase?: boolean;
        lowercase?: boolean;
        numbers?: boolean;
        symbols?: boolean;
    } = {
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true
        }
): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let charset = '';
    if (options.uppercase) charset += uppercase;
    if (options.lowercase) charset += lowercase;
    if (options.numbers) charset += numbers;
    if (options.symbols) charset += symbols;

    if (charset.length === 0) {
        throw new Error('At least one character type must be selected');
    }

    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);

    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset[randomValues[i] % charset.length];
    }

    return password;
}

/**
 * Calculate password strength (0-100)
 */
export function calculatePasswordStrength(password: string): number {
    let strength = 0;

    // Length
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (password.length >= 16) strength += 10;

    // Character variety
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;

    return Math.min(100, strength);
}

/**
 * Validate master password strength
 */
export function validateMasterPassword(password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 12) {
        errors.push('Password must be at least 12 characters long');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain lowercase letters');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain uppercase letters');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain numbers');
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
        errors.push('Password must contain special characters');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
