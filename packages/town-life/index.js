import { dashboardUrl, startDashboard } from './lib/dashboard.mjs'
import { npcGift, DEFAULT_FILE, status, event, act, enter, travel, buy, decorate, work, weather, npcTalk, eventSuggestion } from './lib/state.mjs'
import { loadHostDeps } from './lib/hostdeps.mjs'
import fs from 'node:fs'
import path from 'node:path'

const SETTINGS_FILE = path.join(path.dirname(DEFAULT_FILE), 'town-life.settings.json')
function readSavedSettings() {
  try {
    const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch { return {} }
}
function writeSavedSettings(patch) {
  try {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true })
    const merged = { ...readSavedSettings(), ...patch }
    const temp = `${SETTINGS_FILE}.${process.pid}.tmp`
    fs.writeFileSync(temp, JSON.stringify(merged, null, 2) + '\n')
    fs.renameSync(temp, SETTINGS_FILE)
    return true
  } catch (error) { console.error('橡溪镇设置保存失败', error && error.message); return false }
}

const { z } = await loadHostDeps()
const TOWN_OUTPUT = { schema: { type: 'object', additionalProperties: true }, render: (_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] }
const defineTool = spec => ({ ...spec, output: spec.output || TOWN_OUTPUT })

export const inject = ['tools']
let activeConfig = {}
function summary() {
  try {
    const { state } = status(activeConfig)
    return [state.location?.name, state.lastAction?.text || state.currentPhase, '精力 ' + state.energy].filter(Boolean).join(' · ')
  } catch { return '暂时无法读取小镇存档' }
}
function settingsSchema() {
  const overview = z.string().disabled().description('小渊近况').extra('volatile', true)
  Object.defineProperty(overview.meta, 'default', { enumerable: true, get: summary })
  Object.defineProperty(overview.meta, 'description', { enumerable: true, get: () => '小渊近况 · ' + summary() })
  const currentLocation = z.string().disabled().description('当前位置').extra('volatile', true)
  Object.defineProperty(currentLocation.meta, 'default', { enumerable: true, get: () => { try { return status(activeConfig).state.location?.name || '未进入地点' } catch { return '未进入地点' } } })
  const coinBalance = z.number().disabled().description('当前小镇币').extra('volatile', true)
  Object.defineProperty(coinBalance.meta, 'default', { enumerable: true, get: () => { try { return Number(status(activeConfig).state.wallet?.balance ?? 0) } catch { return 0 } } })
  const npcSummary = z.string().disabled().description('NPC 状态与关系').extra('volatile', true)
  Object.defineProperty(npcSummary.meta, 'default', { enumerable: true, get: () => { try { const s = status(activeConfig).state; return (s.npcs || []).map(n => `${n.name}：${n.activity || '活动中'}，关系 ${s.relationships?.[n.id]?.score || 0}`).join('；') } catch { return '暂时无法读取 NPC' } } })
  const townSummary = z.string().disabled().description('小镇规模与设施').extra('volatile', true)
  Object.defineProperty(townSummary.meta, 'default', { enumerable: true, get: () => { try { const s = status(activeConfig).state; return `${s.locations?.length || 0} 个地点 · ${(s.shops || []).length} 家商店 · ${(s.inventory || []).length} 件物品` } catch { return '暂时无法读取小镇' } } })
  return z.object({
    overview,
    currentLocation,
    coinBalance,
    npcSummary,
    townSummary,
    dashboard: z.string().default(dashboardUrl).link(dashboardUrl).description('打开橡溪镇详细地图；地图会显示小渊位置、地点、商店和生活操作。').disabled().extra('volatile', true),
    stateFile: z.string().default(DEFAULT_FILE).description('共享生活线 JSON 文件路径；网页地图和小渊对话读取同一份状态。').extra('volatile', true),
    enabled: z.boolean().default(true).description('启用橡溪镇生活线工具、地图和对话共享状态。').extra('volatile', true),
    eventMode: z.string().default('daily').description('事件模式：daily=每日事件，偶然=同日偶然事件，surprise=突发事件。').extra('volatile', true),
    allowFreeActions: z.boolean().default(true).description('允许记录主人或小渊选择的自由行动。').extra('volatile', true),
    weatherCity: z.string().default('成都').description('城市级天气位置；当前默认成都，不需要精确住址。').extra('volatile', true),
     homeName: z.string().default('月镜湖·芦苇湾').description('小鱼当前居住的家名称，可在设置中修改。').extra('volatile', true),
     avatarImageUrl: z.string().default('').description('小鱼自定义头像图片地址；留空使用内置 Q 版大肥鱼。').extra('volatile', true),
     townScale: z.string().default('expanded').description('小镇规模：compact=基础六地点，expanded=完整生活设施。').extra('volatile', true),
     showNpcDetails: z.boolean().default(true).description('在地图和状态中显示 NPC 的位置、职业、活动和关系。').extra('volatile', true),
     startingCoins: z.number().min(0).default(320).description('仅在存档没有余额时使用的初始小镇币；之后通过工作和交易变化。').extra('volatile', true),
     mapTheme: z.string().default('oakbrook').description('地图主题：oakbrook=橡溪镇。').extra('volatile', true),
      showDecorDetails: z.boolean().default(true).description('在地图详情中显示家具的房间、坐标和旋转角度。').extra('volatile', true),
      mapRefreshSeconds: z.number().min(1).max(60).default(2).description('地图实时状态刷新间隔，单位为秒。').extra('volatile', true),
      defaultDecorRoom: z.string().default('小书桌与日记本').description('从库存布置家具时使用的默认房间区域。').extra('volatile', true)
  })
}
const SETTINGS_KEYS = ['enabled', 'stateFile', 'eventMode', 'allowFreeActions', 'weatherCity', 'homeName', 'avatarImageUrl', 'townScale', 'showNpcDetails', 'startingCoins', 'mapTheme', 'showDecorDetails', 'mapRefreshSeconds', 'defaultDecorRoom']
const SETTINGS_DEFAULTS = { enabled: true, stateFile: DEFAULT_FILE, eventMode: 'daily', allowFreeActions: true, weatherCity: '成都', homeName: '月镜湖·芦苇湾', avatarImageUrl: '', townScale: 'expanded', showNpcDetails: true, startingCoins: 320, mapTheme: 'oakbrook', showDecorDetails: true, mapRefreshSeconds: 2, defaultDecorRoom: '小书桌与日记本' }
const plainValue = value => (value && typeof value === 'object' && typeof value.get === 'function') ? value.get() : value
const plainConfig = () => {
  const source = plainValue(activeConfig) || {}
  const out = {}
  for (const key of Object.keys(source)) out[key] = plainValue(source[key])
  return out
}
function configView() {
  const current = plainConfig()
  const out = {}
  for (const key of SETTINGS_KEYS) out[key] = current[key] ?? SETTINGS_DEFAULTS[key]
  out.dashboard = dashboardUrl
  return out
}
function townSnapshot() {
  try {
    const s = status(plainConfig()).state
    return { location: s.location?.name || '未进入地点', phase: s.currentPhase || '', coins: Number(s.wallet?.balance ?? s.coins ?? 0), energy: Number(s.energy ?? 0), mood: Number(s.mood ?? 0), locations: (s.locations || []).length, shops: (s.shops || []).length, npcs: (s.npcs || []).length, updatedAt: s.updatedAt || '' }
  } catch (error) { return { error: error.message } }
}
function registerSettingsRoutes(ctx) {
  const readBody = req => new Promise(resolve => { let body = ''; req.on('data', chunk => { body += chunk; if (body.length > 65536) body = body.slice(0, 65536) }); req.on('end', () => { try { resolve(JSON.parse(body || '{}')) } catch { resolve({}) } }); req.on('error', () => resolve({})) })
  const sendJson = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)) }
  const authorized = async (req, res, handler) => {
    try { const connection = ctx.get?.('connection'); const rejected = connection?.requestRejection?.(req); if (rejected === 401 || rejected === 403) return sendJson(res, rejected, { ok: false, error: rejected === 401 ? 'authentication_required' : 'management_forbidden' }) } catch {}
    return handler(req, res)
  }
  const handler = (req, res) => authorized(req, res, async () => {
    if (req.method === 'POST') {
      const patch = await readBody(req)
      const next = {}
      for (const key of SETTINGS_KEYS) if (Object.prototype.hasOwnProperty.call(patch, key)) next[key] = patch[key]
      try {
        writeSavedSettings(next)
        activeConfig = { ...activeConfig, ...next }
        try {
          const entry = ctx.fiber?.entry
          const editor = ctx.get?.('configEditor')
          if (entry && editor) await editor.edit(entry, current => ({ ...(current || {}), ...next }))
        } catch (error) { if (!/root Include entry/.test(String(error && error.message))) console.error('橡溪镇配置写入 profile 失败', error && error.message) }
        return sendJson(res, 200, { ok: true, config: configView(), state: townSnapshot() })
      } catch (error) { return sendJson(res, 400, { ok: false, error: error.message }) }
    }
    return sendJson(res, 200, { ok: true, config: configView(), state: townSnapshot() })
  })
  const registerRoutes = webCtx => webCtx.effect(() => webCtx.webServer.register({ kind: 'exact', path: '/town-life/settings', handler }))
  if (typeof ctx.inject === 'function') ctx.inject(['webServer'], registerRoutes)
  else if (ctx.webServer?.register) registerRoutes(ctx)
}
export const Config = z ? settingsSchema() : undefined
export function apply(ctx, config = {}) {
  activeConfig = { ...(config || {}), ...readSavedSettings() }
  if (config.enabled === false) return () => {}
  let stopDashboard = () => {}
  try { stopDashboard = startDashboard(config) } catch (error) { console.error('橡溪镇地图启动失败（不影响插件本身）', error && error.message) }
  const off = [stopDashboard]
  const reg = (spec, execute) => off.push(ctx.tools.register(defineTool({ ...spec, execute })))
  reg({ name: 'town_life_status', description: '读取橡溪镇小鱼当前生活阶段、心情、任务和最近事件。只读。', parameters: { type: 'object', properties: {}, additionalProperties: false } }, async () => status(config))
  reg({ name: 'town_life_event', description: '推进一次生活线事件；daily 按当天选择每日或偶然事件，surprise 选择突发事件。', parameters: { type: 'object', properties: { kind: { type: 'string', enum: ['daily', 'surprise'], default: 'daily' } }, additionalProperties: false } }, async ({ kind = 'daily' }) => event(config, kind === 'surprise' ? 'surprise' : 'tick'))
  reg({ name: 'town_life_act', description: '记录主人或小渊选择的自由行动，并结束当前事件。', parameters: { type: 'object', required: ['action'], properties: { action: { type: 'string', minLength: 1, maxLength: 200 } }, additionalProperties: false } }, async ({ action }) => act(config, action))
  reg({ name: 'town_life_enter', description: '进入或入住小镇地点；进入水边小屋后可布置、休息和工作。', parameters: { type: 'object', required: ['locationId'], properties: { locationId: { type: 'string' } }, additionalProperties: false } }, async ({ locationId }) => enter(config, locationId))
  reg({ name: 'town_life_travel', description: '在小镇地点之间移动；walk 会按现实步行耗时推进，transit 使用交通耗时。', parameters: { type: 'object', required: ['locationId'], properties: { locationId: { type: 'string' }, mode: { type: 'string', enum: ['walk', 'transit'], default: 'walk' } }, additionalProperties: false } }, async ({ locationId, mode = 'walk' }) => travel(config, locationId, mode))
  reg({ name: 'town_life_shop', description: '在现实对应的小镇商店购买物品，自动扣除小镇币并写入库存。', parameters: { type: 'object', required: ['shopId', 'itemId'], properties: { shopId: { type: 'string' }, itemId: { type: 'string' }, quantity: { type: 'integer', minimum: 1, maximum: 10, default: 1 } }, additionalProperties: false } }, async ({ shopId, itemId, quantity = 1 }) => buy(config, shopId, itemId, quantity))
  reg({ name: 'town_life_decorate', description: '把已购买物品布置进月镜湖芦苇湾水边小屋并持久化房屋状态。', parameters: { type: 'object', required: ['itemId'], properties: { itemId: { type: 'string' } }, additionalProperties: false } }, async ({ itemId }) => decorate(config, itemId))
  reg({ name: 'town_life_work', description: '在小镇做一份安全的生活工作，获得小镇币并消耗精力。', parameters: { type: 'object', properties: { jobId: { type: 'string', enum: ['lake-helper', 'shop-helper', 'diary-copyist'], default: 'lake-helper' } }, additionalProperties: false } }, async ({ jobId = 'lake-helper' }) => work(config, jobId))
  reg({ name: 'town_life_npc_talk', description: '与当前小镇 NPC 互动并记录关系变化。', parameters: { type: 'object', required: ['npcId'], properties: { npcId: { type: 'string' }, text: { type: 'string', maxLength: 200 } }, additionalProperties: false } }, async ({ npcId, text = '' }) => npcTalk(config, npcId, text))
  reg({ name: 'town_life_npc_gift', description: '把背包里的一件东西送给小镇居民，按喜好提升好感度并返回对方反应。', parameters: { type: 'object', required: ['npcId', 'itemId'], properties: { npcId: { type: 'string' }, itemId: { type: 'string' } }, additionalProperties: false } }, async ({ npcId, itemId }) => npcGift(config, npcId, itemId))
  reg({ name: 'town_life_event_suggestion', description: '根据现实时间、天气和地点给出一条正在流动的生活事件建议。', parameters: { type: 'object', properties: {}, additionalProperties: false } }, async () => eventSuggestion(config))
  reg({ name: 'town_life_weather', description: '读取成都城市级天气状态；未接入真实天气服务时会明确标注占位。', parameters: { type: 'object', properties: {}, additionalProperties: false } }, async () => weather(config))
  try { registerSettingsRoutes(ctx) } catch (error) { console.error('橡溪镇设置接口注册失败（不影响插件本身）', error && error.message) }
  return () => off.forEach(fn => { try { fn?.() } catch {} })
}
