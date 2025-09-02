#!/bin/bash

# Supabase Daily Backup Script
# Creates compressed PostgreSQL dumps with timestamp

set -e  # Exit on any error

# Configuration
BACKUP_DIR="$HOME/supabase_backups"
STAMP=$(date +'%Y-%m-%d_%H-%M')
LOG_FILE="$BACKUP_DIR/backup.log"

# Database connection (local Supabase)
PG_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "$(date +'%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "Starting backup process..."

# Create the backup using Docker with PostgreSQL 17
docker run --rm --network=host -v "$BACKUP_DIR:/backup" \
  postgres:17 pg_dump "$PG_URL" \
  -F c --blobs --verbose --no-owner \
  --exclude-schema=extensions \
  --exclude-schema=graphql \
  --exclude-schema=cron \
  --exclude-schema=vault \
  -f "/backup/backup_$STAMP.dump" 2>&1 | tee -a "$LOG_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/backup_$STAMP.dump" | cut -f1)
    log "Backup completed successfully: backup_$STAMP.dump ($BACKUP_SIZE)"
else
    log "ERROR: Backup failed!"
    exit 1
fi

# Optional: Remove backups older than 7 days
find "$BACKUP_DIR" -name "backup_*.dump" -mtime +7 -delete
if [ $? -eq 0 ]; then
    log "Cleaned up backups older than 7 days"
fi

log "Backup process completed"