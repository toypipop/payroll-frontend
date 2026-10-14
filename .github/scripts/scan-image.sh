#!/usr/bin/env bash
set -euo pipefail
image=$1
work=$2
pkg_types=${3:-os}
mkdir -p "$work/cache" "$work/results"
scanner='aquasec/trivy:0.75.0@sha256:af6acf9a6b85dfe389a1941505c0ce9efef52a4719635e1a962f022a3d855daa'
# Download only the public advisory database, without mounting the application.
docker run --rm --mount "type=bind,source=$work/cache,target=/cache" "$scanner" image --cache-dir /cache --download-db-only --disable-telemetry --quiet
docker save --output "$work/results/image.tar" "$image"
trap 'rm -f -- "$work/results/image.tar"' EXIT
scan=(docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges:true --tmpfs /tmp:rw,noexec,nosuid,size=512m --mount "type=bind,source=$work/cache,target=/cache" --mount "type=bind,source=$work/results,target=/results" "$scanner" image --cache-dir /cache --input /results/image.tar --skip-db-update --skip-java-db-update --offline-scan --disable-telemetry --scanners vuln --quiet)
# Keep the complete local report. The gate uses distro fix status for OS packages;
# language findings need reachability review and the app's separate dependency checks.
"${scan[@]}" --format json --output /results/report.json
"${scan[@]}" --pkg-types "$pkg_types" --ignore-unfixed --severity HIGH,CRITICAL --exit-code 1
