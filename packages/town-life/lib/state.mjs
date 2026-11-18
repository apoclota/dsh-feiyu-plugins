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
  { id: 'oakbrook-post', name: '邮局与包裹站', kind: 'post', walkMinutes: 10, transitMinutes: 4, description: '寄信、取包裹和购买邮票。' },
  { id: 'oakbrook-furniture', name: '橡溪家具行', kind: 'furniture', walkMinutes: 12, transitMinutes: 4, description: '手工木家具、布艺和墙面摆设，买下来就能搬回小屋。' }
]
const EXTENDED_SHOPS = [
  { id: 'oakbrook-pharmacy', name: '橡溪药房', items: [{ id: 'first-aid', name: '急救包', price: 28, energy: 8, sprite: 'firstaid' }, { id: 'vitamin', name: '维生素', price: 12, energy: 3, sprite: 'bottle' }] },
  { id: 'oakbrook-bakery', name: '麦穗面包房', items: [{ id: 'bread', name: '乡村面包', price: 10, energy: 8, sprite: 'bread' }, { id: 'coffee', name: '热咖啡', price: 9, energy: 5, mood: 3, sprite: 'coffee' }, { id: 'cake', name: '奶油蛋糕', price: 22, mood: 12, sprite: 'cake' }, { id: 'cookie', name: '黄油曲奇', price: 8, mood: 4, sprite: 'cookie' }, { id: 'tart', name: '苹果挞', price: 16, mood: 8, sprite: 'pie' }] },
  { id: 'oakbrook-hardware', name: '榫卯五金铺', items: [{ id: 'paint', name: '木屋油漆', price: 32, mood: 5, decor: true, sprite: 'paint' }, { id: 'toolbox', name: '工具箱', price: 45, mood: 6, decor: true, sprite: 'toolbox' }, { id: 'shelf', name: '橡木壁架', price: 58, mood: 10, decor: true, sprite: 'shelf' }, { id: 'wall-clock', name: '铜面挂钟', price: 88, mood: 11, decor: true, sprite: 'clock' }, { id: 'curtain-rod', name: '窗帘杆', price: 22, mood: 3, decor: true, sprite: 'rod' }] },
  { id: 'oakbrook-clothing', name: '云杉衣铺', items: [{ id: 'raincoat', name: '雨衣', price: 36, mood: 5, decor: true, sprite: 'raincoat' }, { id: 'scarf', name: '湖蓝围巾', price: 24, mood: 6, decor: true, sprite: 'scarf' }, { id: 'cushion', name: '花布靠垫', price: 35, mood: 7, decor: true, sprite: 'cushion' }, { id: 'blanket', name: '拼布毯', price: 58, mood: 9, decor: true, sprite: 'blanket' }, { id: 'curtain', name: '亚麻窗帘', price: 85, mood: 10, decor: true, sprite: 'curtain' }] },
  { id: 'oakbrook-flower', name: '湖畔花店', items: [{ id: 'seed-pack', name: '花种子', price: 14, mood: 5, decor: true, sprite: 'seed' }, { id: 'potted-fern', name: '蕨类盆栽', price: 30, mood: 9, decor: true, sprite: 'plant' }, { id: 'vase', name: '手绘花瓶', price: 38, mood: 8, decor: true, sprite: 'vase' }, { id: 'hanging-plant', name: '垂吊绿萝', price: 46, mood: 10, decor: true, sprite: 'hanging' }, { id: 'flower-bunch', name: '一束蓝花', price: 20, mood: 6, sprite: 'flowers' }] },
  { id: 'oakbrook-library', name: '橡溪图书馆', items: [{ id: 'travel-book', name: '湖区旅行书', price: 20, mood: 7, sprite: 'book' }, { id: 'recipe-book', name: '家常菜谱', price: 18, mood: 6, sprite: 'book' }, { id: 'story-album', name: '湖岸绘本', price: 24, mood: 8, sprite: 'book' }] },
  { id: 'oakbrook-workshop', name: '木匠工作室', items: [{ id: 'bench', name: '窗边长凳', price: 90, mood: 14, decor: true, sprite: 'bench' }, { id: 'lamp', name: '黄铜台灯', price: 75, mood: 12, decor: true, sprite: 'lamp' }, { id: 'rocking-chair', name: '木摇椅', price: 210, mood: 20, decor: true, sprite: 'rocking-chair' }, { id: 'side-table', name: '小边几', price: 65, mood: 8, decor: true, sprite: 'lowtable' }, { id: 'coat-rack', name: '门边衣架', price: 55, mood: 7, decor: true, sprite: 'coat-rack' }] },
  { id: 'oakbrook-post', name: '邮局与包裹站', items: [{ id: 'postcard', name: '湖景明信片', price: 6, mood: 3, sprite: 'postcard' }, { id: 'stamp-book', name: '纪念邮票册', price: 26, mood: 7, decor: true, sprite: 'stamp' }, { id: 'letter-set', name: '信封信纸', price: 12, mood: 4, sprite: 'envelope' }] },
  { id: 'oakbrook-furniture', name: '橡溪家具行', items: [
    { id: 'sofa', name: '二人布沙发', price: 260, mood: 22, decor: true, sprite: 'sofa' },
    { id: 'armchair', name: '布艺扶手椅', price: 140, mood: 15, decor: true, sprite: 'armchair' },
    { id: 'dining-table', name: '橡木餐桌', price: 220, mood: 18, decor: true, sprite: 'table' },
    { id: 'coffee-table', name: '矮茶几', price: 95, mood: 10, decor: true, sprite: 'lowtable' },
    { id: 'stool', name: '木圆凳', price: 45, mood: 6, decor: true, sprite: 'stool' },
    { id: 'bookshelf', name: '高脚书架', price: 180, mood: 16, decor: true, sprite: 'bookshelf' },
    { id: 'bed', name: '单人木床', price: 320, mood: 24, decor: true, sprite: 'bed' },
    { id: 'cabinet', name: '矮收纳柜', price: 160, mood: 12, decor: true, sprite: 'cabinet' },
    { id: 'wardrobe', name: '双门衣橱', price: 280, mood: 18, decor: true, sprite: 'wardrobe' },
    { id: 'rug', name: '编织地毯', price: 70, mood: 11, decor: true, sprite: 'rug' },
    { id: 'mirror', name: '落地镜', price: 120, mood: 12, decor: true, sprite: 'mirror' },
    { id: 'painting', name: '湖景挂画', price: 110, mood: 13, decor: true, sprite: 'painting' },
    { id: 'floor-lamp', name: '布罩落地灯', price: 100, mood: 12, decor: true, sprite: 'floor-lamp' },
    { id: 'radio', name: '旧收音机', price: 130, mood: 14, decor: true, sprite: 'radio' },
    { id: 'desk', name: '写字桌', price: 190, mood: 15, decor: true, sprite: 'desk' }
  ] }
]
const EXTRA_ITEMS = {
  'oakbrook-market': [{ id: 'teapot', name: '粗陶茶壶', price: 26, mood: 6, decor: true, sprite: 'teapot' }, { id: 'candle', name: '香薰蜡烛', price: 18, mood: 7, decor: true, sprite: 'candle' }, { id: 'basket', name: '藤编篮', price: 22, mood: 5, decor: true, sprite: 'basket' }, { id: 'frame', name: '木相框', price: 20, mood: 5, decor: true, sprite: 'frame' }, { id: 'seed-tomato', name: '番茄种子', price: 20, sprite: 'seed', seed: 'tomato' }, { id: 'seed-pumpkin', name: '南瓜种子', price: 30, sprite: 'seed', seed: 'pumpkin' }, { id: 'seed-wheat', name: '麦种', price: 25, sprite: 'seed', seed: 'wheat' }, { id: 'apple', name: '青苹果', price: 9, energy: 6, mood: 2, food: { energy: 6, mood: 2, minutes: 5 }, sprite: 'fruit' }],
  'oakbrook-restaurant': [{ id: 'dumpling', name: '手工饺子', price: 14, energy: 5, sprite: 'dumpling' }],
  'lucky-star': [{ id: 'scratch-card', name: '刮刮乐', price: 5, mood: 2, sprite: 'ticket' }],
  'oakbrook-flower': [{ id: 'seed-flower', name: '花种子', price: 15, sprite: 'seed', seed: 'flower' }],
  'oakbrook-pharmacy': [{ id: 'seed-herb', name: '草药种子', price: 40, sprite: 'seed', seed: 'herb' }],
  'oakbrook-bakery': [{ id: 'hot-soup', name: '热汤', price: 30, energy: 25, mood: 6, food: { energy: 25, mood: 6, minutes: 15 }, sprite: 'soup' }, { id: 'coffee', name: '热咖啡', price: 15, energy: 10, mood: 6, food: { energy: 10, mood: 6, minutes: 8 }, sprite: 'coffee' }, { id: 'cake-slice', name: '蛋糕', price: 35, energy: 15, mood: 8, food: { energy: 15, mood: 8, minutes: 12 }, sprite: 'cake' }],
  'oakbrook-restaurant': [{ id: 'hot-soup', name: '热汤', price: 30, energy: 25, mood: 6, food: { energy: 25, mood: 6, minutes: 15 }, sprite: 'soup' }, { id: 'dumpling', name: '手工饺子', price: 14, energy: 5, mood: 4, food: { energy: 12, mood: 4, minutes: 12 }, sprite: 'dumpling' }]
}
const BASE_SPRITES = { 'hot-soup': 'soup', 'berry-pie': 'pie', 'shell-lamp': 'lamp', 'notebook': 'notebook', 'tea': 'teacup', 'lottery-ticket': 'ticket' }
const SPRITE_RULES = [[/沙发/, 'sofa'], [/扶手椅/, 'armchair'], [/摇椅/, 'rocking-chair'], [/长凳|板凳/, 'bench'], [/凳/, 'stool'], [/餐桌|方桌/, 'table'], [/茶几|边几|小桌/, 'lowtable'], [/写字桌|书桌/, 'desk'], [/书架|书架/, 'bookshelf'], [/壁架|搁架|层架/, 'shelf'], [/床/, 'bed'], [/衣橱|衣柜/, 'wardrobe'], [/柜/, 'cabinet'], [/地毯|垫毯/, 'rug'], [/靠垫|抱枕/, 'cushion'], [/窗帘/, 'curtain'], [/挂钟|钟/, 'clock'], [/落地灯/, 'floor-lamp'], [/台灯|灯/, 'lamp'], [/挂画|画/, 'painting'], [/镜/, 'mirror'], [/收音机/, 'radio'], [/盆栽|绿萝|植物/, 'plant'], [/花瓶/, 'vase'], [/花/, 'flowers'], [/书|册/, 'book'], [/明信片/, 'postcard'], [/邮票/, 'stamp'], [/信纸|信封/, 'envelope'], [/面包/, 'bread'], [/蛋糕/, 'cake'], [/曲奇|饼/, 'pie'], [/咖啡/, 'coffee'], [/茶/, 'teacup'], [/工具箱/, 'toolbox'], [/油漆|涂料/, 'paint'], [/雨衣/, 'raincoat'], [/围巾/, 'scarf'], [/种子/, 'seed'], [/急救/, 'firstaid'], [/药|维生素/, 'bottle'], [/彩票|刮刮/, 'ticket'], [/日记/, 'notebook'], [/毯/, 'blanket']]
function spriteOf(item) { return item.sprite || BASE_SPRITES[item.id] || (SPRITE_RULES.find(([rule]) => rule.test(String(item.name || ''))) || [])[1] || 'box' }
const AFFECTION_LEVELS = [{ min: 0, label: '初识', hearts: 0 }, { min: 15, label: '面熟', hearts: 1 }, { min: 35, label: '友好', hearts: 2 }, { min: 55, label: '亲近', hearts: 3 }, { min: 75, label: '挚友', hearts: 4 }, { min: 95, label: '知己', hearts: 5 }]
function affectionOf(score) { const value = Math.max(0, Math.min(100, Number(score) || 0)); const level = [...AFFECTION_LEVELS].reverse().find(x => value >= x.min) || AFFECTION_LEVELS[0]; const next = AFFECTION_LEVELS.find(x => x.min > value); return { score: Math.round(value * 10) / 10, label: level.label, hearts: level.hearts, next: next ? next.label : null, toNext: next ? Math.max(0, next.min - value) : 0, progress: next ? Math.round((value - level.min) / (next.min - level.min) * 100) : 100 } }
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
const fileOf = config => { const value = config?.stateFile; if (typeof value === 'string' && value.trim() && value !== '[object Object]') return value; return 'Z:/肥鱼的一生0.1/tools/town-life/town-life.json' }
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
  if (!Array.isArray(state.homeDecor)) state.homeDecor = []
  state.homeRooms = HOME_ROOMS.map(room => ({ ...room }))
  for (const item of state.homeDecor) {
    if (!item.sprite) item.sprite = spriteOf(item)
    item.comfort = comfortOf(item)
    if (!item.room || !HOME_ROOMS.some(room => room.name === item.room)) item.room = '客厅'
  }
  for (const item of Array.isArray(state.inventory) ? state.inventory : []) {
    if (!item.sprite) item.sprite = spriteOf(item)
    item.comfort = comfortOf(item)
  }
  state.lastVisit = state.lastVisit || null
  state.homeVisitor = state.homeVisitor || null
  state.locations = Array.isArray(state.locations) ? state.locations : []
  for (const place of EXTENDED_LOCATIONS) if (!state.locations.some(x => x.id === place.id)) state.locations.push(place)
  state.shops = Array.isArray(state.shops) ? state.shops : []
  for (const shop of EXTENDED_SHOPS) {
    const existing = state.shops.find(x => x.id === shop.id)
    if (!existing) { state.shops.push({ ...shop, items: shop.items.map(item => ({ ...item })) }); continue }
    existing.name = existing.name || shop.name
    existing.items = Array.isArray(existing.items) ? existing.items : []
    for (const item of shop.items) if (!existing.items.some(x => x.id === item.id)) existing.items.push({ ...item })
  }
  for (const [shopId, items] of Object.entries(EXTRA_ITEMS)) {
    const shop = state.shops.find(x => x.id === shopId)
    if (!shop) continue
    shop.items = Array.isArray(shop.items) ? shop.items : []
    for (const item of items) if (!shop.items.some(x => x.id === item.id)) shop.items.push({ ...item })
  }
  for (const shop of state.shops) shop.items = (shop.items || []).map(item => ({ ...item, sprite: spriteOf(item) }))
  state.events = state.events || {}
  for (const key of ['daily', '偶然', '突发']) state.events[key] = [...(state.events[key] || []), ...(EXTENDED_EVENTS[key] || [])].filter((item, index, list) => list.findIndex(x => x.id === item.id) === index)
  state.homeDecor = (Array.isArray(state.homeDecor) ? state.homeDecor : []).map(item => ({ ...item, sprite: spriteOf(item) }))
  state.inventory = (Array.isArray(state.inventory) ? state.inventory : []).map(item => ({ ...item, sprite: spriteOf(item) }))
  state.relationships = state.relationships || {}
  const residents = [
    { id: 'finn', name: '芬恩', role: '码头渔夫', routine: '白天在码头，夜里回家', likes: ['咖啡', '热汤', '明信片', '围巾'], why: '喜欢暖的东西和湖上的故事' },
    { id: 'marta', name: '玛尔塔', role: '邻居烘焙师', routine: '午后在餐厅或自家厨房', likes: ['面包', '蛋糕', '花', '靠垫'], why: '喜欢甜香和能让屋子变软的东西' },
    { id: 'lina', name: '莉娜', role: '药房药师', routine: '白天在药房，傍晚去图书馆', likes: ['茶', '书', '盆栽', '蜡烛'], why: '喜欢安静的植物和纸页味道' },
    { id: 'cedar', name: '塞德', role: '木匠师傅', routine: '白天在木匠工作室，周末去集市', likes: ['工具箱', '油漆', '木', '凳'], why: '喜欢好木料和顺手的工具' },
    { id: 'noah', name: '诺亚', role: '邮差', routine: '上午在邮局，下午骑车送信', likes: ['明信片', '邮票', '信纸', '咖啡'], why: '喜欢纸和路上的小东西' },
    { id: 'rue', name: '露伊', role: '图书管理员', routine: '白天在图书馆，午后在公园读书', likes: ['书', '绘本', '花', '画'], why: '喜欢故事、颜色和窗边的光' }
  ]
  state.npcs = Array.isArray(state.npcs) ? state.npcs : []
  for (const resident of residents) if (!state.npcs.some(x => x.id === resident.id)) state.npcs.push({ ...resident })
  for (const npc of state.npcs) {
    const base = residents.find(x => x.id === npc.id)
    if (base) { npc.likes = npc.likes || base.likes; npc.why = npc.why || base.why }
    if (!state.relationships[npc.id]) state.relationships[npc.id] = { score: 0, talks: 0, gifts: 0 }
  }
  state.wallet = state.wallet || { currency: 'CNY', label: '小镇币', balance: Number(state.coins || 0), dailyAllowance: 80 }
  state.coins = Number(state.wallet.balance ?? state.coins ?? 0)
  return state
}
const readTown = file => ensureTown(readState(file))
const phase = state => { const h = new Date().getHours(); const r = Array.isArray(state.routine) ? state.routine : []; return h < 6 ? '安静睡觉' : h < 10 ? r[0] : h < 13 ? r[1] : h < 17 ? r[2] : h < 21 ? r[3] : r[4] }
const HOME_ROOMS = [
  { id: 'living', name: '客厅', x: 3, y: 5, w: 53, h: 55, floor: '#d9c3a0' },
  { id: 'bedroom', name: '卧室', x: 58, y: 5, w: 39, h: 36, floor: '#cbb894' },
  { id: 'study', name: '书房', x: 58, y: 43, w: 39, h: 52, floor: '#d3bd97' },
  { id: 'kitchen', name: '厨房', x: 3, y: 62, w: 26, h: 33, floor: '#c8b794' },
  { id: 'yard', name: '小院', x: 31, y: 62, w: 25, h: 33, floor: '#b9a67f' }
]
const COMFORT_BY_SPRITE = { sofa: 9, armchair: 6, bed: 12, table: 5, lowtable: 4, desk: 5, stool: 2, bookshelf: 6, shelf: 4, cabinet: 4, wardrobe: 4, rug: 5, mirror: 3, painting: 3, clock: 2, 'floor-lamp': 4, lamp: 3, plant: 3, vase: 2, hanging: 2, flowers: 2, candle: 1, curtain: 3, cushion: 2, blanket: 2, bench: 2, 'rocking-chair': 4, 'coat-rack': 2, teapot: 1, basket: 1, frame: 1, radio: 3 }
const COMFORT_LEVELS = [
  { min: 0, label: '简陋', note: '只有几件必需品。' },
  { min: 10, label: '朴素', note: '能住，但还缺点什么。' },
  { min: 25, label: '舒适', note: '坐下来就不太想动了。' },
  { min: 45, label: '温馨', note: '灯光和布艺让人放松。' },
  { min: 70, label: '惬意', note: '朋友来了会想多待一会儿。' },
  { min: 100, label: '理想', note: '像杂志里的小屋。' }
]
function comfortOf(item) { return COMFORT_BY_SPRITE[item?.sprite] ?? 2 }
function comfortLevel(score) { let level = COMFORT_LEVELS[0]; for (const entry of COMFORT_LEVELS) if (score >= entry.min) level = entry; const next = COMFORT_LEVELS.find(entry => entry.min > score); return { score, label: level.label, note: level.note, next: next ? next.label : null, toNext: next ? next.min - score : 0, progress: next ? Math.max(0, Math.min(1, (score - level.min) / (next.min - level.min))) : 1 } }
function homeComfort(state) { const items = Array.isArray(state?.homeDecor) ? state.homeDecor : []; return comfortLevel(items.reduce((sum, item) => sum + comfortOf(item), 0)) }
function status(config) { const state = tickWorld(fileOf(config), withInterior(readTown(fileOf(config)))); if (config?.startingCoins != null && !state.wallet?.balance && !state.coins) { state.wallet = { ...(state.wallet || {}), balance: Number(config.startingCoins) || 0 }; state.coins = state.wallet.balance } const now = new Date(); const trip = state.travel?.inProgress; if (trip) { const started = Date.parse(trip.startedAt); const eta = Date.parse(trip.eta); const duration = Math.max(1, eta - started); const elapsed = Math.max(0, now.getTime() - started); trip.progress = Math.max(0, Math.min(1, elapsed / duration)); if (now.getTime() >= eta) { const destination = state.locations.find(x => x.id === trip.to); if (destination) state.location = { ...destination, mode: trip.mode }; state.travel = { ...state.travel, inProgress: null, progress: 1, arrivedAt: now.toISOString() }; state.energy = Math.max(0, Number(state.energy || 0) - Math.ceil(Number(trip.minutes || 0) / 15)); state.updatedAt = now.toISOString(); writeState(fileOf(config), state) } } const hour = now.getHours(); const minute = String(now.getMinutes()).padStart(2, '0'); const rain = /雨|雷/.test(String(state.weather?.condition || '')); const npcs = Array.isArray(state.npcs) ? state.npcs : [{ id: 'finn', name: '芬恩', role: '码头渔夫', routine: '白天在码头，夜里回家' }, { id: 'marta', name: '玛尔塔', role: '邻居烘焙师', routine: '午后在餐厅或自家厨房' }]; const movingNpcs = npcs.map(n => { const schedule = { finn: [hour >= 7 && hour < 19 && !rain ? 'moonlake-park' : 'fish-home', rain ? '在屋檐下收渔具' : '整理湖边渔具'], marta: [hour >= 11 && hour < 18 ? 'oakbrook-restaurant' : 'oakbrook-market', hour >= 11 && hour < 18 ? '在餐厅准备莓果饼' : '采购烘焙材料'], lina: [hour < 17 ? 'oakbrook-pharmacy' : 'oakbrook-library', hour < 17 ? '整理药品并提供咨询' : '整理健康读物'], cedar: [hour < 18 ? 'oakbrook-workshop' : 'oakbrook-hardware', hour < 18 ? '打磨一件窗边家具' : '挑选木料和五金'], noah: [hour < 13 ? 'oakbrook-post' : 'oakbrook-station', hour < 13 ? '分拣镇民包裹' : '查看短途线路'], rue: [hour < 16 ? 'oakbrook-library' : 'moonlake-park', hour < 16 ? '整理小镇档案' : '在公园窗边阅读'] }; const [locationId, activity] = schedule[n.id] || ['oakbrook-market', '在商业街活动']; return { ...n, locationId, activity } }); const homeId = 'fish-home'
 const homeDecor = (Array.isArray(state.homeDecor) ? state.homeDecor : []).map(item => ({ ...item, comfort: comfortOf(item) }))
 const comfort = homeComfort(state)
 const visitorNow = state.homeVisitor && typeof state.homeVisitor === 'object' ? state.homeVisitor : null
 if (visitorNow && Date.parse(visitorNow.until) <= now.getTime()) {
   state.relationships = state.relationships || {}
   const prior = state.relationships[visitorNow.npcId] || { score: 0, talks: 0, gifts: 0 }
   state.relationships[visitorNow.npcId] = { ...prior, score: Math.min(100, Number(prior.score || 0) + 2), visits: Number(prior.visits || 0) + 1, lastVisitAt: now.toISOString() }
   state.mood = Math.min(100, Number(state.mood || 50) + 2)
   state.lastVisit = { npcId: visitorNow.npcId, name: visitorNow.name, at: now.toISOString(), text: `${visitorNow.name}来小屋坐了一会儿，聊得很开心。` }
   state.homeVisitor = null
   state.updatedAt = now.toISOString()
   writeState(fileOf(config), state)
 } else if (!visitorNow && state.location?.id === homeId) {
   const lastRoll = Date.parse(state.lastVisitRollAt || 0)
   if (!Number.isFinite(lastRoll) || now.getTime() - lastRoll > 90000) {
     state.lastVisitRollAt = now.toISOString()
     const chance = Math.min(0.55, 0.1 + comfort.score / 260)
     if (Math.random() < chance) {
       const pool = (Array.isArray(state.npcs) ? state.npcs : []).filter(n => n && n.id)
       if (pool.length) {
         const guest = pool[Math.floor(Math.random() * pool.length)]
         const minutes = 8 + Math.round(Math.random() * 10)
         state.homeVisitor = { npcId: guest.id, name: guest.name, role: guest.role || '镇上居民', startedAt: now.toISOString(), until: new Date(now.getTime() + minutes * 60000).toISOString(), line: guest.visitLine || `${guest.name}路过湖边，顺便来小屋看看。` }
       }
     }
     state.updatedAt = now.toISOString()
     writeState(fileOf(config), state)
   }
 }
 const shownNpcs = state.homeVisitor && state.homeVisitor.npcId
   ? movingNpcs.map(n => n.id === state.homeVisitor.npcId ? { ...n, locationId: homeId, activity: '来小屋串门' } : n)
   : movingNpcs
 const openHours = { 'oakbrook-restaurant': hour >= 8 && hour < 22, 'oakbrook-market': hour >= 9 && hour < 20, 'oakbrook-station': true, 'lucky-star': hour >= 9 && hour < 21, 'moonlake-park': hour >= 5 && hour < 23, 'fish-home': true }; for (const place of state.locations || []) if (!(place.id in openHours)) openHours[place.id] = place.kind === 'library' ? hour >= 9 && hour < 20 : place.kind === 'post' ? hour >= 8 && hour < 19 : hour >= 9 && hour < 21; return { ok: true, mode: 'status', state: { ...state, activity: activeActivity(state), jobs: jobsAt(state), field: fieldView(state), tone: toneOf(state), fullness: fullnessOf(state), clock: gameClock(state), realTime: { iso: now.toISOString(), local: `${hour}:${minute}`, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }, npcs: shownNpcs.map(n => ({ ...n, affinity: affectionOf(state.relationships?.[n.id]?.score) })),
        home: { rooms: HOME_ROOMS, items: homeDecor, comfort, visitor: state.homeVisitor || null, lastVisit: state.lastVisit || null, visitCeiling: Math.min(55, Math.round((0.1 + comfort.score / 260) * 100)) },
        homeComfortLevels: COMFORT_LEVELS, relationships: Object.fromEntries(Object.entries(state.relationships || {}).map(([id, rel]) => [id, { ...rel, affinity: affectionOf(rel.score) }])), affectionLevels: AFFECTION_LEVELS, itemCount: (state.shops || []).reduce((sum, shop) => sum + (shop.items || []).length, 0), furnitureCount: (state.shops || []).reduce((sum, shop) => sum + (shop.items || []).filter(item => item.decor).length, 0), openHours, weatherEffect: rain ? '雨天：户外活动减少，NPC更常待在室内。' : '适合户外活动。', currentPhase: phase(state) } } }
function event(config, mode) { const file = fileOf(config); const state = readTown(file); const today = new Date().toISOString().slice(0, 10); const prior = state.lastEvent && String(state.lastEvent.at || '').slice(0, 10); const key = mode === 'surprise' ? '突发' : prior === today ? '偶然' : 'daily'; const picked = choose(state.events?.[key]?.length ? state.events[key] : DEFAULT_EVENTS[key]); state.lastEvent = { ...picked, mode: key, at: new Date().toISOString() }; state.updatedAt = new Date().toISOString(); writeState(file, state); return { ok: true, mode, event: state.lastEvent, state: withInterior(state) } }
function act(config, action) { if (!action?.trim()) throw new Error('action is required'); const file = fileOf(config); const state = readTown(file); if (state.location?.id === 'fish-home' && /歇|休息|躺|睡/.test(action)) { const comfort = homeComfort(state); state.energy = Math.min(100, Number(state.energy || 0) + Math.round(2 + comfort.score / 12)); state.mood = Math.min(100, Number(state.mood || 50) + 2) } state.lastAction = { text: action.trim(), at: new Date().toISOString() }; state.lastEvent = null; state.updatedAt = new Date().toISOString(); writeState(file, state); return { ok: true, mode: 'act', action: state.lastAction, state: withInterior(state) } }
function npcTalk(config, npcId, text = '') { const file = fileOf(config); const state = readTown(file); const now = new Date().toISOString(); const npcs = Array.isArray(state.npcs) ? state.npcs : []; const npc = npcs.find(n => n.id === npcId) || { id: npcId, name: npcId, role: '小镇居民' }; state.relationships = state.relationships || {}; const prior = state.relationships[npcId] || { score: 0, talks: 0, gifts: 0 }; const liked = (npc.likes || []).some(word => String(text).includes(word)); const gain = liked ? 3 : 1; const score = Math.min(100, Number(prior.score || 0) + gain); state.relationships[npcId] = { ...prior, score, talks: Number(prior.talks || 0) + 1, lastTalkAt: now, lastText: String(text).slice(0, 200) }; state.lastAction = { text: `和${npc.name}聊了一会儿`, at: now }; state.updatedAt = now; writeState(file, state); return { ok: true, mode: 'npc-talk', npc, gain, relationship: { ...state.relationships[npcId], affinity: affectionOf(score) }, state: withInterior(state) } }
function npcGift(config, npcId, itemId) { const file = fileOf(config); const state = readTown(file); const now = new Date().toISOString(); const npcs = Array.isArray(state.npcs) ? state.npcs : []; const npc = npcs.find(n => n.id === npcId) || { id: npcId, name: npcId, role: '小镇居民' }; const inventory = Array.isArray(state.inventory) ? state.inventory : []; const index = inventory.findIndex(x => x.id === itemId || x.name === itemId || x.instanceId === itemId); if (index < 0) throw new Error('item not in inventory'); const gift = inventory[index]; inventory.splice(index, 1); const liked = (npc.likes || []).some(word => String(gift.name || '').includes(word)); const gain = Math.max(2, Math.min(14, Math.round(Number(gift.price || 20) / 18) + 2)) + (liked ? 5 : 0); state.relationships = state.relationships || {}; const prior = state.relationships[npc.id] || { score: 0, talks: 0, gifts: 0 }; const score = Math.min(100, Number(prior.score || 0) + gain); state.relationships[npc.id] = { ...prior, score, gifts: Number(prior.gifts || 0) + 1, lastGiftAt: now, lastGift: gift.name }; state.lastAction = { text: `把${gift.name}送给了${npc.name}`, at: now }; state.updatedAt = now; writeState(file, state); const reaction = liked ? `${npc.name}眼睛亮了一下：“这个我正想要。”` : recallGiftReaction(npc, gift); return { ok: true, mode: 'npc-gift', npc, gift: gift.name, liked, gain, reaction, relationship: { ...state.relationships[npc.id], affinity: affectionOf(score) }, state: withInterior(state) } }
function recallGiftReaction(npc, gift) { const interest = (npc.likes || [])[0] || '小东西'; return `${npc.name}收下了${gift.name}，说会好好收着${npc.why ? '——' + npc.why : ''}，还提到自己最近常在意的${interest}。` }
function eventSuggestion(config) { const file = fileOf(config); const state = status(config).state; const hour = new Date().getHours(); const rain = /雨|雷/.test(String(state.weather?.condition || '')); const candidates = []; if (rain) candidates.push({ id: 'rainy-tea', title: '雨天室内茶会', locationId: 'oakbrook-restaurant', text: '雨声把大家留在餐厅，玛尔塔提议煮一壶红茶。' }); else if (hour >= 17) candidates.push({ id: 'lake-sunset', title: '湖边晚霞', locationId: 'moonlake-park', text: '傍晚的湖面亮起来，芬恩在木栈道边收渔具。' }); else candidates.push({ id: 'market-basket', title: '杂货店新货', locationId: 'oakbrook-market', text: '杂货店刚到了一批灯芯和手账纸，玛尔塔在门口整理。' }); return { ok: true, mode: 'suggestion', event: candidates[0], state } }
function enter(config, locationId) { return travel(config, locationId, 'walk') }
function travel(config, locationId, mode = 'walk') { const file = fileOf(config); const state = readTown(file); const destination = (state.locations || []).find(x => x.id === locationId); if (!destination) throw new Error('unknown location'); const from = state.location?.id || 'fish-home'; if (from === locationId) return { ok: true, mode: 'travel', location: state.location, elapsedMinutes: 0, state: withInterior(state) }; const minutes = mode === 'transit' ? Number(destination.transitMinutes ?? destination.walkMinutes ?? 0) : Number(destination.walkMinutes ?? 0); const now = new Date(); const scale = 60000; state.travel = { ...(state.travel || {}), mode, inProgress: { from, to: locationId, minutes, mode, startedAt: now.toISOString(), eta: new Date(now.getTime() + minutes * scale).toISOString(), progress: 0 }, lastTrip: { from, to: locationId, minutes, at: now.toISOString() }, minutesToday: Number(state.travel?.minutesToday || 0) + minutes, date: now.toISOString().slice(0, 10) }; state.updatedAt = now.toISOString(); writeState(file, state); return { ok: true, mode: 'travel', location: state.location, elapsedMinutes: minutes, state: withInterior(state) } }
function buy(config, shopId, itemId, quantity = 1) { const file = fileOf(config); const state = readTown(file); const shop = (state.shops || []).find(x => x.id === shopId); const item = shop?.items?.find(x => x.id === itemId); const count = Math.max(1, Math.min(10, Number(quantity) || 1)); if (!item) throw new Error('unknown item'); const total = Number(item.price) * count; const balance = Number(state.wallet?.balance ?? state.coins ?? 0); if (balance < total) throw new Error(`not enough coins: need ${total}, have ${balance}`); state.wallet = { ...(state.wallet || {}), balance: balance - total }; state.coins = state.wallet.balance; state.energy = Math.min(100, Number(state.energy || 0) + Number(item.energy || 0)); state.mood = Math.min(100, Number(state.mood || 50) + Number(item.mood || 0)); state.inventory = Array.isArray(state.inventory) ? state.inventory : []; for (let i=0;i<count;i++) state.inventory.push({ id:item.id, name:item.name, sprite:item.sprite || spriteOf(item), decor:item.decor === true, price:item.price, boughtAt:new Date().toISOString() }); state.updatedAt = new Date().toISOString(); writeState(file, state); return { ok:true, mode:'buy', shop:shop.name, item:item.name, quantity:count, total, balance:state.wallet.balance, state:withInterior(state) } }
function clampToRoom(roomName, x, y) {
  const room = HOME_ROOMS.find(r => r.name === roomName || r.id === roomName)
  const nx = Math.round(Number(x))
  const ny = Math.round(Number(y))
  if (!room) return { x: Math.max(2, Math.min(98, nx)), y: Math.max(2, Math.min(98, ny)) }
  return { x: Math.max(room.x + 5, Math.min(room.x + room.w - 5, nx)), y: Math.max(room.y + 9, Math.min(room.y + room.h - 4, ny)) }
}
function decorate(config, itemId, placement = {}) { const file = fileOf(config); const state = readTown(file); state.homeDecor = Array.isArray(state.homeDecor) ? state.homeDecor : []; const action = placement.action || 'place'; const index = state.homeDecor.findIndex(x => x.id === itemId || x.instanceId === itemId); if (action === 'remove' || action === 'move' || action === 'rotate') { if (index < 0) throw new Error('decor not found'); const decor = state.homeDecor[index]; if (action === 'remove') { state.inventory.push({ id: decor.id, name: decor.name, sprite: decor.sprite || spriteOf(decor), price: decor.price, decor: true, boughtAt: new Date().toISOString() }); state.homeDecor.splice(index, 1) } else { if (placement.room) decor.room = String(placement.room).slice(0, 80); if (Number.isFinite(Number(placement.x)) || Number.isFinite(Number(placement.y))) {
    const spot = clampToRoom(decor.room, placement.x ?? decor.x ?? 50, placement.y ?? decor.y ?? 50)
    decor.x = spot.x
    decor.y = spot.y
  } if (action === 'rotate' || Number.isFinite(Number(placement.rotation))) decor.rotation = ((Number(placement.rotation ?? decor.rotation ?? 0) % 360) + 360) % 360 } state.lastAction = { text: action === 'remove' ? `把${decor.name}收回库存` : `调整了${decor.name}的位置`, at: new Date().toISOString() } } else { const item = (state.inventory || []).find(x => x.id === itemId || x.name === itemId); if (!item) throw new Error('item not in inventory'); state.inventory.splice(state.inventory.indexOf(item), 1); const placeRoom = placement.room || '客厅'; const placeSpot = clampToRoom(placeRoom, Number.isFinite(Number(placement.x)) ? Number(placement.x) : 50, Number.isFinite(Number(placement.y)) ? Number(placement.y) : 50); state.homeDecor.push({ id: item.id, instanceId: `${item.id}-${Date.now()}`, name: item.name, sprite: item.sprite || spriteOf(item), price: item.price, room: placeRoom, x: placeSpot.x, y: placeSpot.y, rotation: Number(placement.rotation) || 0, comfort: comfortOf(item), placedAt: new Date().toISOString() }); state.lastAction = { text: `把${item.name}布置进水边小屋`, at: new Date().toISOString() } } state.updatedAt = new Date().toISOString(); writeState(file, state); return { ok:true, mode:'decorate', action, state:withInterior(state) } }
// ---------- 时间 · 精力 · 干活 · 田地 ----------
const MINUTE_MS = 6000
const JOBS = [
  { id: 'restaurant-hand', locationId: 'oakbrook-restaurant', name: '餐厅帮厨', minutes: 20, energy: 12, mood: 2, pay: 55, desc: '切菜、看火、洗盘子。' },
  { id: 'market-clerk', locationId: 'oakbrook-market', name: '杂货店理货', minutes: 15, energy: 8, mood: 2, pay: 40, desc: '拆箱子、把货摆上架。' },
  { id: 'workshop-hand', locationId: 'oakbrook-workshop', name: '木匠帮工', minutes: 25, energy: 18, mood: 1, pay: 70, desc: '递工具、打磨、扫木屑。' },
  { id: 'bakery-morning', locationId: 'oakbrook-bakery', name: '面包房帮工', minutes: 20, energy: 12, mood: 3, pay: 45, desc: '揉面、看烤箱。' },
  { id: 'post-sorter', locationId: 'oakbrook-post', name: '邮局分拣', minutes: 10, energy: 6, mood: 1, pay: 30, desc: '按街区分信件和包裹。' },
  { id: 'library-shelf', locationId: 'oakbrook-library', name: '图书馆整理', minutes: 15, energy: 5, mood: 3, pay: 25, desc: '把书按编号放回架子。' },
  { id: 'flower-trim', locationId: 'oakbrook-flower', name: '花店修枝', minutes: 15, energy: 8, mood: 3, pay: 35, desc: '剪枝、换水、包花束。' },
  { id: 'lake-helper', locationId: 'moonlake-park', name: '湖边小帮手', minutes: 10, energy: 8, mood: 2, pay: 24, desc: '帮芬恩收渔具、扫木栈道。' },
  { id: 'diary-copy', locationId: 'fish-home', name: '抄写日记', minutes: 15, energy: 4, mood: 3, pay: 20, desc: '在家把今天的见闻抄进本子换稿费。' }
]
const CROPS = {
  flower: { id: 'flower', name: '野花', seed: 'seed-flower', growMinutes: 480, sell: 60, eat: 0, gift: '花' },
  tomato: { id: 'tomato', name: '番茄', seed: 'seed-tomato', growMinutes: 720, sell: 45, eat: 8, gift: '番茄' },
  pumpkin: { id: 'pumpkin', name: '南瓜', seed: 'seed-pumpkin', growMinutes: 1440, sell: 120, eat: 6, gift: '南瓜' },
  wheat: { id: 'wheat', name: '麦子', seed: 'seed-wheat', growMinutes: 1080, sell: 70, eat: 0, gift: '麦子' },
  herb: { id: 'herb', name: '草药', seed: 'seed-herb', growMinutes: 1200, sell: 90, eat: 2, gift: '草药' }
}
const FIELD_Y = { x: 33, y: 66, w: 21, h: 25 }
const PLOT_SPOTS = [{ x: 38, y: 74 }, { x: 43.5, y: 74 }, { x: 49, y: 74 }]
const TONE_BANDS = [
  { min: 80, energy: 'energetic', voice: '很有精神', hint: '她精神很好：句子可以长一点，愿意主动提议，会用感叹号。' },
  { min: 50, energy: 'normal', voice: '正常', hint: '状态正常，平常的说话方式就好。' },
  { min: 25, energy: 'tired', voice: '有点累', hint: '她有点累：回答变短，偶尔抱怨两句，别安排太多事。' },
  { min: 10, energy: 'exhausted', voice: '很累', hint: '她很累了：短句、敷衍、想坐下；不要用感叹号，可以拒绝邀约。' },
  { min: 0, energy: 'spent', voice: '几乎没力气', hint: '她几乎没力气了：只回很短的句子，比如“……让我歇会儿”。' }
]
function gameClock(state) {
  const offset = Number(state.clockOffset || 0)
  const at = new Date(Date.now() + offset * 60000)
  const hour = at.getHours()
  const minute = String(at.getMinutes()).padStart(2, '0')
  return { offsetMinutes: Math.round(offset), local: hour + ':' + minute, hour, label: hour < 6 ? '深夜' : hour < 10 ? '早上' : hour < 13 ? '中午' : hour < 17 ? '下午' : hour < 21 ? '傍晚' : '夜里' }
}
function toneOf(state) {
  const energy = Math.max(0, Math.min(100, Number(state.energy ?? 100)))
  const mood = Math.max(0, Math.min(100, Number(state.mood ?? 50)))
  const band = TONE_BANDS.find(b => energy >= b.min) || TONE_BANDS[TONE_BANDS.length - 1]
  const moodBand = mood >= 70 ? '心情不错' : mood >= 40 ? '心情平稳' : mood >= 20 ? '有点低落' : '心情很闷'
  return { energy: Math.round(energy), mood: Math.round(mood), band: band.energy, energyLabel: band.voice, moodLabel: moodBand, voice: band.voice + ' · ' + moodBand, hint: band.hint }
}
function fullnessOf(state) {
  const last = Date.parse(state.lastMealAt || 0)
  const hours = Number.isFinite(last) ? (Date.now() - last) / 3600000 : 12
  const value = Math.max(0, Math.min(100, Math.round(100 - hours * 11)))
  const label = value >= 70 ? '饱' : value >= 40 ? '有点饿' : value >= 15 ? '饿了' : '饿坏了'
  return { value, label, hoursSinceMeal: Math.round(hours * 10) / 10, hint: value >= 40 ? '' : '她已经有一阵没吃东西了，提醒她吃饭会让她心情好一些。（只提示，不影响行动）' }
}
function ensureField(state) {
  if (!Array.isArray(state.field?.plots) || state.field.plots.length !== PLOT_SPOTS.length) {
    const prior = Array.isArray(state.field?.plots) ? state.field.plots : []
    state.field = { plots: PLOT_SPOTS.map((_, index) => prior[index] || { index, cropId: null, plantedAt: null, growth: 0, water: 100, lastTickAt: new Date().toISOString(), harvestAt: null }) }
  }
  return state.field
}
function cropStage(plot) {
  if (!plot.cropId) return { key: 'empty', label: '空着', progress: 0 }
  const crop = CROPS[plot.cropId]
  const ratio = Math.max(0, Math.min(1, Number(plot.growth || 0) / crop.growMinutes))
  const label = ratio >= 1 ? '成熟' : ratio >= 0.6 ? '长叶' : ratio >= 0.25 ? '发芽' : '播种'
  const key = ratio >= 1 ? 'ready' : ratio >= 0.6 ? 'leaf' : ratio >= 0.25 ? 'sprout' : 'seed'
  return { key, label, progress: Math.round(ratio * 100), crop, ratio }
}
function fieldView(state) {
  const field = ensureField(state)
  const plots = field.plots.map((plot, index) => {
    const stage = cropStage(plot)
    return { index, x: PLOT_SPOTS[index].x, y: PLOT_SPOTS[index].y, cropId: plot.cropId, cropName: stage.crop ? stage.crop.name : null, stage: stage.key, stageLabel: stage.label, progress: stage.progress, water: Math.round(Number(plot.water || 0)), thirsty: Number(plot.water || 0) < 20, ready: stage.progress >= 100, sell: stage.crop ? stage.crop.sell : 0 }
  })
  const planted = plots.filter(p => p.cropId).length
  return { rect: FIELD_Y, spots: PLOT_SPOTS, plots, planted, empty: plots.length - planted, crops: Object.values(CROPS).map(c => ({ id: c.id, name: c.name, seed: c.seed, growMinutes: c.growMinutes, sell: c.sell, eat: c.eat })) }
}
function tickWorld(file, state, now = new Date()) {
  let dirty = false
  const last = Date.parse(state.lastClockAt || 0)
  if (!Number.isFinite(last)) { state.lastClockAt = now.toISOString(); dirty = true }
  const activity = state.activity
  if (activity && activity.endsAt && Date.parse(activity.endsAt) <= now.getTime()) {
    const minutes = Number(activity.minutes || 0)
    state.clockOffset = Number(state.clockOffset || 0) + minutes
    state.energy = Math.max(0, Math.min(100, Number(state.energy || 0) - Number(activity.energyCost || 0) + Number(activity.energyGain || 0)))
    state.mood = Math.max(0, Math.min(100, Number(state.mood || 50) + Number(activity.moodGain || 0)))
    if (activity.kind === 'work') {
      const pay = Number(activity.pay || 0)
      state.wallet = { ...(state.wallet || {}), balance: Number(state.wallet?.balance ?? state.coins ?? 0) + pay }
      state.coins = state.wallet.balance
      state.jobStats = state.jobStats || {}
      const prior = state.jobStats[activity.jobId] || { times: 0, total: 0 }
      state.jobStats[activity.jobId] = { times: Number(prior.times || 0) + 1, total: Number(prior.total || 0) + pay, lastAt: now.toISOString() }
      state.lastWork = { jobId: activity.jobId, name: activity.label, pay, minutes, at: now.toISOString() }
      state.lastAction = { text: '在' + (activity.placeName || '镇上') + '做了' + minutes + '分钟' + activity.label + '，挣了' + pay + '镇币', at: now.toISOString() }
      state.lastResult = { kind: 'work', pay, minutes, text: '干完' + activity.label + '，到手 ' + pay + ' 镇币，精力 −' + Number(activity.energyCost || 0) + '。' }
    } else if (activity.kind === 'rest') {
      state.lastAction = { text: activity.label, at: now.toISOString() }
      state.lastResult = { kind: 'rest', text: activity.label + '，精力 +' + Number(activity.energyGain || 0) + '。' }
    } else if (activity.kind === 'farm') {
      state.lastAction = { text: activity.label, at: now.toISOString() }
      state.lastResult = { kind: 'farm', text: activity.label }
    }
    state.activity = null
    dirty = true
  }
  const field = ensureField(state)
  for (const plot of field.plots) {
    if (!plot.cropId) continue
    const tickAt = Date.parse(plot.lastTickAt || now.toISOString())
    const dt = Math.max(0, (now.getTime() - tickAt) / 60000)
    if (dt > 0) {
      const rate = Number(plot.water || 0) > 0 ? 1 : 0
      plot.growth = Number(plot.growth || 0) + dt * rate
      plot.water = Math.max(0, Number(plot.water || 0) - dt * 0.8)
      plot.lastTickAt = now.toISOString()
      const crop = CROPS[plot.cropId]
      if (plot.growth >= crop.growMinutes && !plot.harvestAt) plot.harvestAt = now.toISOString()
      dirty = true
    }
  }
  state.lastClockAt = now.toISOString()
  if (dirty) { state.updatedAt = now.toISOString(); writeState(file, state) }
  return state
}
function activeActivity(state) {
  const activity = state.activity
  if (!activity || !activity.endsAt) return null
  if (Date.parse(activity.endsAt) <= Date.now()) return null
  return { ...activity, remainMinutes: Math.max(0, Math.round((Date.parse(activity.endsAt) - Date.now()) / MINUTE_MS)) }
}
function jobsAt(state) {
  const placeId = state.location?.id
  return JOBS.filter(job => job.locationId === placeId).map(job => {
    const stat = state.jobStats?.[job.id] || { times: 0 }
    const bonus = Math.min(0.5, Number(stat.times || 0) * 0.05)
    const pay = Math.round(job.pay * (1 + bonus))
    const energy = Number(state.energy ?? 100)
    const busy = activeActivity(state)
    const reason = busy ? '手上还有活没干完' : energy < job.energy ? '精力不够，先吃点东西' : ''
    return { ...job, pay, bonus: Math.round(bonus * 100), times: Number(stat.times || 0), available: !reason, reason }
  })
}
function startActivity(state, payload) {
  const now = Date.now()
  state.activity = { ...payload, startedAt: new Date(now).toISOString(), endsAt: new Date(now + Number(payload.minutes || 0) * MINUTE_MS).toISOString() }
  return state.activity
}
function work(config, jobId) {
  const file = fileOf(config)
  const state = readTown(file)
  tickWorld(file, state)
  const busy = activeActivity(state)
  if (busy) throw new Error('正在' + busy.label + '，等这' + busy.remainMinutes + '分钟做完再说。')
  const job = JOBS.find(j => j.id === jobId) || jobsAt(state)[0]
  if (!job) throw new Error('这里没有可以干的活：' + (state.location?.name || '当前地点'))
  const stat = state.jobStats?.[job.id] || { times: 0 }
  const bonus = Math.min(0.5, Number(stat.times || 0) * 0.05)
  const pay = Math.round(job.pay * (1 + bonus))
  const energy = Number(state.energy ?? 100)
  if (energy < job.energy) throw new Error('太累了：' + job.name + '要 ' + job.energy + ' 点精力，现在只有 ' + Math.round(energy) + ' 点。先吃点东西或歇一会儿。')
  startActivity(state, { kind: 'work', jobId: job.id, label: job.name, placeName: state.location?.name, minutes: job.minutes, energyCost: job.energy, moodGain: job.mood, pay })
  state.updatedAt = new Date().toISOString()
  writeState(file, state)
  return { ok: true, mode: 'work', job: job.name, pay, minutes: job.minutes, activity: activeActivity(state), note: '这段时间也可以聊天，只是她手上正忙着。', state: withInterior(state) }
}
function rest(config, mode = 'nap') {
  const file = fileOf(config)
  const state = readTown(file)
  tickWorld(file, state)
  const busy = activeActivity(state)
  if (busy) throw new Error('正在' + busy.label + '，做完再歇。')
  const comfort = homeComfort(state)
  const atHome = state.location?.id === 'fish-home'
  const gain = mode === 'sleep' ? 100 : Math.round((atHome ? 10 : 6) + comfort.score / 8)
  if (mode === 'sleep') {
    const clock = gameClock(state)
    const until = 7
    const add = ((until - clock.hour + 24) % 24) * 60
    state.clockOffset = Number(state.clockOffset || 0) + add
    state.energy = 100
    state.mood = Math.min(100, Number(state.mood || 50) + 8)
    state.lastMealAt = new Date().toISOString()
    state.lastAction = { text: '睡了一觉，天亮了', at: new Date().toISOString() }
    state.lastResult = { kind: 'sleep', text: '睡到自然醒，精力回满，心情也好了些。' }
    state.updatedAt = new Date().toISOString()
    writeState(file, state)
    return { ok: true, mode: 'rest', activity: null, state: withInterior(state) }
  }
  startActivity(state, { kind: 'rest', label: atHome ? '在' + comfort.label + '的小屋歇一会儿' : '在长椅上眯一会儿', placeName: state.location?.name, minutes: atHome ? 20 : 30, energyGain: gain, moodGain: 2 })
  state.updatedAt = new Date().toISOString()
  writeState(file, state)
  return { ok: true, mode: 'rest', activity: activeActivity(state), state: withInterior(state) }
}
function eat(config, itemId) {
  const file = fileOf(config)
  const state = readTown(file)
  tickWorld(file, state)
  const inventory = Array.isArray(state.inventory) ? state.inventory : []
  const index = inventory.findIndex(x => x.id === itemId || x.name === itemId || x.instanceId === itemId)
  if (index < 0) throw new Error('背包里没有这样吃的')
  const item = inventory[index]
  const food = item.food || { energy: Number(item.energy || 8), mood: Number(item.mood || 2), minutes: 10 }
  inventory.splice(index, 1)
  state.energy = Math.min(100, Number(state.energy || 0) + Number(food.energy || 0))
  state.mood = Math.min(100, Number(state.mood || 50) + Number(food.mood || 0))
  state.clockOffset = Number(state.clockOffset || 0) + Number(food.minutes || 10)
  state.lastMealAt = new Date().toISOString()
  state.lastAction = { text: '吃了' + item.name, at: new Date().toISOString() }
  state.lastResult = { kind: 'eat', text: '吃了' + item.name + '，精力 +' + Number(food.energy || 0) + '，心情 +' + Number(food.mood || 0) + '。' }
  state.updatedAt = new Date().toISOString()
  writeState(file, state)
  return { ok: true, mode: 'eat', item: item.name, energy: state.energy, mood: state.mood, state: withInterior(state) }
}
function sell(config, itemId) {
  const file = fileOf(config)
  const state = readTown(file)
  tickWorld(file, state)
  const inventory = Array.isArray(state.inventory) ? state.inventory : []
  const index = inventory.findIndex(x => x.id === itemId || x.name === itemId || x.instanceId === itemId)
  if (index < 0) throw new Error('背包里没有这件东西')
  const item = inventory[index]
  const price = Number(item.price || 10)
  const rate = item.decor ? 0.6 : 0.5
  const gain = Math.max(1, Math.round(price * rate))
  inventory.splice(index, 1)
  state.wallet = { ...(state.wallet || {}), balance: Number(state.wallet?.balance ?? state.coins ?? 0) + gain }
  state.coins = state.wallet.balance
  state.clockOffset = Number(state.clockOffset || 0) + 10
  state.lastAction = { text: '卖掉了' + item.name, at: new Date().toISOString() }
  state.lastResult = { kind: 'sell', text: '把' + item.name + '卖回店里，拿到 ' + gain + ' 镇币。' }
  state.updatedAt = new Date().toISOString()
  writeState(file, state)
  return { ok: true, mode: 'sell', item: item.name, gain, state: withInterior(state) }
}
function plant(config, seedId, plotIndex = null) {
  const file = fileOf(config)
  const state = readTown(file)
  tickWorld(file, state)
  if (state.location?.id !== 'fish-home') throw new Error('要先回小屋，进小院才能种')
  const inventory = Array.isArray(state.inventory) ? state.inventory : []
  const index = inventory.findIndex(x => x.id === seedId || x.name === seedId)
  if (index < 0) throw new Error('背包里没有这种种子（花店、杂货店、药房有卖）')
  const seed = inventory[index]
  const cropId = seed.seed || Object.values(CROPS).find(c => c.seed === seed.id)?.id
  const crop = CROPS[cropId]
  if (!crop) throw new Error('这不是种子')
  const field = ensureField(state)
  const target = plotIndex == null ? field.plots.find(p => !p.cropId) : field.plots[plotIndex]
  if (!target) throw new Error('小院里没有空着的田了')
  if (target.cropId) throw new Error('这块地已经种着' + CROPS[target.cropId].name + '了')
  inventory.splice(index, 1)
  target.cropId = crop.id
  target.plantedAt = new Date().toISOString()
  target.growth = 0
  target.water = 100
  target.lastTickAt = new Date().toISOString()
  target.harvestAt = null
  state.energy = Math.max(0, Number(state.energy || 0) - 3)
  state.clockOffset = Number(state.clockOffset || 0) + 5
  state.lastAction = { text: '在小院种下' + crop.name, at: new Date().toISOString() }
  state.lastResult = { kind: 'plant', text: '种下' + crop.name + '，' + Math.round(crop.growMinutes / 60) + ' 小时左右能收（游戏时间，浇水会快一些）。' }
  state.updatedAt = new Date().toISOString()
  writeState(file, state)
  return { ok: true, mode: 'plant', crop: crop.name, plot: target.index, state: withInterior(state) }
}
function waterField(config, plotIndex = null) {
  const file = fileOf(config)
  const state = readTown(file)
  tickWorld(file, state)
  if (state.location?.id !== 'fish-home') throw new Error('要先回小屋')
  const field = ensureField(state)
  const targets = plotIndex == null ? field.plots.filter(p => p.cropId) : [field.plots[plotIndex]].filter(Boolean)
  if (!targets.length) throw new Error('小院里还没有种东西')
  const energy = Number(state.energy ?? 100)
  if (energy < 3) throw new Error('提不动水壶了，先歇一会儿')
  for (const plot of targets) plot.water = 100
  state.energy = Math.max(0, energy - 3)
  state.clockOffset = Number(state.clockOffset || 0) + 3
  state.lastAction = { text: '给小院浇了水', at: new Date().toISOString() }
  state.lastResult = { kind: 'water', text: '给 ' + targets.length + ' 块地浇了水，土是湿的。' }
  state.updatedAt = new Date().toISOString()
  writeState(file, state)
  return { ok: true, mode: 'water', watered: targets.length, state: withInterior(state) }
}
function harvest(config, plotIndex) {
  const file = fileOf(config)
  const state = readTown(file)
  tickWorld(file, state)
  if (state.location?.id !== 'fish-home') throw new Error('要先回小屋')
  const field = ensureField(state)
  const plot = field.plots[Number(plotIndex)]
  if (!plot || !plot.cropId) throw new Error('这块地上没有东西')
  const crop = CROPS[plot.cropId]
  const stage = cropStage(plot)
  if (stage.ratio < 1) throw new Error(crop.name + '还没熟（' + stage.progress + '%），再等等')
  const energy = Number(state.energy ?? 100)
  if (energy < 4) throw new Error('累得蹲不下去了，先吃口东西')
  state.inventory = Array.isArray(state.inventory) ? state.inventory : []
  state.inventory.push({ id: crop.id, name: crop.name, sprite: crop.id === 'flower' ? 'flowers' : 'box', price: crop.sell, food: crop.eat ? { energy: crop.eat, mood: 2, minutes: 8 } : null, harvestAt: new Date().toISOString() })
  plot.cropId = null; plot.growth = 0; plot.water = 100; plot.plantedAt = null; plot.harvestAt = null
  state.energy = Math.max(0, energy - 4)
  state.clockOffset = Number(state.clockOffset || 0) + 4
  state.lastAction = { text: '收了一茬' + crop.name, at: new Date().toISOString() }
  state.lastResult = { kind: 'harvest', text: '收下' + crop.name + '，能卖 ' + crop.sell + ' 镇币' + (crop.eat ? '，也能吃（+ ' + crop.eat + ' 精力）' : '') + '。' }
  state.updatedAt = new Date().toISOString()
  writeState(file, state)
  return { ok: true, mode: 'harvest', crop: crop.name, sell: crop.sell, state: withInterior(state) }
}

async function weather(config) { const file = fileOf(config); const state = readTown(file); const w = { ...(state.weather || {}) }; if (w.provider === 'city' && Number.isFinite(Number(w.latitude)) && Number.isFinite(Number(w.longitude))) { try { const url = `https://api.open-meteo.com/v1/forecast?latitude=${w.latitude}&longitude=${w.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=${encodeURIComponent(w.timezone || 'Asia/Shanghai')}`; const res = await fetch(url, { signal: AbortSignal.timeout(8000) }); if (!res.ok) throw new Error(`weather http ${res.status}`); const data = await res.json(); const c = data.current || {}; w.temperatureC = c.temperature_2m ?? w.temperatureC; w.feelsLikeC = c.apparent_temperature ?? w.feelsLikeC; w.humidity = c.relative_humidity_2m ?? w.humidity; w.windKph = c.wind_speed_10m ?? w.windKph; w.condition = String(c.weather_code ?? w.condition); w.updatedAt = new Date().toISOString(); w.source = 'open-meteo city forecast'; const latest = readState(file); latest.weather = w; latest.updatedAt = new Date().toISOString(); writeState(file, latest); return { ok:true, mode:'weather', weather:w, live:true } } catch (error) { return { ok:true, mode:'weather', weather:w, live:false, error:String(error.message || error), note:'实时天气暂时不可用，返回上次城市级缓存。' } } } return { ok:true, mode:'weather', weather:w, live:false, note:'未配置城市坐标。' } }

export { DEFAULT_FILE, status, event, act, enter, travel, buy, decorate, work, rest, eat, sell, plant, waterField, harvest, weather, npcTalk, npcGift, affectionOf, spriteOf, AFFECTION_LEVELS, eventSuggestion, HOME_ROOMS, COMFORT_LEVELS, comfortOf, comfortLevel, homeComfort, JOBS, CROPS, PLOT_SPOTS, jobsAt, toneOf, fullnessOf, fieldView, gameClock }
