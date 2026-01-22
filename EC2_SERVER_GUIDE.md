# 🚀 EC2 Server Management Guide

**Server Details:**

- **IP:** 51.21.220.250
- **Port:** 5000 (Application), 6002 (Socket)
- **Region:** EU North (Stockholm)
- **OS:** Ubuntu 24.04 LTS
- **Process Manager:** PM2

---

## 📌 Prerequisites

1. **AWS Key Pair File:** `fernando-backends.pem`

   - Location: `D:\Desktop\fernando-backends.pem` (Windows)
   - Permissions: 400 (Read-only)

2. **SSH Client:** Git Bash, PowerShell, or Terminal

---

## 🔗 Connection Methods

### Method 1: Windows (Git Bash) - ✅ RECOMMENDED

```bash
cd /d/Desktop/
ssh -i "fernando-backends.pem" ubuntu@51.21.220.250
```

### Method 2: Windows (PowerShell)

```powershell
ssh -i "D:\Desktop\fernando-backends.pem" ubuntu@51.21.220.250
```

### Method 3: Mac/Linux

```bash
ssh -i ~/.ssh/fernando-backends.pem ubuntu@51.21.220.250
```

### Method 4: AWS Console (Browser)

1. AWS Console → EC2 → Instances
2. Select instance
3. Click **Connect** button
4. Choose **Session Manager** tab
5. Click **Connect**

---

## 📊 Server Status Commands

### Check if Server is Running

```bash
pm2 status
```

**Expected Output:**

```
id │ name              │ mode │ status   │ cpu  │ memory
0  │ fernando-backend  │ fork │ online   │ 0%   │ 56.6mb
```

### View Real-time Logs

```bash
pm2 logs fernando-backend
```

Exit logs: `Ctrl+C`

### View Last 100 Lines of Logs

```bash
pm2 logs fernando-backend --lines 100
```

---

## 🎮 Server Control

### Restart Server

```bash
pm2 restart fernando-backend
```

### Stop Server

```bash
pm2 stop fernando-backend
```

### Start Server

```bash
pm2 start fernando-backend
```

### Delete from PM2

```bash
pm2 delete fernando-backend
```

---

## 🔄 Deploy New Code

### 1. Pull Latest Code from GitHub

```bash
cd /home/ubuntu/backend
git pull origin main
```

### 2. Install/Update Dependencies

```bash
npm install
```

### 3. Build Application

```bash
npm run build
```

### 4. Restart Server

```bash
pm2 restart fernando-backend
```

### 🔥 Quick Deploy (All in One)

```bash
cd /home/ubuntu/backend && git pull origin main && npm install && npm run build && pm2 restart fernando-backend
```

---

## 🔐 Environment Variables

### View Current .env

```bash
cat /home/ubuntu/backend/.env
```

### Edit .env File

```bash
nano /home/ubuntu/backend/.env
```

**Edit commands in Nano:**

- Navigate: Arrow keys
- Save: `Ctrl+O` then `Enter`
- Exit: `Ctrl+X`

---

## 📁 Server Directory Structure

```
/home/ubuntu/backend/
├── src/                 # Source code
├── dist/                # Built files
├── node_modules/        # Dependencies
├── .env                 # Environment variables
├── package.json         # Project config
├── tsconfig.json        # TypeScript config
└── ecosystem.config.js  # PM2 config
```

### Navigate to Project Directory

```bash
cd /home/ubuntu/backend
```

### View Project Files

```bash
ls -la
```

---

## 🔍 Monitoring & Debugging

### Check System Resources

```bash
top
```

Exit: `q`

### Check Disk Space

```bash
df -h
```

### Check Memory Usage

```bash
free -h
```

### Check Running Processes

```bash
ps aux | grep node
```

### Check Port Usage

```bash
sudo netstat -tulpn | grep 5000
```

---

## 🐛 Troubleshooting

### Server Not Starting

```bash
pm2 logs fernando-backend
# Check error messages in logs
```

### Port Already in Use

```bash
sudo lsof -i :5000
# Kill process if needed
sudo kill -9 <PID>
```

### Clear PM2 Cache

```bash
pm2 kill
pm2 start npm --name "fernando-backend" -- start
pm2 save
```

### Check Node Version

```bash
node -v
npm -v
```

### Reinstall Dependencies

```bash
cd /home/ubuntu/backend
rm -rf node_modules package-lock.json
npm install
```

---

## 🚀 Deployment Checklist

Before deploying, verify:

- [ ] All environment variables updated
- [ ] Code pushed to GitHub
- [ ] No hardcoded secrets in code
- [ ] Database connection working
- [ ] AWS credentials valid
- [ ] All new dependencies added to package.json

---

## 📞 Quick Commands Reference

| Command                        | Purpose                |
| ------------------------------ | ---------------------- |
| `pm2 status`                   | Check server status    |
| `pm2 logs fernando-backend`    | View logs              |
| `pm2 restart fernando-backend` | Restart server         |
| `pm2 stop fernando-backend`    | Stop server            |
| `pm2 start fernando-backend`   | Start server           |
| `cd /home/ubuntu/backend`      | Go to project          |
| `git pull origin main`         | Pull latest code       |
| `npm install`                  | Install dependencies   |
| `npm run build`                | Build project          |
| `exit`                         | Disconnect from server |

---

## 🔐 Security Tips

1. **Never share your key file** (`fernando-backends.pem`)
2. **Keep key file permissions** as 400:
   ```bash
   chmod 400 fernando-backends.pem
   ```
3. **Always use HTTPS** in production
4. **Rotate credentials** regularly
5. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## 📝 Next Steps

- [ ] Test server connection
- [ ] Deploy frontend to production
- [ ] Setup custom domain with Nginx
- [ ] Configure SSL certificate
- [ ] Setup monitoring dashboard
- [ ] Create backup strategy

---

**Last Updated:** January 13, 2026
**Deployment Status:** ✅ LIVE
