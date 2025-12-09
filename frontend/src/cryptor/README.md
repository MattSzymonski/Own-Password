# Passwood File Format (.passwood)

A secure, encrypted file format for password storage with strong cryptographic guarantees.

## File Specification

### File Extension
`.passwood`

### File Structure

```
┌─────────────────────────────────────────────────────────┐
│ Header (256 bytes)                                      │
├─────────────────────────────────────────────────────────┤
│ - Magic bytes: "PSWD" (4 bytes)                        │
│ - Version: uint32 (4 bytes)                            │
│ - Encryption algorithm: uint32 (4 bytes)               │
│ - KDF salt (32 bytes)                                  │
│ - KDF iterations: uint32 (4 bytes)                     │
│ - KDF memory: uint32 (4 bytes)                         │
│ - KDF parallelism: uint32 (4 bytes)                    │
│ - HMAC-SHA256 (32 bytes)                               │
│ - Reserved (168 bytes)                                  │
├─────────────────────────────────────────────────────────┤
│ Encrypted Payload                                       │
├─────────────────────────────────────────────────────────┤
│ - IV/Nonce (12 bytes)                                  │
│ - Encrypted JSON data (variable length)                │
│ - GCM authentication tag (16 bytes, included in data)  │
└─────────────────────────────────────────────────────────┘
```

## Security Features

### Encryption
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits
- **IV Size**: 96 bits (12 bytes)
- **Authentication**: 128-bit authentication tag
- **Benefits**: Provides both confidentiality and authenticity, prevents tampering

### Key Derivation
- **Function**: PBKDF2-SHA256 (Web Crypto API standard)
- **Iterations**: 600,000 (OWASP recommended minimum for 2023+)
- **Salt**: 256 bits (32 bytes), randomly generated per file
- **Output**: 256-bit encryption key
- **Note**: Future versions may upgrade to Argon2id when available in browsers

### Integrity Protection
- **Header HMAC**: SHA-256 HMAC protects header from tampering
- **Payload Authentication**: GCM mode provides built-in authentication tag
- **Master Password**: Never stored, only derived keys are used

### Attack Resistance
- ✅ **Brute Force**: High iteration count + 256-bit salt
- ✅ **Dictionary Attacks**: Strong KDF with salt
- ✅ **Rainbow Tables**: Unique salt per file
- ✅ **Tampering**: HMAC + GCM authentication
- ✅ **Replay Attacks**: Unique IV per encryption
- ✅ **Padding Oracle**: GCM mode (no padding)

## Usage

### Basic Example

```typescript
import {
    createEmptyDatabase,
    createEntry,
    addEntry,
    encodePasswoodFile,
    decodePasswoodFile,
    downloadPasswoodFile
} from './cryptor';

// Create a new database
let database = createEmptyDatabase();

// Add password entries
const entry = createEntry(
    'GitHub',
    'user@example.com',
    'super-secure-password',
    'https://github.com',
    'My GitHub account',
    ['work', 'development']
);
database = addEntry(database, entry);

// Encrypt and save
const masterPassword = 'my-master-password-123';
const encrypted = await encodePasswoodFile(database, masterPassword);
const blob = new Blob([encrypted], { type: 'application/octet-stream' });
downloadPasswoodFile(blob, 'my-passwords.passwood');

// Load and decrypt
const fileData = new Uint8Array(await file.arrayBuffer());
const decrypted = await decodePasswoodFile(fileData, masterPassword);
```

### Password Generation

```typescript
import { generatePassword, calculatePasswordStrength } from './cryptor';

// Generate a strong password
const password = generatePassword(20, {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
});

// Check password strength
const strength = calculatePasswordStrength(password);
console.log(`Password strength: ${strength}/100`);
```

### Database Operations

```typescript
import {
    createEmptyDatabase,
    addEntry,
    updateEntry,
    deleteEntry,
    searchEntries
} from './cryptor';

let db = createEmptyDatabase();

// Add entry
db = addEntry(db, createEntry('Service', 'user', 'pass'));

// Update entry
db = updateEntry(db, entryId, { password: 'new-password' });

// Delete entry
db = deleteEntry(db, entryId);

// Search
const results = searchEntries(db, 'github');
```

## JSON Database Structure

The encrypted payload contains a JSON database with this structure:

```json
{
  "version": "1.0.0",
  "created": "2025-12-09T12:00:00.000Z",
  "modified": "2025-12-09T12:30:00.000Z",
  "entries": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "GitHub",
      "username": "user@example.com",
      "password": "super-secure-password",
      "url": "https://github.com",
      "notes": "My GitHub account",
      "tags": ["work", "development"],
      "created": "2025-12-09T12:00:00.000Z",
      "modified": "2025-12-09T12:00:00.000Z",
      "customFields": [
        {
          "name": "Security Question",
          "value": "What is your favorite color?",
          "type": "text"
        }
      ]
    }
  ]
}
```

## Best Practices

### Master Password
- Use at least 12 characters (longer is better)
- Include uppercase, lowercase, numbers, and symbols
- Don't reuse passwords from other services
- Consider using a passphrase (e.g., "correct-horse-battery-staple")
- Never store the master password in plain text

### File Storage
- Keep backups in secure locations
- Use different master passwords for different files
- Consider storing files encrypted at rest (full disk encryption)
- Regularly update passwords and re-encrypt files

### Usage
- Lock/clear clipboard after copying passwords
- Use HTTPS for all password-related operations
- Implement auto-lock after inactivity
- Never log or store decrypted data in plain text

## Performance

- **Encryption**: ~10-50ms for typical database (< 1000 entries)
- **Decryption**: ~10-50ms for typical database
- **Key Derivation**: ~500-1500ms (intentionally slow for security)
- **File Size**: ~1KB + (entries × ~200-500 bytes)

## Browser Compatibility

Requires modern browsers with Web Crypto API support:
- ✅ Chrome 60+
- ✅ Firefox 57+
- ✅ Safari 11+
- ✅ Edge 79+

## Future Enhancements

- [ ] Argon2id support via WebAssembly
- [ ] Hardware security key support (WebAuthn)
- [ ] Key rotation mechanism
- [ ] Compressed payload option
- [ ] Multiple vault support
- [ ] Password history tracking
- [ ] Secure sharing mechanism
- [ ] 2FA/TOTP integration

## License

Same as parent project.
