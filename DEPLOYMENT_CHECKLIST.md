# 🚀 Fernando Backend Deployment Checklist

## ✅ Deployment Status (Jan 12, 2026)

**🎉 DEPLOYMENT SUCCESSFUL!**

### Current Deployment Details:

- **Server:** EC2 (t3.micro) - EU North (Stockholm)
- **IP:** 51.21.220.250
- **Port:** 5000 (Application), 6002 (Socket)
- **Process Manager:** PM2
- **Status:** ✅ RUNNING & ONLINE
- **Memory:** 56.6 MB
- **CPU:** 0%
- **Uptime:** Running

### Deployment Method Used:

```bash
✅ Node.js 18.20.8
✅ npm 10.8.2
✅ PM2 Process Manager
✅ Environment: Production
✅ Database: MongoDB Atlas Connected
```

---

## Pre-Deployment (Must Complete)

### 📋 Environment Setup

- [ ] `.env` file created from `.env.example`
- [ ] All required environment variables filled
- [ ] Strong secrets generated for JWT keys
- [ ] Production URLs configured (frontend, backend)

### 🗄️ Database Configuration

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with strong password
- [ ] Network access configured (IP whitelist)
- [ ] Connection string tested
- [ ] Database indexes created (if any)

### ☁️ AWS Setup

- [ ] AWS account created
- [ ] IAM user created with programmatic access
- [ ] S3 bucket created for file uploads
- [ ] S3 bucket CORS policy configured
- [ ] IVS channel created (for live streaming)
- [ ] AWS credentials added to `.env`

### 💳 Payment Gateway

- [ ] Stripe account created
- [ ] Stripe API keys (test/live) obtained
- [ ] Stripe webhook configured
- [ ] Payment success/cancel URLs set

### 📧 Email Service

- [ ] Email service configured (Gmail/SMTP)
- [ ] App password generated (for Gmail)
- [ ] Email credentials added to `.env`
- [ ] Test email sent successfully

### 🔐 Security

- [ ] All secrets are strong (min 32 characters)
- [ ] CORS origins configured correctly
- [ ] Rate limiting enabled
- [ ] Helmet security headers enabled
- [ ] No hardcoded credentials in code

---

## Deployment Options

### Option A: Docker Deployment (Recommended) 🐳

#### Local Docker Test

```bash
# 1. Build image
docker build -t fernando-backend:test .

# 2. Test run
docker run -p 4000:4000 --env-file .env fernando-backend:test

# 3. Test health endpoint
curl http://localhost:4000/api/v1/health
```

#### Docker Compose Deployment

```bash
# 1. Update .env file
cp .env.example .env
nano .env

# 2. Start services
docker-compose up -d

# 3. Check logs
docker-compose logs -f fernando-backend

# 4. Seed admin user
docker-compose exec fernando-backend npm run seed

# 5. Health check
curl http://localhost:4000/api/v1/health
```

**Post-Deployment:**

- [ ] All containers running
- [ ] Health check returns 200 OK
- [ ] Database connected
- [ ] Logs show no errors

---

### Option B: VPS Deployment (Ubuntu/Debian) 🖥️

#### Initial Server Setup

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2
sudo npm install -g pm2

# 4. Install Nginx
sudo apt install nginx -y

# 5. Install Git
sudo apt install git -y
```

#### Application Deployment

```bash
# 1. Clone repository
cd /var/www
sudo git clone <your-repo-url> fernando-backend
cd fernando-backend

# 2. Install dependencies
npm install

# 3. Create .env file
sudo nano .env
# Paste all environment variables

# 4. Build application
npm run build

# 5. Seed admin user
npm run seed

# 6. Start with PM2
pm2 start ecosystem.config.js

# 7. Save PM2 configuration
pm2 save
pm2 startup
```

#### Nginx Configuration

```bash
# 1. Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/fernando-backend

# 2. Update domain name in config
sudo nano /etc/nginx/sites-available/fernando-backend
# Replace 'your-domain.com' with actual domain

# 3. Enable site
sudo ln -s /etc/nginx/sites-available/fernando-backend /etc/nginx/sites-enabled/

# 4. Test nginx config
sudo nginx -t

# 5. Restart nginx
sudo systemctl restart nginx
```

#### SSL Certificate (Let's Encrypt)

```bash
# 1. Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# 2. Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 3. Test auto-renewal
sudo certbot renew --dry-run
```

**Post-Deployment:**

- [ ] Application running on PM2
- [ ] Nginx configured and running
- [ ] SSL certificate installed
- [ ] Domain pointing to server
- [ ] Health check accessible via domain

---

### Option C: Cloud Platform Deployment ☁️

#### Railway.app

1. [ ] Connect GitHub repository
2. [ ] Add all environment variables in dashboard
3. [ ] Deploy from main branch
4. [ ] Configure custom domain (optional)
5. [ ] Test deployed URL

#### Render.com

1. [ ] Create new Web Service
2. [ ] Connect GitHub repository
3. [ ] Select "Docker" environment
4. [ ] Add environment variables
5. [ ] Deploy
6. [ ] Configure custom domain

#### DigitalOcean App Platform

1. [ ] Create new App
2. [ ] Connect GitHub repository
3. [ ] Select Dockerfile build
4. [ ] Add environment variables
5. [ ] Add Redis as managed database (optional)
6. [ ] Deploy

#### AWS ECS/Fargate

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name fernando-backend

# 2. Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# 3. Build and tag image
docker build -t fernando-backend .
docker tag fernando-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/fernando-backend:latest

# 4. Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/fernando-backend:latest

# 5. Create ECS task definition and service via AWS Console
```

**Post-Deployment:**

- [ ] Application deployed successfully
- [ ] Environment variables configured
- [ ] Custom domain configured (if applicable)
- [ ] Health check passing

---

## Post-Deployment Verification ✅

### 1. Health Check

```bash
curl https://your-domain.com/api/v1/health
```

Expected response:

```json
{
  "status": "UP",
  "timestamp": "2025-12-30T...",
  "uptime": 123.45,
  "database": "connected",
  "environment": "production"
}
```

### 2. API Endpoints Test

```bash
# Test user registration
curl -X POST https://your-domain.com/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test@1234"
  }'

# Test login
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }'
```

### 3. Database Connection

- [ ] MongoDB connection successful
- [ ] Admin user seeded
- [ ] Collections created

### 4. File Upload Test

- [ ] S3 bucket accessible
- [ ] File upload working
- [ ] Files accessible via URLs

### 5. Socket.IO Test

- [ ] WebSocket connection established
- [ ] Real-time events working

### 6. Email Test

- [ ] Welcome email sent
- [ ] Password reset email working

---

## Monitoring Setup 📊

### 1. Application Monitoring

```bash
# PM2 monitoring (if using PM2)
pm2 monit

# PM2 logs
pm2 logs fernando-backend

# Docker logs (if using Docker)
docker-compose logs -f fernando-backend
```

### 2. External Monitoring Services

- [ ] UptimeRobot configured for uptime monitoring
- [ ] Sentry configured for error tracking (optional)
- [ ] LogDNA/Papertrail for log management (optional)

### 3. Alerts Setup

- [ ] Email alerts for downtime
- [ ] Slack/Discord webhook for critical errors
- [ ] Database backup alerts

---

## Backup Strategy 💾

### Database Backups

```bash
# Manual MongoDB backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/fernando"

# Automated backups (MongoDB Atlas)
# Enable automated backups in Atlas dashboard
```

### Application Backups

```bash
# Backup .env file (securely)
# Backup uploaded files from S3
# Backup configuration files
```

**Schedule:**

- [ ] Daily database backups configured
- [ ] Weekly full backups
- [ ] Backup retention policy (30 days)

---

## Performance Optimization ⚡

- [ ] Enable gzip compression (nginx)
- [ ] Configure Redis caching
- [ ] Add database indexes
- [ ] Enable CDN for static assets
- [ ] Optimize images before upload
- [ ] Monitor and optimize slow queries

---

## Security Hardening 🔒

### Server Security (VPS)

```bash
# 1. Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 2. Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# 3. Install fail2ban
sudo apt install fail2ban -y
```

### Application Security

- [ ] Environment variables not exposed
- [ ] Error messages don't leak sensitive info
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] SQL injection protection (Mongoose)
- [ ] XSS protection (helmet)

---

## Maintenance Tasks 🔧

### Daily

- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Check disk space

### Weekly

- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Test backup restoration

### Monthly

- [ ] Update dependencies (`npm update`)
- [ ] Security audit (`npm audit`)
- [ ] Review and rotate logs
- [ ] Database performance review

---

## Rollback Plan 🔄

### Docker Rollback

```bash
# Rollback to previous image
docker-compose down
docker pull username/fernando-backend:previous-tag
docker-compose up -d
```

### PM2 Rollback

```bash
# Deploy previous version
cd /var/www/fernando-backend
git checkout previous-commit
npm install
npm run build
pm2 restart fernando-backend
```

---

## Common Issues & Solutions 🔧

### Issue: Port already in use

```bash
# Find and kill process
sudo lsof -ti:4000 | xargs kill -9
# Or change PORT in .env
```

### Issue: Database connection failed

- Check DATABASE_URL format
- Verify IP whitelist in MongoDB Atlas
- Test connection string locally

### Issue: File upload failing

- Check AWS credentials
- Verify S3 bucket permissions
- Check CORS policy

### Issue: Docker build failing

```bash
# Clear Docker cache
docker system prune -a
# Rebuild without cache
docker-compose build --no-cache
```

---

## Post-Deployment Tasks ✅ (Jan 12, 2026)

### Server Management Commands

**Check server status:**

```bash
ssh -i "fernando-backends.pem" ubuntu@51.21.220.250
pm2 status
pm2 logs fernando-backend
```

**Restart server:**

```bash
pm2 restart fernando-backend
```

**Stop/Start server:**

```bash
pm2 stop fernando-backend
pm2 start fernando-backend
```

**Future deployments (pull latest code):**

```bash
cd /home/ubuntu/backend
git pull origin main
npm install
npm run build
pm2 restart fernando-backend
```

### Health Checks ✅

- [x] **Server Running:** http://51.21.220.250:5000 ✅
- [x] **Database Connected:** ✅ (MongoDB Atlas)
- [x] **PM2 Process Online:** ✅
- [x] **AWS S3 Configured:** ✅
- [x] **IVS Streaming Setup:** ✅
- [x] **Email Service Active:** ✅ (SMTP)
- [x] **Stripe Integration:** ✅

### Next Steps:

1. **Frontend Deployment:**

   - Update API URL to: `http://51.21.220.250:5000`
   - Deploy frontend to AWS/Vercel/Railway

2. **Domain Configuration (Optional):**

   - Point custom domain to: `51.21.220.250`
   - Setup Nginx reverse proxy
   - Configure SSL with Let's Encrypt

3. **Monitoring:**
   - Setup PM2 monitoring: `pm2 web`
   - Monitor logs regularly
   - Keep dependencies updated

---

## Support & Documentation 📚

- API Documentation: [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)
- Streaming Guide: [STREAM_API_POSTMAN.md](./STREAM_API_POSTMAN.md)
- Database Architecture: [DB_ARCHITECTURE.md](./DB_ARCHITECTURE.md)
- Deployment Guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## Final Checklist ✓

Before going live:

- [ ] All environment variables configured
- [ ] Database connected and seeded
- [ ] SSL certificate installed
- [ ] Health check passing
- [ ] All APIs tested
- [ ] File upload working
- [ ] Email sending working
- [ ] Payment gateway tested
- [ ] Monitoring setup complete
- [ ] Backup strategy in place
- [ ] Domain configured
- [ ] Firewall configured (if VPS)
- [ ] Error tracking enabled
- [ ] Documentation updated

---

## 🎉 Deployment Complete!

Your Fernando Backend is now live at: `https://your-domain.com`

Health Check: `https://your-domain.com/api/v1/health`
