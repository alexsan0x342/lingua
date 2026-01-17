#!/bin/bash

# Variables
LOCAL_DB="postgresql://lingua:S9v%234pX%21dLq7%40rZ8@localhost:5432/lingua_db"
REMOTE_DB="postgresql://neondb_owner:npg_ZILn5VhYaUO2@ep-broad-smoke-agcu31lw-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

echo "🔄 Starting Database Sync..."

# 1. Dump local DB and Pipe directly to Remote DB
# --clean: drops objects before creating them in the remote
# --if-exists: prevents errors if the table doesn't exist yet
# --no-owner: Neon has different user permissions than local
echo "📤 Exporting local and importing to Neon (this may take a moment)..."
pg_dump --clean --if-exists --no-owner --no-privileges --dbname="$LOCAL_DB" | psql "$REMOTE_DB"

if [ $? -eq 0 ]; then
    echo "✅ Sync Successful!"
else
    echo "❌ Sync Failed! Please check your connection or credentials."
fi
