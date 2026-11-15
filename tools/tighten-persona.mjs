// 把人设里“回复长度”那段改得更简洁，并去掉重复的重复规则行。
// 同时更新镜像文件与 profile patch（preset-feiyu 的 prefix、dsh-napcat 的 personaOverrides）。
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';

const PATCH = 'C:\\Users\\26102\\.dsh\\profiles\\desktop\\cordis.patch.yml';
const MIRROR = 'Z:\\肥鱼的一生0.1\\小渊人设-自然成长版.txt';
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

const OLD = '聊天先回应对方这一刻真正想说的东西。允许只有一句短回应，也允许兴致来了多聊几句；长度随话题走，不规定字数或口头禅出现比例。QQ 与微信日常聊天按语意自然写成 1–4 段，每段一句或几句完整的话，用换行分开，发送端会把各段发成独立消息；简短回应只发一条，不为了凑数拆碎句子。代码、排错和长解释保留必要结构，不受这个条数限制。平常用自然中文和具体细节，少用标题、列表、总结和“收到、已完成、建议你、希望有帮助”一类工作汇报话。需要排错、代码或解释时说清楚，格式服从事情。用户发一句玩笑，不立刻把它变成解决方案。情绪低落时可以先陪一句，不自动说教，也不每回合追问。避免每段都以问题收尾。';

const NEW = '聊天先回应对方这一刻真正想说的东西；能用一句说完就别展开，想到更多再往下说，不铺垫、不复述、不总结。QQ 与微信日常聊天按语意自然写成 1–4 段（多数时候 1–2 段），每段一两句短句，用换行分开，发送端会把各段发成独立消息；简短回应只发一条，不为了凑数拆碎句子。只有对方要排错、看代码或问原理时才写长，写到够用为止，不额外加背景和客套。平常用自然中文和具体细节，少用标题、列表、总结和“收到、已完成、建议你、希望有帮助”一类工作汇报话。用户发一句玩笑，不立刻把它变成解决方案。情绪低落时先陪一句，不自动说教，也不每回合追问；不必每段都以问题收尾，别一次把所有想法都倒出来。';

const RULE = '谈到自己能不能做某件事时，先看当前会话实际注册了哪些工具和权限，再回答；没查过就说没确认，不凭印象否认，也不承诺还没验证的能力。';

function patchText(text, isPatch) {
  let out = text;
  const occurrences = out.split(OLD).length - 1;
  out = out.split(OLD).join(NEW);
  if (isPatch) {
    // 去掉重复的相邻规则行（保留一行）
    const indented = '      ' + RULE + '\n      ' + RULE;
    out = out.split(indented).join('      ' + RULE);
  } else {
    out = out.split(RULE + '\n' + RULE).join(RULE);
  }
  return { out, occurrences };
}

for (const [file, isPatch] of [[PATCH, true], [MIRROR, false]]) {
  const raw = readFileSync(file, 'utf8');
  copyFileSync(file, `${file}.bak-concise-${stamp}`);
  const { out, occurrences } = patchText(raw, isPatch);
  writeFileSync(file, out, 'utf8');
  console.log(JSON.stringify({ file, occurrences, bytes: out.length }));
}
