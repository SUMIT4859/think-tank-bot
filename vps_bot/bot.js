/**
 * Think Tank 24/7 VPS Bot - 8 Taps/Sec Floor Engine (Bug-Fixed)
 * Guarantees real taps without false-positive bell matching.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_URL = 'https://thinkers.games.moongate.com/index.html?ref=3hwshr5iijzf';
const SESSION_FILE = path.join(__dirname, 'think_tank_session.json');

async function runBot() {
    console.log('==============================================');
    console.log('🚀 Starting Think Tank 8 Taps/Sec Floor Bot...');
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
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--js-flags=--max-old-space-size=256',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const context = await browser.newContext({
        viewport: { width: 1366, height: 768 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // 1. Restore Session & Force Floor View
    if (fs.existsSync(SESSION_FILE)) {
        console.log('🔑 Loading session from think_tank_session.json...');
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
                session.localStorage['thinkers-floor:tab'] = 'floor';
                await page.addInitScript((storage) => {
                    for (const [k, v] of Object.entries(storage)) {
                        try { window.localStorage.setItem(k, v); } catch(e){}
                    }
                    try { window.localStorage.setItem('thinkers-floor:tab', 'floor'); } catch(e){}
                }, session.localStorage);
            }
            console.log('✅ Session restored with Floor mode active.');
        } catch (e) {
            console.error('Session load error:', e.message);
        }
    }

    // 2. Navigate to Game
    console.log(`🌐 Navigating to ${GAME_URL}...`);
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    console.log('✅ Page loaded! Waiting 10s for 3D engine to render...');
    await page.waitForTimeout(10000);

    // 3. Close any blocking overlays (THINKERS or TASKS)
    await page.evaluate(() => {
        const backBtn = Array.from(document.querySelectorAll('button, div, span, a')).find(el => 
            (el.textContent || '').includes('BACK TO THE FLOOR') && el.offsetHeight > 0
        );
        if (backBtn) backBtn.click();

        const closeBtn = Array.from(document.querySelectorAll('button, div, span')).find(el => 
            ((el.textContent || '').trim() === 'CLOSE' || (el.textContent || '').trim() === '✕') && el.offsetHeight > 0
        );
        if (closeBtn) closeBtn.click();
    });
    await page.waitForTimeout(2000);

    // 4. Inject 8 Taps/Sec Engine (No early returns, exact button matching)
    console.log('⚡ Starting High-Speed 8 Taps/Sec Engine...');
    await page.evaluate(() => {
        window.__TOTAL_TAPS__ = 0;
        window.__LIVE_STATUS__ = 'Tapping Active (8 CPS)';

        function rand(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function tap() {
            // A. Check for EXACT "RING THE BELL" button (Do NOT return, keep tapping!)
            const ringBellBtn = Array.from(document.querySelectorAll('button, div[role="button"]')).find(el => {
                const t = (el.textContent || '').trim().toUpperCase();
                return t === 'RING THE BELL' && el.offsetHeight > 0;
            });
            if (ringBellBtn) {
                ringBellBtn.click();
            }

            // B. Check for EXACT "THINK" button
            const thinkBtn = Array.from(document.querySelectorAll('button, div[role="button"]')).find(el => {
                const t = (el.textContent || '').trim().toUpperCase();
                return t === 'THINK' && el.offsetHeight > 0;
            });
            if (thinkBtn) {
                thinkBtn.click();
            }

            // C. Tap on the 3D Canvas
            const canvas = document.querySelector('canvas') || document.body;
            const w = window.innerWidth;
            const h = window.innerHeight;

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
                pageX: x,
                pageY: y,
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
            window.dispatchEvent(new PointerEvent('pointerdown', ptrProps));

            setTimeout(() => {
                canvas.dispatchEvent(new PointerEvent('pointerup', { ...ptrProps, buttons: 0 }));
                canvas.dispatchEvent(new MouseEvent('mouseup', { ...props, buttons: 0 }));
                canvas.dispatchEvent(new MouseEvent('click', { ...props, buttons: 0 }));
                window.dispatchEvent(new MouseEvent('click', { ...props, buttons: 0 }));
            }, 15);

            window.__TOTAL_TAPS__++;
            window.__LIVE_STATUS__ = '⚡ Tapping Active (8 CPS)';
        }

        // Fast 8 CPS loop (125ms interval)
        function loop() {
            tap();
            setTimeout(loop, rand(115, 135));
        }

        loop();
    });

    console.log('🔥 8 TAPS/SECOND BOT IS RUNNING!');

    // 5. Live Score & Tap Reporter: Every 30 seconds
    setInterval(async () => {
        try {
            const data = await page.evaluate(() => {
                const billboard = document.body.innerText;
                const match = billboard.match(/([0-9.,]+[KMBT]?)\s*THTS/i) || billboard.match(/([0-9.,]+M)/);
                const score = match ? match[0] : 'Scanning';

                return {
                    taps: window.__TOTAL_TAPS__ || 0,
                    status: window.__LIVE_STATUS__ || 'Tapping',
                    score: score
                };
            });

            console.log(`⚡ [LIVE UPDATE] Score: ${data.score} | Total Taps: ${data.taps.toLocaleString()} | Status: ${data.status}`);
        } catch (e) {
            console.error('Monitor tick warning:', e.message);
        }
    }, 30 * 1000);
}

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

runBot().catch(err => {
    console.error('Fatal Bot Error:', err);
});
