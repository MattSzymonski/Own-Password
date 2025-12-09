/**
 * Passwood file format encoder/decoder
 * File extension: .passwood
 */

import type {
    PasswoodDatabase,
    PasswoodHeader
} from './types';
import {
    generateSalt,
    generateIV,
    deriveKey,
    encryptData,
    decryptData,
    createHMACKey,
    generateHMAC,
    verifyHMAC
} from './crypto';

const MAGIC_BYTES = 'PSWD';
const FILE_VERSION = 1;
const HEADER_SIZE = 256;
const ENCRYPTION_ALGORITHM_AES_GCM = 1;

/**
 * Encode a PasswoodDatabase into encrypted .passwood file format
 */
export async function encodePasswoodFile(
    database: PasswoodDatabase,
    masterPassword: string
): Promise<Uint8Array> {
    // Generate cryptographic parameters
    const salt = generateSalt(32);
    const iv = generateIV();
    const iterations = 600000;

    // Derive encryption key
    const encryptionKey = await deriveKey(masterPassword, salt, iterations);

    // Serialize database to JSON
    const jsonData = JSON.stringify(database);

    // Encrypt the data
    const encryptedBuffer = await encryptData(jsonData, encryptionKey, iv);
    const encrypted = new Uint8Array(encryptedBuffer);

    // Create header
    const header: PasswoodHeader = {
        magic: MAGIC_BYTES,
        version: FILE_VERSION,
        encryptionAlgorithm: ENCRYPTION_ALGORITHM_AES_GCM,
        kdfSalt: salt,
        kdfIterations: iterations,
        kdfMemory: 65536, // 64MB (placeholder for future Argon2)
        kdfParallelism: 4, // Placeholder for future Argon2
        hmac: new Uint8Array(32) // Will be filled later
    };

    // Serialize header
    const headerBuffer = serializeHeader(header);

    // Generate HMAC for header integrity
    const hmacKey = await createHMACKey(masterPassword, salt);
    const hmac = await generateHMAC(headerBuffer, hmacKey);

    // Update header with HMAC
    header.hmac = hmac;
    const finalHeaderBuffer = serializeHeader(header);

    // Combine header + IV + encrypted data
    const fileSize = HEADER_SIZE + iv.length + encrypted.length;
    const fileBuffer = new Uint8Array(fileSize);

    let offset = 0;
    fileBuffer.set(finalHeaderBuffer, offset);
    offset += HEADER_SIZE;
    fileBuffer.set(iv, offset);
    offset += iv.length;
    fileBuffer.set(encrypted, offset);

    return fileBuffer;
}

/**
 * Decode a .passwood file and decrypt the database
 */
export async function decodePasswoodFile(
    fileData: Uint8Array,
    masterPassword: string
): Promise<PasswoodDatabase> {
    if (fileData.length < HEADER_SIZE + 12) {
        throw new Error('Invalid file: too small');
    }

    // Extract and parse header
    const headerBuffer = fileData.slice(0, HEADER_SIZE);
    const header = deserializeHeader(headerBuffer);

    // Verify magic bytes
    if (header.magic !== MAGIC_BYTES) {
        throw new Error('Invalid file: incorrect magic bytes');
    }

    // Verify version
    if (header.version !== FILE_VERSION) {
        throw new Error(`Unsupported file version: ${header.version}`);
    }

    // Verify HMAC
    const hmacKey = await createHMACKey(masterPassword, header.kdfSalt);
    const headerWithoutHMAC = serializeHeader({ ...header, hmac: new Uint8Array(32) });
    const isValid = await verifyHMAC(headerWithoutHMAC, header.hmac, hmacKey);

    if (!isValid) {
        throw new Error('Invalid file: HMAC verification failed (file may be corrupted or tampered)');
    }

    // Extract IV and encrypted data
    let offset = HEADER_SIZE;
    const iv = fileData.slice(offset, offset + 12);
    offset += 12;
    const encryptedData = fileData.slice(offset);

    // Derive decryption key
    const decryptionKey = await deriveKey(
        masterPassword,
        header.kdfSalt,
        header.kdfIterations
    );

    // Decrypt data
    let jsonData: string;
    try {
        jsonData = await decryptData(encryptedData.buffer, decryptionKey, iv);
    } catch (error) {
        throw new Error('Decryption failed: incorrect password or corrupted file');
    }

    // Parse JSON
    try {
        const database: PasswoodDatabase = JSON.parse(jsonData);
        return database;
    } catch (error) {
        throw new Error('Invalid file: corrupted database structure');
    }
}

/**
 * Serialize header to binary format
 */
function serializeHeader(header: PasswoodHeader): Uint8Array {
    const buffer = new Uint8Array(HEADER_SIZE);
    const view = new DataView(buffer.buffer);

    let offset = 0;

    // Magic bytes (4 bytes)
    const encoder = new TextEncoder();
    const magicBytes = encoder.encode(header.magic);
    buffer.set(magicBytes, offset);
    offset += 4;

    // Version (4 bytes)
    view.setUint32(offset, header.version, true);
    offset += 4;

    // Encryption algorithm (4 bytes)
    view.setUint32(offset, header.encryptionAlgorithm, true);
    offset += 4;

    // KDF parameters
    // Salt (32 bytes)
    buffer.set(header.kdfSalt, offset);
    offset += 32;

    // Iterations (4 bytes)
    view.setUint32(offset, header.kdfIterations, true);
    offset += 4;

    // Memory (4 bytes)
    view.setUint32(offset, header.kdfMemory, true);
    offset += 4;

    // Parallelism (4 bytes)
    view.setUint32(offset, header.kdfParallelism, true);
    offset += 4;

    // HMAC (32 bytes)
    buffer.set(header.hmac, offset);
    offset += 32;

    // Remaining bytes are reserved (zeros)

    return buffer;
}

/**
 * Deserialize header from binary format
 */
function deserializeHeader(buffer: Uint8Array): PasswoodHeader {
    if (buffer.length < HEADER_SIZE) {
        throw new Error('Invalid header: buffer too small');
    }

    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    let offset = 0;

    // Magic bytes (4 bytes)
    const decoder = new TextDecoder();
    const magic = decoder.decode(buffer.slice(offset, offset + 4));
    offset += 4;

    // Version (4 bytes)
    const version = view.getUint32(offset, true);
    offset += 4;

    // Encryption algorithm (4 bytes)
    const encryptionAlgorithm = view.getUint32(offset, true);
    offset += 4;

    // KDF Salt (32 bytes)
    const kdfSalt = buffer.slice(offset, offset + 32);
    offset += 32;

    // Iterations (4 bytes)
    const kdfIterations = view.getUint32(offset, true);
    offset += 4;

    // Memory (4 bytes)
    const kdfMemory = view.getUint32(offset, true);
    offset += 4;

    // Parallelism (4 bytes)
    const kdfParallelism = view.getUint32(offset, true);
    offset += 4;

    // HMAC (32 bytes)
    const hmac = buffer.slice(offset, offset + 32);
    offset += 32;

    return {
        magic,
        version,
        encryptionAlgorithm,
        kdfSalt,
        kdfIterations,
        kdfMemory,
        kdfParallelism,
        hmac
    };
}
