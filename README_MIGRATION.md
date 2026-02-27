# Supabase Backup Restoration & Migration Guide

This guide will help you restore your downloaded physical backup (`db_cluster.backup`) to a local Supabase instance and then migrate it to your new hosted Supabase project.

## Prerequisites

1.  **Docker Desktop**: Must be installed and **running**.
2.  **Supabase CLI**: Must be installed (which you have).
3.  **New Project Connection String**: You need the connection string of your new Supabase project.
    -   Go to [Supabase Dashboard](https://supabase.com/dashboard).
    -   Select your new project.
    -   Go to **Project Settings** -> **Database**.
    -   Under **Connection String**, select **URI**.
    -   Copy the string (it looks like `postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:5432/postgres`).
    -   *Note*: You will need the database password you set when creating the project.

## Step 1: Restore Backup Locally

We first need to restore the backup to a local container because physical backups cannot be uploaded directly to the cloud.

1.  Open a PowerShell terminal in the `jata` directory.
2.  Run the restoration script:
    ```powershell
    .\restore_local.ps1
    ```
3.  Wait for the script to finish. It will start a local Supabase instance with your data.

## Step 2: Migrate to Cloud

Once the local database is running, we will dump its data and push it to your new project.

1.  Run the migration script with your connection string:
    ```powershell
    .\migrate_to_cloud.ps1 -ConnectionString "postgresql://postgres.xxxx:YOUR_PASSWORD@..."
    ```
    *(Replace the URI with your actual connection string)*

2.  The script will:
    -   Generate a `full_dump.sql` from your local instance.
    -   Push this data to your new remote project.

## Troubleshooting

-   **Docker not found/running**: Ensure Docker Desktop is open.
-   **Postgres Version Mismatch**: The scripts assume the backup is compatible with Postgres 15 (standard for Supabase). If you encounter version errors, check the logs.
-   **Connection Refused**: If `migrate_to_cloud.ps1` fails to connect to the remote, check your password and internet connection.
