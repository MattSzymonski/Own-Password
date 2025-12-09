# App Password Authentication

This application supports app-level password protection using htpasswd files or plain text passwords.

## Setup Instructions

### Option 1: Using htpasswd (Recommended)

1. **Install htpasswd** (if not already installed):
   ```bash
   sudo apt-get install apache2-utils
   ```

2. **Create htpasswd file with MD5 encryption**:
   ```bash
   htpasswd -cm /path/to/.htpasswd username
   ```
   
   Or to add more users to an existing file (without `-c` flag):
   ```bash
   htpasswd -m /path/to/.htpasswd username
   ```

3. **Set proper permissions**:
   ```bash
   chmod 600 /path/to/.htpasswd
   ```

4. **Configure docker-compose**:
   ```yaml
   environment:
     - APP_PASSWORD_FILE=/app/data/passwords/.htpasswd
     - REQUIRE_APP_PASSWORD=true  # or use VITE_REQUIRE_APP_PASSWORD=true in dev
   ```

   Make sure to mount the file in volumes:
   ```yaml
   volumes:
     - /path/to/.htpasswd:/app/data/passwords/.htpasswd:ro
   ```

### Option 2: Plain Text Password File

1. **Create password file**:
   ```bash
   echo "your_password_here" > /path/to/app_password.txt
   chmod 600 /path/to/app_password.txt
   ```

2. **Configure docker-compose**:
   ```yaml
   environment:
     - APP_PASSWORD_FILE=/app/data/passwords/app_password.txt
   ```

## Supported htpasswd Formats

- **MD5 (APR1)** - Recommended, created with `htpasswd -m`
  - Format: `$apr1$salt$hash`
  
- **SHA** - Legacy format
  - Format: `{SHA}base64hash`

- **Plain MD5** - Legacy format
  - Format: 32-character hex string

**Note**: Bcrypt is not currently supported.

## Security Notes

- Always use HTTPS in production to protect passwords in transit
- Keep password files outside the web root
- Set restrictive file permissions (600 or 400)
- Use htpasswd format for better security over plain text

## Example

```bash
# Create htpasswd file
htpasswd -cm /home/campfire/data/other/passwords/.htpasswd myuser

# Set in docker-compose-dev.yaml
- APP_PASSWORD_FILE=/app/data/passwords/.htpasswd

# Mount in volumes
- /home/campfire/data/other/passwords/.htpasswd:/app/data/passwords/.htpasswd:ro
```
