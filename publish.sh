#!/bin/bash

# Publish script for Clean Dev Project
TAG="dev-clean"
APK_NAME="SriBagavathDevClean.apk"

echo "Verifying APK..."
if [ ! -f "$APK_NAME" ]; then
    echo "Error: $APK_NAME not found!"
    exit 1
fi

echo "Publishing to tag: $TAG"
gh release delete $TAG --yes || true
git tag -d $TAG || true
git push origin :refs/tags/$TAG || true

gh release create $TAG "$APK_NAME" --title "v2.8.33: Renamed Tamil Book Titles" --notes "Features:
- Updated all Tamil category book titles to their Tamil equivalents in Firestore.
- Added AI-generated prefaces and introductions for all 22 books.
- Refined Book Details UI by removing redundant 'Description' header.
- Implemented a more minimal and cleaner tab navigation style in the Book Store."

echo "---------------------------------------------------"
echo "Dev Clean Build Published!"
echo "URL: https://github.com/Ganapathiraj-A/SriBagavath/releases/download/$TAG/$APK_NAME"
echo "---------------------------------------------------"
