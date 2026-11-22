# ⚡ Think Tank Floor Auto-Tapper Tool

Custom auto-tapper tool created for **Think Tank** (`https://thinkers.games.moongate.com/`).

---

## 🛡️ Critical Safety Feature
In Think Tank, the right sidebar contains sensitive controls like:
- **SIGN OUT**
- **DELETE MY DATA** (Dangerous!)
- **ROOMS / UPGRADES**

Both tools below are specifically engineered with a **Safe Zone**:
> They only tap across the 3D office floor (the left 70% of the screen) with random coordinates and human-like micro-jitters, ensuring **ZERO chance of clicking 'Sign Out' or 'Delete My Data'**.

---

## 🚀 Option 1: Instant Browser Console Tool (No Install Required)
This is the fastest method. It runs directly inside your browser tab:

1. Open your game tab at [thinkers.games.moongate.com](https://thinkers.games.moongate.com/?ref=wffz4rst3r38).
2. Press **F12** (or `Ctrl + Shift + I`) to open Developer Tools.
3. Click on the **Console** tab.
4. Copy the entire contents of `browser_autotapper.js` and paste it into the console, then press **Enter**.
5. A draggable retro terminal HUD will appear on your screen:
   - Click **▶ START TAPPING (F8)** (or press `F8` on your keyboard).
   - Adjust speed slider (~10 to 25 taps per second).
   - Press **F8** anytime to pause/resume.
   - Click **✖** on the top right of the HUD to remove it.

---

## 🖥️ Option 2: Standalone Windows Desktop App
If you prefer native hardware mouse clicks (100% `isTrusted` OS events):

1. Double-click `run_autoclicker.bat` (or run `python think_tank_autoclicker.py`).
2. The sleek floating window will appear:
   - Select mode: **"Random Inside 3D Floor (Safe Zone)"** or **"Around Current Mouse"**.
   - Switch to your Think Tank browser window.
   - Press **F6** to start / pause tapping.
   - Press **ESC** at any time for an emergency stop.
