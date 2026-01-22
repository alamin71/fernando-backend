# Fernando Backend Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables

- [ ] Copy `.env.example` to `.env`
- [ ] Update all environment variables with production values
- [ ] Ensure all secrets are strong and secure
- [ ] Configure MongoDB connection string
- [ ] Set up AWS credentials (S3, IVS)
- [ ] Configure Stripe API keys
- [ ] Set up email service credentials

### 2. Database

- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user created with appropriate permissions
- [ ] IP whitelist configured (or 0.0.0.0/0 for cloud deployments)
- [ ] Connection string tested

### 3. AWS Services

- [ ] S3 bucket created for file uploads
- [ ] S3 bucket CORS configured
- [ ] IAM user created with S3 access
- [ ] IVS channel created (for streaming)
- [ ] AWS credentials configured

### 4. External Services

- [ ] Stripe account configured
- [ ] Email service (Gmail/SMTP) configured
- [ ] Redis instance available (or use Docker Compose)

### 5. Security

- [ ] All secrets are environment variables (not hardcoded)
- [ ] CORS origins configured properly
- [ ] Rate limiting configured
- [ ] Helmet security headers enabled

---

## Deployment Options

### Option 1: Docker (Recommended)

#### Build and Run with Docker Compose

```bash
# Build the image
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f fernando-backend

# Stop services
docker-compose down
```

#### Build and Run with Docker only

```bash
# Build image
docker build -t fernando-backend:latest .

# Run container
docker run -d \
  --name fernando-backend \
  -p 4000:4000 \
  -p 4001:4001 \
  --env-file .env \
  fernando-backend:latest

# View logs
docker logs -f fernando-backend
```

---

### Option 2: Cloud Platform Deployments

#### A. AWS ECS/Fargate

1. Push Docker image to ECR:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag fernando-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/fernando-backend:latest

docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/fernando-backend:latest
```

2. Create ECS Task Definition with environment variables
3. Create ECS Service
4. Configure Application Load Balancer

#### B. Railway.app

1. Connect GitHub repository
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

#### C. Render.com

1. Connect GitHub repository
2. Select "Docker" as environment
3. Add environment variables
4. Deploy

#### D. DigitalOcean App Platform

1. Connect GitHub repository
2. Configure environment variables
3. Use Dockerfile for deployment
4. Add Redis as managed database

#### E. Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create fernando-backend

# Add environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=your-mongo-url
# ... add all other env vars

# Deploy with Docker
heroku container:push web
heroku container:release web
```

---

### Option 3: VPS (Ubuntu/Debian)

#### Setup on VPS

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone <your-repo-url>
cd fernando-backend

# Install dependencies
npm install

# Create .env file
nano .env
# Paste your environment variables

# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/server.js --name fernando-backend

# Save PM2 process
pm2 save
pm2 startup

# Setup Nginx reverse proxy
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/fernando-backend
```

Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /socket.io/ {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/fernando-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Certbot
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Post-Deployment

### 1. Health Check

```bash
curl https://your-domain.com/api/v1/health
```

### 2. Seed Admin User

```bash
npm run seed
```

### 3. Monitor Logs

```bash
# Docker
docker-compose logs -f

# PM2
pm2 logs fernando-backend
```

### 4. Setup Monitoring

- Configure logging service (e.g., LogDNA, Papertrail)
- Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
- Configure error tracking (e.g., Sentry)

---

## Environment-Specific Configurations

### Production

- `NODE_ENV=production`
- Use strong, unique secrets
- Enable all security features
- Use managed database services
- Configure CDN for static assets
- Enable HTTPS/SSL

### Staging

- Use separate database
- Mirror production configuration
- Can use less strict rate limits for testing

---

## Troubleshooting

### Common Issues

1. **Cannot connect to database**

   - Check DATABASE_URL format
   - Verify IP whitelist in MongoDB Atlas
   - Test connection string locally

2. **Port already in use**

   - Change PORT in .env
   - Kill process using the port: `lsof -ti:4000 | xargs kill`

3. **Environment variables not loaded**

   - Ensure .env file exists
   - Check file permissions
   - Verify dotenv is configured in code

4. **Docker build fails**
   - Clear Docker cache: `docker system prune -a`
   - Check Dockerfile syntax
   - Ensure all files are accessible (not in .dockerignore)

---

## Backup Strategy

1. **Database Backups**

   - MongoDB Atlas automatic backups
   - Or use `mongodump` for manual backups

2. **File Storage**

   - S3 versioning enabled
   - Regular S3 bucket backups

3. **Configuration**
   - Keep .env.example updated
   - Document all environment variables

---

## Security Best Practices

- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Use rate limiting
- [ ] Keep dependencies updated
- [ ] Use strong JWT secrets
- [ ] Enable helmet security headers
- [ ] Validate all inputs
- [ ] Use parameterized queries (Mongoose does this)
- [ ] Implement proper error handling (don't expose stack traces)

---

## Performance Optimization

- [ ] Enable compression middleware ✓
- [ ] Use Redis for caching/sessions
- [ ] Optimize database queries (add indexes)
- [ ] Use CDN for static assets
- [ ] Enable gzip compression in Nginx
- [ ] Monitor and optimize slow queries
- [ ] Use connection pooling (Mongoose default)

---

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review and rotate secrets quarterly
- Monitor error logs daily
- Check performance metrics weekly
- Review security advisories

### Commands

```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## Support & Contact

For issues or questions, contact the development team.
