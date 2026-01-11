#!/bin/bash
set -e

# Wait for database to be ready
echo "Waiting for database connection..."
until php artisan db:show 2>/dev/null; do
    echo "Database is unavailable - sleeping"
    sleep 2
done

echo "Database is up - running migrations"

# Run migrations
php artisan migrate --force --no-interaction

# Start Apache
exec apache2-foreground
