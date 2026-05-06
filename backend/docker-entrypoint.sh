#!/bin/sh
set -e

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "🚀 Starting MediRoute backend..."
exec node dist/server-postgres.js
