# Stage 2 Task: PostgreSQL Setup + Smoke Test

Working directory: C:/Users/noadmin/nospace/development/harkly/cx-platform/

## Your role
You are the Player. Execute all steps in order. Report output of each step.

## Step 1: Install PostgreSQL via winget
```
winget install --id PostgreSQL.PostgreSQL.17 -e --source winget --accept-package-agreements --accept-source-agreements
```
If already installed, skip. Report the version installed.

## Step 2: Verify PostgreSQL is running
```
pg_isready -h localhost -p 5432
```
If not running, start it:
```
net start postgresql-x64-17
```

## Step 3: Create DB user and database
Connect as postgres superuser and run:
```
psql -U postgres -c "CREATE USER cx_user WITH PASSWORD 'cx_password';" 2>/dev/null || echo "user exists"
psql -U postgres -c "CREATE DATABASE cx_platform OWNER cx_user;" 2>/dev/null || echo "db exists"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE cx_platform TO cx_user;"
```

## Step 4: Create .env file
Create file C:/Users/noadmin/nospace/development/harkly/cx-platform/.env with content:
```
DATABASE_URL=postgresql://cx_user:cx_password@localhost:5432/cx_platform
STEAM_BASE_URL=https://store.steampowered.com
LOG_LEVEL=info
DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000001
```

## Step 5: Install sqlx-cli
```
cargo install sqlx-cli --no-default-features --features native-tls,postgres
```

## Step 6: Run migrations
```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform && sqlx migrate run --database-url postgresql://cx_user:cx_password@localhost:5432/cx_platform
```
Expected: 3 migrations applied (tenants, researches, signals).

## Step 7: Run pipeline
```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform && cargo run -- --appid 1351240 --research-name "Taxi Life" --limit 50
```
Expected output: "Collection complete: N inserted, M skipped"

## Step 8: Verify data in DB
```
psql -U cx_user -d cx_platform -h localhost -c "SELECT count(*), source_type FROM signals GROUP BY source_type;"
```
Expected: at least 1 row with source_type = steam_review.

## Report
After all steps, report:
- PostgreSQL version
- Migration output (which 3 files ran)
- cargo run final line output
- SELECT result from signals table
