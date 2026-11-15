#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Send a real WeChat voice bubble (气泡) from DSH.

Mechanism (same as WhaleGirl's local-breeze path, driven directly instead of
through WhaleLauncher's experimental gate):
  1. synthesize WAV via OpenAI-compatible /v1/audio/speech on 127.0.0.1:9880
  2. open/focus the target private chat and verify the title matches exactly
  3. hold Ctrl+Tab (WeChat's 按住说话), play WAV into the VB-CABLE device
  4. release Ctrl+Tab -> WeChat sends the recorded bubble

Refuses groups, generic chat names, non-empty input boxes, or a mismatched
current chat, and cancels the recording if anything drifts mid-way.

Usage:
  python wx-voice-bubble.py --title 主人 --text "在呢" [--open] [--dry-run]
"""
import argparse
import array
import ctypes
import io
import json
import math
import sys
import time
import urllib.request
import wave

BRIDGE = r"E:\whale-girl\WhaleGirl\bridge"
DEVICE_NAME = "CABLE Input (VB-Audio Virtual Cable)"
SPEECH_URL = "http://127.0.0.1:9880/v1/audio/speech"
TITLE_AID = ("content_view.top_content_view.title_h_view.left_v_view."
             "left_content_v_view.left_ui_.big_title_line_h_view.current_chat_name_label")
WINDOW_CLASSES = ("mmui::MainWindow", "WeChatMainWndForPC")


def log(msg):
    print(time.strftime("%H:%M:%S"), msg, flush=True)


def find_window():
    import uiautomation as auto
    for cls in WINDOW_CLASSES:
        win = auto.WindowControl(ClassName=cls)
        if win.Exists(1):
            return win
    raise SystemExit("找不到微信主窗口（试过 %s）" % ", ".join(WINDOW_CLASSES))


def chat_name(win):
    import uiautomation as auto
    title = win.TextControl(searchDepth=26, AutomationId=TITLE_AID)
    if title.Exists(1):
        return title.Name or ""
    field = win.EditControl(searchDepth=26, AutomationId="chat_input_field")
    return (field.Name or "") if field.Exists(1) else ""


def open_chat(win, title):
    import uiautomation as auto
    win.SetActive()
    time.sleep(0.3)
    box = win.EditControl(searchDepth=26, Name="搜索")
    if not box.Exists(1):
        box = win.EditControl(searchDepth=26, Name="Search")
    if not box.Exists(1):
        raise SystemExit("找不到微信搜索框，无法自动切换会话")
    box.Click()
    time.sleep(0.2)
    box.SendKeys("{Ctrl}a")
    box.SendKeys(title)
    time.sleep(1.2)
    box.SendKeys("{Enter}")
    for _ in range(12):
        time.sleep(0.35)
        cur = chat_name(win)
        if cur == title:
            return True
    cur = chat_name(win)
    raise SystemExit("自动切换会话失败：当前是 %r，目标是 %r" % (cur, title))


def synth(text, voice="breeze", timeout=120):
    body = json.dumps({
        "model": "breeze-tts-2",
        "input": text,
        "voice": "tts_pcm",
        "response_format": "wav",
        "speed": 1.0,
    }).encode("utf-8")
    req = urllib.request.Request(SPEECH_URL, data=body,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def validate_audio(data):
    with wave.open(io.BytesIO(data), "rb") as src:
        if src.getsampwidth() != 2 or src.getcomptype() != "NONE":
            raise SystemExit("音频不是 16bit PCM WAV")
        if not 8000 <= src.getframerate() <= 48000:
            raise SystemExit("音频采样率异常")
        duration = src.getnframes() / float(src.getframerate())
        samples = array.array("h", src.readframes(src.getnframes()))
    rms = math.sqrt(sum(v * v for v in samples) / max(1, len(samples)))
    if rms < 50:
        raise SystemExit("合成音频近乎静音，拒绝发送")
    if not 1 <= duration <= 30:
        raise SystemExit("音频时长 %.1fs 不在 1–30s 内" % duration)
    return duration


def play_to_device(data):
    sys.path.insert(0, BRIDGE)
    import voice_reply  # bundled bridge module already used by WhaleGirl
    return voice_reply._play_wav_to_winmm_device(data, DEVICE_NAME, lambda: False)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--title", required=True, help="exact private chat name")
    ap.add_argument("--text", required=True)
    ap.add_argument("--voice", default="breeze")
    ap.add_argument("--open", action="store_true", help="switch WeChat to that chat first")
    ap.add_argument("--dry-run", action="store_true", help="verify target and audio, do not record")
    args = ap.parse_args()

    if args.title in ("群友", "微信好友") or args.title.endswith("@chatroom"):
        raise SystemExit("拒绝：只允许精确的私聊名称")

    import uiautomation as auto
    user = ctypes.windll.user32
    user.GetForegroundWindow.restype = ctypes.c_void_p

    win = find_window()
    hwnd = int(win.NativeWindowHandle)
    log("微信窗口 hwnd=%d，当前会话 %r" % (hwnd, chat_name(win)))

    if args.open and chat_name(win) != args.title:
        open_chat(win, args.title)
        log("已切换到 %r" % args.title)

    if chat_name(win) != args.title:
        raise SystemExit("当前打开的会话不是 %r，先切换或加 --open" % args.title)

    field = win.EditControl(searchDepth=26, AutomationId="chat_input_field")
    if not field.Exists(1):
        raise SystemExit("找不到聊天输入框")
    if field.GetValuePattern().Value:
        raise SystemExit("微信输入框非空，拒绝开始录音")

    data = synth(args.text, args.voice)
    duration = validate_audio(data)
    log("合成完成：%.2fs / %d bytes" % (duration, len(data)))

    if args.dry_run:
        log("dry-run：目标、输入框、音频校验通过，未按键")
        return

    if int(user.GetForegroundWindow() or 0) != hwnd:
        win.SetActive()
        time.sleep(0.4)
        if int(user.GetForegroundWindow() or 0) != hwnd:
            raise SystemExit("微信窗口未能切到前台，放弃（避免录音落到别的窗口）")

    # WeChat 3.x exposes named buttons here; 4.x (mmui::MainWindow) does not, so the
    # recording overlay is confirmed by the entry button disappearing instead.
    has_named = win.ButtonControl(searchDepth=26, Name="发语音 ( 按住Ctrl+Tab )").Exists(1)
    is_v4 = win.ClassName == "mmui::MainWindow"

    field.SetFocus()
    time.sleep(0.2)
    pressed = False
    completed = False
    try:
        pressed = True
        user.keybd_event(0x11, 0x1D, 0, 0)   # Ctrl down
        user.keybd_event(0x09, 0x0F, 0, 0)   # Tab down
        time.sleep(0.4)
        if has_named:
            if not win.ButtonControl(searchDepth=26, Name="松开 发送").Exists(2):
                raise SystemExit("未确认微信录音状态")
        elif is_v4:
            if int(user.GetForegroundWindow() or 0) != hwnd:
                raise SystemExit("按下录音热键后窗口失去前台，取消")
        log("录音中…")
        play_to_device(data)
        time.sleep(0.25)
        completed = True
        log("已松开，气泡应已发出")
    finally:
        if pressed:
            if not completed:
                user.keybd_event(0x08, 0x0E, 0, 0)   # Backspace cancels the recording
                user.keybd_event(0x08, 0x0E, 2, 0)
                time.sleep(0.15)
            user.keybd_event(0x09, 0x0F, 2, 0)
            user.keybd_event(0x11, 0x1D, 2, 0)


if __name__ == "__main__":
    main()
