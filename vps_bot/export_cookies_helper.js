/**
 * Think Tank Session Exporter
 * Run this snippet in your browser Console (F12) while on Think Tank
 * It will instantly download 'think_tank_session.json' to your computer.
 * You upload this file to your VPS so the VPS bot is automatically logged into your account!
 */

(function () {
    const sessionData = {
        cookies: document.cookie,
        localStorage: { ...localStorage },
        timestamp: new Date().toISOString(),
        gameUrl: window.location.href
    };

    const jsonStr = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'think_tank_session.json';
    document.body.appendChild(a);
    a.click();
    a.remove();

    console.log('%c[SUCCESS] Session exported! Upload "think_tank_session.json" to your VPS.', 'color: #2ecc71; font-weight: bold; font-size: 14px;');
})();
