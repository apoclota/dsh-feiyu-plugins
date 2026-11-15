// 修复上一次字符串替换把两处人设块缩进打断的问题：
// 1) 删掉顶格插入的规则行；2) 把顶格的“工具和渠道：”恢复缩进，并在其前按同样缩进补上规则行。
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire('C:/Users/26102/.dsh/profiles/desktop/');
const yaml = require('js-yaml');

const PATCH = 'C:/Users/26102/.dsh/profiles/desktop/cordis.patch.yml';
const RULE = '谈到自己能不能做某件事时，先看当前会话实际注册了哪些工具和权限，再回答；没查过就说没确认，不凭印象否认，也不承诺还没验证的能力。';
const ANCHOR = '工具和渠道：只用当前聊天可用的发送工具。';

const lines = readFileSync(PATCH, 'utf8').split('\n');
const out = [];
let anchors = 0;
for (const line of lines) {
  if (line.trim() === RULE && !line.startsWith(' ')) continue; // 顶格误插的规则行
  if (line.startsWith(ANCHOR)) {
    anchors += 1;
    const indent = anchors === 1 ? '      ' : '                '; // napcat 块 6 空格，preset 块 16 空格
    out.push(`${indent}${RULE}`);
    out.push(`${indent}${line}`);
    continue;
  }
  out.push(line);
}
const next = out.join('\n');
const rows = yaml.load(next);
const flat = rows.flatMap((row) => (Array.isArray(row?.insert) ? row.insert : [row]));
const preset = flat.find((row) => row?.id === 'preset-feiyu');
const napcat = flat.find((row) => row?.id === 'dsh-napcat');
const prefix = preset?.config?.plugins?.[0]?.config?.prefix ?? '';
const overrides = String(napcat?.config?.personaOverrides ?? '');
if (anchors !== 2) throw new Error(`expected 2 anchors, saw ${anchors}`);
if (!prefix.includes(RULE)) throw new Error('preset rule missing');
if (!overrides.includes(RULE)) throw new Error('napcat rule missing');
if (!prefix.includes(ANCHOR) || !overrides.includes(ANCHOR)) throw new Error('anchor lost');
writeFileSync(PATCH, next, 'utf8');
console.log(JSON.stringify({ anchors, prefixChars: prefix.length, overridesChars: overrides.length, rows: flat.map((r) => r?.id) }, null, 2));
