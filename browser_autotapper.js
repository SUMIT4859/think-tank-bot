/**
 * Think Tank Auto-Tapper & Auto-Upgrader (VPS & Browser 24/7 Edition)
 * Designed for: https://thinkers.games.moongate.com/
 * 
 * Features:
 * - Session Cycles: 20-25 min active playing -> 3-4 min complete break -> Auto-resumes
 * - Safe Human Speed: 7-10 Taps/Sec with natural jitter
 * - Auto-Upgrade: Periodically checks the TAP tab to buy Machines/Keyboards/Boosts
 * - Safe Floor Zone: Never clicks right sidebar danger buttons (Sign Out / Delete Data)
 * - Draggable Retro HUD with live break & session countdown
 */

(function () {
    if (window.__THINK_TANK_TAPPER__) {
        window.__THINK_TANK_TAPPER__.destroy();
    }

    const state = {
        running: false,
        timer: null,
        sessionTimer: null,
        mode: 'session', // 'session' (20-25m work / 3-4m rest)
        
        // Speed & Human behavior
        minCPS: 7,
        maxCPS: 10,
        baseCPS: 8,
        
        // Session schedule settings
        isSessionBreak: false,
        sessionEndTime: 0,
        breakEndTime: 0,
        minWorkMinutes: 20,
        maxWorkMinutes: 25,
        minBreakMinutes: 3,
        maxBreakMinutes: 4,
        
        // Auto-Upgrade settings
        autoUpgrade: true,
        lastUpgradeTime: 0,
        upgradeIntervalMs: 6 * 60 * 1000, // Check upgrades every 6 mins
        
        // Tapping state
        burstCount: 0,
        burstTarget: 35,
        totalTaps: 0,
        currentFocusX: null,
        currentFocusY: null,
        safeMarginRight: 0.32,
        safeMarginTop: 0.12,
        safeMarginBottom: 0.10
    };

    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    function createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = `${x - 12}px`;
        ripple.style.top = `${y - 12}px`;
        ripple.style.width = '24px';
        ripple.style.height = '24px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '2px solid #f6c85f';
        ripple.style.boxShadow = '0 0 10px #f6c85f';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '999999';
        ripple.style.transition = 'transform 0.35s ease-out, opacity 0.35s ease-out';
        ripple.style.transform = 'scale(0.3)';
        ripple.style.opacity = '1';
        document.body.appendChild(ripple);

        requestAnimationFrame(() => {
            ripple.style.transform = 'scale(2.2)';
            ripple.style.opacity = '0';
        });

        setTimeout(() => ripple.remove(), 400);
    }

    function simulateTap(x, y) {
        const canvas = document.querySelector('canvas');
        const target = canvas || document.elementFromPoint(x, y) || document.body;

        const commonProps = {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: x,
            clientY: y,
            screenX: x + window.screenX,
            screenY: y + window.screenY,
            pageX: x + window.scrollX,
            pageY: y + window.scrollY,
            button: 0,
            buttons: 1
        };

        const pointerProps = {
            ...commonProps,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            width: 1,
            height: 1,
            pressure: 0.5
        };

        try {
            target.dispatchEvent(new PointerEvent('pointerdown', pointerProps));
            target.dispatchEvent(new MouseEvent('mousedown', commonProps));
            
            const holdTime = rand(25, 55);
            setTimeout(() => {
                target.dispatchEvent(new PointerEvent('pointerup', { ...pointerProps, buttons: 0 }));
                target.dispatchEvent(new MouseEvent('mouseup', { ...commonProps, buttons: 0 }));
                target.dispatchEvent(new MouseEvent('click', { ...commonProps, buttons: 0 }));
            }, holdTime);

            createRipple(x, y);
            state.totalTaps++;
            state.burstCount++;
            updateStats();
        } catch (err) {
            console.error('[Think Tank Tapper] Tap error:', err);
        }
    }

    function getFloorBounds() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        return {
            minX: Math.floor(width * 0.12),
            maxX: Math.floor(width * (1.0 - state.safeMarginRight)),
            minY: Math.floor(height * state.safeMarginTop),
            maxY: Math.floor(height * (1.0 - state.safeMarginBottom))
        };
    }

    function getHumanCoordinates() {
        const bounds = getFloorBounds();
        if (state.currentFocusX === null || state.burstCount === 0) {
            state.currentFocusX = rand(bounds.minX + 60, bounds.maxX - 60);
            state.currentFocusY = rand(bounds.minY + 60, bounds.maxY - 60);
        }

        let x = state.currentFocusX + rand(-35, 35);
        let y = state.currentFocusY + rand(-35, 35);

        x = Math.max(bounds.minX, Math.min(bounds.maxX, x));
        y = Math.max(bounds.minY, Math.min(bounds.maxY, y));

        return { x, y };
    }

    // Auto-Upgrade Handler
    async function performAutoUpgrade() {
        if (!state.autoUpgrade || !state.running) return;

        updateStatusText('🛒 Checking Upgrades...', '#9b59b6');
        console.log('[Think Tank Bot] Navigating to TAP tab for upgrades...');

        try {
            // Find TAP tab button
            const tapTab = Array.from(document.querySelectorAll('div, button, span'))
                .find(el => el.textContent.trim() === 'TAP' && el.offsetHeight > 0 && el.offsetHeight < 100);

            if (tapTab) {
                tapTab.click();
                await new Promise(r => setTimeout(r, 1500));

                // Click all available machine/keyboard upgrades
                const upgradeCards = Array.from(document.querySelectorAll('div, button')).filter(el => {
                    const txt = el.textContent || '';
                    return (txt.includes('MODEL') || txt.includes('KEYBOARD') || txt.includes('COFFEE')) &&
                           !txt.includes('COMPLETE') && el.offsetHeight > 20;
                });

                for (const card of upgradeCards.slice(0, 3)) {
                    card.click();
                    await new Promise(r => setTimeout(r, 500));
                }

                await new Promise(r => setTimeout(r, 1000));

                // Click "BACK TO THE FLOOR"
                const backBtn = Array.from(document.querySelectorAll('button, div, span'))
                    .find(el => el.textContent.includes('BACK TO THE FLOOR') && el.offsetHeight > 0);
                if (backBtn) {
                    backBtn.click();
                    await new Promise(r => setTimeout(r, 1200));
                }
            }
        } catch (e) {
            console.error('[Think Tank Bot] Auto-upgrade error:', e);
        }

        state.lastUpgradeTime = Date.now();
        console.log('[Think Tank Bot] Auto-upgrade cycle complete. Resuming tapping.');
    }

    // Main Tap Scheduling Loop
    async function scheduleNextTap() {
        if (!state.running) return;

        const now = Date.now();

        // 1. Check if in session break (3-4 mins)
        if (state.isSessionBreak) {
            if (now >= state.breakEndTime) {
                // End break, start new 20-25m session
                state.isSessionBreak = false;
                const workMinutes = rand(state.minWorkMinutes, state.maxWorkMinutes);
                state.sessionEndTime = now + workMinutes * 60 * 1000;
                console.log(`[Think Tank Bot] Break finished! Starting new active session for ${workMinutes} minutes.`);
            } else {
                const secLeft = Math.ceil((state.breakEndTime - now) / 1000);
                const m = Math.floor(secLeft / 60);
                const s = secLeft % 60;
                updateStatusText(`☕ In Break (${m}m ${s < 10 ? '0' : ''}${s}s)`, '#e67e22');
                state.timer = setTimeout(scheduleNextTap, 1000);
                return;
            }
        }

        // 2. Check if active session (20-25m) expired -> Enter break
        if (now >= state.sessionEndTime) {
            // First do an auto-upgrade before taking a break!
            if (state.autoUpgrade) {
                await performAutoUpgrade();
            }

            state.isSessionBreak = true;
            const breakMinutes = rand(state.minBreakMinutes, state.maxBreakMinutes);
            state.breakEndTime = now + breakMinutes * 60 * 1000;
            console.log(`[Think Tank Bot] 20-25m session completed. Taking a human break for ${breakMinutes} minutes.`);
            updateStatusText(`☕ Taking ${breakMinutes}m Break...`, '#e67e22');
            state.timer = setTimeout(scheduleNextTap, 1000);
            return;
        }

        // 3. Check periodic auto-upgrade during session (every ~6 mins)
        if (state.autoUpgrade && (now - state.lastUpgradeTime > state.upgradeIntervalMs)) {
            await performAutoUpgrade();
        }

        // 4. Micro fatigue rest within burst (1.2s - 2.5s)
        if (state.burstCount >= state.burstTarget) {
            state.burstCount = 0;
            state.burstTarget = rand(25, 50);
            state.currentFocusX = null;
            const microRest = rand(1200, 2500);
            state.timer = setTimeout(scheduleNextTap, microRest);
            return;
        }

        // 5. Execute tap at human speed (7-10 CPS)
        const coords = getHumanCoordinates();
        simulateTap(coords.x, coords.y);

        // Update countdown text
        const secLeft = Math.ceil((state.sessionEndTime - now) / 1000);
        const m = Math.floor(secLeft / 60);
        const s = secLeft % 60;
        updateStatusText(`⚡ Active (${m}m ${s < 10 ? '0' : ''}${s}s left)`, '#2ecc71');

        // Randomized interval for 7-10 CPS with jitter
        const cps = randFloat(state.minCPS, state.maxCPS);
        const interval = Math.floor(1000 / cps);
        const delay = Math.floor(interval * randFloat(0.85, 1.25));

        state.timer = setTimeout(scheduleNextTap, Math.max(30, delay));
    }

    function start() {
        if (state.running) return;
        state.running = true;
        const now = Date.now();
        const workMinutes = rand(state.minWorkMinutes, state.maxWorkMinutes);
        state.sessionEndTime = now + workMinutes * 60 * 1000;
        state.isSessionBreak = false;
        state.burstCount = 0;
        state.burstTarget = rand(25, 50);
        state.lastUpgradeTime = now;

        const btn = document.getElementById('tt-toggle-btn');
        if (btn) {
            btn.textContent = '⏹ STOP TAPPING (F8)';
            btn.style.background = '#e74c3c';
            btn.style.boxShadow = '0 0 15px rgba(231, 76, 60, 0.6)';
        }

        console.log(`[Think Tank Bot] Started! Active work session: ${workMinutes} minutes.`);
        scheduleNextTap();
    }

    function stop() {
        state.running = false;
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }
        updateStatusText('PAUSED', '#95a5a6');
        const btn = document.getElementById('tt-toggle-btn');
        if (btn) {
            btn.textContent = '▶ START TAPPING (F8)';
            btn.style.background = '#27ae60';
            btn.style.boxShadow = '0 0 15px rgba(39, 174, 96, 0.6)';
        }
    }

    function toggle() {
        if (state.running) stop();
        else start();
    }

    function updateStatusText(text, color) {
        const el = document.getElementById('tt-live-status');
        if (el) {
            el.textContent = text;
            el.style.color = color || '#f6c85f';
        }
    }

    function updateStats() {
        const statsEl = document.getElementById('tt-stats');
        if (statsEl) {
            statsEl.textContent = `TAPS: ${state.totalTaps.toLocaleString()}`;
        }
    }

    function createHUD() {
        const hud = document.createElement('div');
        hud.id = 'think-tank-hud';
        hud.innerHTML = `
            <div id="tt-hud-header" style="cursor: move; padding: 8px 12px; background: #1a162b; border-bottom: 1px solid #f6c85f; display: flex; justify-content: space-between; align-items: center; font-family: monospace; font-size: 11px; letter-spacing: 1px; color: #f6c85f; font-weight: bold;">
                <span>⚡ THINK TANK 24/7 AUTO-BOT</span>
                <span id="tt-close-btn" style="cursor: pointer; padding: 0 4px; color: #aaa;">✖</span>
            </div>
            <div style="padding: 12px; font-family: monospace; font-size: 11px; color: #e0e0e0;">
                <div style="margin-bottom: 6px; display: flex; justify-content: space-between;">
                    <span style="color: #888;">SCHEDULE:</span>
                    <span id="tt-live-status" style="color: #2ecc71; font-weight: bold;">READY</span>
                </div>
                <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                    <span style="color: #888;">TOTAL TAPS:</span>
                    <span id="tt-stats" style="color: #f6c85f; font-weight: bold;">TAPS: 0</span>
                </div>
                
                <button id="tt-toggle-btn" style="width: 100%; padding: 10px; font-family: monospace; font-weight: bold; font-size: 12px; border: none; cursor: pointer; border-radius: 4px; background: #27ae60; color: #fff; transition: all 0.2s; box-shadow: 0 0 12px rgba(39,174,96,0.4);">
                    ▶ START 24/7 CYCLE (F8)
                </button>

                <!-- Settings Box -->
                <div style="margin-top: 10px; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; border: 1px solid #332d4a; font-size: 10px;">
                    <div style="color: #f6c85f; font-weight: bold; margin-bottom: 5px;">🤖 SMART HUMAN SCHEDULE:</div>
                    <div style="color: #bdc3c7; line-height: 1.4;">
                        • <b>Active:</b> 20 - 25 minutes continuous<br>
                        • <b>Break:</b> 3 - 4 minutes auto-rest<br>
                        • <b>Speed:</b> 7 - 10 Taps/Sec (Human Limit)<br>
                    </div>

                    <div style="margin-top: 6px; border-top: 1px solid #332d4a; padding-top: 6px;">
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: #2ecc71;">
                            <input type="checkbox" id="tt-cb-upgrade" checked style="accent-color: #2ecc71;">
                            <span><b>Auto-Upgrade Machines/Keyboards</b></span>
                        </label>
                    </div>
                </div>

                <div style="margin-top: 8px; font-size: 9px; color: #7f8c8d;">
                    🛡️ Safe Zone protects 'Sign Out' & 'Delete Data'.
                </div>
            </div>
        `;

        hud.style.position = 'fixed';
        hud.style.top = '75px';
        hud.style.left = '20px';
        hud.style.width = '275px';
        hud.style.background = 'rgba(17, 13, 29, 0.96)';
        hud.style.border = '1px solid #f6c85f';
        hud.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.8), 0 0 8px rgba(246, 200, 95, 0.3)';
        hud.style.borderRadius = '6px';
        hud.style.zIndex = '999998';
        hud.style.backdropFilter = 'blur(6px)';
        hud.style.userSelect = 'none';

        document.body.appendChild(hud);

        // Dragging logic
        const header = document.getElementById('tt-hud-header');
        let isDragging = false, startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

        header.addEventListener('mousedown', (e) => {
            if (e.target.id === 'tt-close-btn') return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = hud.offsetLeft;
            initialTop = hud.offsetTop;
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            hud.style.left = `${initialLeft + (e.clientX - startX)}px`;
            hud.style.top = `${initialTop + (e.clientY - startY)}px`;
        });

        window.addEventListener('mouseup', () => { isDragging = false; });

        document.getElementById('tt-toggle-btn').addEventListener('click', toggle);
        document.getElementById('tt-close-btn').addEventListener('click', () => {
            window.__THINK_TANK_TAPPER__.destroy();
        });

        document.getElementById('tt-cb-upgrade').addEventListener('change', (e) => {
            state.autoUpgrade = e.target.checked;
        });

        const keyHandler = (e) => {
            if (e.key === 'F8') {
                e.preventDefault();
                toggle();
            }
        };
        window.addEventListener('keydown', keyHandler);

        return { hud, keyHandler };
    }

    const { hud, keyHandler } = createHUD();

    window.__THINK_TANK_TAPPER__ = {
        start,
        stop,
        toggle,
        destroy: () => {
            stop();
            if (hud) hud.remove();
            window.removeEventListener('keydown', keyHandler);
            delete window.__THINK_TANK_TAPPER__;
            console.log('[Think Tank Bot] Destroyed.');
        }
    };

    console.log('%c[Think Tank 24/7 Smart Bot Loaded! Press F8 or Start on HUD]', 'background: #110d1d; color: #f6c85f; font-size: 13px; font-weight: bold; padding: 6px;');
})();
