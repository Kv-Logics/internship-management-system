# NITT Internship Management System: Deployment Guide (Red Hat/RHEL)

This is a basic, step-by-step guide for deploying the application to a Red Hat Enterprise Linux (RHEL) server for the `cdi.nitt.edu` domain.

## Part 1: Local Preparation (Before Accessing the Server)

I have already created the necessary production files in your local workspace:
1. `docker-compose.prod.yml`: The production configuration that manages the database, backend, frontend, and Nginx.
2. `nginx/nginx.conf`: The web server configuration set up to route traffic for `cdi.nitt.edu`.
3. `.env.production.example`: The template for your environment variables.

**Your Tasks Before Server Access:**
1. You don't need to commit your actual secrets to Git! The file `.env.production.example` is safely pushed to Git as a template.
2. In your local repository (do not commit this): you can copy `.env.production.example` to `.env.production` if you wish to test locally.
3. *Note on System Email:* The `.env.production.example` now contains the base SMTP variables for the `noreplycdi` account. These are required so the system can send you the initial OTP to log in! You can override these later in the Admin UI for certificate generation.

Once your code is pushed to your Git repository, you can move on to the server setup.

---

## Part 2: Server Setup (On the Red Hat Server)

Once you log into your Red Hat server via SSH, follow these steps. (Assuming Docker and Docker Compose are already installed).

### Step 1: Clone the Project
```bash
# Clone your repository
git clone <your-git-repo-url> internship-management-system
cd internship-management-system
```

### Step 2: Create the Secure .env.production File
**CRITICAL**: You must do this *before* running Docker.
```bash
# Create the real production environment file from the template
cp .env.production.example .env.production

# Edit the environment file to put your secure passwords in
nano .env.production
```
*(In nano, fill in your `POSTGRES_PASSWORD`, `JWT_SECRET`, and the `SMTP_PASSWORD` for the `noreplycdi` webmail account. Save and exit using Ctrl+O, Enter, Ctrl+X)*

### Step 3: Start the Application
Now that your `.env.production` file is configured, you can start the system. The `docker-compose.prod.yml` file is configured to automatically read your `.env.production` file and build both the frontend and backend Dockerfiles.

```bash
# Build and run the production environment in the background
sudo docker compose -f docker-compose.prod.yml up -d --build
```

### Step 4: Verify the Deployment
Run the following command to check if all containers (db, backend, frontend, nginx) are running smoothly:
```bash
sudo docker compose -f docker-compose.prod.yml ps
```
You should now be able to access the application via HTTP (e.g., `http://cdi.nitt.edu`) in your browser!

---

## Part 3: Enabling HTTPS / SSL (Let's Encrypt)

Once the HTTP site is working, you must enable HTTPS using Certbot.

1. **Install Certbot** on Red Hat:
```bash
sudo dnf install epel-release -y
sudo dnf install certbot -y
```

2. **Generate the Certificate:**
```bash
sudo certbot certonly --webroot -w /path/to/internship-management-system/certbot/www -d cdi.nitt.edu
```

3. **Enable SSL in Nginx:**
Open the `nginx/nginx.conf` file on your server. At the bottom of the file, there is a block of code commented out with `#`. 
Uncomment the HTTPS `server` block and the `return 301` redirect in the HTTP block. 

4. **Restart Nginx:**
```bash
sudo docker compose -f docker-compose.prod.yml restart nginx
```

Your system is now fully deployed and secure!
