#!/usr/bin/env bash
# ========================================================
# 1-Click VPS Setup Script for Think Tank 24/7 Bot
# Supports: Ubuntu 20.04 / 22.04 / 24.04 & Debian 11 / 12
# ========================================================

set -e

echo "==============================================="
echo "🚀 Setting up Think Tank 24/7 VPS Bot..."
echo "==============================================="

# 1. Update OS packages
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20 LTS (if not installed)
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "✅ Node.js already installed: $(node -v)"
fi

# 3. Install PM2 (Process Manager for 24/7 background uptime)
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    sudo npm install -g pm2
fi

# 4. Install project dependencies & Playwright Chromium
echo "📦 Installing bot dependencies..."
npm install

echo "🌐 Installing Chromium & system dependencies for Playwright..."
npx playwright install --with-deps chromium

# 5. Check for session file
if [ ! -f "think_tank_session.json" ]; then
    echo "⚠️ WARNING: 'think_tank_session.json' not found!"
    echo "👉 Please upload your 'think_tank_session.json' into this folder so the bot logs into your X account."
else
    echo "🔑 'think_tank_session.json' found! Your account will be restored."
fi

# 6. Start Bot with PM2
echo "🚀 Starting Think Tank Bot in the background with PM2..."
pm2 start bot.js --name "think-tank-bot"
pm2 save

echo ""
echo "=========================================================="
echo "🎉 SUCCESS! Your Think Tank Bot is now running 24/7!"
echo "=========================================================="
echo "Useful PM2 Commands:"
echo "  pm2 logs think-tank-bot       # View live logs"
echo "  pm2 status                    # Check if running"
echo "  pm2 restart think-tank-bot    # Restart the bot"
echo "  pm2 stop think-tank-bot       # Stop the bot"
echo "=========================================================="
