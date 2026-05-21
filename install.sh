#!/usr/bin/env bash
set -euo pipefail

VERSION="${HYLE_VERSION:-latest}"
INSTALL_DIR="${HYLE_INSTALL_DIR:-/usr/local/bin}"
GITHUB_REPO="kittender/hyle"
BASE_URL="https://github.com/${GITHUB_REPO}/releases/download"

# Handle 'latest' tag
if [ "$VERSION" = "latest" ]; then
  # Use the API to find the latest release
  RELEASE_URL=$(curl -fsSL "https://api.github.com/repos/${GITHUB_REPO}/releases/latest" | grep -o '"tag_name": "[^"]*"' | head -1 | cut -d'"' -f4)
  VERSION="$RELEASE_URL"
  if [ -z "$VERSION" ]; then
    echo "Error: Could not determine latest version" >&2
    exit 1
  fi
fi

# Detect platform
detect_platform() {
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m)

  case "${OS}" in
    linux)
      case "${ARCH}" in
        x86_64)  echo "hyle-linux-x64" ;;
        aarch64) echo "hyle-linux-arm64" ;;
        *)       echo "Unsupported architecture: ${ARCH}" >&2; exit 1 ;;
      esac
      ;;
    darwin)
      case "${ARCH}" in
        x86_64)  echo "hyle-macos-x64" ;;
        arm64)   echo "hyle-macos-arm64" ;;
        *)       echo "Unsupported architecture: ${ARCH}" >&2; exit 1 ;;
      esac
      ;;
    *)
      echo "Unsupported OS: ${OS}" >&2
      echo "For Windows, use: winget install Kittender.Hyle" >&2
      exit 1
      ;;
  esac
}

BINARY=$(detect_platform)
URL="${BASE_URL}/${VERSION}/${BINARY}"

echo "Installing hylé ${VERSION} (${BINARY})..."

# Create temp directory
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

# Download binary
echo "Downloading from ${URL}..."
curl -fsSL "${URL}" -o "$TMPDIR/hyle"
chmod +x "$TMPDIR/hyle"

# Download checksums and signature (optional, best-effort)
if curl -fsSL "${BASE_URL}/${VERSION}/SHA256SUMS.txt" -o "$TMPDIR/SHA256SUMS.txt" 2>/dev/null; then
  # Verify binary against checksums
  EXPECTED_SHA=$(grep "${BINARY}" "$TMPDIR/SHA256SUMS.txt" | awk '{print $1}' || true)
  if [ -n "$EXPECTED_SHA" ]; then
    ACTUAL_SHA=$(sha256sum "$TMPDIR/hyle" | awk '{print $1}')
    if [ "$EXPECTED_SHA" != "$ACTUAL_SHA" ]; then
      echo "Error: SHA256 mismatch for ${BINARY}" >&2
      echo "Expected: $EXPECTED_SHA" >&2
      echo "Got:      $ACTUAL_SHA" >&2
      exit 1
    fi
    echo "✓ SHA256 verified"
  fi
fi

# Install
if [ -w "${INSTALL_DIR}" ]; then
  mv "$TMPDIR/hyle" "${INSTALL_DIR}/hyle"
else
  sudo mv "$TMPDIR/hyle" "${INSTALL_DIR}/hyle"
fi

echo "✓ hylé installed to ${INSTALL_DIR}/hyle"
echo "Run: hyle --version"
