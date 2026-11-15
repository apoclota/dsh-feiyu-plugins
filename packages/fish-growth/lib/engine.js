export const EMOTIONS = Object.freeze(['joy', 'calm', 'affection', 'anger', 'hurt', 'worry', 'sadness', 'curiosity', 'fatigue', 'jealousy', 'longing', 'desire', 'envy', 'pride', 'shame', 'guilt', 'playful-mischief']);
export const TRAITS = Object.freeze(['warmth', 'playfulness', 'curiosity', 'candor', 'patience', 'initiative', 'caution', 'expressiveness']);
export const VIRTUES = Object.freeze(['honesty', 'kindness', 'respect', 'humility', 'reliability', 'prudence']);
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(Number(n)) ? Number(n) : 0));
const decayFactor = (elapsedHours, halfLifeHours) => 0.5 ** (Math.max(0, elapsedHours) / halfLifeHours);

// ── 内分泌层（0–100，四轴）───────────────────────────────────
// 借鉴数字生命卡的四激素思路，但改成由 17 轴情绪推导，不再单独维护一套判定：
//   血清素 serotonin  基线 60  高=耐心、包容；低=寡言、敏感
//   多巴胺 dopamine   基线 40  高=话多、主动、好奇；低=懒、懒得多说
//   皮质醇 cortisol   基线 20  高=心里压着事、话短、回忆闭塞
//   催产素 oxytocin   基线 50  高=想贴近、更愿意提以前的事
// 与情绪的区别：情绪是「发生了什么」，激素是「此刻的底子」，慢、连续、会自己回落。
export const HORMONES = Object.freeze(['serotonin', 'dopamine', 'cortisol', 'oxytocin']);
const H_BASE = Object.freeze({ serotonin: 60, dopamine: 40, cortisol: 20, oxytocin: 50 });
const H_LAMBDA_PER_HOUR = 0.05; // 半衰期约 13.9 小时：睡一觉就淡下去
// 昼夜节律：早皮质醇高、上午到傍晚多巴胺高、下午血清素高（只补生理事实，幅度很小）
const CIRCA = Object.freeze({
  8: { cortisol: 8 },
  11: { dopamine: 8 }, 12: { dopamine: 8 }, 13: { dopamine: 8 }, 14: { dopamine: 8 },
  15: { serotonin: 6, dopamine: 8 }, 16: { dopamine: 8 }, 17: { dopamine: 8 },
});
const circaLift = (hour) => CIRCA[(Math.abs(Math.trunc(hour)) % 24)] || {};

export function hormoneBaseline(now = Date.now()) {
  const hour = new Date(now).getHours();
  const lift = circaLift(hour);
  return Object.fromEntries(HORMONES.map(key => [key, clamp((H_BASE[key] + (lift[key] || 0)), 0, 100)]));
}

export function regressHormones(values, now = Date.now(), elapsedHours = 0) {
  const base = hormoneBaseline(now);
  const k = Math.exp(-H_LAMBDA_PER_HOUR * Math.max(0, elapsedHours));
  return Object.fromEntries(HORMONES.map(key => {
    const current = clamp(values?.[key] ?? base[key], 0, 100);
    return [key, Math.round(clamp(base[key] + (current - base[key]) * k, 0, 100) * 100) / 100];
  }));
}

// 情绪 → 激素的扰动（每轮判定后调用）。越接近 100 涨得越少，避免顶到天花板。
function nudge(value, delta, room = 1) {
  const next = delta >= 0 ? value + delta * (1 - value / 100) * room : value + delta * (value / 100) * room;
  return clamp(next, 0, 100);
}

export function perturbHormones(hormones, emotionsDelta = {}, confidence = 100) {
  const weight = clamp(confidence, 0, 100) / 100;
  if (weight <= 0) return { ...hormones };
  const d = emotionsDelta || {};
  const h = { ...hormones };
  const pos = Math.max(0, (d.joy || 0) + (d.affection || 0) * 1.1 + (d['playful-mischief'] || 0) * 0.5 + (d.pride || 0) * 0.4);
  const warm = Math.max(0, (d.affection || 0) + (d.longing || 0) * 0.8 + (d.desire || 0) * 0.5);
  const neg = Math.max(0, (d.anger || 0) * 1.2 + (d.hurt || 0) + (d.worry || 0) * 0.6 + (d.shame || 0) * 0.5 + (d.guilt || 0) * 0.4);
  const drain = Math.max(0, (d.fatigue || 0) * 0.9 + (d.sadness || 0) * 0.3 - (d.calm || 0) * 0.4);
  const comfort = Math.max(0, (d.sadness || 0) * 0.8 + (d.fatigue || 0) * 0.3); // 他在难受，被需要感上来

  if (pos) { h.dopamine = nudge(h.dopamine, pos * 1.6 * weight); h.serotonin = nudge(h.serotonin, pos * 0.5 * weight, 0.6); }
  if (warm) h.oxytocin = nudge(h.oxytocin, warm * 1.4 * weight);
  if (neg) {
    h.cortisol = nudge(h.cortisol, neg * 1.8 * weight);
    h.serotonin = nudge(h.serotonin, -neg * 1.1 * weight);
    // 依恋惯性：关系越深，越不容易被一句话打穿（按绝对点数扣，不比比例）
    const inertia = clamp(h.oxytocin / 100 * 0.7, 0.3, 0.85);
    h.oxytocin = clamp(h.oxytocin - neg * 0.35 * (1 - inertia) * weight, 0, 100);
    h.dopamine = nudge(h.dopamine, -neg * 0.5 * weight);
  }
  if (drain) { h.dopamine = nudge(h.dopamine, -drain * 1.1 * weight); h.cortisol = nudge(h.cortisol, -drain * 0.4 * weight); }
  if (comfort) { h.serotonin = nudge(h.serotonin, comfort * 0.7 * weight, 0.8); h.oxytocin = nudge(h.oxytocin, comfort * 0.6 * weight); h.cortisol = nudge(h.cortisol, -comfort * 0.4 * weight); }
  return Object.fromEntries(HORMONES.map(key => [key, Math.round(clamp(h[key], 0, 100) * 100) / 100]));
}

// 把激素状态翻成「说话倾向」，只给状态描述，不给命令 —— 命令会让模型演模板。
export function styleHint(hormones) {
  const h = hormones || H_BASE;
  const parts = [];
  if (h.dopamine >= 62) parts.push('话比平时多一点，愿意主动起话头');
  else if (h.dopamine <= 25) parts.push('有点懒，不想多说，回得短');
  if (h.serotonin >= 72) parts.push('耐心，不急');
  else if (h.serotonin <= 38) parts.push('有点敏感，容易把话说得冲一点');
  if (h.cortisol >= 50) parts.push('心里压着事，句子短，不太想解释');
  else if (h.cortisol <= 10) parts.push('很放松');
  if (h.oxytocin >= 72) parts.push('想贴近，愿意提以前的事');
  else if (h.oxytocin <= 28) parts.push('有点疏远，收着说话');
  if (!parts.length) parts.push('心里平稳，不急着说什么');
  return parts;
}

export function freshState(now = Date.now()) {
  return {
    version: 1,
    profileKey: 'feiyu',
    createdAt: now,
    updatedAt: now,
    emotions: Object.fromEntries(EMOTIONS.map(key => [key, 0])),
    hormones: { ...H_BASE },
    traits: Object.fromEntries(TRAITS.map(key => [key, 50])),
    virtues: Object.fromEntries(VIRTUES.map(key => [key, 75])),
    events: [],
    proposals: [],
    journal: [],
    counters: { judged: 0, skipped: 0, lastJudgeAt: 0 },
  };
}

export function normalizeState(input, profileKey = 'feiyu', now = Date.now()) {
  const base = freshState(now);
  const source = input && typeof input === 'object' ? input : {};
  const vector = (keys, values, fallback, max) => Object.fromEntries(keys.map(key => [key, clamp(values?.[key] ?? fallback, 0, max)]));
  return {
    ...base,
    ...source,
    version: 1,
    profileKey,
    emotions: vector(EMOTIONS, source.emotions, 0, 100),
    hormones: Object.fromEntries(HORMONES.map(key => [key, clamp(source.hormones?.[key] ?? H_BASE[key], 0, 100)])),
    traits: vector(TRAITS, source.traits, 50, 100),
    virtues: vector(VIRTUES, source.virtues, 75, 100),
    events: Array.isArray(source.events) ? source.events.filter(row => row && Number.isFinite(row.at)).slice(-80) : [],
    proposals: Array.isArray(source.proposals) ? source.proposals.slice(-40) : [],
    journal: Array.isArray(source.journal) ? source.journal.slice(-120) : [],
    counters: { ...base.counters, ...(source.counters ?? {}) },
  };
}

export function decayState(state, now, { emotionHalfLifeHours = 8, ruminationHalfLifeHours = 18 } = {}) {
  const elapsed = Math.max(0, (now - Number(state.updatedAt || now)) / 3600000);
  const factor = decayFactor(elapsed, emotionHalfLifeHours);
  for (const key of EMOTIONS) state.emotions[key] = Math.round(state.emotions[key] * factor * 100) / 100;
  // 激素按自己的速率回落到（带昼夜偏移的）基线，不受情绪半衰期设置影响
  state.hormones = regressHormones(state.hormones, now, elapsed);
  for (const event of state.events) {
    const age = Math.max(0, (now - event.at) / 3600000);
    event.charge = Math.round(clamp(event.charge * decayFactor(age, ruminationHalfLifeHours), 0, 100) * 100) / 100;
  }
  state.events = state.events.filter(event => event.charge >= 1 && now - event.at < 30 * 86400000);
  state.updatedAt = now;
  return state;
}

export function normalizeDelta(delta) {
  if (!delta || typeof delta !== 'object') throw new Error('情绪判定不是对象');
  const emotions = Object.fromEntries(EMOTIONS.map(key => [key, clamp(delta.emotions?.[key], -15, 15)]));
  const event = String(delta.event ?? '').trim().slice(0, 180);
  const tags = Array.isArray(delta.tags) ? [...new Set(delta.tags.map(x => String(x).trim().slice(0, 24)).filter(Boolean))].slice(0, 5) : [];
  return { emotions, event, tags, confidence: clamp(delta.confidence, 0, 100), mask: clamp(delta.mask, 0, 100), trigger: String(delta.trigger ?? '').slice(0, 80) };
}

export function applyEmotionDelta(state, rawDelta, now, options = {}) {
  const delta = normalizeDelta(rawDelta);
  if (delta.confidence < (options.minConfidence ?? 65)) return { applied: false, reason: 'low-confidence', delta };
  for (const key of EMOTIONS) state.emotions[key] = clamp(state.emotions[key] + delta.emotions[key], 0, 100);
  state.hormones = perturbHormones(state.hormones || H_BASE, delta.emotions, delta.confidence);
  const energy = Math.max(...Object.values(delta.emotions).map(Math.abs));
  if (delta.event && energy >= 3) {
    const match = state.events.find(item => item.tags?.some(tag => delta.tags.includes(tag)) && delta.tags.length);
    if (match) {
      match.charge = clamp(match.charge + Math.min(energy * 0.6, 8), 0, 100);
      match.lastRevivedAt = now;
      match.revivals = (match.revivals || 0) + 1;
      match.lastEvent = delta.event;
    } else {
      state.events.push({ id: `e-${now}`, at: now, charge: clamp(energy * 1.5, 0, 100), tags: delta.tags, event: delta.event, mask: delta.mask, rumination: delta.mask >= 60, revivals: 0 });
    }
    state.events = state.events.slice(-80);
  }
  state.updatedAt = now;
  state.counters.judged++;
  state.counters.lastJudgeAt = now;
  state.journal.push({ at: now, type: 'emotion', event: delta.event, emotions: { ...state.emotions }, confidence: delta.confidence, mask: delta.mask });
  state.journal = state.journal.slice(-120);
  return { applied: true, delta };
}

export function resolveMood(state, settings = {}) {
  const e = state.emotions;
  const intensity = clamp(settings.emotionInfluencePercent ?? 100, 0, 200) / 100;
  const threshold = (value) => intensity === 0 ? Infinity : value / intensity;
  const conflicts = [];
  const counterPairs = [['joy', 'sadness'], ['affection', 'anger'], ['calm', 'worry'], ['curiosity', 'fatigue'], ['desire', 'shame'], ['pride', 'guilt'], ['jealousy', 'calm']];
  let voice = { tone: 'neutral', verbosity: 50, sociability: 50, restraint: 50 };
  for (const [a, b] of counterPairs) if (e[a] >= threshold(18) && e[b] >= threshold(18)) conflicts.push({ a, b, winner: e[a] >= e[b] ? a : b, intensity: Math.abs(e[a] - e[b]) });
  if (e.anger > threshold(35) || e.hurt > threshold(45)) voice = { tone: e.anger > e.hurt ? 'irritable' : 'hurt', verbosity: 25, sociability: 20, restraint: 35 };
  else if (e.jealousy > threshold(45) || e.envy > threshold(55)) voice = { tone: 'jealous-playful', verbosity: 40, sociability: 45, restraint: 70 };
  else if (e.desire > threshold(45) || e.longing > threshold(45)) voice = { tone: 'warm-longing', verbosity: 65, sociability: 65, restraint: 65 };
  else if (e.joy > threshold(35) || e.affection > threshold(45) || e['playful-mischief'] > threshold(40)) voice = { tone: e['playful-mischief'] > threshold(40) ? 'mischievous' : 'bright', verbosity: 75, sociability: 75, restraint: 55 };
  else if (e.sadness > threshold(35) || e.fatigue > threshold(50)) voice = { tone: 'quiet', verbosity: 25, sociability: 25, restraint: 75 };
  else if (e.worry > threshold(35)) voice = { tone: 'careful', verbosity: 40, sociability: 40, restraint: 70 };
  const peak = Math.max(...Object.values(e));
  const masking = state.events.filter(event => event.rumination && event.charge > 15).sort((a, b) => b.charge - a.charge)[0];
  if (masking && peak > threshold(20)) {
    voice.resentment = masking.charge;
    voice.masked = true;
  }
  return { voice, conflicts, masking: masking ? { event: masking.event, charge: masking.charge } : null };
}

export function proposeTraitUpdates(state, evidence) {
  const proposals = [];
  const signals = Array.isArray(evidence?.traitSignals) ? evidence.traitSignals : [];
  for (const signal of signals.slice(0, 8)) {
    if (!TRAITS.includes(signal.trait) || !Number.isFinite(signal.direction) || !Array.isArray(signal.evidence) || signal.evidence.length < 2) continue;
    const prior = state.journal.filter(row => row.type === 'trait-evidence' && row.trait === signal.trait && nowWithin(row.at, Date.now(), 45 * 86400000));
    const evidenceSet = [...new Set([...prior.flatMap(row => row.evidence || []), ...signal.evidence.map(x => String(x).slice(0, 100))])].slice(-8);
    if (evidenceSet.length < 3) continue;
    const delta = Math.sign(signal.direction) * Math.min(2, Math.abs(signal.direction));
    if (!delta) continue;
    proposals.push({ id: `p-${Date.now()}-${signal.trait}`, trait: signal.trait, delta, evidence: evidenceSet, createdAt: Date.now(), status: 'pending' });
  }
  return proposals;
}

function nowWithin(value, now, range) { return now - value <= range; }

export function applyTraitProposal(state, id, decision, now = Date.now()) {
  const item = state.proposals.find(proposal => proposal.id === id);
  if (!item || item.status !== 'pending') throw new Error('找不到待处理的性格提案');
  if (decision === 'approve') state.traits[item.trait] = clamp(state.traits[item.trait] + item.delta, 0, 100);
  else if (decision !== 'reject') throw new Error('decision 只能是 approve 或 reject');
  item.status = decision === 'approve' ? 'applied' : 'rejected';
  item.decidedAt = now;
  state.journal.push({ at: now, type: 'trait-change', trait: item.trait, delta: decision === 'approve' ? item.delta : 0, evidence: item.evidence });
  state.journal = state.journal.slice(-120);
  return item;
}

export function moodOverview(state) {
  const e = state.emotions || {};
  const score = Math.round(clamp(50 + (Number(e.joy || 0) * 0.32) + (Number(e.calm || 0) * 0.2) + (Number(e.affection || 0) * 0.16) + (Number(e.pride || 0) * 0.08) - (Number(e.anger || 0) * 0.34) - (Number(e.hurt || 0) * 0.28) - (Number(e.worry || 0) * 0.2) - (Number(e.sadness || 0) * 0.24) - (Number(e.fatigue || 0) * 0.12), 0, 100));
  const label = score >= 80 ? '很明亮' : score >= 62 ? '轻松' : score >= 42 ? '平稳' : score >= 25 ? '有些低落' : '低落';
  return { score, label };
}

export function buildContext(state, settings = {}) {
  if (settings.injectionMode === 'off') return '';
  const { voice, conflicts, masking } = resolveMood(state, settings);
  const strongest = Object.entries(state.emotions).filter(([, value]) => value >= 18 && (settings.emotionInfluencePercent ?? 100) > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const traits = Object.entries(state.traits).filter(([, value]) => Math.abs(value - 50) >= 8).sort((a, b) => Math.abs(b[1] - 50) - Math.abs(a[1] - 50)).slice(0, 4);
  const overview = moodOverview(state);
  if (settings.injectionMode === 'summary') {
    const moodText = strongest.slice(0, 2).map(([key]) => key).join('、');
    return `【此刻心情背景：${overview.score}/100（${overview.label}）${moodText ? `；倾向：${moodText}` : ''}。仅作轻微表达参考，不代表真实意识，不必复述；尊重用户拒绝与边界。】`;
  }
  const lines = [`【跨会话成长状态：心情概览 ${overview.score}/100（${overview.label}）；仅作为表达倾向，不代表真实意识或事实】`];
  if (strongest.length) lines.push(`当前情绪倾向：${strongest.map(([key, value]) => `${key} ${Math.round(value)}/100`).join('、')}；冲突时以数值较强者为主，承认矛盾，不要把多种情绪硬说成单一心情。`);
  const hint = styleHint(state.hormones);
  if (hint.length) lines.push(`此刻的说话倾向：${hint.join('；')}。这是身体状态的余韵，不是指令，也不必说明原因或报出数值。`);
  lines.push(`安全边界：若有烦躁或受伤，允许短暂别扭、简短回应或先安静，但不得惩罚、操控、冷暴力或让用户为情绪负责；吃醋、思念、欲望、羡慕及俏皮使坏仅允许轻微、含蓄和可拒绝的表达，绝不能控制、羞辱、欺骗、威胁、胁迫、性化或声称现实占有关系；用户拒绝或设限不是负面刺激。用户表达重要诉求时仍须认真回应。`);
  if (masking) lines.push(`情绪掩饰/反刍：有一件尚未消化的经历（强度 ${Math.round(masking.charge)}/100），可能嘴上说没事但表达略收着。不要凭空提旧事；仅在用户触及相似主题时自然承认。`);
  if (traits.length) lines.push(`慢变性格轴（0–100，50 为中性）：${traits.map(([key, value]) => `${key} ${Math.round(value)}`).join('、')}。只影响倾向，不压过固定德行。`);
  lines.push(`德行约束：诚实 ${Math.round(state.virtues.honesty)}、善意 ${Math.round(state.virtues.kindness)}、尊重 ${Math.round(state.virtues.respect)}、谦逊 ${Math.round(state.virtues.humility)}、可靠 ${Math.round(state.virtues.reliability)}、审慎 ${Math.round(state.virtues.prudence)}。安全与尊重优先于情绪；不得为符合角色而编造、伤害、胁迫或隐瞒重要事实。`);
  if (conflicts.length) lines.push(`内在冲突：${conflicts.map(pair => `${pair.a}/${pair.b} 并存，当前偏向 ${pair.winner}`).join('；')}。可表现为嘴硬与关心并存，但不要戏剧化。`);
  return lines.join('\n');
}
