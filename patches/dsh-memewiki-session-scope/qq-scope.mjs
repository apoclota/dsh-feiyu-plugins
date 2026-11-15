// 只在指定会话/工作区挂载梗百科工具与预查提示（2026-11-13：从“只挂 QQ”改成可配置白名单）。
// 配置：%USERPROFILE%\.dsh\memewiki-scope.json
//   {"sessions":["napcat-private-0000000000"], "workspaces":["Z:\\你的工作区"]}
// 任一项命中即挂载；文件不存在则不挂载任何会话（默认不外溢）。
import { readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const SCOPE_PATH = join(process.env.USERPROFILE || '', '.dsh', 'memewiki-scope.json');
const DEBUG_PATH = join(process.env.USERPROFILE || '', '.dsh', 'memewiki-scope-debug.log');
const norm = value => String(value || '').replace(/[\\/]+$/, '').toLowerCase();

let cached = { at: 0, sessions: [], workspaces: [] };
function readScope() {
  const now = Date.now();
  if (now - cached.at < 1000) return cached;
  try {
    const raw = JSON.parse(readFileSync(SCOPE_PATH, 'utf8'));
    cached = {
      at: now,
      sessions: (raw.sessions || []).filter(v => typeof v === 'string'),
      workspaces: (raw.workspaces || []).filter(v => typeof v === 'string').map(norm),
    };
  } catch {
    cached = { at: now, sessions: [], workspaces: [] };
  }
  return cached;
}

function agentFields(agent) {
  return [
    agent?.session?.id, agent?.session?.sessionId, agent?.session?.key, agent?.sessionId, agent?.id,
    agent?.session?.cwd, agent?.session?.workspace, agent?.session?.root,
    agent?.cwd, agent?.workspace, agent?.root, agent?.workspaceRoot,
  ].filter(v => typeof v === 'string');
}

export function isTargetAgent(agent) {
  const scope = readScope();
  if (!scope.sessions.length && !scope.workspaces.length) return false;
  const fields = agentFields(agent);
  if (fields.some(v => scope.sessions.includes(v))) return true;
  if (!scope.workspaces.length) return false;
  return fields.some(v => {
    const value = norm(v);
    return scope.workspaces.some(w => value === w || value.startsWith(w + '\\') || value.startsWith(w + '/'));
  });
}

// 保留旧导出名，避免 index.js 里已有引用炸掉
export const QQ_SESSION_ID = 'scope-config';

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
        name: `memewiki:prefetch:${(agent?.session?.id || agent?.sessionId || 'scoped').toString().slice(0, 40)}`,
        order: 950,
        text: context => isTargetAgent(context?.agent || agent) ? promptText(context, agent) : '',
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
  // DSH 内核的 agent 列表字段可能随版本变化：把命中情况记到本地日志，便于核对作用域。
  try {
    sync();
    const agents = ctx.agents?.list?.() || [];
    appendFileSync(DEBUG_PATH, JSON.stringify({
      at: new Date().toISOString(),
      scope: readScope(),
      agents: agents.map(a => ({ hit: isTargetAgent(a), fields: agentFields(a).slice(0, 6) })),
    }) + '\n', 'utf8');
  } catch {}
  return dispose;
}
