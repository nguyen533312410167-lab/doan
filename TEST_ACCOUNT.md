# Test Accounts

These accounts are registered in the application database and can be used for testing after restoring the backup.

## Admin Account

| Field    | Value            |
|----------|------------------|
| Email    | admin@gmail.com  |
| Password | ********         |
| Role     | Administrator (Superuser) |
| Access   | Django Admin (`/admin/`), Frontend, Backend API |

This account has superuser/staff privileges and can access the Django admin interface at `http://localhost:8000/admin/`.

## Demo User Account

| Field    | Value           |
|----------|-----------------|
| Email    | user@gmail.com  |
| Password | ********        |
| Role     | Regular User    |
| Access   | Frontend, Backend API |

This is a standard user account for testing the application's regular user features.

## How to log in

1. Make sure the application is running: `docker compose up -d`
2. Open the frontend at http://localhost:5173
3. Click on the login button
4. Enter the email and password for either account
5. Click "Sign In"

## Django Admin Access

1. Open http://localhost:8000/admin/
2. Log in with the admin account credentials
3. You can manage users, transactions, categories, and other data from the admin panel