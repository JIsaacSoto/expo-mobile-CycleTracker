#!/usr/bin/env bash
# Builds a release APK locally (signed with the debug key: for testing only).
#
#   npm run build:apk            # reuse ./android if it exists
#   npm run build:apk -- --clean # regenerate ./android from app.json first
#
# Needs Java 17 and the Android SDK. Defaults match ~/Android/{jdk17,Sdk};
# override with CYCLETRACKER_JAVA_HOME / ANDROID_HOME.
set -euo pipefail

cd "$(dirname "$0")/.."

export JAVA_HOME="${CYCLETRACKER_JAVA_HOME:-$HOME/Android/jdk17}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

[[ -x "$JAVA_HOME/bin/java" ]] || { echo "Java 17 not found at $JAVA_HOME" >&2; exit 1; }
[[ -d "$ANDROID_HOME/platforms" ]] || { echo "Android SDK not found at $ANDROID_HOME" >&2; exit 1; }

prebuild_args=(--platform android --no-install)
[[ "${1:-}" == "--clean" ]] && prebuild_args+=(--clean)
CI=1 npx expo prebuild "${prebuild_args[@]}"

(cd android && ./gradlew assembleRelease --console=plain)

version=$(node -p "require('./app.json').expo.version")
code=$(node -p "require('./app.json').expo.android.versionCode")
mkdir -p builds
out="builds/CycleTracker-v${version}-${code}.apk"
cp android/app/build/outputs/apk/release/app-release.apk "$out"
echo "APK: $out ($(du -h "$out" | cut -f1))"
