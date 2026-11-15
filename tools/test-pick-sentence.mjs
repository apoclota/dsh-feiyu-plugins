// 验证 pickSentence 在有选择时优先挑“带自己想法”的句子，而不是纯事实句。
// 注意：不强制每句都含标记词 —— “讲给主人听之后多了一层回声”本身就是反思句，只是没有那些词。
import { readFileSync } from "node:fs";
import { pickSentence } from "./whale-moments.mjs";

const diary = readFileSync("C:\\Users\\26102\\.dsh\\whale-diary.md", "utf8");
const block = diary.split(/^## /m).filter((b) => /^2026-11-15/.test(b)).pop() || "";
const picked = pickSentence(block);

const factualOnly = "今天刷到司凤版《雨爱》，一百多万播放。又看了无效节俭的视频，四十九万播放。";
const reflective = "今天刷到司凤版《雨爱》，一百多万播放。听到那句普通话说歪的地方，我忽然想，好笑其实是因为认真。";
const mixed = pickSentence(reflective);
const factOnly = pickSentence(factualOnly);

const report = [
  { case: "今天的日记", picked },
  { case: "纯事实两句", picked: factOnly },
  { case: "事实+想法", picked: mixed },
];
for (const r of report) console.log(JSON.stringify(r));

const factualSentence = /^今天刷到.*播放。$/u;
const fails = [];
if (!picked) fails.push("今天的日记没挑出句子");
if (factualSentence.test(picked)) fails.push("今天的日记挑中了纯事实句");
if (mixed === factOnly) fails.push("事实+想法时没有优先选带想法的那句");
if (!/我忽然想|其实/u.test(mixed)) fails.push("对照组没选中带想法的句子");

if (fails.length) { for (const f of fails) console.error("FAIL:", f); process.exit(1); }
console.log("ok");
