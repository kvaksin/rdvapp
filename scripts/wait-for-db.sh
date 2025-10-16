#!/bin/sh

echo "Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if nc -z $(echo $DATABASE_URL | sed -E 's/^.*@([^:]+):([0-9]+)\/.*$/\1 \2/') >/dev/null 2>&1; then
        echo "PostgreSQL is ready!"
        exit 0
    fi
    
    echo "Attempt $attempt of $max_attempts. Waiting..."
    attempt=$((attempt + 1))
    sleep 2
done

echo "Could not connect to PostgreSQL after $max_attempts attempts."
exit 1