<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="media/fonty_logo_white.png">
    <img src="media/fonty_logo_black.png" width="500">
  </picture>
</p>


**Modern, minimal and selfhosted password manager** - Keep securely encrypted password files on your server and access them wherever you want through the browser. No installation required.

# Features
- Military-grade and well-documented password encryption format
- Password vault collections
- Sleak interface
- Runs in a single Docker container - 1 minute deployment on your server - Full control of your data, no cloud dependencies
- 


**Modern self-hosted password manager** - Securely store and manage your passwords with military-grade AES-256-GCM encryption. Access your password vault through a beautiful, intuitive interface.

# Features

- 🔐 **Military-Grade Encryption** - AES-256-GCM encryption with PBKDF2 key derivation (600,000 iterations)
- 📁 **Multiple Vaults** - Create and manage multiple encrypted password files
- 🔍 **Smart Search** - Quickly find passwords by title, username, URL, or tags
- 🎯 **Password Generator** - Generate strong, random passwords with customizable options
- 📊 **Password Strength Meter** - Visual feedback on password security
- 🏷️ **Tags & Organization** - Organize passwords with tags and custom fields
- 💾 **Auto-Save** - Encrypted backups saved to your server
- 🎨 **Modern UI** - Beautiful, responsive interface with Tailwind CSS
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- 🌐 **Self-Hosted** - Full control of your data, no cloud dependencies

# Deployment

OwnPassword is meant to run as self-hosted Docker container.

## Quick Start

1. **Prepare the data directory**
   
   Create a directory for your encrypted password files:
   ```bash
   mkdir -p /path/to/your/passwords
   ```
   
   Update the volume mount in `docker-compose.yaml`:
   ```yaml
   volumes:
     - /path/to/your/passwords:/app/data/passwords  # Change this path
   ```

2. **Build and run**
   ```bash
   docker compose up -d --build
   ```

3. **Access the application**
   - Application runs on port 3009 (configure reverse proxy as needed)
   - Open your browser and navigate to `http://localhost:3009`
   - Create your first password vault or open an existing `.passwood` file

## Security Notes

- **Master Password**: Never share or store your master password. It cannot be recovered if lost.
- **Backup**: Regularly backup your `.passwood` files to multiple secure locations
- **HTTPS**: Always use HTTPS in production (configure your reverse proxy)
- **Access Control**: Restrict network access to the application
- **File Permissions**: Ensure proper file permissions on the passwords directory

---

# For developers

## Tech Stack

### Frontend
- **TypeScript** - Type-safe JavaScript
- **React** - UI component library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Web Crypto API** - Browser-native cryptography

### Backend
- **TypeScript** - Type-safe JavaScript
- **Express** - Web framework for Node.js
- **Node.js** - JavaScript runtime

### Encryption
- **AES-256-GCM** - Authenticated encryption with associated data
- **PBKDF2-SHA256** - Key derivation (600,000 iterations, OWASP recommended)
- **HMAC-SHA256** - Header integrity verification

## Project Structure

```
own-password/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── server.ts          # Express server setup
│   │   └── password_endpoints.ts  # Password file API endpoints
│   ├── data/
│   │   └── passwords/         # Encrypted .passwood files
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Frontend React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── MainPage.tsx           # Main application component
│   │   │   ├── PasswordFilePicker.tsx # File selection UI
│   │   │   └── PasswordFileEditor.tsx # Password vault editor
│   │   ├── cryptor/           # Encryption library
│   │   │   ├── crypto.ts      # Cryptographic primitives
│   │   │   ├── format.ts      # .passwood file format
│   │   │   ├── types.ts       # TypeScript interfaces
│   │   │   └── utils.ts       # Helper functions
│   │   ├── api/
│   │   │   └── passwordApi.ts # Backend API client
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yaml         # Production deployment
├── docker-compose-dev.yaml     # Development setup
└── README.md
```

## Development

### Prerequisites
- Node.js 18+
- Docker (optional, for containerized development)

### Local Development

1. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Run in development mode**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

3. **Or use Docker**
   ```bash
   docker compose -f docker-compose-dev.yaml up --build
   ```

### API Endpoints

- `GET /api/password_files` - List all .passwood files
- `GET /api/password_files/:filename` - Download a password file
- `POST /api/password_files/:filename` - Save/update a password file
- `DELETE /api/password_files/:filename` - Delete a password file

## File Format (.passwood)

See [frontend/src/cryptor/README.md](frontend/src/cryptor/README.md) for detailed documentation on the encrypted file format.

### Key Features
- 256-byte header with metadata and HMAC
- AES-256-GCM encrypted payload
- Unique salt and IV per file
- JSON database structure (encrypted)
- Password strength validation

## Security Architecture

```
┌─────────────────────────────────────────┐
│         User Master Password            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    PBKDF2-SHA256 (600k iterations)      │
│         + Random Salt (256-bit)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Encryption Key (256-bit)          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      AES-256-GCM Encryption             │
│    + Unique IV + Auth Tag               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Encrypted .passwood File            │
│    (Header + Encrypted Payload)         │
└─────────────────────────────────────────┘
```

## Best Practices

### For Users
- Use a strong master password (12+ characters, mixed case, numbers, symbols)
- Never reuse your master password
- Keep backups of your .passwood files in secure locations
- Use the password generator for new passwords
- Regularly update stored passwords
- Lock the application when not in use

### For Developers
- Never log decrypted data
- Clear sensitive data from memory when done
- Use HTTPS in production
- Implement rate limiting on the backend
- Add authentication for multi-user deployments
- Regular security audits

## Browser Compatibility

Requires modern browsers with Web Crypto API support:
- ✅ Chrome 60+
- ✅ Firefox 57+
- ✅ Safari 11+
- ✅ Edge 79+

## Future Enhancements

- [ ] Argon2id support via WebAssembly
- [ ] Hardware security key support (WebAuthn)
- [ ] Browser extension for auto-fill
- [ ] Mobile app (React Native)
- [ ] Password sharing with encryption
- [ ] 2FA/TOTP integration
- [ ] Password breach checking
- [ ] Import from other password managers
- [ ] Secure notes and documents
- [ ] Multi-user support with access control

## License

MIT License - See LICENSE file for details

## Security

If you discover a security vulnerability, please email security@example.com. Do not open a public issue.

---

Built with ❤️ for privacy and security