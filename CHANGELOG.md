# Changelog

All notable changes to niffler-ui are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project aims
for [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-09-29

A small honesty release for an app that is no longer the front door: it renders
the whole context story core puts on the wire — including the compaction
refusals that used to be dropped on the floor — and it now owns its own
installer, because the harness stopped installing it. `niffler-tui` is the
client Niffler ships; this stays an experimental, unmaintained spin-off, and the
README now says so.

### Changed

- **The harness-side installer lives here now.** The harness demoted this app to
  an experimental side project: `make install-ui`, `install-ui-deps` and
  `install-wails`, the Wails/WebKitGTK checks in `make setup`/`make doctor`, and
  the `niffler-ui` PATH link in `make install` are gone from it, and its
  `scripts/install-ui.sh` was deleted. That flow is ported here as
  `scripts/install-into-harness.sh` + `make install-into-harness H=<harness>`
  (private, auto-approved harness boot, `cli install gokr/niffler-ui`, then a
  check that `<harness>/var/bin/niffler-ui` landed), and the Linux prerequisites
  it used to pull in are `make install-deps`.
- **The README stops pointing at a harness flow that no longer exists.** It told
  you to run `cd ~/git/niffler && make install WITH_UI=1` (that flag and that
  link are gone) and claimed the harness keeps a `scripts/niffler-ui.in`
  launcher (it does not — the binary's own `ensureHarness` call starts a
  harness). Both are corrected, the target table gains the two new targets, and
  the top carries an "experimental side project, currently unmaintained" banner
  naming `niffler-tui` as the shipped client.

### Fixed

- **Every context reason core emits is rendered.** The context branch understood
  only a trim count and a bare threshold warning, so every `compact:*` refusal —
  the thing that explains why the ladder fell through to a lossy trim — never
  reached the user; and the warning invented "will trim soon" where core prints
  "will compact/trim at N%". It now renders `warn:threshold` with core's own
  `trimAt` percentage (falling back to "will compact/trim soon" for an older
  core), `reset:prune`, and each compaction refusal as label + detail, keeping
  the existing `reset:trim`/`reset:compact` notes.
