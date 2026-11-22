# 🌐 Think Tank 24/7 VPS Setup Guide

Run Think Tank 24/7 in the cloud without leaving your laptop or screen turned on!

---

## 🎯 What This System Does:
- **Autonomous 24/7 Tapping:** Runs continuously in the cloud.
- **Smart Human Schedule:** Taps for **20–25 minutes**, stops for a **3–4 minute break**, and auto-resumes.
- **Human Speed:** **7–10 Taps/Sec** with randomized micro-jitter.
- **Auto-Upgrades:** Checks and purchases **Machine**, **Keyboard**, and **Coffee** boosts automatically to maximize your points and help you climb into the Top 100!
- **Safe Zone:** Only clicks on the 3D floor; never clicks "Sign Out" or "Delete Data".

---

## 🔑 Step 1: Export Your Login Session (Takes 10 Seconds)

You don't need to type your X username or password on the VPS. We export your active session directly from your browser!

1. Open your logged-in Think Tank game tab on your computer: [thinkers.games.moongate.com](https://thinkers.games.moongate.com/?ref=wffz4rst3r38).
2. Press **F12** (or `Ctrl + Shift + I`) and click the **Console** tab.
3. Paste the following snippet and press **Enter**:

```javascript
const sessionData = {
    cookies: document.cookie,
    localStorage: { ...localStorage },
    timestamp: new Date().toISOString(),
    gameUrl: window.location.href
};
const a = document.createElement('a');
a.href = URL.createObjectURL(new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' }));
a.download = 'think_tank_session.json';
document.body.appendChild(a);
a.click();
a.remove();
```
4. A file named `think_tank_session.json` will be downloaded to your computer.

---

## 🚀 Step 2: Choose Your VPS Type

### Method A: Linux VPS (Ubuntu/Debian) — Recommended ($3 - $5/month)
Any cheap VPS provider works (Hetzner, DigitalOcean, Contabo, Vultr, Linode, AWS Lightsail).
*Specs needed: 1 vCPU, 1GB–2GB RAM, Ubuntu 22.04 or 24.04.*

1. Connect to your VPS via SSH or PuTTY:
   ```bash
   ssh root@YOUR_VPS_IP
   ```
2. Upload this `vps_bot` folder and `browser_autotapper.js` to your VPS (or use SCP / FileZilla / GitHub).
   Make sure `think_tank_session.json` is placed inside the `vps_bot` folder!
3. Inside the `vps_bot` directory on your VPS, make the setup script executable and run it:
   ```bash
   chmod +x setup_vps.sh
   ./setup_vps.sh
   ```
4. **Done!** The bot is now running in the background with PM2. You can safely close your SSH terminal and turn off your laptop!

#### Helpful Commands on VPS:
- View live progress & taps:
  ```bash
  pm2 logs think-tank-bot
  ```
- Check bot status:
  ```bash
  pm2 status
  ```
- Download `latest_score.png` via SCP/FileZilla anytime to see a screenshot of your floor and current points!

---

### Method B: Windows VPS (Zero Linux Knowledge Needed)
If you prefer a Windows Desktop in the cloud:

1. Rent a Windows VPS (e.g. from Vultr, Kamatera, or Contabo).
2. Connect to the VPS using **Remote Desktop Connection (RDP)** on your PC.
3. Open Chrome/Brave inside the Windows VPS.
4. Log into Think Tank with your X account.
5. Press **F12** -> **Console** -> Paste `browser_autotapper.js` -> Press **F8** (or click Start).
6. Simply close the Remote Desktop window!
   *(On Windows VPS, applications and browsers keep running even when you disconnect from RDP).*
