# Internship Management System (IMS) Deployment & Database Setup Guide

This document provides a detailed guide to deploying the Internship Management System (IMS) on a production campus server. It covers two configuration options: **Option A (Containerized Database)** and **Option B (Standalone/Manual Database Server)**.

---

## 1. Core Architecture Overview
The system consists of three services:
1. **Frontend (Next.js)**: Listens on Port `3000`.
2. **Backend API (FastAPI)**: Listens on Port `8000`.
3. **Database (PostgreSQL 15)**: Listens on Port `5432`.

---

## 2. Option A: Containerized Database Setup (Recommended)
If you deploy using `docker-compose.yml`, PostgreSQL runs inside an isolated container. The user creation, password setup, database creation, and permissions are **handled automatically** during the container's first boot.

### Step-by-Step Setup
1. **Define database variables in `.env`:**
   Open your environment file in the project root:
   ```bash
   nano .env
   ```
   Define your credentials:
   ```env
   # DB credentials to initialize
   POSTGRES_USER=ims_admin
   POSTGRES_PASSWORD=your_secure_db_password
   POSTGRES_DB=internship_management

   # Async connection string (Note that the host is "db" representing the compose service name)
   DATABASE_URL=postgresql+asyncpg://ims_admin:your_secure_db_password@db:5432/internship_management
   ```

2. **Boot the Container:**
   ```bash
   sudo docker compose up -d --build
   ```
   
3. **How Initial Database Setup Happens Under the Hood:**
   - The PostgreSQL container checks if the `/var/lib/postgresql/data` volume is empty.
   - If empty, it initializes the database cluster and automatically runs:
     ```sql
     CREATE ROLE ims_admin WITH LOGIN PASSWORD 'your_secure_db_password';
     CREATE DATABASE internship_management OWNER ims_admin;
     ```
   - The FastAPI backend container automatically waits for the database socket to open, then initiates database migrations and tables/indexing setups via SQL Alchemy.

---

## 3. Option B: Standalone/Manual PostgreSQL Server Setup
If your organization requires running a dedicated, native PostgreSQL database instance on a host operating system (e.g. a separate database node on Ubuntu/Debian), use these steps to set it up manually.

### Step 1: Install PostgreSQL
SSH into your database server and run:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
```

Verify the database service is running:
```bash
sudo systemctl status postgresql
```

### Step 2: Create Database User & Password
1. Enter the default PostgreSQL administrative shell:
   ```bash
   sudo -i -u postgres psql
   ```
2. Create the dedicated user for the IMS application (replace `your_secure_db_password` with a strong password):
   ```sql
   CREATE USER ims_admin WITH PASSWORD 'your_secure_db_password';
   ```
3. Create the database instance and assign ownership to the user:
   ```sql
   CREATE DATABASE internship_management OWNER ims_admin;
   ```
4. Grant privileges:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE internship_management TO ims_admin;
   ```
5. Exit the shell:
   ```sql
   \q
   ```

### Step 3: Configure Network Access for PostgreSQL
By default, PostgreSQL only accepts connections originating from `localhost` (127.0.0.1). If your backend API container is running on a different server/host, you must allow remote connections.

1. **Configure listen address:**
   Open `postgresql.conf` (adjust path if using a version other than 15):
   ```bash
   sudo nano /etc/postgresql/15/main/postgresql.conf
   ```
   Locate `listen_addresses` and configure it to listen on all network interfaces:
   ```ini
   listen_addresses = '*'
   ```

2. **Configure client authentication rules (`pg_hba.conf`):**
   Open `pg_hba.conf`:
   ```bash
   sudo nano /etc/postgresql/15/main/pg_hba.conf
   ```
   Add a line at the end to allow the backend server to authenticate. Specify the server's IP address or the local subnet range (e.g. `192.168.1.0/24`):
   ```ini
   # TYPE  DATABASE                USER        ADDRESS            METHOD
   host    internship_management   ims_admin   your_backend_ip/32  scram-sha-256
   ```
   *(For testing behind a firewall only, you can allow all hosts via `0.0.0.0/0`).*

3. **Apply changes:**
   Restart the database service:
   ```bash
   sudo systemctl restart postgresql
   sudo systemctl enable postgresql
   ```

### Step 4: Configure the Application Connection
In your `.env` file in the project root, configure the `DATABASE_URL` using your database server IP instead of `db`:
```env
DATABASE_URL=postgresql+asyncpg://ims_admin:your_secure_db_password@your_db_server_ip:5432/internship_management
```

---

## 4. Decoupled SSO & Application Configuration (.env)
A pre-configured production environment file with secure, randomly generated passwords and keys has been prepared at [production.env](file:///C:/Users/keert/NIT%20Projects/internship-management-system/deployment_env/production.env). 

The DevOps team can copy or rename this file to `.env` at the root of the project, configure the server URLs in Section 2, and deploy immediately.

Alternatively, you can manually create a `.env` file in the root directory using these variables:

```env
# Database Settings
POSTGRES_USER=ims_admin
POSTGRES_PASSWORD=your_secure_db_password
POSTGRES_DB=internship_management
DATABASE_URL=postgresql+asyncpg://ims_admin:your_secure_db_password@db:5432/internship_management

# Security Keys
# Run `openssl rand -hex 32` to generate a strong key
SECRET_KEY=your_generated_random_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Central SSO Integration
# Must match the JWT secrets defined in the deployed NITT SSO Authentication Server
JWT_ACCESS_SECRET=your_jwt_access_secret_from_sso
JWT_REFRESH_SECRET=your_jwt_refresh_secret_from_sso

# Network Origins (No trailing slashes)
FRONTEND_URL=http://your-server-ip-or-domain:3000
NEXT_PUBLIC_API_URL=http://your-server-ip-or-domain:8000/api
NEXT_PUBLIC_SSO_URL=https://cdi.nitt.edu/login
```

### Guide to Constructing Network URLs:

* **`FRONTEND_URL`**: The final URL where users will go in their browser to access the website (e.g., `https://ims.nitt.edu`). The backend uses this to configure CORS policy and prevent unauthorized origins from calling the API.
* **`NEXT_PUBLIC_API_URL`**: The public address of the backend FastAPI server (e.g., `https://ims.nitt.edu/api` or `https://ims-api.nitt.edu/api`). Since the frontend code runs directly in the client's browser, the browser needs this address to send HTTP requests (like generating certificates or loading student records).
* **`NEXT_PUBLIC_SSO_URL`**: The address of the central Single Sign-On login portal. (Pre-configured to `https://cdi.nitt.edu/login`).

#### 3 Common Deployment Scenarios for URLs:
1. **Single Domain Routing (Recommended)**:
   If Nginx routes all `/` traffic to the Next.js frontend and `/api` paths to the FastAPI backend:
   ```env
   FRONTEND_URL=https://ims.nitt.edu
   NEXT_PUBLIC_API_URL=https://ims.nitt.edu/api
   NEXT_PUBLIC_SSO_URL=https://cdi.nitt.edu/login
   ```
2. **Subdomain Routing**:
   If separate domains are assigned to frontend and backend:
   ```env
   FRONTEND_URL=https://ims.nitt.edu
   NEXT_PUBLIC_API_URL=https://ims-api.nitt.edu/api
   NEXT_PUBLIC_SSO_URL=https://cdi.nitt.edu/login
   ```
3. **Bare IP Address Routing (No domains)**:
   If deploying to a raw server IP address without DNS:
   ```env
   FRONTEND_URL=http://your-server-ip:3000
   NEXT_PUBLIC_API_URL=http://your-server-ip:8000/api
   NEXT_PUBLIC_SSO_URL=https://cdi.nitt.edu/login
   ```

---

## 5. Schema Setup & Database Migrations
On startup, the FastAPI server lifespan automatically executes SQLAlchemy schema reflection. You do not need to manually import SQL tables. 

However, to manually execute migrations or test database seeding on a clean install:
1. Log in to the backend container:
   ```bash
   sudo docker compose exec backend bash
   ```
2. Seed the initial faculty databases or test script manually:
   ```bash
   python migrate.py
   python seed.py
   ```

---

## 6. Database Backups & Restore operations

### How to Backup the database:
* **Docker Setup:**
  Run the command on the host machine to generate a gzipped SQL dump:
  ```bash
  sudo docker compose exec -t db pg_dump -U ims_admin -d internship_management | gzip > backup_$(date +%F).sql.gz
  ```
* **Standalone Host Setup:**
  ```bash
  pg_dump -U ims_admin -h your_db_server_ip -d internship_management | gzip > backup_$(date +%F).sql.gz
  ```

### How to Restore the database:
1. Decompress the backup:
   ```bash
   gunzip backup_YYYY-MM-DD.sql.gz
   ```
2. Run the restore command:
   * **Docker Setup:**
     ```bash
     cat backup_YYYY-MM-DD.sql | sudo docker compose exec -i db psql -U ims_admin -d internship_management
     ```
   * **Standalone Host Setup:**
     ```bash
     psql -U ims_admin -h your_db_server_ip -d internship_management -f backup_YYYY-MM-DD.sql
     ```
