# dsh-feiyu-plugins

我在 DeepSeek Harness（DSH）上给自己养的一只「鱼」写的几个插件与工具：情绪与成长、长期记忆接入、以及把微信当聊天窗口用的脚本。

不是框架，也不是通用聊天机器人；这些代码是先解决我自己的问题才长出来的，所以很多地方带着具体场景的取舍（Windows、中文、个人微信、单机）。你可以直接拿去改。

## 里面有什么

```
packages/
  fish-growth/     情绪 + 内分泌 + 性格成长的 DSH 插件（后台 + 设置页）
  whale-bridge/    数字生命卡（SYNAPSE-1024）的会话级接入插件
tools/             微信直发 / 语音气泡 / 朋友圈 / TTS / B站摘要 等脚本
docs/              微信接入、记忆架构两份说明
```

### packages/fish-growth

一次对话结束后，用一次模型调用判断「这句话让她的情绪怎么动」，把结果写进一份按渠道共享的状态文件：

- **17 条情绪轴**：joy / calm / affection / anger / hurt / worry / sadness / curiosity / fatigue / jealousy / longing / desire / envy / pride / shame / guilt / playful-mischief，各有半衰期（默认 8h），会自己淡下去；
- **4 条内分泌轴**（serotonin / dopamine / cortisol / oxytocin）：由情绪推动、按 13.9h 半衰期回归基线，还带昼夜节律。它只影响「怎么说话」（话多话少、句子长短、想不想提以前的事），不写成命令，也不在提示词里报数字；
- **性格与美德**：warmth / playfulness / curiosity / candor / patience / initiative / caution / expressiveness；honesty / kindness / respect / humility / reliability / prudence。性格要连续多次证据才会提议改动，且必须由人批准；
- **策略**：同一件事反复出现、她判断需要改做法时，会给你一条「我下次想这样做」的提议，你可以批准或拒绝；
- **边界写在引擎里**：情绪不能成为惩罚、操控、忽视、责备或越界的理由；负面情绪只表现成语气，不改变事实与承诺。

状态文件在 `~/.dsh/fish-growth/<profileKey>.json`（配置在 `<profileKey>.config.json`），所有渠道共用一个 `profileKey`，所以微信、手机、QQ 看到的是同一个她。

设置页可以调：参与采集的会话白名单（默认空 = 谁都不采集）、情绪影响强度 0–200%、情绪/反刍半衰期、性格提案的观察轮数、最低置信度、注入模式（完整 / 精简 / 关闭）。

### packages/whale-bridge

把「数字生命卡」当长期记忆用，只挂在你指定的会话上：

- 5 个工具：`mind_context`（回话前取相关记忆）、`mind_report`（回完记账）、`mind_recall`（找具体的事）、`mind_remember`（钉死一条）、`mind_health`；
- 按 `~/.dsh/whale-bridge-scope.json` 的 `sessions` 列表精确匹配会话 id，不注册全局工具、不注入全局人格；
- 卡里没翻到就回「没翻到」，连不上就说没连上——不许编。

职责划分是刻意分开的：**卡管事实与记忆，fish-growth 管情绪与人格**，避免两套情绪、两套人格互相打架。

### tools/

都是可以直接跑的脚本，路径和昵称请按你自己的改：

| 脚本 | 干什么 |
| --- | --- |
| `wx-say.py` | 直接驱动已登录的微信客户端发一条私聊消息（UIA，键鼠空闲才发） |
| `wx-voice-bubble.py` | 微信语音气泡：本地 TTS → 虚拟声卡 → 按住「发语音」→ 松开 |
| `whale-moments.mjs` | 从日记里挑一句发朋友圈（走 WhaleGirl 的日记草稿链） |
| `bili-digest.mjs` | B 站日记摘要 + 当前情绪 |
| `tts-9880.mjs` | 调本地 9880 TTS 服务，给微信插件当合成命令 |
| `qq-napcat-monitor.ps1` | NapCat/QQ 掉线监控（进程、端口、日志），掉线时提醒一次 |
| `import-memories-to-card.mjs` | 把旧记忆文件导入卡，带调试/配置类过滤 |
| `session-tail.mjs` | 读 DSH 的 zstd 会话文件尾巴（调试用） |

## 装法

DSH 的插件是「包 + bundle 行」两件事。以 fish-growth 为例：

1. 把 `packages/fish-growth` 复制到 `<profile>/node_modules/dsh-fish-growth`；
2. 在 profile 的 `package.json` 里加依赖 `"dsh-fish-growth": "file:./node_modules/dsh-fish-growth"`，并把 `dsh-fish-growth` 加进 `dsh.profile.bundles`；
3. 重载该 bundle（或重启 DSH）。

`packages/*/cordis.patch.yml` 里是 bundle 行，插件自己的配置写在这里或 profile 的 patch 层。

## 说明与限制

- 只测过 Windows + DSH 桌面版；`tools/` 里的脚本大量使用 Windows 专有 API（UIA、`GetLastInputInfo`、`winmm`），换系统要重写。
- 微信那条链路有硬限制：官方 iLink 通道只在「刚收到消息」的窗口里才能外发，所以主动说话只能走桌面自动化；语音气泡依赖虚拟声卡（VB-CABLE）和已登录的微信客户端，会短暂占用前台。细节见 `docs/微信接入.md`。
- 情绪判断会消耗模型调用（默认同一会话 90 秒最多一次，失败只告警不影响对话）。
- 没有任何遥测；状态全在本机文件里。仓库里不含 token、账号或聊天记录，示例中的 QQ 号、昵称都是占位符。

## License

MIT，见 `LICENSE`。
