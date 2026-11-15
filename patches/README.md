# patches

这些是**打第三方插件**的补丁，不是我们自己的包。升级第三方后会被覆盖，需要重打；每个补丁都只改一两行，回滚就是删掉。

| 补丁 | 目标 | 改了什么 |
| --- | --- | --- |
| `dsh-wechat-media-voice-tts.diff` | `dsh-wechat-media` 1.24.13 | 语音合成默认走本地 9880，不再退回 Windows SAPI |
| `dsh-memewiki-session-scope/` | `dsh-memewiki` 0.1.20 | 全局工具 + 全局提示改成「只在白名单会话里挂载」 |

## 应用方式

在 profile 目录（`node_modules` 的上一级）执行：

```bash
git apply --directory=node_modules/dsh-wechat-media patches/dsh-wechat-media-voice-tts.diff
```

不想用 git，就照着 diff 手工改那几行。也可以完全不改代码，改用环境变量（见下面）。

## dsh-wechat-media-voice-tts

插件先读 `DSH_TTS_CMD`，没有就退回 SAPI（中文音色明显是系统朗读）。本机已有 9880 的 TTS，把默认值指向 `tools/tts-9880.mjs` 即可，调用约定不变：`<命令> <输出文件> <文本文件>`。

等价做法（不改代码）：

```
DSH_TTS_CMD=node C:\你的路径\tools\tts-9880.mjs
```

## dsh-memewiki-session-scope

原插件（[thawline/dsh-memewiki](https://github.com/thawline/dsh-memewiki)，MIT）把 `search_meme_wiki` / `feedback_meme_wiki` 和梗百科预查注册成**全局**的，所有会话都能用。我要的是「只在我聊天这个会话里出现」，所以把挂载逻辑改成按会话白名单。

改动要点：

1. 新增 `lib/qq-scope.mjs`：读 `~/.dsh/memewiki-scope.json`（`{"sessions":[...],"workspaces":[]}`），1500ms 轮询 + `agent/created`，命中才在该 agent 的 `ctx.tools.register` 与 `ctx.systemPrompt.context` 上挂载；
2. `lib/index.js` 里原来的全局 `ctx.tools.register` / 全局 `systemPrompt` 块用 `if (false)` 关掉，改为调用 `installScoped`；
3. 清理走 `ctx.effect(() => () => cleanup)`，卸载时把工具、提示、定时器、监听一起撤掉。

DSH 只把 session id 交给插件（`agent.session.cwd/workspace/root` 是空的），所以**只能按 session id 匹配**，按工作目录匹配永远命中不了——这是我踩过的坑，写在这里省得你再踩。

文件在 `dsh-memewiki-session-scope/qq-scope.mjs`，覆盖到 `node_modules/dsh-memewiki/lib/qq-scope.mjs` 即可；`index.js` 的改动按 `dsh-memewiki-session-scope/README.md` 里的说明手改（只有两处）。
