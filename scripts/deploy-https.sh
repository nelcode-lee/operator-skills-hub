#!/bin/bash
# HTTPS Deployment Script for Operator Skills Hub
# Run this script on your production server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="operatorskillshub.com"
EMAIL="admin@operatorskillshub.com"
NGINX_CONFIG="/etc/nginx/sites-available/operatorskillshub"
NGINX_ENABLED="/etc/nginx/sites-enabled/operatorskillshub"

echo -e "${BLUE}🔒 Setting up HTTPS for Operator Skills Hub...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Update system packages
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install required packages
echo -e "${YELLOW}📦 Installing required packages...${NC}"
apt install -y nginx certbot python3-certbot-nginx ufw fail2ban

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure fail2ban
echo -e "${YELLOW}🛡️ Configuring fail2ban...${NC}"
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Stop Nginx temporarily
echo -e "${YELLOW}⏹️ Stopping Nginx...${NC}"
systemctl stop nginx

# Generate SSL certificate
echo -e "${YELLOW}🔐 Generating SSL certificate...${NC}"
certbot certonly --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Create Nginx configuration
echo -e "${YELLOW}⚙️ Creating Nginx configuration...${NC}"
cat > $NGINX_CONFIG << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name operatorskillshub.com www.operatorskillshub.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name operatorskillshub.com www.operatorskillshub.com;

    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/operatorskillshub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/operatorskillshub.com/privkey.pem;
    
    # SSL Security Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Remove server signature
    server_tokens off;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # Frontend (Next.js) - Port 3000
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
    
    # Backend API (FastAPI) - Port 8000
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Login endpoint with stricter rate limiting
    location /api/auth/token {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files with caching
    location /static/ {
        alias /var/www/operatorskillshub/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Enable the site
echo -e "${YELLOW}🔗 Enabling Nginx site...${NC}"
ln -sf $NGINX_CONFIG $NGINX_ENABLED
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
nginx -t

# Start Nginx
echo -e "${YELLOW}🚀 Starting Nginx...${NC}"
systemctl start nginx
systemctl enable nginx

# Set up automatic certificate renewal
echo -e "${YELLOW}🔄 Setting up automatic certificate renewal...${NC}"
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

# Create security.txt
echo -e "${YELLOW}📄 Creating security.txt...${NC}"
mkdir -p /var/www/operatorskillshub
cat > /var/www/operatorskillshub/security.txt << EOF
Contact: security@operatorskillshub.com
Expires: 2025-12-31T23:59:59.000Z
Encryption: https://operatorskillshub.com/pgp-key.txt
Preferred-Languages: en
Canonical: https://operatorskillshub.com/.well-known/security.txt
EOF

# Create robots.txt
cat > /var/www/operatorskillshub/robots.txt << EOF
User-agent: *
Allow: /

Sitemap: https://operatorskillshub.com/sitemap.xml
EOF

# Set proper permissions
chown -R www-data:www-data /var/www/operatorskillshub
chmod -R 755 /var/www/operatorskillshub

# Test SSL configuration
echo -e "${YELLOW}🧪 Testing SSL configuration...${NC}"
if command -v openssl &> /dev/null; then
    echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates
fi

# Display final status
echo -e "${GREEN}✅ HTTPS setup complete!${NC}"
echo -e "${GREEN}🌐 Your site is now available at: https://$DOMAIN${NC}"
echo -e "${GREEN}🔒 SSL certificate is valid and secure${NC}"
echo -e "${GREEN}🔄 Automatic renewal is configured${NC}"

# Display next steps
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "1. Update your DNS records to point to this server"
echo -e "2. Configure your application with the production environment variables"
echo -e "3. Set up monitoring and logging"
echo -e "4. Test all functionality"
echo -e "5. Set up regular backups"

# Display security recommendations
echo -e "${YELLOW}🛡️ Security recommendations:${NC}"
echo -e "1. Change all default passwords"
echo -e "2. Set up fail2ban monitoring"
echo -e "3. Configure log monitoring"
echo -e "4. Set up regular security updates"
echo -e "5. Monitor SSL certificate expiration"

echo -e "${GREEN}🎉 Deployment complete!${NC}"
