#!/bin/bash

# Fichiers à traiter (ajustez si besoin)
FILES=$(find . -name "*.ts" -not -path "*/node_modules/*")

for file in $FILES; do
  sed -i "s/\\.ts//g" "$file"
done
