#!/usr/bin/env node
// 把 B 站两本日记 + 当前情绪，整理成「可以拿去当朋友圈/对话摘要」的一段文字。
// 用法：
//   node tools\bili-digest.mjs            # 打印摘要 JSON
//   node tools\bili-digest.mjs --text     # 只打印正文
//   node tools\bili-digest.mjs --json-out C:\path\out.json
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const HOME = process.env.USERPROFILE || homedir();
const DSH = join(HOME, '.dsh');
const DIARY_PUBLIC = join(DSH, 'whale-diary.md');
const DIARY_PRIVATE = join(DSH, 'whale-diary-private.md');
const GROWTH = join(DSH, 'fish-growth', 'feiyu.json');

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};

function tailEntries(file, max = 12) {
  if (!existsSync(file)) return { entries: [], mtime: null };
  const raw = readFileSync(file, 'utf8');
  const mtime = Number.isFinite(Date.parse(raw.slice(0, 0))) ? null : null;
  // 以 markdown 二级标题（## ...）或日期行（2026-11-13）为分块
  const blocks = raw
    .split(/\n(?=##\s|\d{4}-\d{2}-\d{2})/g)
    .map((b) => b.trim())
    .filter(Boolean);
  return { entries: blocks.slice(-max), mtime };
}

// 情绪 → 一句心情描述（与养鱼插件 moodOverview 同权重）
const W = { joy: 0.32, calm: 0.2, affection: 0.16, pride: 0.08, anger: -0.34, hurt: -0.28, worry: -0.2, sadness: -0.24, fatigue: -0.12 };
function moodOf() {
  try {
    const st = JSON.parse(readFileSync(GROWTH, 'utf8'));
    const emo = st.emotions || {};
    let score = 50;
    for (const [k, w] of Object.entries(W)) score += (Number(emo[k]) || 0) * w;
    score = Math.max(0, Math.min(100, Math.round(score)));
    const top = Object.entries(emo)
      .filter(([, v]) => Number(v) > 0.2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k]) => k);
    const label = score >= 70 ? '挺开心' : score >= 58 ? '还不错' : score >= 45 ? '平稳' : score >= 32 ? '有点低' : '低落';
    return { score, label, top };
  } catch {
    return null;
  }
}

function clean(line) {
  return line
    .replace(/^[-*]\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim();
}

const pub = tailEntries(DIARY_PUBLIC, 10);
const priv = tailEntries(DIARY_PRIVATE, 10);
const mood = moodOf();

// 取最新一条日记块，抽出像"看了什么/感觉"的句子
const latest = pub.entries[pub.entries.length - 1] || '';
const latestPriv = priv.entries[priv.entries.length - 1] || '';
const lines = (latest + '\n' + latestPriv)
  .split('\n')
  .map(clean)
  .filter((l) => l.length >= 8 && !/^#/.test(l) && !/^日期|^时间|^----/.test(l));

const picked = [...new Set(lines)].slice(0, 3);
const date = new Date();
const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

let text;
if (picked.length === 0) {
  text = `今天（${stamp}）的两本日记还没更新，最新内容是 ${latest ? '更早的' : '空的'}。`;
} else {
  const moodLine = mood ? `心情${mood.label}（${mood.score}）` : '';
  text = [
    `【${stamp}】${moodLine}`,
    ...picked.map((p) => `· ${p.length > 90 ? p.slice(0, 88) + '…' : p}`),
  ].join('\n');
}

const out = {
  date: stamp,
  mood,
  diaryUpdated: pub.entries.length > 0,
  picked,
  text,
  sources: { public: DIARY_PUBLIC, private: DIARY_PRIVATE, growth: GROWTH },
};

const jsonOut = opt('--json-out');
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(out, null, 2), 'utf8');
console.log(flag('--text') ? text : JSON.stringify(out, null, 2));
