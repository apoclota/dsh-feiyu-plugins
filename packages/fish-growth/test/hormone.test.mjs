import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshState, applyEmotionDelta, decayState, perturbHormones, regressHormones, hormoneBaseline, styleHint, buildContext, normalizeState, HORMONES } from '../lib/engine.js';

const delta = (emotions, confidence = 90) => ({ emotions, event: 'test', tags: ['t'], confidence, mask: 0, trigger: 'user' });

test('新状态带四激素基线，旧状态载入时补齐', () => {
  const fresh = freshState();
  assert.deepEqual(Object.keys(fresh.hormones).sort(), [...HORMONES].sort());
  const legacy = normalizeState({ emotions: { joy: 1 } }, 'feiyu');
  for (const key of HORMONES) assert.ok(legacy.hormones[key] >= 0 && legacy.hormones[key] <= 100, key);
});

test('正向事件抬高多巴胺与催产素，压低皮质醇', () => {
  const state = freshState();
  applyEmotionDelta(state, delta({ joy: 8, affection: 6 }), Date.now(), { minConfidence: 0 });
  assert.ok(state.hormones.dopamine > 40, 'dopamine');
  assert.ok(state.hormones.oxytocin > 50, 'oxytocin');
});

test('负面事件抬高皮质醇、压低血清素，且依恋越深越不容易被打穿', () => {
  const low = freshState();
  low.hormones.oxytocin = 10;
  const high = freshState();
  high.hormones.oxytocin = 95;
  const d = delta({ anger: 10, hurt: 8 });
  applyEmotionDelta(low, d, Date.now(), { minConfidence: 0 });
  applyEmotionDelta(high, d, Date.now(), { minConfidence: 0 });
  assert.ok(low.hormones.cortisol > 20, 'cortisol up');
  assert.ok(low.hormones.serotonin < 60, 'serotonin down');
  const lowDrop = 10 - low.hormones.oxytocin;
  const highDrop = 95 - high.hormones.oxytocin;
  assert.ok(highDrop < lowDrop * 3, `高依恋应更抗压: lowDrop=${lowDrop} highDrop=${highDrop}`);
});

test('激素按指数回落到基线，且带昼夜偏移', () => {
  const now = new Date('2026-11-15T15:10:00+08:00').getTime();
  const base = hormoneBaseline(now);
  assert.ok(base.dopamine > 40, '下午多巴胺基线偏高');
  const hot = { serotonin: 100, dopamine: 100, cortisol: 100, oxytocin: 100 };
  const after = regressHormones(hot, now, 14);
  for (const key of HORMONES) {
    assert.ok(after[key] < 100 && after[key] > base[key], `${key} 应落在基线与原值之间`);
  }
});

test('低置信度不扰动激素', () => {
  const h = { serotonin: 60, dopamine: 40, cortisol: 20, oxytocin: 50 };
  assert.deepEqual(perturbHormones(h, { anger: 10 }, 0), h);
});

test('说话倾向是状态描述，不含命令词和数字', () => {
  const hint = styleHint({ serotonin: 80, dopamine: 70, cortisol: 5, oxytocin: 80 });
  assert.ok(hint.length >= 3);
  const text = hint.join('；');
  assert.ok(!/请|应该|务必/.test(text), '不要命令式');
  assert.ok(!/\d/.test(text), '不要报数字');
});

test('context 用倾向代替数值报数，且仍含安全边界', () => {
  const state = freshState();
  applyEmotionDelta(state, delta({ affection: 9, joy: 7 }), Date.now(), { minConfidence: 0 });
  const text = buildContext(state, { injectionMode: 'full' });
  assert.ok(text.includes('此刻的说话倾向'));
  assert.ok(!text.includes('话量='), '不再直接报话量');
  assert.ok(text.includes('安全边界'));
});

test('decay 会同时让激素回落', () => {
  const state = freshState();
  state.hormones.dopamine = 95;
  state.updatedAt = Date.now() - 20 * 3600000;
  decayState(state, Date.now());
  assert.ok(state.hormones.dopamine < 95);
});
