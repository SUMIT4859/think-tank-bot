/**
 * Think Tank 24/7 VPS Bot - High Speed 8 CPS Engine
 * Runs at steady 8 Taps/sec inside the browser with auto-bell ringing.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_URL = 'https://thinkers.games.moongate.com/?ref=wffz4rst3r38';
const SESSION_FILE = path.join(__dirname, 'think_tank_session.json');

async function runBot() {
    console.log('==============================================');
    console.log('🚀 Starting Think Tank Fast 8 CPS Bot...');
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
    console.log('✅ Page loaded! Waiting 8s for 3D engine to render...');
    await page.waitForTimeout(8000);

    // 3. Inject Fast In-Browser 8 CPS Loop with Auto-Bell
    console.log('⚡ Injecting Fast 8 CPS Tap Engine & Auto-Bell Ringing...');
    await page.evaluate(() => {
        window.__TOTAL_TAPS__ = 0;
        window.__LAST_STATUS__ = 'Tapping at 8 CPS';

        function rand(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        // Tap execution
        function doTap() {
            // 1. Check if floor is closed -> RING THE BELL
            const ringBellBtn = Array.from(document.querySelectorAll('button, div, span, a')).find(el => {
                const t = (el.textContent || '').trim().toUpperCase();
                return t.includes('RING THE BELL') && el.offsetHeight > 0;
            });
            if (ringBellBtn) {
                ringBellBtn.click();
                window.__LAST_STATUS__ = '🔔 Rang Bell (Floor Re-Opened)';
                return;
            }

            // 2. Check for THINK button
            const thinkBtn = Array.from(document.querySelectorAll('button, div, span')).find(el => {
                const t = (el.textContent || '').trim().toUpperCase();
                return t === 'THINK' && el.offsetHeight > 0;
            });
            if (thinkBtn) {
                thinkBtn.click();
                window.__LAST_STATUS__ = '💡 Clicked THINK';
                return;
            }

            // 3. Perform tap on canvas
            const canvas = document.querySelector('canvas') || document.body;
            const w = window.innerWidth;
            const h = window.innerHeight;

            // Safe floor zone (Left 65% of screen, center area)
            const x = rand(Math.floor(w * 0.15), Math.floor(w * 0.65));
            const y = rand(Math.floor(h * 0.20), Math.floor(h * 0.75));

            const props = {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: x,
                clientY: y,
                screenX: x,
                screenY: y,
                button: 0,
                buttons: 1
            };

            const ptrProps = {
                ...props,
                pointerId: 1,
                pointerType: 'mouse',
                isPrimary: true,
                pressure: 0.5
            };

            canvas.dispatchEvent(new PointerEvent('pointerdown', ptrProps));
            canvas.dispatchEvent(new MouseEvent('mousedown', props));

            setTimeout(() => {
                canvas.dispatchEvent(new PointerEvent('pointerup', { ...ptrProps, buttons: 0 }));
                canvas.dispatchEvent(new MouseEvent('mouseup', { ...props, buttons: 0 }));
                canvas.dispatchEvent(new MouseEvent('click', { ...props, buttons: 0 }));
            }, 25);

            window.__TOTAL_TAPS__++;
            window.__LAST_STATUS__ = '⚡ Tapping Active';
        }

        // Fast 8 CPS loop (125ms delay with ±15ms human jitter)
        function tapLoop() {
            doTap();
            const jitterDelay = rand(110, 135); // 7.5 to 9 CPS
            setTimeout(tapLoop, jitterDelay);
        }

        tapLoop();
    });

    console.log('🔥 8 CPS Fast Engine is RUNNING! Auto-Bell is active.');

    // 4. Live Progress Logger: logs every 30 seconds
    setInterval(async () => {
        try {
            const stats = await page.evaluate(() => {
                return {
                    taps: window.__TOTAL_TAPS__ || 0,
                    status: window.__LAST_STATUS__ || 'Running'
                };
            });
            console.log(`⚡ [LIVE] Status: ${stats.status} | Total Taps: ${stats.taps.toLocaleString()}`);
        } catch (e) {
            console.error('Logger warning:', e.message);
        }
    }, 30 * 1000); // Every 30 seconds
}

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

runBot().catch(err => {
    console.error('Fatal Bot Error:', err);
});
