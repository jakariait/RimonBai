#!/bin/bash

set -e

# === CONFIG ===
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
BACKUP_DIR="$SCRIPT_DIR/uploads/DatabaseBackup"

DATE=$(date +%F_%H-%M-%S)
ARCHIVE_NAME="mongo_backup_$DATE.tar.gz"

# === FIND MONGODUMP ===
MONGODUMP="$(command -v mongodump || true)"

if [ -z "$MONGODUMP" ]; then
    echo "ERROR: mongodump not found."
    echo "Install MongoDB Database Tools first."
    exit 1
fi

echo "Using mongodump: $MONGODUMP"

# === LOAD MONGO URI ===
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: .env file not found: $ENV_FILE"
    exit 1
fi

MONGO_URI=$(grep -E '^MONGO_URI=' "$ENV_FILE" | cut -d'=' -f2-)

if [ -z "$MONGO_URI" ]; then
    echo "ERROR: MONGO_URI not found in .env"
    exit 1
fi

# === CREATE BACKUP DIRECTORY ===
mkdir -p "$BACKUP_DIR"

# === BACKUP ===
echo "Starting MongoDB backup..."

"$MONGODUMP" \
    --uri="$MONGO_URI" \
    --out="$BACKUP_DIR/$DATE"

# === COMPRESS ===
echo "Compressing backup..."

tar -czf "$BACKUP_DIR/$ARCHIVE_NAME" \
    -C "$BACKUP_DIR" \
    "$DATE"

# === REMOVE UNCOMPRESSED BACKUP ===
rm -rf "$BACKUP_DIR/$DATE"

# === CLEANUP: KEEP LAST 7 BACKUPS ===
echo "Cleaning old backups..."

ls -t "$BACKUP_DIR"/mongo_backup_*.tar.gz 2>/dev/null \
    | tail -n +8 \
    | xargs -r rm -f

echo "======================================"
echo "MongoDB backup completed successfully"
echo "Backup: $BACKUP_DIR/$ARCHIVE_NAME"
echo "======================================"