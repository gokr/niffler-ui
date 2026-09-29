#!/usr/bin/env bash
# Install this plugin into a Niffler harness through the plugin lifecycle.
#
#   scripts/install-into-harness.sh /path/to/niffler-checkout
#   NIF_HARNESS=/path/to/niffler make install-into-harness
#
# This lived in the harness as `scripts/install-ui.sh` until the desktop UI was
# demoted to an experimental side project; the harness no longer carries any
# installer for it, so the flow lives here, with the package it installs.
#
# It always uses a private, auto-approved boot for the install: that avoids
# mutating a user's live conversation bus and gives plugin_install a human
# approval context even when it runs headlessly (CI, a Makefile).
#
# The package is `interactive`: the plugin manager builds it (the recipe in
# niffler.json — npm + wails, against the installing harness) and publishes
# <harness>/var/bin/niffler-ui. Nothing spawns it; a desktop window is yours to
# open. `make install` here adds the launcher + PATH entry.
set -euo pipefail

HARNESS="${1:-${NIF_HARNESS:-}}"
REPO="${NIF_PLUGIN_REPO:-gokr/niffler-ui}"

log() { printf 'install-into-harness: %s\n' "$*"; }
die() { printf 'install-into-harness: %s\n' "$*" >&2; exit 1; }

[ -n "$HARNESS" ] || die "usage: scripts/install-into-harness.sh <harness-checkout> (or NIF_HARNESS=…)"
[ -d "$HARNESS" ] || die "harness checkout not found: $HARNESS"
HARNESS="$(cd "$HARNESS" && pwd)"

CORE="$HARNESS/var/bin/niffler"
CLI="$HARNESS/var/bin/cli"
URL_FILE="$HARNESS/var/nats-url"
PID=""
SAVED_URL=""

cleanup() {
  if [ -n "$PID" ]; then
    kill -TERM "$PID" 2>/dev/null || true
    wait "$PID" 2>/dev/null || true
  fi
  if [ -n "$SAVED_URL" ]; then printf '%s\n' "$SAVED_URL" > "$URL_FILE"; fi
}
trap cleanup EXIT

[ -x "$CORE" ] && [ -x "$CLI" ] || die "harness binaries missing in $HARNESS — run 'make build' there first"
mkdir -p "$HARNESS/var/logs"
[ -f "$URL_FILE" ] && SAVED_URL="$(tr -d '[:space:]' < "$URL_FILE")"

log "booting an isolated harness in $HARNESS for plugin_install"
NIF_NATS_URL= NIF_NATS_SPAWN=1 NIF_AUTO_APPROVE=1 \
  "$CORE" </dev/null >>"$HARNESS/var/logs/core.log" 2>&1 &
PID=$!

url=""
for _ in $(seq 1 180); do
  [ -f "$URL_FILE" ] && url="$(tr -d '[:space:]' < "$URL_FILE")"
  if [ -n "$url" ] && NIF_NATS_URL="$url" "$CLI" catalog >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done
[ -n "$url" ] && NIF_NATS_URL="$url" "$CLI" catalog >/dev/null 2>&1 || \
  die "harness did not come up — see $HARNESS/var/logs/core.log"

log "installing $REPO through the plugin manager"
NIF_NATS_URL="$url" "$CLI" install --timeout:900 "$REPO"

[ -x "$HARNESS/var/bin/niffler-ui" ] || \
  die "plugin installed without $HARNESS/var/bin/niffler-ui"
log "installed $HARNESS/var/bin/niffler-ui"

log "next: 'make install' here for the launcher + PATH entry, or run var/bin/niffler-ui directly"
