# dsh-memewiki：单会话挂载补丁

原插件：[thawline/dsh-memewiki](https://github.com/thawline/dsh-memewiki)（MIT，6792 条梗库，本地 SQLite，零依赖）。

原版把 `search_meme_wiki` / `feedback_meme_wiki` 和梗百科预查提示注册为**全局**——任何会话都能用。我想要的是「只在我和它聊天这个会话里出现」，于是把挂载改成按会话白名单。

## 改了两个地方

### 1. 新增 `lib/qq-scope.mjs`

本目录里的文件就是它，直接覆盖到 `node_modules/dsh-memewiki/lib/qq-scope.mjs`。

配置在 `%USERPROFILE%\.dsh\memewiki-scope.json`：

```json
{ "sessions": ["session-xxxxxxxx"], "workspaces": [] }
```

- 任一命中即挂载；文件不存在 = **不挂任何会话**（默认不外溢）；
- 每次同步前读文件（1s 缓存），改完不用重启，最多 1.5 秒生效；
- 命中情况写 `%USERPROFILE%\.dsh\memewiki-scope-debug.log`，排查「为什么这个会话没工具」时先看它。

### 2. `lib/index.js` 里关掉全局注册

```js
// 顶部加
import { installScoped } from './qq-scope.mjs'

// apply() 里，原来的全局注册块改成
const scopeCleanup = installScoped({ ctx, /* 两个工具的 define 与提示文本 */ })
```

原文件里被关掉的是这四处（行号对应 0.1.20）：

```
:877  if (false) { try {   // 全局 search_meme_wiki
:903  if (false) { try {   // 全局 feedback_meme_wiki
:930  if (false) { try {   // 全局 systemPrompt 预查
:966  if (false) ctx.webServer.register(  // 设置页用的 web API
```

改成 `if (false)` 是最省事的关法，代价是那些代码还留在文件里；想干净就整块删掉。

## 必须知道的坑

**DSH 只把 session id 交给插件**：`agent.session.cwd / workspace / root` 全是空的，`agent.cwd / workspace / root` 也没有。所以：

- 按工作目录匹配**永远命中不了**，`workspaces` 这个字段基本是给自己留的念想；
- 只能按 session id 匹配，session id 形如 `session-0f00df71-....`，在 `%USERPROFILE%\.dsh\sessions\<工作区>--\<会话id>\` 目录名里能找到；
- 想给某个渠道（QQ 私聊、手机桥、微信）配，用它们各自的会话 id，例如手机桥固定是 `phone-chat-owner`。

## 验证

```bash
node --check lib/qq-scope.mjs
node --test lib/qq-scope.test.mjs   # 原插件自带的 2 个用例，改完后仍应通过
```

再在目标会话里问一句「yyds 是什么意思」，能调出词条就通了；在别的会话里问同一句，应该看不到这个工具。
