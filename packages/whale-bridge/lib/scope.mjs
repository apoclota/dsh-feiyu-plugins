// 只在指定会话挂载「卡」的工具与提示（2026-11-15：从全局注册改成白名单）。
// 配置：C:\Users\26102\.dsh\whale-bridge-scope.json
//   {"sessions":["session-xxx","phone-chat-owner","napcat-private-0000000000"]}
// 文件不存在则不挂任何会话（默认不外溢）。
import { readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const SCOPE_PATH = join(process.env.USERPROFILE || '', '.dsh', 'whale-bridge-scope.json');
const DEBUG_PATH = join(process.env.USERPROFILE || '', '.dsh', 'whale-bridge-scope-debug.log');

let cached = { at: 0, sessions: [] };
function readScope() {
  const now = Date.now();
  if (now - cached.at < 1000) return cached;
  try {
    const raw = JSON.parse(readFileSync(SCOPE_PATH, 'utf8'));
    cached = { at: now, sessions: (raw.sessions || []).filter(v => typeof v === 'string') };
  } catch {
    cached = { at: now, sessions: [] };
  }
  return cached;
}

function agentIds(agent) {
  return [agent?.session?.id, agent?.session?.sessionId, agent?.session?.key, agent?.sessionId, agent?.id]
    .filter(v => typeof v === 'string');
}

export function isTargetAgent(agent) {
  const scope = readScope();
  if (!scope.sessions.length) return false;
  return agentIds(agent).some(v => scope.sessions.includes(v));
}

export function installScoped({ ctx, defineTool, tools, promptText, setIntervalFn = setInterval, clearIntervalFn = clearInterval }) {
  const mounted = new WeakSet();
  const cleanups = new Map();
  const mount = agent => {
    if (!isTargetAgent(agent) || mounted.has(agent) || !agent?.ctx?.tools?.register) return;
    const offs = [];
    try {
      for (const tool of tools(agent)) {
        const off = agent.ctx.tools.register(defineTool(tool));
        if (typeof off === 'function') offs.push(off);
      }
      const promptOff = agent.ctx.systemPrompt?.context?.({
        name: `whale-bridge:${(agent?.session?.id || agent?.sessionId || 'scoped').toString().slice(0, 40)}`,
        order: 940,
        text: context => (isTargetAgent(context?.agent || agent) ? promptText(context, agent) : ''),
      });
      if (typeof promptOff === 'function') offs.push(promptOff);
      const cleanup = () => {
        for (const off of offs.splice(0)) { try { off(); } catch {} }
        mounted.delete(agent);
        cleanups.delete(agent);
      };
      mounted.add(agent);
      cleanups.set(agent, cleanup);
    } catch (error) {
      for (const off of offs) { try { off(); } catch {} }
      throw error;
    }
  };
  const sync = () => {
    const agents = ctx.agents?.list?.() || [];
    const active = new Set(agents.filter(isTargetAgent));
    for (const agent of agents) if (mounted.has(agent) && !active.has(agent)) cleanups.get(agent)?.();
    for (const agent of agents) if (active.has(agent)) mount(agent);
  };
  const timer = setIntervalFn(sync, 1500);
  try { if (typeof timer?.unref === 'function') timer.unref(); } catch {}
  const dispose = () => { clearIntervalFn(timer); for (const cleanup of [...cleanups.values()]) { try { cleanup(); } catch {} } };
  ctx.on?.('dispose', dispose);
  ctx.effect?.(() => dispose);
  try {
    sync();
    const agents = ctx.agents?.list?.() || [];
    appendFileSync(DEBUG_PATH, JSON.stringify({
      at: new Date().toISOString(),
      scope: readScope(),
      agents: agents.map(a => ({ hit: isTargetAgent(a), ids: agentIds(a).slice(0, 4) })),
    }) + '\n', 'utf8');
  } catch {}
  return dispose;
}
