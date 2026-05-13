#!/bin/sh
set -e

echo "🔄 Synchronizing database schema..."
# Utilise db push au lieu de migrate (pas besoin de migration files)
./node_modules/.bin/prisma db push --accept-data-loss --skip-generate

echo "🚀 Starting MediRoute backend..."
exec node dist/server-postgres.js
