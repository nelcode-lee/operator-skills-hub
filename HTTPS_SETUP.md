# HTTPS/SSL Configuration Guide

## 🔒 HTTPS Setup for Operator Skills Hub

This guide covers setting up HTTPS/SSL certificates for secure production deployment of the Operator Skills Hub.

## 📋 Prerequisites

- Domain name registered and pointing to your server
- Server with root/sudo access
- Ports 80 and 443 open in firewall
- Basic understanding of SSL certificates

## 🚀 Option 1: Let's Encrypt (Recommended - Free)

### Step 1: Install Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx

# macOS (with Homebrew)
brew install certbot
```

### Step 2: Generate SSL Certificate

```bash
# For Nginx
sudo certbot --nginx -d operatorskillshub.com -d www.operatorskillshub.com

# For Apache
sudo certbot --apache -d operatorskillshub.com -d www.operatorskillshub.com

# Manual mode (if you don't use Nginx/Apache)
sudo certbot certonly --manual -d operatorskillshub.com -d www.operatorskillshub.com
```

### Step 3: Auto-renewal Setup

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Option 2: Self-Signed Certificates (Development)

### Generate Self-Signed Certificate

```bash
# Create certificates directory
mkdir -p /etc/ssl/operatorskillshub
cd /etc/ssl/operatorskillshub

# Generate private key
openssl genrsa -out operatorskillshub.key 2048

# Generate certificate signing request
openssl req -new -key operatorskillshub.key -out operatorskillshub.csr

# Generate self-signed certificate
openssl x509 -req -days 365 -in operatorskillshub.csr -signkey operatorskillshub.key -out operatorskillshub.crt

# Set proper permissions
chmod 600 operatorskillshub.key
chmod 644 operatorskillshub.crt
```

## 🌐 Nginx Configuration

### Create Nginx Configuration

```nginx
# /etc/nginx/sites-available/operatorskillshub
server {
    listen 80;
    server_name operatorskillshub.com www.operatorskillshub.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name operatorskillshub.com www.operatorskillshub.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/operatorskillshub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/operatorskillshub.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API (FastAPI)
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location /static/ {
        alias /var/www/operatorskillshub/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/operatorskillshub /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 🐳 Docker Configuration

### Docker Compose with HTTPS

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://operatorskillshub.com/api
    restart: unless-stopped

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/operatorskillshub
      - SECRET_KEY=your-secure-secret-key
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=operatorskillshub
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

## 🔧 Application Configuration

### Update Environment Variables

```bash
# .env.production
# Security
SECRET_KEY=your-super-secure-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/operatorskillshub

# Redis
REDIS_URL=redis://localhost:6379

# CORS (Update for production)
ALLOWED_ORIGINS=https://operatorskillshub.com,https://www.operatorskillshub.com

# Trusted Hosts
TRUSTED_HOSTS=operatorskillshub.com,www.operatorskillshub.com

# SSL/TLS
SSL_CERT_PATH=/etc/letsencrypt/live/operatorskillshub.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/operatorskillshub.com/privkey.pem
```

### Update FastAPI Configuration

```python
# backend/app/core/config.py
class Settings(BaseSettings):
    # ... existing settings ...
    
    # HTTPS/SSL Settings
    ssl_cert_path: Optional[str] = None
    ssl_key_path: Optional[str] = None
    force_https: bool = True
    
    # CORS for production
    allowed_origins: list = [
        "https://operatorskillshub.com",
        "https://www.operatorskillshub.com"
    ]
    
    # Trusted hosts for production
    trusted_hosts: list = [
        "operatorskillshub.com",
        "www.operatorskillshub.com"
    ]
```

## 🚀 Production Deployment Script

### Create Deployment Script

```bash
#!/bin/bash
# deploy-https.sh

set -e

echo "🔒 Setting up HTTPS for Operator Skills Hub..."

# Update system
sudo apt update

# Install Nginx
sudo apt install nginx -y

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Stop services
sudo systemctl stop nginx

# Generate SSL certificate
sudo certbot certonly --standalone -d operatorskillshub.com -d www.operatorskillshub.com

# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/operatorskillshub
sudo ln -sf /etc/nginx/sites-available/operatorskillshub /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start services
sudo systemctl start nginx
sudo systemctl enable nginx

# Set up auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

echo "✅ HTTPS setup complete!"
echo "🌐 Your site is now available at: https://operatorskillshub.com"
```

## 🔍 SSL Testing

### Test SSL Configuration

```bash
# Test SSL certificate
openssl s_client -connect operatorskillshub.com:443 -servername operatorskillshub.com

# Test with SSL Labs
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=operatorskillshub.com

# Test with curl
curl -I https://operatorskillshub.com

# Check certificate expiration
echo | openssl s_client -servername operatorskillshub.com -connect operatorskillshub.com:443 2>/dev/null | openssl x509 -noout -dates
```

## 🛡️ Security Best Practices

### SSL/TLS Security

1. **Use Strong Ciphers**: Only allow TLS 1.2 and 1.3
2. **Perfect Forward Secrecy**: Use ECDHE cipher suites
3. **HSTS**: Enable HTTP Strict Transport Security
4. **Certificate Pinning**: Consider implementing certificate pinning
5. **Regular Updates**: Keep certificates updated

### Additional Security

1. **Firewall**: Only allow ports 80, 443, and 22
2. **Fail2Ban**: Install fail2ban for brute force protection
3. **Security Headers**: Implement comprehensive security headers
4. **Rate Limiting**: Configure rate limiting at Nginx level
5. **Monitoring**: Set up SSL certificate monitoring

## 📊 Monitoring & Maintenance

### Certificate Monitoring

```bash
# Check certificate expiration
certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Set up monitoring script
#!/bin/bash
# check-ssl.sh
DOMAIN="operatorskillshub.com"
EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_LEFT=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt 30 ]; then
    echo "WARNING: SSL certificate expires in $DAYS_LEFT days"
    # Send notification
fi
```

## 🆘 Troubleshooting

### Common Issues

1. **Certificate Not Found**
   ```bash
   sudo certbot certificates
   sudo certbot renew --force-renewal
   ```

2. **Nginx Configuration Error**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

3. **Port 80/443 Blocked**
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   ```

4. **DNS Not Propagated**
   ```bash
   nslookup operatorskillshub.com
   dig operatorskillshub.com
   ```

## 📚 Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)

---

**Last Updated**: December 2024
**Version**: 1.0.0
