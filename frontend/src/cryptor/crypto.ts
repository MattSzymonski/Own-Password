/**
 * Cryptographic functions for Passwood file format
 */

/**
 * Generate a cryptographically secure random salt
 */
export function generateSalt(length: number = 32): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate a random IV for AES-GCM
 */
export function generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM
}

/**
 * Derive encryption key from master password using PBKDF2
 * (Note: Argon2id is preferred but not available in Web Crypto API)
 * For production, consider using a WebAssembly implementation of Argon2
 */
export async function deriveKey(
    password: string,
    salt: Uint8Array,
    iterations: number = 600000 // OWASP recommended minimum for PBKDF2-SHA256
): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    // Derive AES-GCM key
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: iterations,
            hash: 'SHA-256'
        },
        keyMaterial,
        {
            name: 'AES-GCM',
            length: 256
        },
        false, // Not extractable for security
        ['encrypt', 'decrypt']
    );

    return key;
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encryptData(
    data: string,
    key: CryptoKey,
    iv: Uint8Array
): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv as BufferSource,
            tagLength: 128 // 128-bit authentication tag
        },
        key,
        dataBuffer
    );

    return encrypted;
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decryptData(
    encryptedData: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array
): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv as BufferSource,
            tagLength: 128
        },
        key,
        encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

/**
 * Generate HMAC-SHA256 for header integrity verification
 */
export async function generateHMAC(
    data: Uint8Array,
    key: CryptoKey
): Promise<Uint8Array> {
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        data as BufferSource
    );

    return new Uint8Array(signature);
}

/**
 * Verify HMAC-SHA256
 */
export async function verifyHMAC(
    data: Uint8Array,
    signature: Uint8Array,
    key: CryptoKey
): Promise<boolean> {
    return await crypto.subtle.verify(
        'HMAC',
        key,
        signature as BufferSource,
        data as BufferSource
    );
}

/**
 * Create HMAC key from master password
 */
export async function createHMACKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        {
            name: 'HMAC',
            hash: 'SHA-256',
            length: 256
        },
        false,
        ['sign', 'verify']
    );
}
