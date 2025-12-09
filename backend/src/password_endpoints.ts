import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { verifyAppPassword } from './auth_middleware';

const router = express.Router();
const PASSWORDS_DIR = path.resolve(__dirname, '../../data/passwords'); // Directory where .pass files are stored

// Apply authentication middleware to all routes
router.use(verifyAppPassword);

// Ensure passwords directory exists
(async () => {
    try {
        await fs.mkdir(PASSWORDS_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating passwords directory:', error);
    }
})();

// GET /api/password_files - List all .pass files
router.get('/password_files', async (req: Request, res: Response) => {
    try {
        // Read all files from directory
        const files = await fs.readdir(PASSWORDS_DIR);
        const passwoodFiles = files.filter((file) => {
            const ext = path.extname(file).toLowerCase();
            return ext === '.pass';
        });

        // Sort alphabetically
        passwoodFiles.sort();

        // Get file stats for each file
        const filesWithStats = await Promise.all(
            passwoodFiles.map(async (filename) => {
                const filePath = path.join(PASSWORDS_DIR, filename);
                const stats = await fs.stat(filePath);
                return {
                    filename,
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    created: stats.birthtime.toISOString(),
                };
            })
        );

        res.json({
            files: filesWithStats,
            total: filesWithStats.length,
        });
    } catch (error) {
        console.error('Error reading passwords directory:', error);
        res.status(500).json({ error: 'Failed to read passwords directory' });
    }
});

// GET /api/password_files/:filename - Download a specific .pass file
router.get('/password_files/:filename', async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;

        // Validate filename
        if (!filename.endsWith('.pass')) {
            return res.status(400).json({ error: 'Invalid file extension' });
        }

        const filePath = path.join(PASSWORDS_DIR, filename);

        // Security check: ensure the path is within PASSWORDS_DIR
        const resolvedPath = path.resolve(filePath);
        if (!resolvedPath.startsWith(path.resolve(PASSWORDS_DIR))) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if file exists
        await fs.access(filePath);

        // Read file as binary
        const fileData = await fs.readFile(filePath);

        // Set appropriate headers
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.send(fileData);
    } catch (error) {
        console.error('Error serving password file:', error);
        res.status(404).json({ error: 'Password file not found' });
    }
});

// POST /api/password_files/:filename - Save/update a .pass file
router.post('/password_files/:filename', async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;

        // Validate filename
        if (!filename.endsWith('.pass')) {
            return res.status(400).json({ error: 'Invalid file extension' });
        }

        const filePath = path.join(PASSWORDS_DIR, filename);

        // Security check: ensure the path is within PASSWORDS_DIR
        const resolvedPath = path.resolve(filePath);
        if (!resolvedPath.startsWith(path.resolve(PASSWORDS_DIR))) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get binary data from request body
        const data = req.body.data;
        if (!data) {
            return res.status(400).json({ error: 'No data provided' });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(data, 'base64');

        // Write file
        await fs.writeFile(filePath, buffer);

        res.json({ message: 'Password file saved successfully' });
    } catch (error) {
        console.error('Error saving password file:', error);
        res.status(500).json({ error: 'Failed to save password file' });
    }
});

// DELETE /api/password_files/:filename - Delete a .pass file
router.delete('/password_files/:filename', async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;

        // Validate filename
        if (!filename.endsWith('.pass')) {
            return res.status(400).json({ error: 'Invalid file extension' });
        }

        const filePath = path.join(PASSWORDS_DIR, filename);

        // Security check: ensure the path is within PASSWORDS_DIR
        const resolvedPath = path.resolve(filePath);
        if (!resolvedPath.startsWith(path.resolve(PASSWORDS_DIR))) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Delete file
        await fs.unlink(filePath);

        res.json({ message: 'Password file deleted successfully' });
    } catch (error) {
        console.error('Error deleting password file:', error);
        res.status(500).json({ error: 'Failed to delete password file' });
    }
});

export default router;
