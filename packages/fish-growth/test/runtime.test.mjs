import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGrowthRuntime, emotionPrompt, createTool } from '../lib/index.js';
import { GrowthStore } from '../lib/store.js';

const JUDGEMENT = {
  emotions: { joy: 12, calm: 0, affection: 6, anger: 0, hurt: 0, worry: 0, sadness: 0, curiosity: 4, fatigue: 0, jealousy: 0, longing: 0, desire: 0, envy: 0, pride: 0, shame: 0, guilt: 0, 'playful-mischief': 0 },
  event: '主人夸了鱼一句', tags: ['夸赞', '闲聊'], confidence: 90, mask: 0, trigger: '',
  traitSignals: [{ trait: 'warmth', direction: 1, evidence: ['主动道谢', '语气放松'] }],
};

/** 复刻宿主 dsh-scope 的撞名行为：同一个作用域里重复注册同名 prompt context 会抛错。 */
function makeScope(label) {
  const names = new Set();
  const handlers = new Map();
  return {
    label, names, handlers,
    systemPrompt: {
      context({ name }) {
        if (names.has(name)) { const error = new Error(`prompt context "${name}" is already registered in this scope`); throw error; }
        names.add(name);
        return () => names.delete(name);
      },
    },
    on(type, handler) {
      if (!handlers.has(type)) handlers.set(type, []);
      handlers.get(type).push(handler);
      return () => { const list = handlers.get(type) || []; const index = list.indexOf(handler); if (index >= 0) list.splice(index, 1); };
    },
    emit(type, payload) { for (const handler of [...(handlers.get(type) || [])]) handler(payload); },
  };
}

function makeAgent(id, scope, extra = {}) {
  const events = [];
  return {
    id, ctx: scope, session: {
      id, requestHeader: () => ({ config: { provider: 'deepseek-account', model: 'deepseek-flash' } }),
      snapshotEvents: () => events,
    },
    events, ...extra,
  };
}

function makeCtx({ agents, hasDefaultModel = true } = {}) {
  const warnings = [];
  return {
    warnings,
    agents: { list: () => agents },
    get(key) {
      if (key === 'agentDefaultModel' && hasDefaultModel) return { currentSelection: () => ({ provider: 'deepseek-account', model: 'deepseek-flash' }) };
      return undefined;
    },
    tools: { register: () => () => {} },
    logger: () => ({ warn: message => warnings.push(String(message)), info() {}, error: message => warnings.push(String(message)) }),
  };
}

function tempStore() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fish-growth-'));
  fs.mkdirSync(path.join(home, 'fish-growth'), { recursive: true });
  return new GrowthStore({ home, profileKey: 'feiyu' });
}

test('同一个作用域被多个 agent 共享时不会撞名，也不会抛错', () => {
  const shared = makeScope('shared');
  const agents = [makeAgent('sess-a', shared), makeAgent('sess-b', shared)];
  const ctx = makeCtx({ agents });
  const runtime = createGrowthRuntime({ ctx, store: tempStore(), settings: { selectedSessions: ['sess-a', 'sess-b'] }, judgeFn: async () => JUDGEMENT });
  runtime.start();
  assert.doesNotThrow(() => { runtime.tick(); runtime.tick(); runtime.tick(); });
  assert.deepEqual([...shared.names].sort(), ['fish-growth-sess-a', 'fish-growth-sess-b']);
  assert.deepEqual(ctx.warnings, []);
  runtime.dispose();
});

test('注册失败（宿主拒收）只记日志，不抛给宿主', () => {
  const hostile = {
    on: () => () => {},
    systemPrompt: { context() { throw new Error('prompt context "x" is already registered in this scope'); } },
  };
  const ctx = makeCtx({ agents: [makeAgent('sess-x', hostile)] });
  const runtime = createGrowthRuntime({ ctx, store: tempStore(), settings: { selectedSessions: ['sess-x'] }, judgeFn: async () => JUDGEMENT });
  runtime.start();
  assert.doesNotThrow(() => runtime.tick());
  assert.match(ctx.warnings.join('\n'), /提示词注入挂载失败/);
  runtime.dispose();
});

test('关闭总开关会卸载当前上下文和会话监听', () => {
  const scope = makeScope('disable-growth');
  const agent = makeAgent('sess-disable', scope);
  const runtime = createGrowthRuntime({ ctx: makeCtx({ agents: [agent] }), store: tempStore(), settings: { selectedSessions: ['sess-disable'] } });
  runtime.start();
  assert.equal(scope.names.size, 1);
  assert.ok((scope.handlers.get('agent/turn-stopping') || []).length > 0);
  runtime.updateSettings({ enabled: false });
  assert.equal((scope.handlers.get('agent/turn-stopping') || []).length, 0);
  assert.equal(scope.names.size, 0);
  runtime.dispose();
});

test('空白会话白名单时不挂载、不采集也不调用判定器', async () => {
  const scope = makeScope('empty-allowlist');
  const agent = makeAgent('sess-private', scope);
  let calls = 0;
  const runtime = createGrowthRuntime({ ctx: makeCtx({ agents: [agent] }), store: tempStore(), judgeFn: async () => { calls++; return JUDGEMENT; } });
  scope.emit('agent/inbox/inserted', { message: { role: 'user', content: 'private work message' } });
  scope.emit('agent/turn-stopping', {});
  await runtime.idle();
  assert.equal(scope.names.size, 0);
  assert.ok([...scope.handlers.values()].every(list => list.length === 0));
  assert.equal(calls, 0);
  runtime.dispose();
});

test('取消勾选会立即卸载会话监听与提示词上下文', () => {
  const scope = makeScope('unselect');
  const agent = makeAgent('sess-toggle', scope);
  const runtime = createGrowthRuntime({ ctx: makeCtx({ agents: [agent] }), store: tempStore(), settings: { selectedSessions: ['sess-toggle'] } });
  runtime.updateSettings({ selectedSessions: ['sess-toggle'] });
  runtime.start();
  assert.equal(scope.names.size, 1);
  runtime.updateSettings({ selectedSessions: [] });
  assert.equal(scope.names.size, 0);
  assert.ok([...scope.handlers.values()].every(list => list.length === 0));
  runtime.dispose();
});

test('取消会话选择时丢弃进行中的判定结果', async () => {
  const scope = makeScope('cancel-pending');
  const agent = makeAgent('sess-pending', scope);
  const store = tempStore();
  let finish;
  const runtime = createGrowthRuntime({ ctx: makeCtx({ agents: [agent] }), store, settings: { selectedSessions: ['sess-pending'] }, judgeFn: () => new Promise(resolve => { finish = resolve; }) });
  runtime.start();
  scope.emit('agent/inbox/inserted', { message: { role: 'user', content: 'hello' } });
  scope.emit('agent/turn-stopping', {});
  await Promise.resolve();
  await Promise.resolve();
  runtime.updateSettings({ selectedSessions: [] });
  finish(JUDGEMENT);
  await runtime.idle();
  assert.equal(store.read().emotions.joy, 0);
  assert.equal(store.read().counters.judged, 0);
  runtime.dispose();
});

test('情绪影响为 0 时只计数、不修改情绪', async () => {
  const scope = makeScope('zero-intensity');
  const agent = makeAgent('sess-zero', scope);
  const store = tempStore();
  const runtime = createGrowthRuntime({ ctx: makeCtx({ agents: [agent] }), store, settings: { selectedSessions: ['sess-zero'], emotionInfluencePercent: 0 }, judgeFn: async () => JUDGEMENT });
  runtime.start();
  scope.emit('agent/inbox/inserted', { message: { role: 'user', content: 'hello' } });
  scope.emit('agent/turn-stopping', {});
  await runtime.idle();
  assert.equal(store.read().emotions.joy, 0);
  assert.equal(store.read().counters.judged, 1);
  runtime.dispose();
});

test('回合结束后判定一次并写入情绪，随后被限速器跳过', async () => {
  const scope = makeScope('one');
  const agent = makeAgent('sess-1', scope);
  const store = tempStore();
  let calls = 0;
  const runtime = createGrowthRuntime({ ctx: makeCtx({ agents: [agent] }), store, settings: { minIntervalMs: 10000, selectedSessions: ['sess-1'] }, judgeFn: async () => { calls++; return JUDGEMENT; } });
  runtime.start();
  scope.emit('agent/inbox/inserted', { message: { role: 'user', content: [{ type: 'text', text: '今天夸你一句' }], source: { kind: 'user' } } });
  scope.emit('agent/turn-stopping', {});
  await runtime.idle();
  assert.equal(calls, 1);
  const state = store.read();
  assert.ok(state.emotions.joy > 0, 'joy 应该被写入');
  assert.equal(state.counters.judged, 1);

  // 第二轮：立刻再触发，应当被 minIntervalMs 拦住
  scope.emit('agent/inbox/inserted', { message: { role: 'user', content: '再来一句' } });
  scope.emit('agent/turn-stopping', {});
  await runtime.idle();
  assert.equal(calls, 1, '限速器应当跳过第二次判定');
  assert.ok(store.read().counters.skipped >= 1);
  runtime.dispose();
});

test('注入文本随情绪变化，且不改写磁盘（读时衰减）', async () => {
  const scope = makeScope('text');
  const agent = makeAgent('sess-t', scope);
  const store = tempStore();
  const base = store.read(); base.emotions.anger = 70; base.emotions.joy = 5; base.updatedAt = Date.now(); store.write(base);
  const runtime = createGrowthRuntime({ ctx: makeCtx({ agents: [agent] }), store, settings: { selectedSessions: ['sess-t'] }, judgeFn: async () => JUDGEMENT });
  runtime.start();
  assert.equal(store.read().emotions.anger, 70, '读状态不应顺手落盘');
  runtime.dispose();
});

test('拿不到模型时判定失败只 warn，不影响宿主', async () => {
  const scope = makeScope('nomodel');
  const agent = makeAgent('sess-n', scope);
  agent.session.requestHeader = () => ({});
  const ctx = makeCtx({ agents: [agent], hasDefaultModel: false });
  const store = tempStore();
  const runtime = createGrowthRuntime({ ctx, store, settings: { selectedSessions: ['sess-a', 'sess-b', 'sess-x', 'sess-1', 'sess-t', 'sess-n', 'sess-f', 'sess-trait'] }, judgeFn: async () => { throw new Error('拿不到可用模型（未配置且宿主没有默认选择）'); } });
  runtime.tick();
  scope.emit('agent/inbox/inserted', { message: { role: 'user', content: '在吗' } });
  scope.emit('agent/turn-stopping', {});
  await runtime.idle();
  assert.match(ctx.warnings.join('\n'), /拿不到可用模型/);
  runtime.dispose();
});

test('注入过滤器：runtime-context 等宿主内容不算用户发言', async () => {
  const scope = makeScope('filter');
  const agent = makeAgent('sess-f', scope);
  let calls = 0;
  const runtime = createGrowthRuntime({ ctx: makeCtx({ agents: [agent] }), store: tempStore(), settings: { selectedSessions: ['sess-a', 'sess-b', 'sess-x', 'sess-1', 'sess-t', 'sess-n', 'sess-f', 'sess-trait'] }, judgeFn: async () => { calls++; return JUDGEMENT; } });
  runtime.tick();
  scope.emit('agent/inbox/inserted', { message: { role: 'user', content: '<runtime-context/>', source: { kind: 'runtime-context' } } });
  scope.emit('agent/turn-stopping', {});
  await runtime.idle();
  assert.equal(calls, 0);
  runtime.dispose();
});

test('工具：status / reset_emotions / reset_personality 需要 confirm', () => {
  const store = tempStore();
  const tool = createTool({ logger: () => ({ warn() {} }) }, store, {});
  const state = store.read(); state.emotions.anger = 40; state.traits.warmth = 80; store.write(state);
  assert.match(tool.execute({ action: 'status' }), /"anger": 40/);
  assert.match(tool.execute({ action: 'reset_personality' }), /confirm=true/);
  assert.match(tool.execute({ action: 'reset_personality', confirm: true }), /恢复中性/);
  assert.equal(store.read().traits.warmth, 50);
  tool.execute({ action: 'reset_emotions' });
  assert.equal(store.read().emotions.anger, 0);
});

test('同一会话中的不同轮次可以累计性格证据并生成待审核提案', async () => {
  const scope = makeScope('trait-evidence');
  const agent = makeAgent('sess-trait', scope);
  const store = tempStore();
  const judgement = { ...JUDGEMENT, traitSignals: [{ trait: 'warmth', direction: 1, evidence: ['主动关心对话', '持续使用体贴表达'] }] };
  let now = Date.now();
  const runtime = createGrowthRuntime({ ctx: makeCtx({ agents: [agent] }), store, now: () => now, settings: { minIntervalMs: 10000, traitEvidenceTurns: 2, selectedSessions: ['sess-trait'] }, judgeFn: async () => judgement });
  runtime.tick();
  for (let i = 0; i < 4; i++) {
    now += 11000;
    scope.emit('agent/inbox/inserted', { message: { role: 'user', content: `不同轮次 ${i}` } });
    scope.emit('agent/turn-stopping', {});
    await runtime.idle();
  }
  const state = store.read();
  const observations = state.journal.filter(row => row.type === 'trait-evidence' && row.trait === 'warmth');
  assert.equal(observations.length, 4);
  assert.equal(new Set(observations.map(row => row.observationId)).size, 4);
  assert.equal(state.proposals.filter(item => item.trait === 'warmth' && item.status === 'pending').length, 1);
  runtime.dispose();
});

test('判定提示词要求 JSON、纳入七情倾向并尊重拒绝边界', () => {
  const prompt = emotionPrompt('用户：今天不想聊', { traits: {}, virtues: {} });
  assert.match(prompt, /严格输出 JSON/);
  assert.match(prompt, /不得因用户拒绝/);
  assert.match(prompt, /playful-mischief/);
  assert.match(prompt, /绝不能升级为控制/);
});
