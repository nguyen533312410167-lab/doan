# Database Backup & Restore Guide

This document explains how to restore the `database_backup.sql` file to get the project running with all existing data.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Git (to clone the repository)

## Steps to Restore

### 1. Clone the project

```bash
git clone <repository-url>
cd doan
```

### 2. Start Docker containers

```bash
docker compose up -d
```

This will start all services: PostgreSQL (`db`), pgAdmin, Django backend, and React frontend.

Wait a moment for all containers to be healthy. You can check with:

```bash
docker compose ps
```

### 3. Run database migrations (creates the table structure)

```bash
docker compose exec backend python manage.py migrate
```

### 4. Restore the data backup

Once migrations are complete and the tables exist, restore the data:

```bash
# On Windows (PowerShell):
Get-Content database_backup.sql | docker compose exec -T db psql -U app_user -d app_db

# On Linux/macOS:
docker compose exec -T db psql -U app_user -d app_db < database_backup.sql
```

### 5. Access the application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/graphql/
- **Django Admin**: http://localhost:8000/admin/
- **pgAdmin**: http://localhost:8080 (email: `admin@example.com`, password: `Apc@12345`)

## Re-creating the backup (if you modify data)

If you've added or changed data and want to create an updated backup:

```bash
docker compose exec backend python scripts/export_data.py > database_backup.sql
```

## Notes

- The backup file contains all application data including users, profiles, categories, transactions, saving goals, notifications, and Django admin logs.
- The backup uses `SET session_replication_role = 'replica'` to bypass foreign key checks during restore, ensuring clean import.
- Sequence values are automatically reset after data insertion.
- **Important**: The backup contains only data (INSERT statements), not table schemas. You must run `python manage.py migrate` first to create the tables before restoring data.