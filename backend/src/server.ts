import express from 'express';
import cors from 'cors';
import path from 'path';
import passwordEndpoints from './password_endpoints';
import { verifyAppPassword } from './auth_middleware';

const PORT = 3010;
const app = express();

// Allow specific connections
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5180',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-app-password'],
}));

app.use(express.json({ limit: '50mb' })); // Increase limit for encrypted files

// Apply app password authentication middleware to all /api routes
app.use('/api', verifyAppPassword);

app.use('/api', passwordEndpoints);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.resolve(__dirname, '../../frontend/dist');

  // 1. Serve static files
  app.use(express.static(staticPath));

  // 2. Frontend fallback (only for non-API GET requests)
  app.use((req, res, next) => {
    if (
      req.method === 'GET' &&
      !req.path.startsWith('/api') &&
      !req.path.includes('.') // skip actual static files like .js/.css
    ) {
      res.sendFile(path.join(staticPath, 'index.html'));
    } else {
      next();
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Backend server started and running on http://localhost:${PORT}`);
});