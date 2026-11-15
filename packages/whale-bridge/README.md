# dsh-whale-bridge

把本地「数字生命卡」（SYNAPSE-1024，Python 进程，默认 `127.0.0.1:8848`）接进 DSH。
插件只做门：记忆、人格、衰减曲线都在 `card.db` 里，插件不直接开库。

## 工具

按白名单会话挂载，只有 5 个日常工具：

| 工具 | 用途 |
| --- | --- |
| `mind_context` | 取这一轮相关的记忆片段（只回记忆，不回人格/心境） |
| `mind_report` | 一轮结束写回：他说的 + 你回的 |
| `mind_recall` | 按意思找记忆 |
| `mind_remember` | 主动钉一条长期记忆 |
| `mind_health` | 连得上吗、几条、链是否完好、第几天 |

维护动作（盖章、磁盘同步、梦境提交、时间线、防污报告、参数预览）不暴露给模型，
需要时用 HTTP 直接调：`GET /health`、`POST /report`、`POST /remember` 等。

## 作用域

只挂白名单里的会话，配置在 `%USERPROFILE%\.dsh\whale-bridge-scope.json`：

```json
{ "sessions": ["session-xxxx", "phone-chat-owner", "napcat-private-0000000000"] }
```

文件不存在 → 一个会话也不挂（默认不外溢）。命中情况记在
`%USERPROFILE%\.dsh\whale-bridge-scope-debug.log`。

## 分工

- **卡**：长期记忆（三级池 + 分区衰减 + 哈希链 + 身份锚）
- **dsh-fish-growth**：情绪 17 轴 + 四激素 + 人格提案
- 两边不互相注入人格，避免两套人设打架。

## 放弃的旧做法

- 全局注册 16 个工具 + 全局 `systemPrompt` 塞「每轮先 context 后 report」→ 挤占所有人设，已删。
- `dsh.client.inject` 8 个客户端服务 → 会触发 `web boot: entry did not activate`，已删。
