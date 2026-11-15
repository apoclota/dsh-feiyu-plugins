import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/26102/.dsh/profiles/desktop/");
const yaml = require("js-yaml");
const rows = yaml.load(readFileSync("C:/Users/26102/.dsh/profiles/desktop/cordis.patch.yml", "utf8"));
const flat = rows.flatMap(r => Array.isArray(r?.insert) ? r.insert : [r]);
const preset = flat.find(r => r?.id === "preset-feiyu");
const text = preset.config.plugins[0].config.prefix;
const head = [
  "# 小渊人设（当前生效版 · QQ / 微信 / 手机共用同一份）",
  "",
  "> 这份文件是**镜像**，真正被读取的是 `C:\\Users\\26102\\.dsh\\profiles\\desktop\\cordis.patch.yml` 里的",
  "> `preset-feiyu`（微信/手机）与 `dsh-napcat.config.personaOverrides`（QQ 私聊）。",
  "> 改这里不会自动生效；改完需要同步进 patch（见 `Z:\\肥鱼的一生0.1\\tools\\apply-channel-persona.mjs`）。",
  "> 另一个文件 `C:\\Users\\26102\\.dsh\\soul-config.json` 目前没有任何已加载插件引用，改它不生效。",
  "",
  "---",
  "",
].join("\n");
writeFileSync("Z:/肥鱼的一生0.1/小渊人设-自然成长版.txt", head + text + "\n", "utf8");
console.log("written", text.length, "chars");
