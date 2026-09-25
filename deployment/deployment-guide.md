# SecureAuth X — Deployment Guide

This guide provides step-by-step instructions for deploying SecureAuth X to a production environment using Docker and Nginx.

## 1. Prerequisites

- A Linux server (Ubuntu 22.04 LTS recommended)
- Docker & Docker Compose installed
- A domain name pointing to your server's IP
- SSL/TLS Certificates (e.g., Let's Encrypt / Certbot)

## 2. Server Preparation

1. **Update packages:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
2. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```
   *(Log out and log back in to apply group changes)*

## 3. Clone and Configure

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/secureauth-x.git
   cd secureauth-x
   ```

2. **Setup Environment Variables:**
   Create the `.env` file in the root directory (used by docker-compose):
   ```bash
   cp backend/.env.example .env
   nano .env
   ```
   
   **CRITICAL PRODUCTION VARIABLES:**
   - `NODE_ENV=production`
   - `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET` (Use 64-character random strings)
   - `COOKIE_SECRET` (For signing cookies)
   - `MONGO_USERNAME` & `MONGO_PASSWORD` (Strong credentials)
   - `CLIENT_URL=https://your-domain.com`

## 4. SSL Configuration (Let's Encrypt)

Before starting Nginx, generate SSL certificates. Nginx will require these to bind to port 443.

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
```

*Note: You must map these certificates into the Nginx container by editing `deployment/docker-compose.yml` and updating `deployment/nginx.conf` to handle port 443 and SSL directives.*

## 5. Deployment

1. **Build and Run:**
   ```bash
   docker-compose -f deployment/docker-compose.yml up -d --build
   ```

2. **Verify Containers:**
   ```bash
   docker ps
   ```
   You should see 3 running containers:
   - `secureauth-frontend` (Nginx)
   - `secureauth-backend` (Node.js API)
   - `secureauth-mongodb` (Database)

3. **Check Logs:**
   Ensure there are no crash loops:
   ```bash
   docker-compose -f deployment/docker-compose.yml logs -f
   ```

## 6. Post-Deployment (Seed Data)

If this is a fresh install, run the seed script to create the initial Admin user.

```bash
docker exec -it secureauth-backend node /app/database/seed-data.js
```

You can now log in at `https://your-domain.com` using the admin credentials.

## 7. Maintenance & Backup

### Backup MongoDB
Automate this via cron to backup your database:
```bash
docker exec secureauth-mongodb mongodump -u $MONGO_USERNAME -p $MONGO_PASSWORD --db secureauth-x --archive=/data/db/backup.gz --gzip
```

### Updating the Platform
```bash
git pull origin main
docker-compose -f deployment/docker-compose.yml build
docker-compose -f deployment/docker-compose.yml up -d
```
