#!/usr/bin/env bash
# Helpers for deploying to cPanel using an API token (no SSH needed).
# Used by deploy-admin.yml, deploy-backend.yml and deploy-store.yml (anaya-*.eastlogic.com).
#
# Required env:
#   CPANEL_HOST   e.g. https://eastlogic.com:2083
#   CPANEL_USER   cPanel username
#   CPANEL_TOKEN  cPanel API token (GitHub secret)
#
# Usage:
#   source .github/scripts/cpanel.sh
#   cp_upload  <local-file> <remote-dir>
#   cp_extract <remote-archive> <remote-dest-dir>
#   cp_unlink  <remote-path>
set -euo pipefail

: "${CPANEL_HOST:?CPANEL_HOST is required}"
: "${CPANEL_USER:?CPANEL_USER is required}"
: "${CPANEL_TOKEN:?CPANEL_TOKEN is required}"

_cp_auth() {
  printf 'Authorization: cpanel %s:%s' "$CPANEL_USER" "$CPANEL_TOKEN"
}

# Upload a single file into a remote directory (overwrites existing file).
cp_upload() {
  local file="$1" dir="$2" resp
  echo "Uploading $(basename "$file") ($(du -h "$file" | cut -f1)) -> $dir"
  resp=$(curl -sS --fail-with-body --max-time 900 \
    -H "$(_cp_auth)" \
    -F "dir=$dir" \
    -F "overwrite=1" \
    -F "file-1=@$file" \
    "$CPANEL_HOST/execute/Fileman/upload_files")
  if ! echo "$resp" | jq -e '.status == 1 and (.data.failed // 0) == 0' >/dev/null; then
    echo "::error::Upload failed: $resp"
    return 1
  fi
}

# Run a legacy API2 Fileman::fileop (extract / unlink / etc.).
_cp_fileop() {
  local op="$1" src="$2" dest="${3:-}" resp
  resp=$(curl -sS --fail-with-body --max-time 900 -G \
    -H "$(_cp_auth)" \
    --data-urlencode "cpanel_jsonapi_user=$CPANEL_USER" \
    --data-urlencode "cpanel_jsonapi_apiversion=2" \
    --data-urlencode "cpanel_jsonapi_module=Fileman" \
    --data-urlencode "cpanel_jsonapi_func=fileop" \
    --data-urlencode "op=$op" \
    --data-urlencode "sourcefiles=$src" \
    --data-urlencode "destfiles=$dest" \
    --data-urlencode "doubledecode=0" \
    "$CPANEL_HOST/json-api/cpanel")
  if ! echo "$resp" | jq -e '(.cpanelresult.error // "") == "" and (.cpanelresult.data[0].result // 0) == 1' >/dev/null; then
    echo "::error::fileop '$op' failed for $src: $resp"
    return 1
  fi
}

cp_extract() {
  echo "Extracting $1 -> $2"
  _cp_fileop extract "$1" "$2"
}

cp_unlink() {
  echo "Deleting $1"
  _cp_fileop unlink "$1"
}
