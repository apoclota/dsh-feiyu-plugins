# tools

这些脚本是我日常在用的，不是示例玩具，但**里面的路径、会话名、聊天标题都写死成了我这台机器的**。跑之前先按你的环境改一遍，主要改这几样：

- `C:\Users\26102\...`、`Z:\肥鱼的一生0.1\...`、`E:\whale-girl\...` 这些绝对路径；
- 微信聊天标题（默认发给「文件传输助手」做测试）；
- QQ 号占位符 `0000000000`；
- 本机端口：TTS 9880、WhaleGirl 8787、手机桥 8765、NapCat 3001 / WebUI 6099、数字生命卡 8848。

## 微信

- `wx-say.py` — 给已登录的微信私聊发一条文字。`--title` 精确匹配会话名，`--dry-run` 只演练，默认键鼠空闲 8 秒才发。需要 `uiautomation`。
- `wx-voice-bubble.py` — 发一条真语音气泡：本地 TTS → 虚拟声卡 → 按住 `Ctrl+Tab` → 松开。需要 VB-CABLE，微信 4.x。
- `tts-9880.mjs` — 给上面两个脚本当合成后端（读文本文件，请求 9880，写音频文件）。

## 朋友圈

- `whale-moments.mjs` — `view` / `scan` / `auto [--dry]`。读日记 → 挑一句 → 建草稿 → confirm，交给 WhaleGirl 的发表引擎点「发表」。挑句会优先选带判断/想法的句子，避免只发“看了什么、多少播放”。
  需要 WhaleGirl 在跑，token 从它的 `config.json` 里读 `gateway.wechat.inboundToken`（脚本只读不打印）。

## B 站

- `bili-digest.mjs` — 读两本日记 + fish-growth 的当前情绪，输出一段摘要（`--text` 只要正文）。需要 `bili-agent` 已经登录。
- `test-pick-sentence.mjs` — 给 `whale-moments.mjs` 的挑句逻辑跑对照测试。

## 记忆

- `import-memories-to-card.mjs` — 把旧的 `fish-memory/*.json` 与 `memory-engine/memories.json` 导入卡。带去重和 `SKIP` 规则（版本号、路径、端口、快捷键、TTS 音色、wxid、「测试/调试/探针」这类），默认只预览，`--apply` 才写。
- `card-inspect.py` / `card-inspect2.py` — 在卡的**副本**上列表和样例行，别对着生产库跑。
- `card-region-fix.py` — 检查记忆的 `region` 分类是否合理；只做“升级”（往衰减更慢的区挪），默认 `--dry`。

## 运维

- `qq-napcat-monitor.ps1` — 每分钟看进程、3001 监听/连接、登录日志最后一段；掉线时提醒一次（`msg.exe`），可选打开 WebUI。配合计划任务用，窗口建议用 `wscript` 隐藏启动。
- `restart-dsh.ps1` — 延迟重启 DSH（先杀再以原参数拉起），我用计划任务触发，避免重启把自己也杀掉。
- `session-tail.mjs` / `session-tail.py` — 读 DSH 的 zstd 会话文件最后几条，排查「她到底说了什么」时用。

## 人设

- `apply-channel-persona.mjs` — 从 QQ 的 `personaOverrides` 抽正文，生成 `preset-feiyu` 这一行写进 profile patch，让微信/手机也用同一份人设。
- `export-persona.mjs` — 反向导出，把当前生效的人设镜像成 `.txt` 方便改。
- `tighten-persona.mjs` / `fix-persona-indent.mjs` — 改措辞、修 YAML 缩进（改人设最容易把 patch 弄坏，这两个是止血用的）。
- `import-memories-to-card.mjs`、`bili_credential_reuse_check.py` — 见上。

改人设前请先备份 `cordis.patch.yml`：它是 YAML，字符串里带换行或引号时很容易缩进错位，`js-yaml` 会直接解析失败。
