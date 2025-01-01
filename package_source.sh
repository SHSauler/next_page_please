#!/bin/bash

PROJECT_NAME=$(basename "$PWD")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="${PROJECT_NAME}_source_${TIMESTAMP}.zip"

TMP_EXCLUDE=$(mktemp)

cat << EOF > "$TMP_EXCLUDE"
*.git/*
.DS_Store
node_modules/**
dist/**
*.zip
.idea/**
.vscode/**
*.log
Thumbs.db
package-lock.json
EOF

zip -r "$ARCHIVE_NAME" . -x@"$TMP_EXCLUDE"

rm "$TMP_EXCLUDE"

echo "Source code archived as: $ARCHIVE_NAME"