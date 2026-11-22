/**
 * Think Tank 24/7 VPS Native Bot (Direct Playwright Mouse Engine)
 * Uses native CDP mouse events (100% isTrusted) + Auto-Bell Ringing.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_URL = 'https://thinkers.games.moongate.com/?ref=wffz4rst3r38';
const SESSION_FILE = path.join(__dirname, 'think_tank_session.json');

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function runBot() {
    console.log('==============================================');
    console.log('🚀 Launching Think Tank VPS Native Mouse Bot...');
    console.log('==============================================');

    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--use-gl=swiftshader',
            '--enable-webgl',
            '--mute-audio',
            '--js-flags=--max-old-space-size=256',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // 1. Restore Cookies & Session
    if (fs.existsSync(SESSION_FILE)) {
        console.log('🔑 Restoring session from think_tank_session.json...');
        try {
            const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
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
                if (cookieList.length > 0) await context.addCookies(cookieList);
            }
            if (session.localStorage) {
                await page.addInitScript((storage) => {
                    for (const [k, v] of Object.entries(storage)) {
                        try { window.localStorage.setItem(k, v); } catch(e){}
                    }
                }, session.localStorage);
            }
            console.log('✅ Session restored successfully.');
        } catch (e) {
            console.error('Session load error:', e.message);
        }
    }

    // 2. Navigate to Game
    console.log(`🌐 Navigating to ${GAME_URL}...`);
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    console.log('✅ DOM loaded. Waiting 10s for 3D engine to render...');
    await page.waitForTimeout(10000);

    console.log('🔥 NATIVE PLAYWRIGHT MOUSE TAPPER ACTIVE!');
    console.log('Schedule: 20-25m active tapping -> 3-4m rest -> Auto-Bell ringing.');

    // State Tracking
    let totalTaps = 0;
    let burstTaps = 0;
    let burstLimit = rand(30, 60);
    let sessionEndTime = Date.now() + rand(20, 25) * 60 * 1000;
    let isBreak = false;
    let breakEndTime = 0;

    // Floor Safe Box (3D Office on left side: avoid right menus)
    const floorMinX = 180;
    const floorMaxX = 750;
    const floorMinY = 220;
    const floorMaxY = 560;

    // Focal cluster point (moves periodically to mimic human focus)
    let focalX = rand(floorMinX + 50, floorMaxX - 50);
    let focalY = rand(floorMinY + 50, floorMaxY - 50);

    while (true) {
        try {
            const now = Date.now();

            // 1. AUTO-BELL: Check if floor is closed or bell needs ringing
            const bellBtn = await page.$('text="RING THE BELL"');
            if (bellBtn) {
                console.log('🔔 Floor is closed! Clicking RING THE BELL to reopen...');
                await bellBtn.click({ force: true });
                await page.waitForTimeout(1500);
            }

            // Check for THINK button
            const thinkBtn = await page.$('button:has-text("THINK")');
            if (thinkBtn) {
                console.log('💡 Found THINK button! Claiming points...');
                await thinkBtn.click({ force: true });
                await page.waitForTimeout(1000);
            }

            // 2. SCHEDULE: Check 3-4m Break
            if (isBreak) {
                if (now >= breakEndTime) {
                    isBreak = false;
                    const workMins = rand(20, 25);
                    sessionEndTime = now + workMins * 60 * 1000;
                    console.log(`☕ Break finished! Starting new active session for ${workMins} minutes.`);
                } else {
                    const secLeft = Math.ceil((breakEndTime - now) / 1000);
                    if (secLeft % 30 === 0) console.log(`☕ Resting (${secLeft}s left)...`);
                    await page.waitForTimeout(1000);
                    continue;
                }
            }

            // Check if 20-25m session finished
            if (now >= sessionEndTime) {
                isBreak = true;
                const breakMins = rand(3, 4);
                breakEndTime = now + breakMins * 60 * 1000;
                console.log(`☕ 20-25m session done! Taking a ${breakMins}m human break...`);
                await page.waitForTimeout(1000);
                continue;
            }

            // 3. FINGER FATIGUE: Micro-pause after burst
            if (burstTaps >= burstLimit) {
                burstTaps = 0;
                burstLimit = rand(25, 55);
                // Shift focal point on floor
                focalX = rand(floorMinX + 50, floorMaxX - 50);
                focalY = rand(floorMinY + 50, floorMaxY - 50);
                const microPause = rand(1200, 2400);
                await page.waitForTimeout(microPause);
                continue;
            }

            // 4. REAL HARDWARE CLICK via Playwright Mouse
            const tapX = Math.max(floorMinX, Math.min(floorMaxX, focalX + rand(-35, 35)));
            const tapY = Math.max(floorMinY, Math.min(floorMaxY, focalY + rand(-35, 35)));

            // Native CDP mouse click (100% isTrusted, native hardware event)
            await page.mouse.click(tapX, tapY);
            totalTaps++;
            burstTaps++;

            if (totalTaps % 100 === 0) {
                console.log(`⚡ [LIVE TAPPING] Total Taps: ${totalTaps.toLocaleString()} | Current session active`);
            }

            // Speed: 7 to 9 taps/sec (110ms - 145ms delay)
            const delay = rand(105, 145);
            await page.waitForTimeout(delay);

        } catch (loopErr) {
            console.error('Loop warning:', loopErr.message);
            await page.waitForTimeout(2000);
        }
    }
}

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

runBot().catch(err => {
    console.error('Fatal Bot Error:', err);
});
