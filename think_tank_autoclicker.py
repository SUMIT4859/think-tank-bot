"""
Think Tank Auto-Tapper (Windows Standalone Tool - Human Stealth Edition)
For Think Tank Game: https://thinkers.games.moongate.com/

Zero external dependencies required (Uses built-in Python ctypes & tkinter).
Features:
- Native Windows hardware clicks (100% isTrusted)
- Human Stealth Engine: 5-8 CPS, burst fatigue rests (1-2s), periodic long pauses (5s)
- Focal area drift: taps in realistic clusters around desks/computers rather than machine noise
- Safe Zone: restricts clicks to 3D floor, protecting right menu & Danger buttons
- F6 Hotkey to Start / Pause anytime
- Esc key for instant Emergency Stop
"""

import sys
import time
import random
import threading
import ctypes
from ctypes import wintypes
import tkinter as tk
from tkinter import ttk, messagebox

# Win32 Constants
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004
VK_F6 = 0x75
VK_ESCAPE = 0x1B

user32 = ctypes.windll.user32

class AutoTapperApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Think Tank Stealth Tapper")
        self.root.geometry("400x520")
        self.root.resizable(False, False)
        self.root.attributes("-topmost", True)

        # Style & Colors (Think Tank retro terminal aesthetic)
        self.bg_color = "#12101e"
        self.panel_color = "#1a172c"
        self.accent_color = "#f6c85f"
        self.green_color = "#27ae60"
        self.red_color = "#e74c3c"
        self.text_color = "#e6e6e6"

        self.root.configure(bg=self.bg_color)

        # State
        self.running = False
        self.total_clicks = 0
        self.burst_count = 0
        self.burst_target = 35
        self.focus_x = None
        self.focus_y = None
        self.click_thread = None
        self.hotkey_thread = None

        # Screen dimensions
        self.screen_w = user32.GetSystemMetrics(0)
        self.screen_h = user32.GetSystemMetrics(1)

        # Safe Floor bounds (Left 65% of screen, middle 70% height)
        self.area_x1 = int(self.screen_w * 0.15)
        self.area_y1 = int(self.screen_h * 0.20)
        self.area_x2 = int(self.screen_w * 0.65)
        self.area_y2 = int(self.screen_h * 0.82)

        self.mode_var = tk.StringVar(value="floor")
        self.stealth_var = tk.BooleanVar(value=True)

        self._build_ui()
        self._start_hotkey_listener()

    def _build_ui(self):
        # Header
        header = tk.Frame(self.root, bg=self.panel_color, pady=10)
        header.pack(fill="x")
        
        lbl_title = tk.Label(
            header,
            text="🛡️ THINK TANK STEALTH TAPPER",
            font=("Consolas", 12, "bold"),
            fg=self.accent_color,
            bg=self.panel_color
        )
        lbl_title.pack()

        lbl_sub = tk.Label(
            header,
            text="Human Emulation • Safe Zone Floor Protected",
            font=("Consolas", 8),
            fg="#95a5a6",
            bg=self.panel_color
        )
        lbl_sub.pack()

        # Main Container
        container = tk.Frame(self.root, bg=self.bg_color, padx=16, pady=12)
        container.pack(fill="both", expand=True)

        # Big Start / Stop Button
        self.btn_toggle = tk.Button(
            container,
            text="▶ START TAPPING (F6)",
            font=("Consolas", 12, "bold"),
            bg=self.green_color,
            fg="#ffffff",
            activebackground="#2ecc71",
            activeforeground="#ffffff",
            relief="flat",
            pady=10,
            cursor="hand2",
            command=self.toggle_clicking
        )
        self.btn_toggle.pack(fill="x", pady=(0, 10))

        # Stats Card
        stats_frame = tk.Frame(container, bg=self.panel_color, padx=12, pady=8, relief="groove", bd=1)
        stats_frame.pack(fill="x", pady=(0, 10))

        lbl_status_desc = tk.Label(stats_frame, text="STATUS:", font=("Consolas", 9), fg="#888", bg=self.panel_color)
        lbl_status_desc.grid(row=0, column=0, sticky="w")

        self.lbl_status = tk.Label(stats_frame, text="IDLE", font=("Consolas", 9, "bold"), fg="#3498db", bg=self.panel_color)
        self.lbl_status.grid(row=0, column=1, sticky="e", padx=(10, 0))

        lbl_clicks_desc = tk.Label(stats_frame, text="TOTAL TAPS:", font=("Consolas", 9), fg="#888", bg=self.panel_color)
        lbl_clicks_desc.grid(row=1, column=0, sticky="w", pady=(4, 0))

        self.lbl_clicks = tk.Label(stats_frame, text="0", font=("Consolas", 10, "bold"), fg=self.accent_color, bg=self.panel_color)
        self.lbl_clicks.grid(row=1, column=1, sticky="e", padx=(10, 0), pady=(4, 0))

        stats_frame.columnconfigure(0, weight=1)

        # Stealth Profile Checkbox
        stealth_frame = tk.Frame(container, bg=self.panel_color, padx=10, pady=8, bd=1, relief="ridge")
        stealth_frame.pack(fill="x", pady=(0, 10))

        cb_stealth = tk.Checkbutton(
            stealth_frame,
            text="🛡️ Human Stealth (Bursts & Natural Rests)",
            variable=self.stealth_var,
            font=("Consolas", 8, "bold"),
            fg="#2ecc71",
            bg=self.panel_color,
            selectcolor=self.bg_color,
            activebackground=self.panel_color,
            activeforeground="#2ecc71"
        )
        cb_stealth.pack(anchor="w")

        lbl_stealth_info = tk.Label(
            stealth_frame,
            text="Taps 25-45 times, rests 1-2s (simulates real hand fatigue)",
            font=("Consolas", 7),
            fg="#95a5a6",
            bg=self.panel_color
        )
        lbl_stealth_info.pack(anchor="w", padx=(20, 0))

        # Mode Selection
        lbl_mode = tk.Label(container, text="CLICKING REGION:", font=("Consolas", 9, "bold"), fg=self.text_color, bg=self.bg_color)
        lbl_mode.pack(anchor="w", pady=(0, 2))

        rb_floor = tk.Radiobutton(
            container,
            text="Floor Area with Focal Drift (Safe Zone)",
            variable=self.mode_var,
            value="floor",
            font=("Consolas", 8),
            fg=self.accent_color,
            bg=self.bg_color,
            selectcolor=self.panel_color,
            activebackground=self.bg_color,
            activeforeground=self.accent_color
        )
        rb_floor.pack(anchor="w")

        rb_cursor = tk.Radiobutton(
            container,
            text="Around Current Mouse (±40px Jitter)",
            variable=self.mode_var,
            value="cursor",
            font=("Consolas", 8),
            fg=self.accent_color,
            bg=self.bg_color,
            selectcolor=self.panel_color,
            activebackground=self.bg_color,
            activeforeground=self.accent_color
        )
        rb_cursor.pack(anchor="w", pady=(0, 8))

        # Speed Slider
        speed_header = tk.Frame(container, bg=self.bg_color)
        speed_header.pack(fill="x")
        
        lbl_speed = tk.Label(speed_header, text="SPEED:", font=("Consolas", 9, "bold"), fg=self.text_color, bg=self.bg_color)
        lbl_speed.pack(side="left")

        self.lbl_speed_val = tk.Label(speed_header, text="~6 CPS (Safe Human)", font=("Consolas", 9, "bold"), fg="#2ecc71", bg=self.bg_color)
        self.lbl_speed_val.pack(side="right")

        self.slider_speed = tk.Scale(
            container,
            from_=3,
            to=20,
            orient="horizontal",
            showvalue=False,
            bg=self.panel_color,
            troughcolor=self.bg_color,
            highlightthickness=0,
            command=self._on_slider_change
        )
        self.slider_speed.set(6)
        self.slider_speed.pack(fill="x", pady=(2, 8))

        # Instructions / Hotkey notice
        notice_frame = tk.Frame(container, bg=self.panel_color, padx=10, pady=6, bd=1, relief="ridge")
        notice_frame.pack(fill="x")

        notice_text = (
            "• F6: Start / Pause anytime\n"
            "• ESC: Emergency Stop\n"
            "• 5-8 CPS is recommended for safety"
        )
        lbl_notice = tk.Label(
            notice_frame,
            text=notice_text,
            font=("Consolas", 8),
            fg="#bdc3c7",
            bg=self.panel_color,
            justify="left"
        )
        lbl_notice.pack(anchor="w")

    def _on_slider_change(self, val):
        cps = int(val)
        if cps <= 8:
            self.lbl_speed_val.config(text=f"~{cps} CPS (Safe Human)", fg="#2ecc71")
        elif cps <= 12:
            self.lbl_speed_val.config(text=f"~{cps} CPS (Fast)", fg="#f1c40f")
        else:
            self.lbl_speed_val.config(text=f"~{cps} CPS (Risky)", fg="#e74c3c")

    def _start_hotkey_listener(self):
        def listener():
            was_f6_pressed = False
            was_esc_pressed = False
            while True:
                if user32.GetAsyncKeyState(VK_F6) & 0x8000:
                    if not was_f6_pressed:
                        was_f6_pressed = True
                        self.root.after(0, self.toggle_clicking)
                else:
                    was_f6_pressed = False

                if user32.GetAsyncKeyState(VK_ESCAPE) & 0x8000:
                    if not was_esc_pressed and self.running:
                        was_esc_pressed = True
                        self.root.after(0, self.stop_clicking)
                else:
                    was_esc_pressed = False

                time.sleep(0.05)

        self.hotkey_thread = threading.Thread(target=listener, daemon=True)
        self.hotkey_thread.start()

    def toggle_clicking(self):
        if self.running:
            self.stop_clicking()
        else:
            self.start_clicking()

    def start_clicking(self):
        if self.running:
            return
        self.running = True
        self.burst_count = 0
        self.burst_target = random.randint(25, 45)
        self.focus_x = None
        self.lbl_status.config(text="ACTIVE ●", fg=self.green_color)
        self.btn_toggle.config(
            text="⏹ PAUSE TAPPING (F6)",
            bg=self.red_color,
            activebackground="#c0392b"
        )

        self.click_thread = threading.Thread(target=self._click_loop, daemon=True)
        self.click_thread.start()

    def stop_clicking(self):
        self.running = False
        self.lbl_status.config(text="PAUSED", fg="#e67e22")
        self.btn_toggle.config(
            text="▶ RESUME TAPPING (F6)",
            bg=self.green_color,
            activebackground="#2ecc71"
        )

    def _click_loop(self):
        while self.running:
            # Check stealth rests
            if self.stealth_var.get():
                # Long break every ~220 taps (checking stats)
                if self.total_clicks > 0 and self.total_clicks % 220 == 0:
                    long_rest = random.uniform(4.5, 7.0)
                    self.root.after(0, lambda r=long_rest: self.lbl_status.config(text=f"BREAK ({r:.1f}s)", fg="#e67e22"))
                    self.focus_x = None
                    time.sleep(long_rest)
                    if not self.running:
                        break

                # Micro fatigue rest after a burst
                if self.burst_count >= self.burst_target:
                    self.burst_count = 0
                    self.burst_target = random.randint(22, 45)
                    self.focus_x = None
                    micro_rest = random.uniform(1.2, 2.6)
                    self.root.after(0, lambda r=micro_rest: self.lbl_status.config(text=f"RESTING ({r:.1f}s)", fg="#f39c12"))
                    time.sleep(micro_rest)
                    if not self.running:
                        break

            cps = self.slider_speed.get()
            avg_interval = 1.0 / max(1, cps)
            # Human jitter (±30%)
            jitter = random.uniform(avg_interval * 0.72, avg_interval * 1.35)

            if self.mode_var.get() == "floor":
                # Natural focal area with hand tremor drift
                if self.focus_x is None:
                    self.focus_x = random.randint(self.area_x1 + 50, self.area_x2 - 50)
                    self.focus_y = random.randint(self.area_y1 + 50, self.area_y2 - 50)

                target_x = self.focus_x + random.randint(-35, 35)
                target_y = self.focus_y + random.randint(-35, 35)
                target_x = max(self.area_x1, min(self.area_x2, target_x))
                target_y = max(self.area_y1, min(self.area_y2, target_y))
            else:
                pt = wintypes.POINT()
                user32.GetCursorPos(ctypes.byref(pt))
                target_x = pt.x + random.randint(-40, 40)
                target_y = pt.y + random.randint(-40, 40)
                target_x = max(0, min(self.screen_w - 1, target_x))
                target_y = max(0, min(self.screen_h - 1, target_y))

            # Move and click
            user32.SetCursorPos(target_x, target_y)
            user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
            time.sleep(random.uniform(0.025, 0.055))  # Realistic human hold
            user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)

            self.total_clicks += 1
            self.burst_count += 1

            if self.total_clicks % 3 == 0:
                self.root.after(0, self._update_clicks_label)

            time.sleep(jitter)

    def _update_clicks_label(self):
        self.lbl_clicks.config(text=f"{self.total_clicks:,}")
        if self.running:
            self.lbl_status.config(text=f"TAP ({self.burst_count}/{self.burst_target})", fg=self.green_color)


def main():
    root = tk.Tk()
    app = AutoTapperApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
