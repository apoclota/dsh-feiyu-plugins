import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const DEFAULT_FILE = process.env.DSH_TOWN_LIFE_FILE || path.join(process.env.DSH_HOME || path.join(os.homedir(), '.dsh'), 'town-life.json')
const EXTENDED_LOCATIONS = [
  { id: 'oakbrook-pharmacy', name: '橡溪药房', kind: 'service', walkMinutes: 11, transitMinutes: 4, description: '常用药品、护理用品和健康咨询。' },
  { id: 'oakbrook-bakery', name: '麦穗面包房', kind: 'bakery', walkMinutes: 9, transitMinutes: 3, description: '刚出炉的面包、点心和咖啡。' },
  { id: 'oakbrook-hardware', name: '榫卯五金铺', kind: 'hardware', walkMinutes: 14, transitMinutes: 5, description: '修缮工具、灯具、五金和木屋材料。' },
  { id: 'oakbrook-clothing', name: '云杉衣铺', kind: 'clothing', walkMinutes: 13, transitMinutes: 5, description: '换季衣物、鞋帽和布艺小物。' },
  { id: 'oakbrook-flower', name: '湖畔花店', kind: 'flower', walkMinutes: 7, transitMinutes: 3, description: '鲜花、盆栽、种子和花瓶。' },
  { id: 'oakbrook-library', name: '橡溪图书馆', kind: 'library', walkMinutes: 16, transitMinutes: 6, description: '借书、安静阅读和小镇公告。' },
  { id: 'oakbrook-workshop', name: '木匠工作室', kind: 'workshop', walkMinutes: 18, transitMinutes: 7, description: '定制家具、修理用品和房屋升级。' },
  { id: 'oakbrook-post', name: '邮局与包裹站', kind: 'post', walkMinutes: 10, transitMinutes: 4, description: '寄信、取包裹和购买邮票。' }
]
const EXTENDED_SHOPS = [
  { id: 'oakbrook-pharmacy', name: '橡溪药房', items: [{ id: 'first-aid', name: '急救包', price: 28, energy: 8 }, { id: 'vitamin', name: '维生素', price: 12, energy: 3 }] },
  { id: 'oakbrook-bakery', name: '麦穗面包房', items: [{ id: 'bread', name: '乡村面包', price: 10, energy: 8 }, { id: 'coffee', name: '热咖啡', price: 9, energy: 5, mood: 3 }, { id: 'cake', name: '奶油蛋糕', price: 22, mood: 12 }] },
  { id: 'oakbrook-hardware', name: '榫卯五金铺', items: [{ id: 'paint', name: '木屋油漆', price: 32, mood: 5, decor: true }, { id: 'toolbox', name: '工具箱', price: 45, mood: 6, decor: true }, { id: 'shelf', name: '橡木壁架', price: 58, mood: 10, decor: true }] },
  { id: 'oakbrook-clothing', name: '云杉衣铺', items: [{ id: 'raincoat', name: '雨衣', price: 36, mood: 5, decor: true }, { id: 'scarf', name: '湖蓝围巾', price: 24, mood: 6, decor: true }] },
  { id: 'oakbrook-flower', name: '湖畔花店', items: [{ id: 'seed-pack', name: '花种子', price: 14, mood: 5, decor: true }, { id: 'potted-fern', name: '蕨类盆栽', price: 30, mood: 9, decor: true }, { id: 'vase', name: '手绘花瓶', price: 38, mood: 8, decor: true }] },
  { id: 'oakbrook-library', name: '橡溪图书馆', items: [{ id: 'travel-book', name: '湖区旅行书', price: 20, mood: 7 }, { id: 'recipe-book', name: '家常菜谱', price: 18, mood: 6 }] },
  { id: 'oakbrook-workshop', name: '木匠工作室', items: [{ id: 'bench', name: '窗边长凳', price: 90, mood: 14, decor: true }, { id: 'lamp', name: '黄铜台灯', price: 75, mood: 12, decor: true }] },
  { id: 'oakbrook-post', name: '邮局与包裹站', items: [{ id: 'postcard', name: '湖景明信片', price: 6, mood: 3 }, { id: 'stamp-book', name: '纪念邮票册', price: 26, mood: 7, decor: true }] }
]
const EXTENDED_EVENTS = {
  daily: [{ id: 'market-day', when: '上午', text: '集市车停在广场边，面包师和花店都摆出了今日新货。', actions: ['去集市看看', '留在家里列购物清单'] }, { id: 'parcel-day', when: '下午', text: '邮局送来一只没有署名的小包裹，里面有一张旧地图。', actions: ['去邮局取包裹', '先问问邻居'] }],
  偶然: [{ id: 'power-flicker', text: '商业街的灯闪了几下，木匠说今晚可能需要提前关门。', actions: ['去买一盏台灯', '回家检查电路'] }, { id: 'flower-delivery', text: '花店收到一批来自湖对岸的蓝色小花，玛尔塔请你帮忙挑选。', actions: ['去花店看看', '请她送一束到家'] }],
  突发: [{ id: 'town-rain', text: '湖区突然下起大雨，交通站发布了短时延误通知。', actions: ['去交通站查看', '留在室内煮茶'] }, { id: 'lost-wallet', text: '图书馆门口发现一个旧钱包，失主可能就在附近。', actions: ['交给邮局', '在公告栏寻找失主'] }]
}
const DEFAULT_EVENTS = {
  daily: [
    { id: 'morning-light', when: '清晨', text: '小渊去湖边收一小瓶晨光，回来擦亮窗台的玻璃浮片。', actions: ['陪她去湖边', '留在屋里整理桌面'] },
    { id: 'noon-lunch', when: '午后', text: '芬恩在码头晒渔网，顺手给小渊留了一碗热汤。', actions: ['去码头喝汤', '把热汤带回小屋'] },
    { id: 'night-diary', when: '夜里', text: '小渊点亮贝壳灯，在小书桌前写今天最想留下的一件小事。', actions: ['问她今天写了什么', '让她先安静写完'] },
  ],
  偶然: [
    { id: 'blue-button', text: '风把玛尔塔送的蓝色纽扣吹到了芦苇丛边。', actions: ['去找纽扣', '先把门窗关好'] },
    { id: 'lost-bird', text: '一只迷路的小鸟落在屋檐上，叼着半根细草。', actions: ['给它放水', '看看它要飞去哪'] },
    { id: 'tea-invite', text: '玛尔塔忽然敲门，说她带了新烤的莓果饼。', actions: ['请她进屋喝茶', '带饼去湖边分享'] },
  ],
  突发: [
    { id: 'lake-ripple', text: '月镜湖突然起了一圈不合时宜的涟漪，像有什么东西在水下翻身。', actions: ['去码头看看', '先观察，不贸然靠近'] },
    { id: 'lamp-out', text: '贝壳灯忽然熄了，屋里只剩窗外的月光。', actions: ['检查灯芯', '摸黑坐一会'] },
    { id: 'storm-note', text: '远处传来闷雷，芬恩托人送来一张纸条：今晚别靠近湖心。', actions: ['把门窗关好', '去提醒邻居'] },
  ],
}
const fileOf = config => { const value = config?.stateFile; if (typeof value === 'string' && value.trim() && value !== '[object Object]') return value; return DEFAULT_FILE }
const readState = file => JSON.parse(fs.readFileSync(file, 'utf8'))
function writeState(file, state) {
  const tmp = file + '.' + process.pid + '.tmp'
  try {
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + '\n', 'utf8')
    fs.renameSync(tmp, file)
  } finally { fs.rmSync(tmp, { force: true }) }
}
const choose = list => list[Math.floor(Math.random() * list.length)]
const INTERIORS = {
  'oakbrook-pharmacy': { title: '橡溪药房内', rooms: ['药品柜', '护理用品架', '咨询台'], detail: '药师在柜台后整理药盒，墙上贴着健康提醒。' },
  'oakbrook-bakery': { title: '麦穗面包房内', rooms: ['出炉面包架', '咖啡台', '后厨烤炉'], detail: '空气里有麦香，玻璃柜里摆着今天的点心。' },
  'oakbrook-hardware': { title: '榫卯五金铺内', rooms: ['工具墙', '木料架', '配色台'], detail: '墙上挂满工具，角落堆着适合木屋修缮的材料。' },
  'oakbrook-clothing': { title: '云杉衣铺内', rooms: ['试衣镜', '布料架', '鞋帽柜'], detail: '店里挂着湖蓝色布艺，试衣镜旁有一盏暖灯。' },
  'oakbrook-flower': { title: '湖畔花店内', rooms: ['鲜花桶', '种子抽屉', '花瓶展示台'], detail: '门口的风铃轻响，花香从湖边一路飘进来。' },
  'oakbrook-library': { title: '橡溪图书馆内', rooms: ['借阅台', '窗边书桌', '小镇档案柜'], detail: '镇民把旧地图和故事放在档案柜里，供大家查阅。' },
  'oakbrook-workshop': { title: '木匠工作室内', rooms: ['木工台', '家具样品间', '修理角'], detail: '木屑和松木香混在一起，师傅正在打磨窗边长凳。' },
  'oakbrook-post': { title: '邮局与包裹站内', rooms: ['邮务柜台', '包裹架', '公告栏'], detail: '公告栏上贴着失物招领和小镇近期活动。' },
  'fish-home': { title: '芦苇湾木屋', rooms: ['小书桌与日记本', '贝壳灯和灯芯架', '收藏瓶与窗边花盆'], detail: '木屋里有一张靠窗书桌，夜里可以听见湖水。' },
  'oakbrook-restaurant': { title: '橡溪餐厅内', rooms: ['靠窗热汤桌', '木质吧台', '后厨灶台'], detail: '厨房和用餐区相连，能看见热汤冒出的白气。' },
  'oakbrook-market': { title: '橡溪杂货店内', rooms: ['零食货架', '灯芯与文具柜', '门口花箱'], detail: '窄窄的木货架排成两列，收银台旁挂着手绘价签。' },
  'oakbrook-station': { title: '橡溪交通站内', rooms: ['候车长椅', '时刻表墙', '小型售票窗'], detail: '候车厅有暖黄色顶灯，墙上贴着短途接驳线路。' },
  'moonlake-park': { title: '月镜湖公园内', rooms: ['湖岸长椅', '木栈道观景台', '小亭与鸟食台'], detail: '公园没有封闭房屋，但有可避雨的小亭和湖岸室内式休息角。' },
  'lucky-star': { title: '幸运星彩票店内', rooms: ['公告与号码墙', '木质柜台', '手绘海报橱窗'], detail: '柜台后是号码墙，窗边摆着镇民画的幸运星海报。' }
}
const withInterior = state => ({ ...state, locations: (state.locations || []).map(p => ({ ...p, interior: p.interior || INTERIORS[p.id] || { title: p.name + '内', rooms: ['休息区', '操作台', '展示角'], detail: '这里有一个可以停留和互动的室内场景。' } })) })
function ensureTown(state) {
  state.locations = Array.isArray(state.locations) ? state.locations : []
  for (const place of EXTENDED_LOCATIONS) if (!state.locations.some(x => x.id === place.id)) state.locations.push(place)
  state.shops = Array.isArray(state.shops) ? state.shops : []
  for (const shop of EXTENDED_SHOPS) if (!state.shops.some(x => x.id === shop.id)) state.shops.push(shop)
  state.events = state.events || {}
  for (const key of ['daily', '偶然', '突发']) state.events[key] = [...(state.events[key] || []), ...(EXTENDED_EVENTS[key] || [])].filter((item, index, list) => list.findIndex(x => x.id === item.id) === index)
  state.homeDecor = Array.isArray(state.homeDecor) ? state.homeDecor : []
  state.inventory = Array.isArray(state.inventory) ? state.inventory : []
  state.relationships = state.relationships || {}
  const residents = [
    { id: 'finn', name: '芬恩', role: '码头渔夫', routine: '白天在码头，夜里回家' },
    { id: 'marta', name: '玛尔塔', role: '邻居烘焙师', routine: '午后在餐厅或自家厨房' },
    { id: 'lina', name: '莉娜', role: '药房药师', routine: '白天在药房，傍晚去图书馆' },
    { id: 'cedar', name: '塞德', role: '木匠师傅', routine: '白天在木匠工作室，周末去集市' },
    { id: 'noah', name: '诺亚', role: '邮差', routine: '上午在邮局，下午骑车送信' },
    { id: 'rue', name: '露伊', role: '图书管理员', routine: '白天在图书馆，午后在公园读书' }
  ]
  state.npcs = Array.isArray(state.npcs) ? state.npcs : []
  for (const resident of residents) if (!state.npcs.some(x => x.id === resident.id)) state.npcs.push(resident)
  state.wallet = state.wallet || { currency: 'CNY', label: '小镇币', balance: Number(state.coins || 0), dailyAllowance: 80 }
  state.coins = Number(state.wallet.balance ?? state.coins ?? 0)
  return state
}
const readTown = file => ensureTown(readState(file))
const phase = state => { const h = new Date().getHours(); const r = Array.isArray(state.routine) ? state.routine : []; return h < 6 ? '安静睡觉' : h < 10 ? r[0] : h < 13 ? r[1] : h < 17 ? r[2] : h < 21 ? r[3] : r[4] }
function status(config) { const state = withInterior(readTown(fileOf(config))); if (config?.startingCoins != null && !state.wallet?.balance && !state.coins) { state.wallet = { ...(state.wallet || {}), balance: Number(config.startingCoins) || 0 }; state.coins = state.wallet.balance } const now = new Date(); const trip = state.travel?.inProgress; if (trip) { const started = Date.parse(trip.startedAt); const eta = Date.parse(trip.eta); const duration = Math.max(1, eta - started); const elapsed = Math.max(0, now.getTime() - started); trip.progress = Math.max(0, Math.min(1, elapsed / duration)); if (now.getTime() >= eta) { const destination = state.locations.find(x => x.id === trip.to); if (destination) state.location = { ...destination, mode: trip.mode }; state.travel = { ...state.travel, inProgress: null, progress: 1, arrivedAt: now.toISOString() }; state.energy = Math.max(0, Number(state.energy || 0) - Math.ceil(Number(trip.minutes || 0) / 15)); state.updatedAt = now.toISOString(); writeState(fileOf(config), state) } } const hour = now.getHours(); const minute = String(now.getMinutes()).padStart(2, '0'); const rain = /雨|雷/.test(String(state.weather?.condition || '')); const npcs = Array.isArray(state.npcs) ? state.npcs : [{ id: 'finn', name: '芬恩', role: '码头渔夫', routine: '白天在码头，夜里回家' }, { id: 'marta', name: '玛尔塔', role: '邻居烘焙师', routine: '午后在餐厅或自家厨房' }]; const movingNpcs = npcs.map(n => { const schedule = { finn: [hour >= 7 && hour < 19 && !rain ? 'moonlake-park' : 'fish-home', rain ? '在屋檐下收渔具' : '整理湖边渔具'], marta: [hour >= 11 && hour < 18 ? 'oakbrook-restaurant' : 'oakbrook-market', hour >= 11 && hour < 18 ? '在餐厅准备莓果饼' : '采购烘焙材料'], lina: [hour < 17 ? 'oakbrook-pharmacy' : 'oakbrook-library', hour < 17 ? '整理药品并提供咨询' : '整理健康读物'], cedar: [hour < 18 ? 'oakbrook-workshop' : 'oakbrook-hardware', hour < 18 ? '打磨一件窗边家具' : '挑选木料和五金'], noah: [hour < 13 ? 'oakbrook-post' : 'oakbrook-station', hour < 13 ? '分拣镇民包裹' : '查看短途线路'], rue: [hour < 16 ? 'oakbrook-library' : 'moonlake-park', hour < 16 ? '整理小镇档案' : '在公园窗边阅读'] }; const [locationId, activity] = schedule[n.id] || ['oakbrook-market', '在商业街活动']; return { ...n, locationId, activity } }); const openHours = { 'oakbrook-restaurant': hour >= 8 && hour < 22, 'oakbrook-market': hour >= 9 && hour < 20, 'oakbrook-station': true, 'lucky-star': hour >= 9 && hour < 21, 'moonlake-park': hour >= 5 && hour < 23, 'fish-home': true }; for (const place of state.locations || []) if (!(place.id in openHours)) openHours[place.id] = place.kind === 'library' ? hour >= 9 && hour < 20 : place.kind === 'post' ? hour >= 8 && hour < 19 : hour >= 9 && hour < 21; return { ok: true, mode: 'status', state: { ...state, realTime: { iso: now.toISOString(), local: `${hour}:${minute}`, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }, npcs: movingNpcs, openHours, weatherEffect: rain ? '雨天：户外活动减少，NPC更常待在室内。' : '适合户外活动。', currentPhase: phase(state) } } }
function event(config, mode) { const file = fileOf(config); const state = readTown(file); const today = new Date().toISOString().slice(0, 10); const prior = state.lastEvent && String(state.lastEvent.at || '').slice(0, 10); const key = mode === 'surprise' ? '突发' : prior === today ? '偶然' : 'daily'; const picked = choose(state.events?.[key]?.length ? state.events[key] : DEFAULT_EVENTS[key]); state.lastEvent = { ...picked, mode: key, at: new Date().toISOString() }; state.updatedAt = new Date().toISOString(); writeState(file, state); return { ok: true, mode, event: state.lastEvent, state: withInterior(state) } }
function act(config, action) { if (!action?.trim()) throw new Error('action is required'); const file = fileOf(config); const state = readTown(file); state.lastAction = { text: action.trim(), at: new Date().toISOString() }; state.lastEvent = null; state.updatedAt = new Date().toISOString(); writeState(file, state); return { ok: true, mode: 'act', action: state.lastAction, state: withInterior(state) } }
function npcTalk(config, npcId, text = '') { const file = fileOf(config); const state = readTown(file); const now = new Date().toISOString(); const npcs = Array.isArray(state.npcs) ? state.npcs : []; const npc = npcs.find(n => n.id === npcId) || { id: npcId, name: npcId, role: '小镇居民' }; state.relationships = state.relationships || {}; const prior = state.relationships[npcId] || { score: 0, talks: 0 }; state.relationships[npcId] = { ...prior, score: Math.min(100, Number(prior.score || 0) + 1), talks: Number(prior.talks || 0) + 1, lastTalkAt: now, lastText: String(text).slice(0, 200) }; state.lastAction = { text: `和${npc.name}聊了一会儿`, at: now }; state.updatedAt = now; writeState(file, state); return { ok: true, mode: 'npc-talk', npc, relationship: state.relationships[npcId], state: withInterior(state) } }
function eventSuggestion(config) { const file = fileOf(config); const state = status(config).state; const hour = new Date().getHours(); const rain = /雨|雷/.test(String(state.weather?.condition || '')); const candidates = []; if (rain) candidates.push({ id: 'rainy-tea', title: '雨天室内茶会', locationId: 'oakbrook-restaurant', text: '雨声把大家留在餐厅，玛尔塔提议煮一壶红茶。' }); else if (hour >= 17) candidates.push({ id: 'lake-sunset', title: '湖边晚霞', locationId: 'moonlake-park', text: '傍晚的湖面亮起来，芬恩在木栈道边收渔具。' }); else candidates.push({ id: 'market-basket', title: '杂货店新货', locationId: 'oakbrook-market', text: '杂货店刚到了一批灯芯和手账纸，玛尔塔在门口整理。' }); return { ok: true, mode: 'suggestion', event: candidates[0], state } }
function enter(config, locationId) { return travel(config, locationId, 'walk') }
function travel(config, locationId, mode = 'walk') { const file = fileOf(config); const state = readTown(file); const destination = (state.locations || []).find(x => x.id === locationId); if (!destination) throw new Error('unknown location'); const from = state.location?.id || 'fish-home'; if (from === locationId) return { ok: true, mode: 'travel', location: state.location, elapsedMinutes: 0, state: withInterior(state) }; const minutes = mode === 'transit' ? Number(destination.transitMinutes ?? destination.walkMinutes ?? 0) : Number(destination.walkMinutes ?? 0); const now = new Date(); const scale = 60000; state.travel = { ...(state.travel || {}), mode, inProgress: { from, to: locationId, minutes, mode, startedAt: now.toISOString(), eta: new Date(now.getTime() + minutes * scale).toISOString(), progress: 0 }, lastTrip: { from, to: locationId, minutes, at: now.toISOString() }, minutesToday: Number(state.travel?.minutesToday || 0) + minutes, date: now.toISOString().slice(0, 10) }; state.updatedAt = now.toISOString(); writeState(file, state); return { ok: true, mode: 'travel', location: state.location, elapsedMinutes: minutes, state: withInterior(state) } }
function buy(config, shopId, itemId, quantity = 1) { const file = fileOf(config); const state = readTown(file); const shop = (state.shops || []).find(x => x.id === shopId); const item = shop?.items?.find(x => x.id === itemId); const count = Math.max(1, Math.min(10, Number(quantity) || 1)); if (!item) throw new Error('unknown item'); const total = Number(item.price) * count; const balance = Number(state.wallet?.balance ?? state.coins ?? 0); if (balance < total) throw new Error(`not enough coins: need ${total}, have ${balance}`); state.wallet = { ...(state.wallet || {}), balance: balance - total }; state.coins = state.wallet.balance; state.energy = Math.min(100, Number(state.energy || 0) + Number(item.energy || 0)); state.mood = Math.min(100, Number(state.mood || 50) + Number(item.mood || 0)); state.inventory = Array.isArray(state.inventory) ? state.inventory : []; for (let i=0;i<count;i++) state.inventory.push({ id:item.id, name:item.name, boughtAt:new Date().toISOString() }); state.updatedAt = new Date().toISOString(); writeState(file, state); return { ok:true, mode:'buy', shop:shop.name, item:item.name, quantity:count, total, balance:state.wallet.balance, state:withInterior(state) } }
function decorate(config, itemId, placement = {}) { const file = fileOf(config); const state = readTown(file); state.homeDecor = Array.isArray(state.homeDecor) ? state.homeDecor : []; const action = placement.action || 'place'; const index = state.homeDecor.findIndex(x => x.id === itemId || x.instanceId === itemId); if (action === 'remove' || action === 'move' || action === 'rotate') { if (index < 0) throw new Error('decor not found'); const decor = state.homeDecor[index]; if (action === 'remove') { state.inventory.push({ id: decor.id, name: decor.name, boughtAt: new Date().toISOString() }); state.homeDecor.splice(index, 1) } else { if (placement.room) decor.room = String(placement.room).slice(0, 80); if (Number.isFinite(Number(placement.x))) decor.x = Math.max(0, Math.min(100, Number(placement.x))); if (Number.isFinite(Number(placement.y))) decor.y = Math.max(0, Math.min(100, Number(placement.y))); if (action === 'rotate' || Number.isFinite(Number(placement.rotation))) decor.rotation = ((Number(placement.rotation ?? decor.rotation ?? 0) % 360) + 360) % 360 } state.lastAction = { text: action === 'remove' ? `把${decor.name}收回库存` : `调整了${decor.name}的位置`, at: new Date().toISOString() } } else { const item = (state.inventory || []).find(x => x.id === itemId || x.name === itemId); if (!item) throw new Error('item not in inventory'); state.inventory.splice(state.inventory.indexOf(item), 1); state.homeDecor.push({ id: item.id, instanceId: `${item.id}-${Date.now()}`, name: item.name, room: placement.room || '小书桌与日记本', x: Number.isFinite(Number(placement.x)) ? Number(placement.x) : 50, y: Number.isFinite(Number(placement.y)) ? Number(placement.y) : 50, rotation: Number(placement.rotation) || 0, placedAt: new Date().toISOString() }); state.lastAction = { text: `把${item.name}布置进水边小屋`, at: new Date().toISOString() } } state.updatedAt = new Date().toISOString(); writeState(file, state); return { ok:true, mode:'decorate', action, state:withInterior(state) } }
function work(config, jobId = 'lake-helper') { const file = fileOf(config); const state = readTown(file); const jobs = { 'lake-helper': { name:'湖边小帮手', coins:24, energy:8, mood:2 }, 'shop-helper': { name:'杂货店整理员', coins:18, energy:6, mood:1 }, 'diary-copyist': { name:'日记抄写员', coins:20, energy:5, mood:3 } }; const job = jobs[jobId] || jobs['lake-helper']; state.wallet = { ...(state.wallet || {}), balance: Number(state.wallet?.balance ?? state.coins ?? 0) + job.coins }; state.coins = state.wallet.balance; state.energy = Math.max(0, Number(state.energy || 0) - job.energy); state.mood = Math.min(100, Number(state.mood || 50) + job.mood); state.lastAction = { text: `完成工作：${job.name}`, at: new Date().toISOString() }; state.updatedAt = new Date().toISOString(); writeState(file, state); return { ok:true, mode:'work', job:job.name, earned:job.coins, state:withInterior(state) } }
async function weather(config) { const file = fileOf(config); const state = readTown(file); const w = { ...(state.weather || {}) }; if (w.provider === 'city' && Number.isFinite(Number(w.latitude)) && Number.isFinite(Number(w.longitude))) { try { const url = `https://api.open-meteo.com/v1/forecast?latitude=${w.latitude}&longitude=${w.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=${encodeURIComponent(w.timezone || 'Asia/Shanghai')}`; const res = await fetch(url, { signal: AbortSignal.timeout(8000) }); if (!res.ok) throw new Error(`weather http ${res.status}`); const data = await res.json(); const c = data.current || {}; w.temperatureC = c.temperature_2m ?? w.temperatureC; w.feelsLikeC = c.apparent_temperature ?? w.feelsLikeC; w.humidity = c.relative_humidity_2m ?? w.humidity; w.windKph = c.wind_speed_10m ?? w.windKph; w.condition = String(c.weather_code ?? w.condition); w.updatedAt = new Date().toISOString(); w.source = 'open-meteo city forecast'; const latest = readState(file); latest.weather = w; latest.updatedAt = new Date().toISOString(); writeState(file, latest); return { ok:true, mode:'weather', weather:w, live:true } } catch (error) { return { ok:true, mode:'weather', weather:w, live:false, error:String(error.message || error), note:'实时天气暂时不可用，返回上次城市级缓存。' } } } return { ok:true, mode:'weather', weather:w, live:false, note:'未配置城市坐标。' } }

export { DEFAULT_FILE, status, event, act, enter, travel, buy, decorate, work, weather, npcTalk, eventSuggestion }
