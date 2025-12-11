/**
 * API client for password file operations
 */

import { getAppPassword } from './auth';
import { BACKEND_API_URL } from './constants';


/**
 * Get headers with app password if required
 */
function getHeaders(): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const appPassword = getAppPassword();
    if (appPassword) {
        headers['x-app-password'] = appPassword;
    }

    return headers;
} export interface PasswordFileInfo {
    filename: string;
    size: number;
    modified: string;
    created: string;
}

export interface PasswordFilesResponse {
    files: PasswordFileInfo[];
    total: number;
}

/**
 * Fetch list of password files from backend
 */
export async function fetchPasswordFiles(): Promise<PasswordFilesResponse> {
    const response = await fetch(`${BACKEND_API_URL}/password_files`, {
        headers: getHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch password files');
    }
    return await response.json();
}

/**
 * Download a password file from backend
 */
export async function downloadPasswordFile(filename: string): Promise<Uint8Array> {
    const response = await fetch(`${BACKEND_API_URL}/password_files/${filename}`, {
        headers: getHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to download password file');
    }
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

/**
 * Upload/save a password file to backend
 */
export async function savePasswordFile(filename: string, data: Uint8Array): Promise<void> {
    // Convert Uint8Array to base64
    const base64 = btoa(String.fromCharCode(...data));

    const response = await fetch(`${BACKEND_API_URL}/password_files/${filename}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ data: base64 }),
    });

    if (!response.ok) {
        throw new Error('Failed to save password file');
    }
}

/**
 * Delete a password file from backend
 */
export async function deletePasswordFile(filename: string): Promise<void> {
    const response = await fetch(`${BACKEND_API_URL}/password_files/${filename}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to delete password file');
    }
}
