#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

if [ ! -f "package.json" ]; then
  echo "Error: package.json not found in the current directory."
  exit 1
fi

PACKAGE_NAME=$(node -p "require('./package.json').name")
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo "Checking package: $PACKAGE_NAME"
echo "Current local version: $CURRENT_VERSION"

# Fetch the latest published version from npm. 
# We temporarily disable set -e for this command because a new package will return an error.
set +e
PUBLISHED_VERSION=$(npm view "$PACKAGE_NAME" version 2>/dev/null)
set -e

if [ -z "$PUBLISHED_VERSION" ]; then
  echo "No published version found. This seems to be the first time publishing this package."
else
  echo "Latest published version: $PUBLISHED_VERSION"
  
  if [ "$CURRENT_VERSION" = "$PUBLISHED_VERSION" ]; then
    echo "Version $CURRENT_VERSION is already published."
    echo "Bumping patch version..."
    # 'npm version patch' will update package.json, package-lock.json and create a git commit/tag if in a repo.
    npm version patch
  fi
fi

echo "Publishing package..."
npm publish --access public
