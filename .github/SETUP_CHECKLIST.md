# Deployment Setup Checklist

Use this checklist to ensure your automated deployment is properly configured.

## ✅ GitHub Repository Setup

### 1. Secrets Configuration

Go to **Settings** → **Secrets and variables** → **Actions** and add:

- [ ] `VM_HOST` - Your VM's IP address or hostname
- [ ] `VM_USER` - SSH username (e.g., `ubuntu`, `root`)
- [ ] `VM_SSH_KEY` - Private SSH key for VM access
- [ ] `OPENAI_API_KEY` - (Optional) OpenAI API key
- [ ] `MISTRAL_API_KEY` - (Optional) Mistral API key

### 2. Workflow File

- [ ] `.github/workflows/deploy.yml` exists in the repository
- [ ] Workflow is enabled (check Actions tab)

## ✅ VM Setup

### 1. Docker Installation

```bash
# Check if Docker is installed
docker --version

# If not installed, run:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

- [ ] Docker is installed on the VM
- [ ] User can run Docker without sudo

### 2. SSH Access

```bash
# Test SSH connection from your local machine
ssh -i ~/.ssh/your_key user@your-vm-host

# Should connect without password prompt
```

- [ ] SSH key authentication works
- [ ] User has appropriate permissions

### 3. Network Configuration

```bash
# Open port 8000
sudo ufw allow 8000

# Check firewall status
sudo ufw status
```

- [ ] Port 8000 is open and accessible
- [ ] Security group/firewall rules allow HTTP traffic

### 4. Log Directory (Optional)

```bash
# Create directory for persistent logs
sudo mkdir -p /var/log/arena-tic-tac-toe
sudo chown $USER:$USER /var/log/arena-tic-tac-toe
```

- [ ] Log directory created
- [ ] User has write permissions

## ✅ Testing the Deployment

### 1. Trigger Initial Deployment

- [ ] Push a commit to the `main` branch
- [ ] Go to **Actions** tab in GitHub
- [ ] Verify workflow runs successfully
- [ ] Check all steps complete (build, push, deploy)

### 2. Verify Container is Running

```bash
# SSH into VM
ssh user@your-vm-host

# Check running containers
docker ps | grep arena-back-tic-tac-toe

# Should show a running container
```

- [ ] Container is running
- [ ] Container status is "Up"

### 3. Test the API

```bash
# From your local machine or VM
curl http://your-vm-host:8000

# Should return: {"message": "Tic-Tac-Toe Game Server"}
```

- [ ] API responds to requests
- [ ] Health check endpoint works

### 4. Test API Endpoints

```bash
# Create a new game
curl -X POST http://your-vm-host:8000/games

# Should return game state with game_id
```

- [ ] Can create new games
- [ ] Can make moves
- [ ] API documentation accessible at `/docs`

### 5. Check Logs

```bash
# Container logs
docker logs arena-back-tic-tac-toe

# Game logs (if persistent volume configured)
ls -lh /var/log/arena-tic-tac-toe/
```

- [ ] Container logs are accessible
- [ ] No error messages in logs
- [ ] Game logs are being created

## ✅ Monitoring Setup

### 1. Basic Monitoring

```bash
# Set up a simple health check (cron job)
crontab -e

# Add this line (checks every 5 minutes):
*/5 * * * * curl -f http://localhost:8000 || docker restart arena-back-tic-tac-toe
```

- [ ] Health check script configured
- [ ] Automatic restart on failure

### 2. Log Rotation (Optional)

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/arena-tic-tac-toe

# Add:
/var/log/arena-tic-tac-toe/*.csv {
    daily
    rotate 30
    compress
    missingok
    notifempty
}
```

- [ ] Log rotation configured
- [ ] Prevents disk space issues

## ✅ Production Readiness

### Security

- [ ] VM is behind a firewall
- [ ] SSH is configured with key authentication only
- [ ] API keys are stored as GitHub secrets (not in code)
- [ ] Consider adding HTTPS/reverse proxy (nginx)

### Performance

- [ ] VM has adequate resources (1GB RAM minimum)
- [ ] Disk space is sufficient for logs
- [ ] Container restart policy is set to `always`

### Backup

- [ ] Important logs are backed up regularly
- [ ] Docker images are versioned (tagged with commit SHA)
- [ ] Rollback procedure is documented

## 📝 Common Issues

### Deployment fails
- **Check**: GitHub secrets are correctly set
- **Check**: SSH key has correct format (include `-----BEGIN/END-----`)
- **Check**: VM user can run Docker without sudo

### Container exits immediately
- **Check**: `docker logs arena-back-tic-tac-toe` for errors
- **Check**: Port 8000 is not already in use
- **Check**: Dependencies are correctly installed

### API not accessible
- **Check**: Container is running (`docker ps`)
- **Check**: Port 8000 is open in firewall
- **Check**: VM IP address is correct

### LLM features don't work
- **Check**: API keys are set in GitHub secrets
- **Check**: Keys are correctly injected: `docker exec arena-back-tic-tac-toe env | grep API_KEY`

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Workflow runs without errors
- ✅ Container starts and stays running
- ✅ API responds to health checks
- ✅ Can create and play games
- ✅ Logs are being generated
- ✅ Automatic restarts work on failures

## Next Steps

Once deployment is working:

1. Set up monitoring and alerts
2. Configure HTTPS with Let's Encrypt
3. Set up a reverse proxy (nginx/Caddy)
4. Implement log aggregation
5. Add performance monitoring
6. Set up automated backups

---

**Need help?** Check the full [DEPLOYMENT.md](DEPLOYMENT.md) guide or raise an issue on GitHub.


