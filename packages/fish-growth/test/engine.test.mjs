import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, applyEmotionDelta, decayState, resolveMood, buildContext, applyTraitProposal, normalizeState, moodOverview } from '../lib/engine.js';

test('emotion vectors accumulate, saturate and decay independently from traits', () => {
  const state = freshState(1000);
  applyEmotionDelta(state, { emotions: { anger: 12, affection: 8 }, event: 'ignored boundary', tags: ['boundary'], confidence: 90, mask: 70 }, 1000);
  const beforeTrait = state.traits.warmth;
  decayState(state, 1000 + 8 * 3600000, { emotionHalfLifeHours: 8 });
  assert.equal(state.emotions.anger, 6);
  assert.equal(state.traits.warmth, beforeTrait);
  assert.equal(state.events[0].rumination, true);
});

test('similar event revives unresolved event instead of adding another', () => {
  const state = freshState(1000);
  applyEmotionDelta(state, { emotions: { hurt: 8 }, event: 'event one', tags: ['care'], confidence: 90 }, 1000);
  const eventId = state.events[0].id;
  applyEmotionDelta(state, { emotions: { hurt: 5 }, event: 'event two', tags: ['care'], confidence: 90 }, 5000);
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0].id, eventId);
  assert.equal(state.events[0].revivals, 1);
});

test('conflicting emotions remain visible and anger lowers sociability', () => {
  const state = freshState();
  state.emotions.joy = 28;
  state.emotions.sadness = 30;
  state.emotions.anger = 52;
  const result = resolveMood(state);
  assert.equal(result.voice.tone, 'irritable');
  assert.ok(result.conflicts.some(pair => pair.a === 'joy' && pair.b === 'sadness'));
  assert.match(buildContext(state), /冲突/);
  assert.match(buildContext(state), /不得惩罚/);
});

test('low confidence changes neither state nor counters', () => {
  const state = freshState();
  const result = applyEmotionDelta(state, { emotions: { joy: 10 }, event: 'maybe', confidence: 20 }, 1000);
  assert.equal(result.applied, false);
  assert.equal(state.emotions.joy, 0);
  assert.equal(state.counters.judged, 0);
});

test('trait changes are pending and reversible through explicit decision', () => {
  const state = freshState();
  state.proposals.push({ id: 'p1', trait: 'patience', delta: -2, evidence: ['e1', 'e2', 'e3'], status: 'pending' });
  applyTraitProposal(state, 'p1', 'approve', 1234);
  assert.equal(state.traits.patience, 48);
  assert.equal(state.proposals[0].status, 'applied');
  state.proposals.push({ id: 'p2', trait: 'patience', delta: 2, evidence: ['correction'], status: 'pending' });
  applyTraitProposal(state, 'p2', 'approve', 2345);
  assert.equal(state.traits.patience, 50);
});

test('normalization bounds hostile or malformed values and fills new axes for old saves', () => {
  const state = normalizeState({ emotions: { anger: 500 }, traits: { warmth: -3 }, events: 'bad' });
  assert.equal(state.emotions.anger, 100);
  assert.equal(state.emotions.desire, 0);
  assert.equal(state.emotions['playful-mischief'], 0);
  assert.equal(state.traits.warmth, 0);
  assert.deepEqual(state.events, []);
});

test('mood overview derives a single score from the growth emotions and supports compact or disabled injection', () => {
  const state = freshState();
  assert.equal(moodOverview(state).score, 50);
  state.emotions.joy = 50;
  assert.ok(moodOverview(state).score > 50);
  assert.match(buildContext(state, { injectionMode: 'summary' }), /心情背景/);
  assert.doesNotMatch(buildContext(state, { injectionMode: 'summary' }), /德行约束/);
  assert.equal(buildContext(state, { injectionMode: 'off' }), '');
});

test('desire and mischief change playful tone but never remove restraint', () => {
  const state = freshState();
  state.emotions.desire = 60;
  assert.equal(resolveMood(state).voice.tone, 'warm-longing');
  state.emotions.desire = 0;
  state.emotions['playful-mischief'] = 70;
  const voice = resolveMood(state).voice;
  assert.equal(voice.tone, 'mischievous');
  assert.ok(voice.restraint >= 50);
  assert.match(buildContext(state), /不得惩罚/);
  assert.match(buildContext(state), /绝不能控制/);
  assert.equal(resolveMood(state, { emotionInfluencePercent: 0 }).voice.tone, 'neutral');
  assert.doesNotMatch(buildContext(state, { emotionInfluencePercent: 0 }), /当前情绪倾向/);
});
