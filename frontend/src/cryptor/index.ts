/**
 * Passwood - Secure password storage file format
 * File extension: .passwood
 * 
 * Security features:
 * - AES-256-GCM encryption with authenticated encryption
 * - PBKDF2-SHA256 key derivation (600k iterations)
 * - HMAC-SHA256 header integrity verification
 * - Random salt and IV per file
 * - Master password never stored
 */

export type {
    PasswoodEntry,
    CustomField,
    PasswoodDatabase,
    PasswoodHeader,
    EncryptedPayload,
    PasswoodFileData
} from './types';

export {
    encodePasswoodFile,
    decodePasswoodFile
} from './format';

export {
    generateSalt,
    generateIV,
    deriveKey,
    encryptData,
    decryptData
} from './crypto';

// Utility functions
export * from './utils';
