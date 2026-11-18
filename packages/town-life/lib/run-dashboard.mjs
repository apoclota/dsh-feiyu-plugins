import { startDashboard } from './dashboard.mjs'
// 单独起一次地图服务时用：DSH_TOWN_LIFE_FILE 指存档，不填则用 state.mjs 的默认位置（~/.dsh/town-life.json）
startDashboard({ stateFile: process.env.DSH_TOWN_LIFE_FILE })
console.log('town-dashboard-ready')
