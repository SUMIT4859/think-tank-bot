/**
 * Think Tank 24/7 Headless VPS Automation Bot
 * Runs on Linux or Windows VPS via Playwright.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_URL = 'https://thinkers.games.moongate.com/?ref=wffz4rst3r38';
const SESSION_FILE = path.join(__dirname, 'think_tank_session.json');
const SCRIPT_FILE = path.join(__dirname, '..', 'browser_autotapper.js');

async function runBot() {
    console.log('==============================================');
    console.log('🚀 Launching Think Tank 24/7 VPS Bot...');
    console.log('==============================================');

    // Launch Chromium with SwiftShader for headless WebGL support on Linux
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--use-gl=swiftshader',
            '--enable-webgl',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const context = await browser.newContext({
        viewport: { width: 1366, height: 768 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // 1. Load Session & Cookies if available
    if (fs.existsSync(SESSION_FILE)) {
        console.log('🔑 Found session file (think_tank_session.json). Restoring session...');
        try {
            const sessionRaw = fs.readFileSync(SESSION_FILE, 'utf8');
            const session = JSON.parse(sessionRaw);

            // Set cookies
            if (session.cookies) {
                const cookieList = session.cookies.split(';').map(c => {
                    const [name, ...val] = c.trim().split('=');
                    return {
                        name: name.trim(),
                        value: val.join('=').trim(),
                        domain: 'thinkers.games.moongate.com',
                        path: '/'
                    };
                }).filter(c => c.name && c.value);

                if (cookieList.length > 0) {
                    await context.addCookies(cookieList);
                    console.log(`🍪 Restored ${cookieList.length} cookies.`);
                }
            }

            // Restore localStorage before loading page
            if (session.localStorage) {
                await page.addInitScript((storage) => {
                    for (const [k, v] of Object.entries(storage)) {
                        try { window.localStorage.setItem(k, v); } catch(e){}
                    }
                }, session.localStorage);
                console.log('📦 Restored localStorage tokens.');
            }
        } catch (err) {
            console.error('⚠️ Error reading session file:', err.message);
        }
    } else {
        console.log('ℹ️ No session file found. Bot will load initial page.');
    }

    // 2. Navigate to Game
    console.log(`🌐 Navigating to ${GAME_URL}...`);
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    console.log('✅ DOM loaded! Waiting for 3D engine and floor to render...');
    
    try {
        await page.waitForSelector('canvas', { timeout: 25000 });
        console.log('🎮 3D Canvas element detected successfully!');
    } catch (e) {
        console.log('⏳ Canvas loading in background, proceeding...');
    }
    await page.waitForTimeout(6000);

    // Try optional screenshot safely without crashing if VPS is low RAM
    try {
        await page.screenshot({ path: path.join(__dirname, 'latest_score.png'), timeout: 5000 });
        console.log('📸 Saved initial screenshot -> latest_score.png');
    } catch (e) {
        console.log('ℹ️ Initial screenshot skipped (saving CPU/RAM for tapping).');
    }

    // 3. Inject and Start Auto-Tapper Script
    console.log('💉 Injecting Think Tank Smart 24/7 Auto-Tapper with Auto-Bell & Upgrades...');
    const botScript = fs.readFileSync(SCRIPT_FILE, 'utf8');
    await page.evaluate(botScript);

    // Trigger start on the bot
    await page.evaluate(() => {
        if (window.__THINK_TANK_TAPPER__) {
            window.__THINK_TANK_TAPPER__.start();
        }
    });
    console.log('🔥 Bot actively tapping! Schedule: 20-25m work / 3-4m break with auto-bell & upgrades.');

    // 4. Monitoring Loop: Log score every 5 minutes
    let uptimeMinutes = 0;
    const monitorInterval = setInterval(async () => {
        try {
            uptimeMinutes += 5;
            const scoreText = await page.evaluate(() => {
                const totalEl = document.getElementById('tt-stats');
                const statusEl = document.getElementById('tt-live-status');
                return {
                    taps: totalEl ? totalEl.textContent : 'N/A',
                    status: statusEl ? statusEl.textContent : 'N/A'
                };
            });

            console.log(`[Uptime: ${uptimeMinutes}m] ${scoreText.status} | ${scoreText.taps}`);

            // Optional screenshot every 15 mins (safe catch)
            if (uptimeMinutes % 15 === 0) {
                try {
                    await page.screenshot({ path: path.join(__dirname, 'latest_score.png'), timeout: 5000 });
                    console.log(`📸 Updated screenshot -> latest_score.png`);
                } catch (err) {
                    // Ignore screenshot timeouts on low-spec VPS
                }
            }

            // Auto-reload after 4 hours to keep memory clean
            if (uptimeMinutes >= 240) {
                console.log('🔄 4-Hour scheduled refresh. Restarting browser...');
                clearInterval(monitorInterval);
                await browser.close();
                runBot();
            }
        } catch (e) {
            console.error('Monitoring tick warning:', e.message);
        }
    }, 5 * 60 * 1000);
}

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

runBot().catch(err => {
    console.error('Fatal Bot Error:', err);
});
