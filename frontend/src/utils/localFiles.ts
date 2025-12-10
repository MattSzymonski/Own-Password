/**
 * Local file handling utilities using File System Access API
 */

// Type declarations for File System Access API
declare global {
    interface Window {
        showOpenFilePicker(options?: {
            types?: Array<{
                description: string;
                accept: Record<string, string[]>;
            }>;
            multiple?: boolean;
        }): Promise<FileSystemFileHandle[]>;
    }

    interface FileSystemFileHandle {
        queryPermission(descriptor: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
        requestPermission(descriptor: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
    }
}

const LOCAL_FILES_COOKIE = 'ownpassword_local_files';

export interface LocalFileInfo {
    filename: string;
    modified?: string;
    handle: FileSystemFileHandle;
}

// Store local file info in cookie (filename and modified date only)
export function getLocalFilesList(): Array<string | { filename: string; modified?: string }> {
    const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(LOCAL_FILES_COOKIE + '='));

    if (!cookie) return [];

    try {
        const value = decodeURIComponent(cookie.split('=')[1]);
        return JSON.parse(value);
    } catch {
        return [];
    }
}

export function addLocalFile(filename: string, modified?: string): boolean {
    const files = getLocalFilesList();
    // Normalize all entries to new format and check for duplicates
    const normalizedFiles = files.map(f =>
        typeof f === 'string' ? { filename: f } : f
    );

    if (normalizedFiles.find(f => f.filename === filename)) {
        return false; // File already exists
    }

    normalizedFiles.push({ filename, modified });
    saveLocalFilesList(normalizedFiles);
    return true; // Successfully added
}

export function removeLocalFile(filename: string): void {
    const files = getLocalFilesList();
    // Filter and normalize to new format
    const normalizedFiles = files
        .filter(f => {
            const fname = typeof f === 'string' ? f : f.filename;
            return fname !== filename;
        })
        .map(f => typeof f === 'string' ? { filename: f } : f);

    saveLocalFilesList(normalizedFiles);
}

function saveLocalFilesList(files: Array<{ filename: string; modified?: string }>): void {
    const value = encodeURIComponent(JSON.stringify(files));
    // Set cookie with 1 year expiration
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${LOCAL_FILES_COOKIE}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
}

// Store file handles in IndexedDB for persistence
const DB_NAME = 'OwnPasswordLocalFiles';
const STORE_NAME = 'fileHandles';

async function getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'filename' });
            }
        };
    });
}

export async function saveFileHandle(filename: string, handle: FileSystemFileHandle): Promise<void> {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.put({ filename, handle });
}

export async function getFileHandle(filename: string): Promise<FileSystemFileHandle | null> {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.get(filename);
        request.onsuccess = () => {
            const result = request.result;
            resolve(result ? result.handle : null);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function removeFileHandle(filename: string): Promise<void> {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.delete(filename);
}

// Check if File System Access API is supported
export function isFileSystemAccessSupported(): boolean {
    return 'showOpenFilePicker' in window;
}

// Pick a local .pass file
export async function pickLocalFile(): Promise<{ filename: string; modified: string; handle: FileSystemFileHandle } | null> {
    if (!isFileSystemAccessSupported()) {
        throw new Error('File System Access API is not supported in this browser');
    }

    try {
        const [fileHandle] = await window.showOpenFilePicker({
            types: [{
                description: 'Password Files',
                accept: { 'application/octet-stream': ['.pass'] }
            }],
            multiple: false
        });

        // Get modification date
        const file = await fileHandle.getFile();
        const modified = new Date(file.lastModified).toISOString();

        return {
            filename: fileHandle.name,
            modified: modified,
            handle: fileHandle
        };
    } catch (err) {
        // User cancelled
        if ((err as Error).name === 'AbortError') {
            return null;
        }
        throw err;
    }
}

// Read local file
export async function readLocalFile(handle: FileSystemFileHandle): Promise<Uint8Array> {
    // Check if we still have permission to read the file
    const permission = await handle.queryPermission({ mode: 'read' });

    if (permission === 'denied') {
        throw new Error('Permission to read file was denied');
    }

    if (permission === 'prompt') {
        // Request permission again
        const newPermission = await handle.requestPermission({ mode: 'read' });
        if (newPermission === 'denied') {
            throw new Error('Permission to read file was denied');
        }
    }

    const file = await handle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

// Write to local file
export async function writeLocalFile(handle: FileSystemFileHandle, data: Uint8Array): Promise<void> {
    // Check if we have write permission
    const permission = await handle.queryPermission({ mode: 'readwrite' });

    if (permission === 'denied') {
        throw new Error('Permission to write to file was denied');
    }

    if (permission === 'prompt') {
        // Request write permission
        const newPermission = await handle.requestPermission({ mode: 'readwrite' });
        if (newPermission === 'denied') {
            throw new Error('Permission to write to file was denied');
        }
    }

    const writable = await handle.createWritable();
    await writable.write(new Blob([data as unknown as BlobPart]));
    await writable.close();
}

// Get local file modified date
export async function getLocalFileModified(handle: FileSystemFileHandle): Promise<string> {
    const file = await handle.getFile();
    return new Date(file.lastModified).toISOString();
}

// Validate if a local file is still accessible
export async function validateLocalFile(filename: string): Promise<boolean> {
    try {
        const handle = await getFileHandle(filename);
        if (!handle) {
            return false;
        }

        // Check permission status
        const permission = await handle.queryPermission({ mode: 'read' });

        // Try to access the file to verify it still exists
        await handle.getFile();

        return permission !== 'denied';
    } catch {
        return false;
    }
}

// Validate all local files and return status map
export async function validateAllLocalFiles(): Promise<Map<string, boolean>> {
    const files = getLocalFilesList();
    const statusMap = new Map<string, boolean>();

    await Promise.all(
        files.map(async (file) => {
            const filename = typeof file === 'string' ? file : file.filename;
            const isValid = await validateLocalFile(filename);
            statusMap.set(filename, isValid);
        })
    );

    return statusMap;
}
