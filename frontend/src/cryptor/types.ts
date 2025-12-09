/**
 * Types for Passwood encrypted password storage
 */

export interface PasswoodPassword {
    id: string;
    title: string;
    login: string;
    password: string;
    url?: string;
    notes?: string;
    tags?: string[];
    created: string;
    modified: string;
    customFields?: CustomField[];
}

export interface CustomField {
    name: string;
    value: string;
    type?: 'text' | 'password' | 'url' | 'email';
}

export interface PasswoodCollection {
    version: string;
    created: string;
    modified: string;
    passwords: PasswoodPassword[];
}

// Backward compatibility alias
export type PasswoodDatabase = PasswoodCollection;

export interface PasswoodHeader {
    magic: string;           // "PSWD"
    version: number;         // File format version
    encryptionAlgorithm: number; // 1 = AES-256-GCM
    kdfSalt: Uint8Array;     // Salt for key derivation
    kdfIterations: number;   // Argon2id iterations
    kdfMemory: number;       // Argon2id memory cost (KB)
    kdfParallelism: number;  // Argon2id parallelism
    hmac: Uint8Array;        // HMAC-SHA256 of header
}

export interface EncryptedPayload {
    iv: Uint8Array;          // Initialization vector
    ciphertext: Uint8Array;  // Encrypted data
    authTag: Uint8Array;     // GCM authentication tag
}

export interface PasswoodFileData {
    header: PasswoodHeader;
    payload: EncryptedPayload;
}
