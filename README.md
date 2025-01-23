# Project Setup Guide

## Prerequisites

### Installing Bun
1. Install Bun using one of these methods:
   ```bash
   # For macOS and Linux:
   curl -fsSL https://bun.sh/install | bash

   #With Homebrew
   brew install oven-sh/bun/bun

   # For Windows (via WSL):
   # First install WSL, then run the above command
   ```
2. Verify installation:
   ```bash
   bun --version
   ```

### Setting up PostgreSQL
1. Install PostgreSQL:
   ```bash
   # macOS (using Homebrew)
   brew install postgresql@15

   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install postgresql-15

   # Windows
   # Download installer from https://www.postgresql.org/download/windows/
   ```

2. Start PostgreSQL service:
   ```bash
   # macOS
   brew services start postgresql@15

   # Ubuntu/Debian
   sudo systemctl start postgresql

   # Windows
   # PostgreSQL service starts automatically after installation
   ```

### Creating a PostgreSQL User
1. Access PostgreSQL command prompt:
   ```bash
   sudo -u postgres psql
   ```

2. Create a new user and database:
   ```sql
   CREATE USER yourusername WITH PASSWORD 'yourpassword';
   CREATE DATABASE yourdatabase;
   GRANT ALL PRIVILEGES ON DATABASE yourdatabase TO yourusername;
   ```

3. Exit PostgreSQL prompt:
   ```sql
   \q
   ```

## Environment Setup
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your PostgreSQL credentials:

   Make sure to replace:
   - `yourusername` with your PostgreSQL username
   - `yourpassword` with your PostgreSQL password
   - `yourdatabase` with your database name

## Running the Project
1. Install dependencies:
   ```bash
   bun install:all
   ```

2. Start the development server:
   ```bash
   bun dev
   
   #Make sure you are in the project root, not /client - since this is a monorepo running from root will run the express backend in tandem
   ```

The application should now be running at `http://localhost:3000`
