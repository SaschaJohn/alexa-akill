#!/bin/bash
set -euo pipefail

BUCKET="${S3_BUCKET:-hoerspiel-skill-media}"
SOURCE="${1:-/Volumes/NAS/hoerspiele}"

if [ ! -d "$SOURCE" ]; then
  echo "Source directory not found: $SOURCE"
  echo "Usage: $0 /path/to/hoerspiele"
  exit 1
fi

echo "Syncing $SOURCE → s3://$BUCKET/"
aws s3 sync "$SOURCE" "s3://$BUCKET/" \
  --exclude ".DS_Store" \
  --exclude "Thumbs.db" \
  --exclude "*.txt" \
  --include "*.mp3" \
  --include "*.jpg" \
  --include "*.png"

echo "Done. Files synced to s3://$BUCKET/"
