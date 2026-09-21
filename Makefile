# niffler-ui — the desktop SPA shell for a Niffler harness.
#
#   make build       bindings -> SPA -> Wails binary (build/bin/niffler-ui)
#   make dev         Vite dev server in a browser (the bridge is stubbed)
#   make test        frontend unit tests (no dependencies needed)
#   make typecheck   tsc --noEmit + svelte-check
#   make install     desktop integration (~/.local/bin + .desktop + icons)
#   make clean       drop build output and generated artifacts
#
# NIF_ROOT is baked into the binary when set (icon launches have no env and no
# helpful layout); leave it empty for a checkout-local build that finds the
# harness by walking up from the executable.

WAILS    ?= $(shell command -v wails 2>/dev/null || echo "$(HOME)/go/bin/wails")
UI_TAGS  ?= -tags webkit2_41
BIN      := build/bin/niffler-ui
COMMIT   := $(shell git rev-parse --short HEAD 2>/dev/null || echo unknown)
NIF_ROOT ?=

BIN_DIR     := $(HOME)/.local/bin
DESKTOP_DIR := $(HOME)/.local/share/applications
ICON_DIR    := $(HOME)/.local/share/icons/hicolor
DESKTOP_DST := $(DESKTOP_DIR)/niffler.desktop

.PHONY: all build bindings deps spa dev test typecheck install uninstall clean

all: build

# Generated, gitignored, and required before anything typechecks or builds:
# wails introspects the Go package, which //go:embeds frontend/dist — so seed a
# placeholder when the SPA has not been built yet (the real build overwrites it).
bindings:
	@mkdir -p frontend/dist
	@[ -f frontend/dist/index.html ] || \
		echo '<!doctype html><title>placeholder — built by make spa</title>' > frontend/dist/index.html
	@if [ ! -x "$(WAILS)" ]; then \
		echo "wails CLI not found (looked at $(WAILS))."; \
		echo "Install: go install github.com/wailsapp/wails/v2/cmd/wails@latest"; \
		exit 1; fi
	"$(WAILS)" generate module

deps:
	cd frontend && npm ci --no-audit --no-fund

spa: bindings
	cd frontend && npm run build

build: spa
	"$(WAILS)" build $(UI_TAGS) -nopackage \
		-ldflags "-X main.buildCommit=$(COMMIT)$(if $(NIF_ROOT), -X main.nifRoot=$(NIF_ROOT),)"
	@echo "built $(BIN)"

dev: bindings
	cd frontend && npm run dev

test:
	cd frontend && npm test

typecheck: bindings
	cd frontend && npm ci --no-audit --no-fund && npm run typecheck

# Desktop integration (Linux): the window icon comes from the embedded icon in
# main.go; the launcher/taskbar icon needs a desktop entry plus hicolor icons.
install: build
	@echo "Installing Niffler desktop integration..."
	@mkdir -p $(BIN_DIR) $(DESKTOP_DIR) $(ICON_DIR)/48x48/apps $(ICON_DIR)/256x256/apps
	cp $(BIN) $(BIN_DIR)/niffler-ui
	chmod +x $(BIN_DIR)/niffler-ui
	sed 's|Exec=.*|Exec=$(BIN_DIR)/niffler-ui|' niffler.desktop > $(DESKTOP_DST)
	cp appicon-48.png $(ICON_DIR)/48x48/apps/niffler.png
	cp appicon-256.png $(ICON_DIR)/256x256/apps/niffler.png
	-update-desktop-database $(DESKTOP_DIR) 2>/dev/null || true
	-gtk-update-icon-cache -f $(ICON_DIR) 2>/dev/null || true
	@echo "Launcher 'Niffler' installed (executable: $(BIN_DIR)/niffler-ui)."
	@echo "You may need to log out and back in for the icon to appear."

uninstall:
	@echo "Removing Niffler desktop integration..."
	rm -f $(BIN_DIR)/niffler-ui
	rm -f $(DESKTOP_DST)
	rm -f $(ICON_DIR)/48x48/apps/niffler.png
	rm -f $(ICON_DIR)/256x256/apps/niffler.png
	-update-desktop-database $(DESKTOP_DIR) 2>/dev/null || true
	-gtk-update-icon-cache -f $(ICON_DIR) 2>/dev/null || true

clean:
	rm -rf build frontend/dist frontend/wailsjs
