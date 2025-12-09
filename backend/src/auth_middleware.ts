import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
// @ts-ignore - no types available
import apacheMd5 from 'apache-md5';

/**
 * Hash a password using SHA-256
 */
function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify password against htpasswd hash
 * Supports: MD5 (APR1), SHA, plain MD5
 */
function verifyHtpasswdHash(password: string, hash: string): boolean {
    // APR1 MD5 (most common in htpasswd)
    if (hash.startsWith('$apr1$')) {
        return apacheMd5(password, hash) === hash;
    }

    // SHA (legacy)
    if (hash.startsWith('{SHA}')) {
        const shaHash = '{SHA}' + crypto.createHash('sha1').update(password).digest('base64');
        return shaHash === hash;
    }

    // Plain MD5 (legacy)
    if (hash.length === 32 && /^[a-f0-9]+$/i.test(hash)) {
        const md5Hash = crypto.createHash('md5').update(password).digest('hex');
        return md5Hash === hash;
    }

    // Bcrypt (requires bcrypt library)
    if (hash.startsWith('$2y$') || hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
        console.error('Bcrypt is not supported. Please use MD5 (APR1) format: htpasswd -m <file> <username>');
        return false;
    }

    return false;
}

/**
 * Middleware to verify app password if APP_PASSWORD_FILE is set
 */
export async function verifyAppPassword(req: Request, res: Response, next: NextFunction) {
    const appPasswordFile = process.env.APP_PASSWORD_FILE;

    // If no app password file is configured, allow access
    if (!appPasswordFile || appPasswordFile.trim() === '') {
        return next();
    }

    try {
        // Read the password file
        const passwordFilePath = path.resolve(appPasswordFile);
        const fileContent = (await fs.readFile(passwordFilePath, 'utf-8')).trim();

        // Get the provided credentials from request header
        const providedPassword = req.headers['x-app-password'] as string;

        if (!providedPassword) {
            return res.status(401).json({ error: 'App password required' });
        }

        // Check if file contains htpasswd format (username:hash)
        if (fileContent.includes(':')) {
            // Parse htpasswd format
            const lines = fileContent.split('\n');
            let authenticated = false;

            for (const line of lines) {
                if (!line.trim()) continue;

                const colonIndex = line.indexOf(':');
                if (colonIndex === -1) continue;

                const htpasswdHash = line.substring(colonIndex + 1);

                // Verify against htpasswd hash
                if (verifyHtpasswdHash(providedPassword, htpasswdHash)) {
                    authenticated = true;
                    break;
                }
            }

            if (!authenticated) {
                return res.status(403).json({ error: 'Invalid app password' });
            }
        } else {
            // Plain password in file - hash both and compare
            const expectedHash = hashPassword(fileContent);
            const providedHash = hashPassword(providedPassword);

            if (providedHash !== expectedHash) {
                return res.status(403).json({ error: 'Invalid app password' });
            }
        }

        // Password is correct, continue
        next();
    } catch (error) {
        console.error('Error verifying app password:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}