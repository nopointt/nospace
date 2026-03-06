# Stage 2b Task: DB Setup + Migrations + Pipeline Run

PostgreSQL 17 is already installed and running as Windows service postgresql-x64-17.
psql binary is at: "C:\Program Files\PostgreSQL\17\bin\psql.exe"

Working directory: C:/Users/noadmin/nospace/development/harkly/cx-platform/

## Your role
You are the Player. Execute all steps in order. Report exact output of each step.

## Step 1: Create DB user and database
Run these commands using the full path to psql:
```
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE USER cx_user WITH PASSWORD 'cx_password';"
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE cx_platform OWNER cx_user;"
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE cx_platform TO cx_user;"
```
If user or db already exists, that's OK — just report the output.

## Step 2: Create .env file
Create file at C:/Users/noadmin/nospace/development/harkly/cx-platform/.env with this exact content:
```
DATABASE_URL=postgresql://cx_user:cx_password@localhost:5432/cx_platform
STEAM_BASE_URL=https://store.steampowered.com
LOG_LEVEL=info
DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000001
```

## Step 3: Install sqlx-cli
```
cargo install sqlx-cli --no-default-features --features native-tls,postgres
```
This takes 5-10 minutes. Wait for it to complete.

## Step 4: Run migrations
```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform && sqlx migrate run --database-url postgresql://cx_user:cx_password@localhost:5432/cx_platform
```
Expected: 3 migrations applied (tenants, researches, signals).

## Step 5: Run pipeline
```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform && cargo run -- --appid 1351240 --research-name "Taxi Life" --limit 50
```
Expected output contains: "Collection complete: N inserted, M skipped"

## Step 6: Verify data
```
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U cx_user -d cx_platform -h localhost -c "SELECT count(*), source_type FROM signals GROUP BY source_type;"
```
Expected: at least 1 row with source_type = steam_review.

## Report after all steps:
- Step 1 output
- Step 3 final line (Installed package...)
- Step 4 migration output
- Step 5 last line
- Step 6 query result
