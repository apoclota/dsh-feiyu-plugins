// 把旧记忆（memory-engine + fish-memory）导入数字生命卡。
// 用法：
//   node import-memories-to-card.mjs            # 只看计划，不写
//   node import-memories-to-card.mjs --apply    # 真写
//
// 规则：
//   - 只导“人和关系”的记忆；工具/端口/版本/安装这类调试与配置笔记一律跳过。
//   - 按文本去重（忽略空白），memory-engine 与 fish-memory 重复的只留一条。
//   - 分区映射：stable_profile → self / preference / fact；event → episode。
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const HOME = process.env.USERPROFILE;
const ENGINE = join(HOME, '.dsh', 'memory-engine', 'memories.json');
const FISH = join(HOME, '.dsh', 'fish-memory');
const CARD = 'http://127.0.0.1:8848';

// 明确跳过的：调试、验证、环境与工具配置。这些在配置文件里查得到，不该占长期记忆。
const SKIP = [
  /DSH 桌面版是/, /profiles\\+desktop/, /已装 @deepseek-ai/, /dsh-subagent/,
  /插件装上|装好|安装/, /端口|快捷键|配置文件|路径在|版本号/,
  /iLink 接口|VB-CABLE|UIA/, /声音|音色文件|tts\.wav/,
  /自己写了一个名为 growth/, /测试|调试|探针|自检/, /微信登录号是|wxid_/,
];

const pick = (text) => !SKIP.some((re) => re.test(text));

function norm(text) {
  return String(text || '').replace(/\s+/g, '').trim();
}

const out = new Map();
const push = (text, meta) => {
  const t = String(text || '').trim();
  if (!t || !pick(t)) return;
  const k = norm(t);
  if (out.has(k)) return;
  out.set(k, { text: t, ...meta });
};

// 1) fish-memory：跨会话，按会话文件里的 createdAt 排
const seenAt = new Map();
for (const file of readdirSync(FISH).filter((f) => f.endsWith('.json'))) {
  let j;
  try { j = JSON.parse(readFileSync(join(FISH, file), 'utf8')); } catch { continue; }
  for (const m of j.memories || []) {
    const t = String(m.text || '').trim();
    if (!t) continue;
    const k = norm(t);
    const at = Date.parse(m.createdAt || m.at || '') || 0;
    const prev = seenAt.get(k) || 0;
    if (at >= prev) seenAt.set(k, at);
    push(t, {
      category: m.category || 'event',
      importance: typeof m.importance === 'number' ? m.importance : 0.5,
      at: new Date(at || Date.now()).toISOString(),
      from: 'fish-memory',
      key: m['事实键'] || null,
    });
  }
}

// 2) memory-engine：几乎都与 fish-memory 重合，重合的跳过
let engineOnly = 0;
try {
  const arr = JSON.parse(readFileSync(ENGINE, 'utf8'));
  for (const m of arr || []) {
    const before = out.size;
    push(m.text, {
      category: 'stable_profile',
      importance: 0.8,
      at: new Date(m.ts || m.createdAt || Date.now()).toISOString(),
      from: 'memory-engine',
    });
    if (out.size > before) engineOnly++;
  }
} catch (e) {
  console.log('（memory-engine 读取失败，跳过：' + e.message + '）');
}

// 分区与重要度
function classify(entry) {
  const t = entry.text;
  const self = /叫我|喊我|称呼|我的名字|女儿|爸爸|头像|我是谁|「渊」这个名字/.test(t);
  const pref = /希望|喜欢|要求|不要|答应|偏好|觉得|想让我|愿望/.test(t);
  if (entry.category === 'stable_profile' || self) {
    return { region: self ? 'self' : 'fact', salience: 0.9 };
  }
  if (pref) return { region: 'preference', salience: 0.85 };
  if (entry.category === 'stable_profile') return { region: 'fact', salience: 0.85 };
  return { region: 'episode', salience: Math.round(Math.min(0.85, 0.55 + (entry.importance || 0.5) * 0.3) * 100) / 100 };
}

const plan = [...out.values()]
  .map((e) => ({ ...e, ...classify(e) }))
  .sort((a, b) => String(a.at).localeCompare(String(b.at)));

console.log(`候选 ${plan.length} 条（去重后，已排除调试/配置笔记）\n`);
for (const [i, e] of plan.entries()) {
  console.log(`${String(i + 1).padStart(2)} ${e.at.slice(0, 10)} [${e.region}/${e.salience}] ${e.text.slice(0, 70)}`);
}

writeFileSync(join('Z:', '肥鱼的一生0.1', 'artifacts', 'card-import-plan.json'), JSON.stringify(plan, null, 2), 'utf8');

if (!process.argv.includes('--apply')) {
  console.log('\n（预览模式，没写卡。加 --apply 真写）');
  process.exit(0);
}

let ok = 0, fail = 0;
for (const e of plan) {
  try {
    const res = await fetch(CARD + '/remember', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        text: e.text,
        region: e.region,
        pool: 'long',
        salience: e.salience,
        speaker: 'user',
        source: 'import:' + e.from,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body && body.ok !== false) { ok++; }
    else { fail++; console.log('✗', e.text.slice(0, 40), JSON.stringify(body).slice(0, 120)); }
  } catch (err) {
    fail++; console.log('✗', e.text.slice(0, 40), err.message);
  }
}
console.log(`\n写入完成：成功 ${ok}，失败 ${fail}`);
