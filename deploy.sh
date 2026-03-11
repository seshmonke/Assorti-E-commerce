#!/bin/bash

# ============================================================
#  deploy.sh — Universal deploy script for sofar5
#  Usage: bash deploy.sh [--no-notify]
# ============================================================

set -euo pipefail

# ── Paths ─────────────────────────────────────────────────────
BASE_DIR="/root/sofar5"
FRONTEND_DIR="$BASE_DIR/frontend"
BACKEND_DIR="$BASE_DIR/backend"
DIST_DIR="/var/www/frontend"
LOG_FILE="/var/www/sofar5/deploy.log"

# ── Telegram notifications (optional) ────────────────────────
# Set these env vars or fill in directly:
TG_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TG_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

# ── Helpers ──────────────────────────────────────────────────
ts()         { date '+%H:%M:%S'; }
echo_green() { echo -e "\033[32m[$(ts)] ✔  $1\033[0m" | tee -a "$LOG_FILE"; }
echo_yellow(){ echo -e "\033[33m[$(ts)] ➜  $1\033[0m" | tee -a "$LOG_FILE"; }
log_error()  { echo -e "\033[31m[$(ts)] ✘  $1\033[0m" | tee -a "$LOG_FILE"; }
log_info()   { echo -e "\033[36m[$(ts)] ℹ  $1\033[0m" | tee -a "$LOG_FILE"; }

send_telegram() {
  local msg="$1"
  if [[ -n "$TG_BOT_TOKEN" && -n "$TG_CHAT_ID" ]]; then
    curl -s -X POST "https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage" \
      -d chat_id="$TG_CHAT_ID" \
      -d text="$msg" \
      -d parse_mode="HTML" > /dev/null 2>&1 || true
  fi
}

# Detect git branch (main or master)
detect_branch() {
  local dir="$1"
  cd "$dir"
  local branch
  branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")
  echo "$branch"
}

# Rollback helper: stash uncommitted changes on error
rollback() {
  local dir="$1"
  local component="$2"
  log_error "Rolling back $component in $dir ..."
  cd "$dir" && git stash --include-untracked 2>/dev/null || true
}

# ── Init log file ─────────────────────────────────────────────
sudo mkdir -p "$(dirname "$LOG_FILE")"
sudo mkdir -p "$DIST_DIR"
sudo touch "$LOG_FILE"
sudo chown "$(whoami)" "$LOG_FILE"

# ── Start ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo_yellow "════════════════════════════════════════"
echo_yellow "  🚀 Deploy started — $(date '+%Y-%m-%d %H:%M:%S')"
echo_yellow "════════════════════════════════════════"
send_telegram "🚀 <b>Deploy started</b> — $(date '+%Y-%m-%d %H:%M:%S')"

DEPLOY_STATUS="success"

# ── 0. TELEGRAM BOT BUILD ─────────────────────────────────────
echo_yellow "── [0/4] Telegram Bot (TypeScript build) ─"

BOT_DIR="$BASE_DIR/telegram-admin-bot"

if [[ ! -d "$BOT_DIR" ]]; then
  log_error "Telegram bot directory not found: $BOT_DIR"
  DEPLOY_STATUS="failed"
  send_telegram "❌ <b>Deploy FAILED</b>: Telegram bot dir not found"
  exit 1
fi

cd "$BOT_DIR"
log_info "Building telegram-admin-bot..."

npm ci 2>&1 | tee -a "$LOG_FILE"
echo_green "Telegram bot: npm ci OK"

npm run build 2>&1 | tee -a "$LOG_FILE"
echo_green "Telegram bot: build OK"

# ── 1. FRONTEND ───────────────────────────────────────────────
echo_yellow "── [1/4] Frontend (React/Vite) ──────────"

if [[ ! -d "$FRONTEND_DIR" ]]; then
  log_error "Frontend directory not found: $FRONTEND_DIR"
  DEPLOY_STATUS="failed"
  send_telegram "❌ <b>Deploy FAILED</b>: Frontend dir not found"
  exit 1
fi

cd "$FRONTEND_DIR"
BRANCH=$(detect_branch "$FRONTEND_DIR")
log_info "Branch: $BRANCH"

if ! git pull origin "$BRANCH" 2>&1 | tee -a "$LOG_FILE"; then
  log_error "git pull failed for frontend"
  rollback "$FRONTEND_DIR" "frontend"
  DEPLOY_STATUS="failed"
  send_telegram "❌ <b>Deploy FAILED</b>: Frontend git pull error"
  exit 1
fi
echo_green "Frontend: git pull OK"

npm ci 2>&1 | tee -a "$LOG_FILE"
echo_green "Frontend: npm ci OK"

npm run build 2>&1 | tee -a "$LOG_FILE"
echo_green "Frontend: build OK"

log_info "Copying build to $DIST_DIR ..."
sudo rm -rf "$DIST_DIR"/*
sudo cp -r dist/* "$DIST_DIR"/
echo_green "Frontend: dist copied OK"

# ── 2. BACKEND ────────────────────────────���───────────────────
echo_yellow "── [2/4] Backend (Node.js/Prisma) ───────"

if [[ ! -d "$BACKEND_DIR" ]]; then
  log_error "Backend directory not found: $BACKEND_DIR"
  DEPLOY_STATUS="failed"
  send_telegram "❌ <b>Deploy FAILED</b>: Backend dir not found"
  exit 1
fi

cd "$BACKEND_DIR"
BRANCH=$(detect_branch "$BACKEND_DIR")
log_info "Branch: $BRANCH"

if ! git pull origin "$BRANCH" 2>&1 | tee -a "$LOG_FILE"; then
  log_error "git pull failed for backend"
  rollback "$BACKEND_DIR" "backend"
  DEPLOY_STATUS="failed"
  send_telegram "❌ <b>Deploy FAILED</b>: Backend git pull error"
  exit 1
fi
echo_green "Backend: git pull OK"

npm ci 2>&1 | tee -a "$LOG_FILE"
echo_green "Backend: npm ci OK"

npx prisma migrate deploy 2>&1 | tee -a "$LOG_FILE"
echo_green "Backend: prisma migrate deploy OK"

npx prisma generate 2>&1 | tee -a "$LOG_FILE"
echo_green "Backend: prisma generate OK"

npm run build 2>&1 | tee -a "$LOG_FILE"
echo_green "Backend: build OK"

# Copy fresh Prisma Client into dist/ (tsc no longer includes generated/)
log_info "Copying generated/ to dist/generated/ ..."
rm -rf "$BACKEND_DIR/dist/generated"
cp -r "$BACKEND_DIR/generated" "$BACKEND_DIR/dist/generated"
echo_green "Backend: generated/ copied to dist/generated/ OK"

# ── 3. PM2 ───────────────────────────────────────────────────
echo_yellow "── [3/4] PM2 processes ──────────────────"

pm2 delete backend 2>/dev/null || true
pm2 delete telegram-bot 2>/dev/null || true
pm2 start "$BASE_DIR/ecosystem.config.cjs" 2>&1 | tee -a "$LOG_FILE"
echo_green "PM2: processes started from ecosystem.config.cjs"

pm2 save 2>&1 | tee -a "$LOG_FILE"
echo_green "PM2: saved"

# ── 4. NGINX ─────────────────────────────────────────────────
echo_yellow "── [4/4] Nginx reload ───────────────────"

if sudo nginx -t 2>&1 | tee -a "$LOG_FILE"; then
  sudo systemctl reload nginx 2>&1 | tee -a "$LOG_FILE"
  echo_green "Nginx: config OK, reloaded"
else
  log_error "Nginx config test FAILED — reload skipped"
  DEPLOY_STATUS="failed"
  send_telegram "❌ <b>Deploy FAILED</b>: Nginx config error"
  exit 1
fi

# ── Done ─────────────────────────────────────────────��────────
echo_yellow "════════════════════════════════════════"
if [[ "$DEPLOY_STATUS" == "success" ]]; then
  echo_green "🎉 Deploy completed successfully! — $(date '+%Y-%m-%d %H:%M:%S')"
  send_telegram "✅ <b>Deploy SUCCESS</b> — $(date '+%Y-%m-%d %H:%M:%S')"
else
  log_error "Deploy finished with errors."
  send_telegram "❌ <b>Deploy FAILED</b> — $(date '+%Y-%m-%d %H:%M:%S')"
fi
echo_yellow "════════════════════════════════════════"
echo "" | tee -a "$LOG_FILE"
