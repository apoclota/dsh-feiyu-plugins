#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Type a text message into a WeChat private chat and press Enter.

Why this exists: iLink (the official bot API) refuses outbound sends unless a
fresh inbound message just opened the window, so proactive WeChat messages
cannot go through the bot. This drives the logged-in WeChat desktop client
instead — same UI-automation route the reply bridge already uses.

Safety: only private chats, title must match exactly, input box must be empty
before typing, and unless --force is given it refuses while you appear to be
using the computer (no keyboard/mouse input for MinIdle seconds).

Usage:
  python wx-say.py --title 文件传输助手 --text "在呢主人" [--open] [--dry-run] [--force]
"""
import argparse
import ctypes
import time

TITLE_AID = ("content_view.top_content_view.title_h_view.left_v_view."
             "left_content_v_view.left_ui_.big_title_line_h_view.current_chat_name_label")
WINDOW_CLASSES = ("mmui::MainWindow", "WeChatMainWndForPC")
BAD_TITLES = ("群友", "微信好友", "微信团队", "订阅号", "服务号")


class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [("cbSize", ctypes.c_uint), ("dwTime", ctypes.c_uint)]


def log(msg):
    print(time.strftime("%H:%M:%S"), msg, flush=True)


def idle_seconds():
    info = LASTINPUTINFO()
    info.cbSize = ctypes.sizeof(LASTINPUTINFO)
    if not ctypes.windll.user32.GetLastInputInfo(ctypes.byref(info)):
        return 0.0
    now = ctypes.windll.kernel32.GetTickCount()
    return max(0.0, (now - info.dwTime) / 1000.0)


def find_window():
    import uiautomation as auto
    for cls in WINDOW_CLASSES:
        win = auto.WindowControl(ClassName=cls)
        if win.Exists(1):
            return win
    raise SystemExit("找不到微信主窗口（试过 %s）" % ", ".join(WINDOW_CLASSES))


def chat_name(win):
    title = win.TextControl(searchDepth=26, AutomationId=TITLE_AID)
    if title.Exists(1):
        return title.Name or ""
    field = win.EditControl(searchDepth=26, AutomationId="chat_input_field")
    return (field.Name or "") if field.Exists(1) else ""


def open_chat(win, title):
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
    raise SystemExit("自动切换会话失败：当前是 %r，目标是 %r" % (chat_name(win), title))


def input_field(win):
    field = win.EditControl(searchDepth=26, AutomationId="chat_input_field")
    if not field.Exists(1):
        raise SystemExit("找不到聊天输入框")
    return field


def field_text(field):
    try:
        value = field.GetValuePattern().Value
    except Exception:
        value = ""
    return (value or "").strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--title", required=True, help="exact private chat name")
    ap.add_argument("--text", required=True)
    ap.add_argument("--open", action="store_true", help="switch WeChat to that chat first")
    ap.add_argument("--dry-run", action="store_true", help="verify target only")
    ap.add_argument("--force", action="store_true", help="skip the 'user is busy' check")
    ap.add_argument("--min-idle", type=float, default=8.0)
    args = ap.parse_args()

    title = args.title.strip()
    text = args.text.strip()
    if not text:
        raise SystemExit("text 为空")
    if len(title) < 1 or title.endswith("@chatroom") or title in BAD_TITLES:
        raise SystemExit("拒绝：%r 看起来是群或非私聊" % title)

    win = find_window()
    current = chat_name(win)
    if args.open or current != title:
        open_chat(win, title)
    if chat_name(win) != title:
        raise SystemExit("拒绝：当前会话是 %r，目标 %r" % (chat_name(win), title))

    field = input_field(win)
    before = field_text(field)
    if before:
        raise SystemExit("拒绝：输入框里已有内容 %r，不敢覆盖" % before[:40])

    if args.dry_run:
        log("目标会话核验通过：%s（未发送）" % title)
        return

    if not args.force:
        idle = idle_seconds()
        if idle < args.min_idle:
            raise SystemExit("主人在用电脑（空闲 %.1fs < %.1fs），这次不发" % (idle, args.min_idle))
        log("空闲 %.1fs，可以发" % idle)

    field.SetFocus()
    time.sleep(0.2)
    field.SendKeys(text)
    time.sleep(0.4)
    typed = field_text(field)
    if typed != text.strip():
        raise SystemExit("输入没有完整落进输入框：%r" % typed[:60])
    field.SendKeys("{Enter}")
    time.sleep(0.8)
    left = field_text(field)
    if left:
        raise SystemExit("回车后输入框还有内容，可能没发出去：%r" % left[:60])
    log("已发送到 %s（输入框已清空，确认发出）：%s" % (title, text[:40]))


if __name__ == "__main__":
    main()
