# OwnPassword - Quick Start Guide

## What is OwnPassword?

OwnPassword is a self-hosted password manager with military-grade encryption. It stores your passwords in encrypted `.ownpwd` files that can only be decrypted with your master password.

## Key Features

✅ **AES-256-GCM Encryption** - Industry-standard encryption  
✅ **Multiple Password Vaults** - Organize passwords in separate files  
✅ **Password Generator** - Create strong, random passwords  
✅ **Search & Filter** - Find passwords quickly by tags, title, or URL  
✅ **Beautiful UI** - Modern, responsive interface  
✅ **Self-Hosted** - You control your data  

## Getting Started

### 1. Start the Application

**Development:**
```bash
docker compose -f docker-compose-dev.yaml up --build
```

**Production:**
```bash
docker compose up -d --build
```

### 2. Access the App

Open your browser to `http://localhost:3009` (production) or `http://localhost:5179` (development)

### 3. Create Your First Vault

1. Click **"+ Create New"**
2. Enter a name for your password file (e.g., "personal", "work")
3. Choose a **strong master password** (12+ characters, mixed case, numbers, symbols)
4. Confirm the password
5. Click **"Create & Unlock"**

⚠️ **IMPORTANT**: Your master password cannot be recovered if lost!

### 4. Add Passwords

1. In the left panel, fill in the password entry form:
   - **Title**: Name of the service (e.g., "GitHub")
   - **Username**: Your username or email
   - **Password**: Click "Generate" for a strong password or enter your own
   - **URL**: Website URL (optional)
   - **Notes**: Any additional information (optional)
   - **Tags**: Comma-separated tags for organization (optional)

2. Click **"+ Add Entry"**

### 5. Save Your Vault

Click the **"💾 Save"** button in the top-right to encrypt and save your password file.

## Usage Tips

### Password Management
- **View Password**: Click the eye icon (👁️) to show/hide passwords
- **Copy Password**: Click the clipboard icon (📋) to copy
- **Edit Entry**: Click "Edit" to modify an entry
- **Delete Entry**: Click "Delete" to remove an entry

### Organization
- Use **tags** to group related passwords (e.g., "work", "personal", "banking")
- Create **multiple vaults** for different contexts (personal, work, family)
- Use the **search bar** to quickly find entries

### Security Best Practices
- ✅ Use a unique master password for each vault
- ✅ Use the password generator for all new passwords
- ✅ Keep your `.passwood` files backed up in secure locations
- ✅ Never share your master password
- ✅ Use HTTPS in production (configure reverse proxy)
- ❌ Don't reuse passwords across services
- ❌ Don't store master passwords in plain text

## File Structure

```
/app/data/passwords/          # Your encrypted password files
├── personal.passwood         # Personal passwords
├── work.passwood            # Work passwords
└── banking.passwood         # Banking passwords
```

Each `.passwood` file is:
- **Encrypted** with AES-256-GCM
- **Self-contained** - includes all metadata
- **Portable** - can be backed up, transferred, or shared (encrypted)

## Backup & Recovery

### Backup
```bash
# Copy your password files to a secure location
cp /home/campfire/data/other/passwords/*.passwood /path/to/backup/
```

### Restore
```bash
# Copy backed up files to the passwords directory
cp /path/to/backup/*.passwood /home/campfire/data/other/passwords/
```

## Troubleshooting

### Can't unlock file
- ✅ Check that you're using the correct master password
- ✅ Try typing the password slowly
- ✅ Check for caps lock

### File not showing up
- ✅ Ensure the file has `.passwood` extension
- ✅ Check file permissions
- ✅ Refresh the file list

### Lost master password
- ❌ Cannot be recovered - the encryption is too strong
- ✅ You'll need to create a new vault if you have a backup of individual passwords

## API Endpoints

If you want to integrate with other tools:

```
GET  /api/password_files              # List all .passwood files
GET  /api/password_files/:filename    # Download a file
POST /api/password_files/:filename    # Save/update a file  
DELETE /api/password_files/:filename  # Delete a file
```

## Security Architecture

```
Master Password 
    ↓
PBKDF2 (600k iterations) + Salt
    ↓
256-bit Encryption Key
    ↓
AES-256-GCM Encryption
    ↓
Encrypted .passwood File
```

## Support

- 📚 Full documentation: See `README.md`
- 🔐 File format details: See `frontend/src/cryptor/README.md`
- 🐛 Issues: Report on GitHub
- 💡 Feature requests: Open an issue

---

**Remember**: Your security is only as strong as your master password. Choose wisely! 🔐
