#!/bin/bash
set -e

# Verify installation
if ! command -v hyle &> /dev/null; then
  echo "Warning: hyle not found in PATH after installation"
  echo "Add /usr/local/bin to your PATH if needed"
  exit 0
fi

# Show version to confirm
echo "Hylé installed successfully:"
hyle --version
