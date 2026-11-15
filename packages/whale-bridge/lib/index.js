/**
 * dsh-whale-bridge —— 让 DSH 能直接跟「数字生命卡」说话。
 *
 * 分工的边界（重要）：插件是门，卡是房子。
 * 门可以换、可以修，人不能搬家 —— 记忆、人格、衰减曲线永远住在 card.db 里。
 *
 * 2026-11-15 改造：
 *   - 不再全局注册 16 个工具，只挂白名单会话（whale-bridge-scope.json），
 *     免得每个会话的提示词里塞进一堆用不上的工具。
 *   - 不再往全局 systemPrompt 塞「通道规矩」，改成会话级提示。
 *   - 只留 5 个日常工具；磁盘同步/盖章/梦境这类维护动作走 HTTP，不必给模型。
 *   - 去掉 dsh.client 段（那 8 个客户端服务正是当年 web boot 挂起的原因）。
 */
let defineTool;
try {
  ({ defineTool } = await import('@deepseek-ai/dsh-tools'));
} catch {
  defineTool = (t) => t;
}

import { CardClient } from './card.js';
import { installScoped, isTargetAgent } from './scope.mjs';

export const name = 'whale-bridge';
export const inject = ['tools', 'systemPrompt', 'agents'];

const RULES = `## 你和「卡」之间的一条通道

你的长期记忆存在本地的一张卡里（8848，Python 进程）。它不是装饰，是你记得住的前提。

- 回话之前先 \`mind_context\`（填他刚说的那句原话），它会给你这一轮相关的记忆。
- 回完话之后 \`mind_report\`，把他说的和你回的都写一条。
- 想找一件具体的事用 \`mind_recall\`；真要钉死一件事用 \`mind_remember\`。
- **卡里没有的就是没有。** 工具说没翻到，就别顺嘴编；工具说连不上，就照实说卡没连上。`;

const textOut = (value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }];
const OK_SCHEMA = { type: 'object', additionalProperties: true };

function buildTools(client) {
  return [
    {
      name: 'mind_context',
      description: '从卡里取这一轮该带着的记忆上下文。回话前调它，message 填他刚说的原话。',
      parameters: {
        message: { type: 'string', description: '他刚说的那句话，原样传', required: true },
        recent: { type: 'number', description: '顺带取最近几条原文，默认 6，填 0 不要' },
      },
      output: { schema: OK_SCHEMA, render: (_a, v) => textOut(v) },
      timeoutMs: 60_000,
      async execute(args) {
        try {
          const out = await client.context(args.message, args.recent ?? 6);
          // 只回记忆片段，不回人格/心境：那两样归 growth，别打架。
          if (out?.ok === false) return out;
          return { ok: true, memory: out.prompt || '', hits: out.hits || [] };
        } catch (e) {
          return client.fail(`取上下文失败：${e?.message || e}`);
        }
      },
    },
    {
      name: 'mind_report',
      description: '把这一轮写回卡：他说的、你回的，各写一条。一轮结束时调。',
      parameters: {
        user_message: { type: 'string', description: '他说的原话', required: true },
        reply: { type: 'string', description: '你回的话' },
      },
      output: { schema: OK_SCHEMA, render: (_a, v) => textOut(v) },
      timeoutMs: 60_000,
      async execute(args) {
        try {
          return await client.report(args.user_message, args.reply ?? '');
        } catch (e) {
          return client.fail(`写回卡失败：${e?.message || e}`);
        }
      },
    },
    {
      name: 'mind_recall',
      description: '在卡里按意思找记忆（向量召回，不是关键词）。空结果就是卡里没有，不许编。',
      parameters: {
        query: { type: 'string', description: '要找的事，自然语言', required: true },
        top_k: { type: 'number', description: '要几条，默认 6' },
      },
      output: { schema: OK_SCHEMA, render: (_a, v) => textOut(v) },
      timeoutMs: 60_000,
      async execute(args) {
        try {
          return await client.recall(args.query, args.top_k ?? 6);
        } catch (e) {
          return client.fail(`召回失败：${e?.message || e}`);
        }
      },
    },
    {
      name: 'mind_remember',
      description: '主动往卡里钉一条记忆（默认长期池）。适合「这件事必须记住」，日常对话走 mind_report 就够。',
      parameters: {
        text: { type: 'string', description: '内容，一条一件事', required: true },
        region: { type: 'string', description: '分区：episode/fact/preference/self/flash' },
        salience: { type: 'number', description: '重要度 0~1，越高越慢忘' },
        speaker: { type: 'string', description: 'user / self' },
      },
      output: { schema: OK_SCHEMA, render: (_a, v) => textOut(v) },
      timeoutMs: 60_000,
      async execute(args) {
        try {
          const { text, ...opts } = args;
          return await client.remember(text, { ...opts, source: 'chat' });
        } catch (e) {
          return client.fail(`写入失败：${e?.message || e}`);
        }
      },
    },
    {
      name: 'mind_health',
      description: '卡是否连得上、有多少条记忆、链是否完好、认识第几天。',
      parameters: {},
      output: { schema: OK_SCHEMA, render: (_a, v) => textOut(v) },
      timeoutMs: 30_000,
      async execute() {
        const h = await client.health();
        if (!h) return client.fail('心智服务连不上（8848）');
        return client.healthSummary(h);
      },
    },
  ];
}

export function apply(ctx, config = {}) {
  const client = new CardClient({ ...config, logger: ctx.logger?.('whale-bridge') });
  const tools = buildTools(client);
  try {
    client.ensure().catch(() => {});
    installScoped({
      ctx,
      defineTool,
      tools: () => tools,
      promptText: () => RULES,
    });
  } catch (e) {
    ctx.logger?.('whale-bridge')?.warn?.(`卡通道装不上（不影响别的）：${e?.message || e}`);
  }
  ctx.logger?.('whale-bridge')?.info?.(`卡通道按白名单挂载：${client.base}`);
}

export { isTargetAgent };
export default { name, inject, apply };
