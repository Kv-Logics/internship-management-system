# IMS Production Server Deployment Guide

This document outlines the end-to-end process for deploying the Internship Management System (IMS) onto a pristine production campus server using our Dockerized architecture.

## 1. Prerequisites
Ensure the production server (RHEL / CentOS / Rocky Linux) has the following installed:
- `unzip`
- `docker` (Engine version 20.10+)
- `docker-compose-plugin` (Docker Compose V2)

You can install Docker on a clean Red Hat-based server using:
```bash
sudo yum install -y yum-utils unzip
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable the Docker service to run on boot
sudo systemctl enable --now docker
```

## 2. Download and Extract the Codebase
Instead of setting up git keys on the production server, the DevOps team can securely download the latest ZIP archive of the `main` branch.

1. SSH into the production server.
2. Download the ZIP (replace with the actual private/public repository ZIP URL or upload it manually via SFTP):
```bash
wget https://github.com/Kv-Logics/internship-management-system/archive/refs/heads/main.zip
```
3. Extract the contents:
```bash
unzip main.zip
cd internship-management-system-main
```

## 3. Environment Configuration
Create the `.env` file in the root of the project directory.

> [!CAUTION]
> Do not skip this step! The containers will fail to start or connect securely without a complete `.env` file.

```bash
nano .env
```

Paste the following variables and update the secure placeholders:

```env
# Database Configuration
POSTGRES_USER=ims_admin
POSTGRES_PASSWORD=your_secure_db_password
POSTGRES_DB=internship_management
# The host MUST be "db" to match the Docker Compose network service
DATABASE_URL=postgresql+asyncpg://ims_admin:your_secure_db_password@db:5432/internship_management

# Security & Authentication
# Run `openssl rand -hex 32` on your terminal to generate strong keys
SECRET_KEY=your_generated_random_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_ACCESS_SECRET=your_jwt_access_secret_from_sso
JWT_REFRESH_SECRET=your_jwt_refresh_secret_from_sso

# Primary System Administrator Fallback
ADMIN_USERNAME=114123003@nitt.edu
ADMIN_PASSWORD=strong_admin_fallback_password

# Email Service (Optional for certificate delivery)
SENDER_EMAIL=your_email@nitt.edu
SENDER_PASSWORD=your_email_app_password

# Network Origins
FRONTEND_URL=http://your-server-ip-or-domain:3000
NEXT_PUBLIC_API_URL=http://your-server-ip-or-domain:8000/api
```

## 4. Launch the Application
Start the entire stack using Docker Compose. The `--build` flag ensures the multi-stage Dockerfiles compile fresh optimized binaries.

```bash
sudo docker compose up -d --build
```

> [!NOTE]
> The initial build may take 3-5 minutes as it installs Python and Node.js dependencies, compiles the Next.js standalone server, and bundles the Python wheels.

## 5. Verify Health and Stability
Once the command completes, verify that all three containers (`db`, `backend`, `frontend`) are running healthily.

```bash
sudo docker ps
```
You should see `(healthy)` under the STATUS column for all containers. The startup sequence guarantees the backend waits for the database, and the frontend waits for the backend.

**Monitor live logs for any anomalies:**
```bash
sudo docker compose logs -f
```

## 6. Exposing to the Campus Network
The application currently exposes the frontend on **Port 3000**.
If you are running a reverse proxy like NGINX or Apache on the host server:
1. Proxy pass `http://your-domain.edu` to `http://127.0.0.1:3000`
2. Update the `FRONTEND_URL` and `NEXT_PUBLIC_API_URL` inside your `.env` to match the new domain name.
3. Restart the containers: `sudo docker compose down && sudo docker compose up -d`

## Operational Commands Cheat Sheet

| Action | Command |
|--------|---------|
| Start Stack | `sudo docker compose up -d` |
| Stop Stack | `sudo docker compose down` |
| Rebuild after Code Updates | `sudo docker compose up -d --build` |
| View All Logs | `sudo docker compose logs -f` |
| View Backend Errors Only | `sudo docker compose logs -f backend` |

> [!TIP]
> **Data Loss Prevention:** Because the `docker-compose.yml` uses a named Docker volume (`pgdata`), running `docker compose down` or destroying the database container will **NOT** delete the actual database records. They are safely persisted on the host machine.
