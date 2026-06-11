# Host Volume Permissions Setup (775 Security)

Follow these steps to configure host volume permissions for your running Docker container:

### Step 1: Find the Container's User ID (UID)
Run this command on your server to verify the UID/GID of the user running inside the container:
```bash
docker compose -f docker-compose.prod.yml exec backend id
```
*Expected Output:* `uid=1000(appuser) gid=1000(appuser)`

### Step 2: Set Host Folder Ownership
Change the ownership of the host volume directories to match the container's UID/GID (replace `1000:1000` with the values from Step 1 if they differ):
```bash
sudo chown -R 1000:1000 signatures generated_certificates uploads
```

### Step 3: Configure 775 Permissions
Apply the `775` permissions to the folders. The container user (now matching the owner) will have full write access:
```bash
sudo chmod -R 775 signatures generated_certificates uploads
```
