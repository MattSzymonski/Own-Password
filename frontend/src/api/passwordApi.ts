/**
 * API client for password file operations
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3010/api';

export interface PasswordFileInfo {
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
    const response = await fetch(`${API_BASE_URL}/password_files`);
    if (!response.ok) {
        throw new Error('Failed to fetch password files');
    }
    return await response.json();
}

/**
 * Download a password file from backend
 */
export async function downloadPasswordFile(filename: string): Promise<Uint8Array> {
    const response = await fetch(`${API_BASE_URL}/password_files/${filename}`);
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

    const response = await fetch(`${API_BASE_URL}/password_files/${filename}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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
    const response = await fetch(`${API_BASE_URL}/password_files/${filename}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete password file');
    }
}
