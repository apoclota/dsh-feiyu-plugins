window.__ModuleLoader__.load({
  id: 'dsh-fish-growth',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;
    const API = '/dsh-fish-growth';
    const get = async path => { const response = await fetch(API + path, { headers: { accept: 'application/json' } }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); };
    const post = async body => { const response = await fetch(API + '/config', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const result = await response.json(); if (!result?.ok) throw new Error(result?.error || '保存失败'); return result; };
    const styles = `
[data-fg]{display:flex;flex-direction:column;gap:16px;padding:4px 0 24px;color:inherit}
[data-fg-row]{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
[data-fg-grow]{flex:1;min-width:200px}
[data-fg-title]{font-weight:600;font-size:14px}
[data-fg-note]{font-size:12px;opacity:.68;line-height:1.5}
[data-fg-panel]{display:flex;flex-direction:column;gap:10px;padding:12px;border:1px solid rgba(127,127,127,.2);border-radius:6px}
[data-fg-sessions]{display:flex;flex-direction:column;gap:4px;max-height:320px;overflow:auto}
[data-fg-session]{display:flex;align-items:flex-start;gap:9px;padding:7px 4px;border-bottom:1px solid rgba(127,127,127,.12)}
[data-fg-id]{font-size:11px;opacity:.58;overflow-wrap:anywhere}
[data-fg-input]{width:110px;padding:6px 8px;border:1px solid rgba(127,127,127,.35);border-radius:5px;background:transparent;color:inherit}
[data-fg-btn]{padding:6px 12px;border:1px solid rgba(127,127,127,.35);border-radius:5px;background:transparent;color:inherit;cursor:pointer}
[data-fg-btn]:disabled{opacity:.5;cursor:default}
[data-fg-check]{width:16px;height:16px;margin-top:2px}
`;
    function NumberSetting({ config, save, busy, field, label, min, max, step = 1 }) {
      const [value, setValue] = React.useState(String(config[field]));
      React.useEffect(() => setValue(String(config[field])), [config[field]]);
      return h('label', { 'data-fg-row': '', key: field },
        h('span', { 'data-fg-grow': '' }, h('span', { 'data-fg-title': '' }, label)),
        h('input', { 'data-fg-input': '', type: 'number', min, max, step, value, disabled: busy,
          onChange: e => setValue(e.target.value),
          onBlur: () => save({ [field]: Math.max(min, Math.min(max, Number(value) || min)) }) }));
    }
    function Panel() {
      const [config, setConfig] = React.useState(null);
      const [state, setState] = React.useState(null);
      const [sessions, setSessions] = React.useState([]);
      const [showAll, setShowAll] = React.useState(false);
      const [busy, setBusy] = React.useState(false);
      const [message, setMessage] = React.useState('');
      const [error, setError] = React.useState('');
      const load = React.useCallback(async () => {
        try {
          const [c, s] = await Promise.all([get('/config'), get('/sessions')]);
          setConfig(c.config); setState({ ...(c.state || {}), mood: c.mood }); setSessions(s.sessions || []); setError('');
        } catch (e) { setError(`加载设置失败：${e.message}`); }
      }, []);
      React.useEffect(() => { load(); }, [load]);
      const save = async patch => {
        setBusy(true); setMessage('');
        try { const result = await post(patch); setConfig(result.config); setState({ ...(result.state || {}), mood: result.mood }); setMessage('已保存'); setError(''); }
        catch (e) { setMessage(`保存失败：${e.message}`); }
        finally { setBusy(false); }
      };
      if (!config) return h('div', { 'data-fg': '' }, error || '正在读取…');
      const visibleSessions = (showAll ? sessions : sessions.filter(session => !session.isSubagent && (session.isRoot || !sessions.some(item => item.isRoot))));
      const selected = new Set(config.selectedSessions || []);
      return h('div', { 'data-fg': '' },
        h('style', null, styles),
        h('div', { 'data-fg-panel': '' },
          h('label', { 'data-fg-row': '' }, h('input', { 'data-fg-check': '', type: 'checkbox', checked: config.enabled !== false, disabled: busy, onChange: e => save({ enabled: e.target.checked }) }), h('span', { 'data-fg-title': '' }, '启用鱼的心情与成长')),
          h('div', { 'data-fg-row': '' }, h('strong', { 'data-fg-title': '' }, `当前心情 ${state?.mood?.score ?? '—'}/100 · ${state?.mood?.label || '读取中'}`), h('span', { 'data-fg-note': '' }, `判定 ${state?.counters?.judged ?? 0} 次 · 跳过 ${state?.counters?.skipped ?? 0} 次`)),
          h('label', { 'data-fg-row': '' }, h('span', { 'data-fg-title': '' }, '心情注入模式'), h('select', { 'data-fg-input': '', value: config.injectionMode || 'full', disabled: busy, onChange: e => save({ injectionMode: e.target.value }) }, h('option', { value: 'full' }, '完整成长摘要'), h('option', { value: 'summary' }, '简短心情摘要'), h('option', { value: 'off' }, '只记录，不注入'))),
          h('div', { 'data-fg-title': '' }, '最近状态记录'),
          h('div', { 'data-fg-sessions': '' }, (state?.journal || []).slice(-10).reverse().map((row, index) => h('div', { 'data-fg-session': '', key: `${row.at}-${index}` }, h('span', { 'data-fg-id': '' }, new Date(row.at).toLocaleString()), h('span', { 'data-fg-grow': '' }, row.event || row.type || '状态变化'))))),
        h('div', { 'data-fg-panel': '' },
          h('div', { 'data-fg-title': '' }, '参与成长的会话'),
          h('div', { 'data-fg-note': '' }, '只有勾选的活跃会话会注入成长状态，并将对话文本送去异步情绪判断。默认不选任何会话；工作会话请保持未选。'),
          h('label', { 'data-fg-row': '' }, h('input', { 'data-fg-check': '', type: 'checkbox', checked: showAll, onChange: e => setShowAll(e.target.checked) }), h('span', null, '显示全部会话（包括子代理/非根会话）')),
          h('div', { 'data-fg-sessions': '' }, visibleSessions.length ? visibleSessions.map(session => h('label', { 'data-fg-session': '', key: session.id },
            h('input', { 'data-fg-check': '', type: 'checkbox', checked: selected.has(session.id), disabled: busy,
              onChange: e => { const next = new Set(selected); if (e.target.checked) next.add(session.id); else next.delete(session.id); save({ selectedSessions: [...next] }); } }),
            h('span', { 'data-fg-grow': '' }, h('span', { 'data-fg-title': '' }, session.title || '未命名会话'), h('br'), h('span', { 'data-fg-id': '' }, session.id), session.workspace ? h('div', { 'data-fg-note': '' }, `工作区：${session.workspace}`) : null))) : h('div', { 'data-fg-note': '' }, '没有可选的活跃会话。先打开目标会话，再刷新此页面。')),
          h('div', { 'data-fg-row': '' }, h('button', { 'data-fg-btn': '', disabled: busy, onClick: load }, '刷新会话清单'), h('span', { 'data-fg-note': '' }, '当前只列出活跃会话；休眠会话暂不显示。'))),
        h('div', { 'data-fg-panel': '' },
          h('div', { 'data-fg-title': '' }, '情绪与成长参数'),
          h('div', { 'data-fg-note': '' }, '数值会即时生效并保存在本机。情绪影响强度只调节变化幅度与表达阈值，不改变固定德行。细分情绪包含吃醋、思念、欲望和俏皮使坏；只作轻微、含蓄表达，不会导向控制或胁迫。'),
          h(NumberSetting, { config, save, busy, field: 'emotionInfluencePercent', label: '情绪影响强度（%）', min: 0, max: 200 }),
          h(NumberSetting, { config, save, busy, field: 'traitEvidenceTurns', label: '性格提案所需观察轮数', min: 2, max: 20 }),
          h(NumberSetting, { config, save, busy, field: 'emotionHalfLifeHours', label: '情绪半衰期（小时）', min: 0.25, max: 168, step: 0.25 }),
          h(NumberSetting, { config, save, busy, field: 'ruminationHalfLifeHours', label: '反刍半衰期（小时）', min: 0.25, max: 720, step: 0.25 }),
          h(NumberSetting, { config, save, busy, field: 'minConfidence', label: '最低判定置信度', min: 0, max: 100 }),
          h('div', { 'data-fg-row': '' }, h('button', { 'data-fg-btn': '', disabled: busy, onClick: () => save({ emotionInfluencePercent: 100, traitEvidenceTurns: 4, emotionHalfLifeHours: 8, ruminationHalfLifeHours: 18, minConfidence: 65 }) }, '恢复推荐值'), h('span', { 'data-fg-note': '' }, message || error))));
    }
    return {
      inject: ['slots'], 
      apply(ctx) {
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section', id: 'dsh-fish-growth', order: 72, label: '鱼的成长', component: Panel,
        }));
      },
    };
  },
});
