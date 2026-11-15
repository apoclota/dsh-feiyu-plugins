#!/usr/bin/env node
// 和 WhaleGirl 内核的「日记 → 朋友圈」接口对接。
// 用法：
//   node tools\whale-moments.mjs view            # 看草稿状态（无副作用）
//   node tools\whale-moments.mjs scan            # 扫描公共日记，登记新条目
//   node tools\whale-moments.mjs auto            # 自动：取最新未发条目 → 生成 ≤120 字草稿 → 确认排队发表（每天最多 1 条）
//   node tools\whale-moments.mjs auto --dry      # 只打印将要发的内容，不提交
// 认证：读 E:\whale-girl\WhaleGirl\config.json 的 gateway.wechat.inboundToken（不打印）。
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CFG = 'E:\\whale-girl\\WhaleGirl\\config.json';
const BASE = 'http://127.0.0.1:8787';
const HOME = process.env.USERPROFILE || '';
const STATE = join(HOME, '.dsh', 'whale-moments-state.json');
const AUD = 'inherit_current_wechat_audience';

function token() {
  const t = JSON.parse(readFileSync(CFG, 'utf8'))?.gateway?.wechat?.inboundToken;
  if (!t) throw new Error('config.json 里没有 gateway.wechat.inboundToken');
  return t;
}

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', 'x-bot-token': token(), 'x-whale-bridge': '1' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

// 从日记原文里挑一句适合发朋友圈的话：去掉链接/BV/路径/账号，按句子截到 8–120 字
export function pickSentence(raw) {
  const bad = /https?:\/\/|www\.|@|BV[0-9A-Za-z]{10}|[A-Za-z]:[\\/]|token|api[_-]?key|secret/iu;
  // 2026-11-15：主人要「除了看了什么，还要有自己的想法」→ 优先挑带判断/在意/联想的句子，
  //   只按长度选会挑到纯事实句（"今天看了XX，一百万播放"）。
  const sentences = String(raw || '')
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[。！？!?～~])/))
    .map((s) => s.replace(/^[-*#>|\s]+/, '').replace(/\*\*|`/g, '').trim())
    .filter((s) => Array.from(s).length >= 8 && !bad.test(s) && !/^\d+\s*$/.test(s));
  if (!sentences.length) return '';
  const reflective = /我(?:觉得|想|猜|以为|发现|更|其实|好像|担心|好奇|喜欢|不喜欢|下次|以后|宁愿|反而|还是)|其实|好像|因为|所以|大概|值得|不太|有点|要是|如果|可惜|难怪/u;
  const scored = sentences
    .map((s) => {
      const len = Array.from(s).length;
      let score = Math.min(len, 60) / 60;
      if (reflective.test(s)) score += 2;
      if (/信|想说|跟你说|想告诉/.test(s)) score += 0.5;
      return { s, score };
    })
    .sort((a, b) => b.score - a.score);
  let text = scored[0].s.trim();
  if (Array.from(text).length > 120) {
    const chars = Array.from(text).slice(0, 118);
    text = chars.join('') + '…';
  }
  return Array.from(text).length >= 8 ? text : '';
}

function readState() {
  try { return JSON.parse(readFileSync(STATE, 'utf8')); } catch { return { days: {} }; }
}
function writeState(s) {
  try { mkdirSync(join(HOME, '.dsh'), { recursive: true }); writeFileSync(STATE, JSON.stringify(s, null, 2), 'utf8'); } catch {}
}
const today = () => new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD 本地时区

const argv = process.argv.slice(2);
const cmd = argv[0];
const dry = argv.includes('--dry');

if (cmd === 'view') {
  console.log(JSON.stringify(await call('GET', '/api/moments/diary-drafts'), null, 2));
} else if (cmd === 'scan') {
  console.log(JSON.stringify(await call('POST', '/api/moments/diary-drafts/scan', {}), null, 2));
} else if (cmd === 'auto') {
  const st = readState();
  if ((st.days?.[today()] || 0) >= 1) {
    console.log(JSON.stringify({ ok: true, skipped: 'daily_cap', date: today() }, null, 2));
    process.exit(0);
  }
  const scan = await call('POST', '/api/moments/diary-drafts/scan', {});
  if (scan.status !== 200) { console.log(JSON.stringify({ ok: false, stage: 'scan', ...scan }, null, 2)); process.exit(1); }

  const view = await call('GET', '/api/moments/diary-drafts');
  const pending = view.json?.pending || [];
  const drafts = view.json?.drafts || [];
  // 已有「还没提交」的草稿优先发它；失败/已保留的不再碰，改用新的日记条目
  let draft = drafts.filter((d) => d.status === 'draft').pop();
  if (!draft && pending.length) {
    const src = pending[pending.length - 1];
    const text = pickSentence(src.text || '');
    if (!text) { console.log(JSON.stringify({ ok: false, stage: 'pick', reason: 'no_usable_sentence' }, null, 2)); process.exit(1); }
    if (dry) { console.log(JSON.stringify({ ok: true, dry: true, text, source: src.sourceId }, null, 2)); process.exit(0); }
    const made = await call('POST', '/api/moments/diary-drafts', { sourceId: src.sourceId, sourceHash: src.sourceHash, text });
    if (made.status !== 200) { console.log(JSON.stringify({ ok: false, stage: 'draft', ...made }, null, 2)); process.exit(1); }
    draft = made.json.draft;
  } else {
    console.log(JSON.stringify({ ok: true, skipped: 'no_new_diary' }, null, 2));
    process.exit(0);
  }

  if (dry) { console.log(JSON.stringify({ ok: true, dry: true, draftId: draft.id, text: draft.text }, null, 2)); process.exit(0); }

  const confirm = await call('POST', '/api/moments/diary-drafts/confirm', {
    draftId: draft.id, draftHash: draft.draftHash, confirm: true, audienceAcknowledgement: AUD,
  });
  if (confirm.status === 200 && confirm.json?.ok) {
    st.days = { ...(st.days || {}), [today()]: (st.days?.[today()] || 0) + 1 };
    writeState(st);
  }
  console.log(JSON.stringify({ ok: confirm.status === 200, stage: 'confirm', draftId: draft.id, text: draft.text, ...confirm }, null, 2));
} else {
  console.log('用法: view | scan | auto [--dry]');
}
