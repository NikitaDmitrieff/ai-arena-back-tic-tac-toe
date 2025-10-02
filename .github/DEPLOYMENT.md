# Deployment Guide

This document explains how to set up and use the automated deployment workflow for the Tic-Tac-Toe backend.

## Overview

The GitHub Actions workflow automatically:
1. **Builds** the Docker image for the tic-tac-toe backend
2. **Pushes** the image to GitHub Container Registry (ghcr.io)
3. **Deploys** the image to your VM via SSH (on main branch only)

## Required GitHub Secrets

To use this workflow, you need to configure the following secrets in your GitHub repository:

### VM Connection Secrets
- **`VM_HOST`**: The IP address or hostname of your deployment VM
- **`VM_USER`**: The SSH username for the VM (e.g., `ubuntu`, `root`)
- **`VM_SSH_KEY`**: The private SSH key for authenticating to the VM

### API Keys (Optional, for LLM functionality)
- **`OPENAI_API_KEY`**: Your OpenAI API key
- **`MISTRAL_API_KEY`**: Your Mistral API key

## Setting Up Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each secret
4. Add the secret name and value

### Example: Adding SSH Key

```bash
# Generate a new SSH key pair (if you don't have one)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key

# Copy the public key to your VM
ssh-copy-id -i ~/.ssh/github_actions_key.pub user@your-vm-host

# Copy the private key content
cat ~/.ssh/github_actions_key
# Paste this content as the VM_SSH_KEY secret in GitHub
```

## VM Prerequisites

Your deployment VM needs:

1. **Docker installed**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. **Port 8000 exposed** (or configure a reverse proxy)

3. **Log directory** (optional, for persistent logs):
   ```bash
   sudo mkdir -p /var/log/arena-tic-tac-toe
   sudo chown $USER:$USER /var/log/arena-tic-tac-toe
   ```

## Workflow Triggers

The workflow runs on:
- **Push to main**: Builds, pushes, and deploys
- **Pull requests**: Builds and pushes only (no deployment)

## Docker Container Details

The deployed container:
- **Name**: `arena-back-tic-tac-toe`
- **Port**: 8000 (mapped to host port 8000)
- **Restart policy**: Always
- **Logs**: Mounted to `/var/log/arena-tic-tac-toe` on the host
- **Environment**: API keys injected from GitHub secrets

## Accessing the Deployed Service

After deployment, your service will be available at:
- **API**: `http://your-vm-host:8000`
- **API Docs**: `http://your-vm-host:8000/docs`
- **Health check**: `http://your-vm-host:8000/`

## Manual Deployment

If you need to deploy manually:

```bash
# SSH into your VM
ssh user@your-vm-host

# Pull the latest image
docker pull ghcr.io/your-username/arena-back-tic-tac-toe:latest

# Stop and remove old container
docker stop arena-back-tic-tac-toe || true
docker rm arena-back-tic-tac-toe || true

# Run new container
docker run -d --restart=always \
  -p 8000:8000 \
  --name arena-back-tic-tac-toe \
  -e OPENAI_API_KEY="your-key" \
  -e MISTRAL_API_KEY="your-key" \
  -v /var/log/arena-tic-tac-toe:/app/logs \
  ghcr.io/your-username/arena-back-tic-tac-toe:latest
```

## Monitoring

### Check container status
```bash
docker ps | grep arena-back-tic-tac-toe
```

### View logs
```bash
docker logs arena-back-tic-tac-toe

# Follow logs in real-time
docker logs -f arena-back-tic-tac-toe
```

### Check game logs
```bash
ls -lh /var/log/arena-tic-tac-toe/
```

## Troubleshooting

### Deployment fails
- Verify all secrets are correctly set in GitHub
- Check SSH key has correct permissions on the VM
- Ensure VM user can run Docker without sudo

### Container crashes
```bash
# Check logs
docker logs arena-back-tic-tac-toe

# Restart container
docker restart arena-back-tic-tac-toe
```

### Can't access API
- Check firewall rules: `sudo ufw status`
- Verify port 8000 is open: `sudo ufw allow 8000`
- Check if container is running: `docker ps`

### LLM players not working
- Verify API keys are set correctly in GitHub secrets
- Check environment variables in container: `docker exec arena-back-tic-tac-toe env | grep API_KEY`

## Security Notes

- **Never commit secrets** to the repository
- Use GitHub secrets for sensitive data
- Rotate SSH keys periodically
- Consider using a reverse proxy (nginx) with HTTPS
- Limit SSH key access to specific IPs if possible

## Updating the Deployment

To deploy a new version:
1. Push changes to the `main` branch
2. GitHub Actions will automatically build and deploy
3. Monitor the Actions tab for deployment status

## Rollback

To rollback to a previous version:
```bash
# List available image tags
docker images ghcr.io/your-username/arena-back-tic-tac-toe

# Deploy specific version
docker pull ghcr.io/your-username/arena-back-tic-tac-toe:COMMIT_SHA
docker stop arena-back-tic-tac-toe
docker rm arena-back-tic-tac-toe
docker run -d --restart=always \
  -p 8000:8000 \
  --name arena-back-tic-tac-toe \
  -e OPENAI_API_KEY="your-key" \
  -e MISTRAL_API_KEY="your-key" \
  -v /var/log/arena-tic-tac-toe:/app/logs \
  ghcr.io/your-username/arena-back-tic-tac-toe:COMMIT_SHA
```


