#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Rescue card memories that were filed as `chatter` (the "forget by tomorrow"
bucket) but are actually worth keeping.

Context: region is what drives decay (poolmath.REGION_DECAY_SCALE). The card's
classifier over-triggers `chatter` on short Chinese sentences, so real content
(how she should address him, permissions he granted, preferences) ends up in
the fastest-decaying bucket. This promotes those rows back to episode and, when
the classifier gives a better bucket, to preference/self/fact.

Rules:
  * only rows with region='chatter'
  * promote to the classifier's bucket when it is preference/self/fact/habit/flash
  * otherwise promote to 'episode' when salience >= 0.75 or the text is >= 30 chars
  * never demote anything

Usage:
  python card-region-fix.py --dry-run
  python card-region-fix.py --apply
"""
import argparse
import os
import shutil
import sqlite3
import sys
import time

CARD_DIR = r"E:\whale-girl\WhaleGirl\whale-card"
DB = os.path.join(CARD_DIR, "card.db")
BACKUP_DIR = r"Z:\肥鱼的一生0.1\backups"

SCALE = {"flash": 0.30, "fact": 0.50, "self": 0.60, "habit": 0.70,
         "preference": 0.80, "episode": 1.00, "chatter": 2.00}
KEEP_SALIENCE = 0.75
KEEP_CHARS = 30


def log(msg):
    print(time.strftime("%H:%M:%S"), msg, flush=True)


def backup():
    stamp = time.strftime("%Y%m%d-%H%M%S")
    target = os.path.join(BACKUP_DIR, "whale-card-region-" + stamp)
    os.makedirs(target, exist_ok=True)
    for suffix in ("", "-wal", "-shm"):
        src = DB + suffix
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(target, "card.db" + suffix))
    log("备份到 %s" % target)
    return target


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.dry_run):
        raise SystemExit("要么 --dry-run，要么 --apply")

    sys.path.insert(0, CARD_DIR)
    from cardtext import classify_region  # noqa: E402

    if args.apply:
        backup()

    con = sqlite3.connect(DB, timeout=20)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA busy_timeout=20000")
    cur = con.cursor()

    rows = cur.execute(
        "SELECT id, raw, emotion, region, salience, pool FROM mem"
        " WHERE dead IS NOT 1 AND region='chatter'").fetchall()

    changes = []
    kept = 0
    for r in rows:
        raw = (r["raw"] or "").strip()
        if not raw:
            continue
        sal = float(r["salience"] or 0.0)
        guess = classify_region(raw, float(r["emotion"] or 0.0))
        if guess in ("preference", "self", "fact", "habit", "flash"):
            target = guess
        else:
            kept += 1
            continue
        if SCALE.get(target, 2.0) >= SCALE["chatter"]:
            kept += 1
            continue
        changes.append((r["id"], target, sal, raw[:46]))

    log("chatter 共 %d 条；建议升级 %d 条，保留 %d 条" % (len(rows), len(changes), kept))
    for cid, target, sal, sample in changes[:15]:
        log("  #%s -> %-10s sal=%.2f  %s" % (cid, target, sal, sample))

    if not args.apply:
        log("dry-run，未写入")
        return

    with con:
        for cid, target, _sal, _s in changes:
            cur.execute("UPDATE mem SET region=? WHERE id=?", (target, cid))
    con.commit()
    log("已写入 %d 条" % len(changes))
    after = cur.execute(
        "SELECT region, COUNT(*) n FROM mem WHERE dead IS NOT 1 GROUP BY region"
        " ORDER BY n DESC").fetchall()
    log("现在：%s" % {r["region"]: r["n"] for r in after})
    con.close()


if __name__ == "__main__":
    main()
