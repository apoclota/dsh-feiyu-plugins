// 给小渊在微信 / 手机 App（phone-chat）通道装上与 QQ 同一套人设和电脑工具。
// 做法：在 profile patch 里注册一个 agent preset `feiyu`，人设正文直接复用
// dsh-napcat 现有 personaOverrides（唯一真源），再把两个通道的 agentPreset 指向它。
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire('C:/Users/26102/.dsh/profiles/desktop/');
const yaml = require('js-yaml');

const PATCH = 'C:/Users/26102/.dsh/profiles/desktop/cordis.patch.yml';
const PHONE = 'C:/Users/26102/.dsh/phone-chat.local.json';
const PRESET_ID = 'feiyu';

const text = readFileSync(PATCH, 'utf8');
const rows = yaml.load(text);

const napcat = rows.find((row) => row && row.id === 'dsh-napcat');
if (!napcat) throw new Error('dsh-napcat row not found');
const overrides = String(napcat.config?.personaOverrides ?? '');
const marker = 'private:0000000000=';
const idx = overrides.indexOf(marker);
if (idx < 0) throw new Error('persona marker not found');
const persona = overrides.slice(idx + marker.length).replace(/^【QQ主人私聊】\s*/, '').trim();
if (persona.length < 500) throw new Error(`persona too short: ${persona.length}`);

function block(body) {
  return body
    .split('\n')
    .map((line) => (line.trim() ? `                ${line}` : ''))
    .join('\n');
}

const presetBlock = `
- insert:
    - id: preset-feiyu
      name: '@deepseek-ai/dsh-agent-preset'
      config:
        id: ${PRESET_ID}
        name: 小渊
        description: 小渊的统一人设 + 电脑工具（QQ / 微信 / 手机共用同一份）
        order: 5
        plugins:
          - id: persona
            name: '@deepseek-ai/dsh-persona'
            config:
              prefix: |-
${block(persona)}
          - id: agent-instructions
            name: '@deepseek-ai/dsh-agent-instructions'
            config:
              maxBytes: 65536
          - id: time-context
            name: '@deepseek-ai/dsh-time-context'
          - id: tool-pwsh
            name: '@deepseek-ai/dsh-tool-pwsh'
          - id: tool-fs
            name: '@deepseek-ai/dsh-tool-fs'
            config:
              applyPatch: false
          - id: tool-fs-search
            name: '@deepseek-ai/dsh-tool-fs-search'
            config:
              sampleOverCapGlobResults: false
          - id: tool-jobs
            name: '@deepseek-ai/dsh-tool-jobs'
          - id: tool-web
            name: '@deepseek-ai/dsh-tool-web'
            config:
              fetch: true
              searchTimeoutMs: 60000
          - id: tool-todo
            name: '@deepseek-ai/dsh-tool-todo'
            config:
              allowParallelInProgress: true
          - id: tool-ask-user
            name: '@deepseek-ai/dsh-tool-ask-user'
          - id: tool-schedule
            name: '@deepseek-ai/dsh-tool-schedule'
          - id: compaction
            name: cordis:group
            group: true
            isolate:
              compaction: true
              toolResultPruner: true
            config:
              - id: compaction-basic
                name: '@deepseek-ai/dsh-compaction-basic'
              - id: command-compact
                name: '@deepseek-ai/dsh-command-compact'
              - id: tool-result-pruner
                name: '@deepseek-ai/dsh-compaction-tool-result-pruner'
                config:
                  thresholdChars: 8192
                  headChars: 4096
                  tailChars: 1024
`;

const wechatBlock = `
- insert:
    - id: wechat-media
      name: dsh-wechat-media
      config:
        agentPreset: ${PRESET_ID}
`;

const flat = (list) => list.flatMap((row) => (Array.isArray(row?.insert) ? row.insert : [row]));
const hasPreset = flat(rows).some((row) => row && row.id === 'preset-feiyu');
const hasWechat = flat(rows).some((row) => row && row.id === 'wechat-media');

let next = text.replace(/\s*$/u, '\n');
if (!hasPreset) next += presetBlock;
if (!hasWechat) next += wechatBlock;

const parsed = yaml.load(next);
const ids = flat(parsed).map((row) => row?.id);
const presetRow = flat(parsed).find((row) => row?.id === 'preset-feiyu');
const prefix = presetRow?.config?.plugins?.[0]?.config?.prefix ?? '';
if (!prefix.includes('小渊')) throw new Error('preset persona missing');

writeFileSync(PATCH, next, 'utf8');

const phone = JSON.parse(readFileSync(PHONE, 'utf8'));
phone.agentPreset = PRESET_ID;
writeFileSync(PHONE, `${JSON.stringify(phone, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  rows: ids,
  presetId: presetRow?.config?.id,
  presetPlugins: presetRow?.config?.plugins?.map((p) => p.id),
  personaChars: prefix.length,
  phonePreset: phone.agentPreset,
}, null, 2));

