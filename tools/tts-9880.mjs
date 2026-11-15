#!/usr/bin/env node
// DSH_TTS_CMD 适配器：让 dsh-wechat-media / speak-up 的语音用本机 9880 的「小渊」音色，
// 而不是 Windows SAPI 的机器人腔。
//
// 插件调用约定（voice.js）：<cmd> <outPath> <textPath>
//   - textPath: UTF-8 文本，就是要说的话
//   - outPath : 需要写出的音频文件（插件随后会自己转 mp3/amr/silk）
//
// 环境变量：
//   DSH_TTS_URL    默认 http://127.0.0.1:9880/tts
//   DSH_TTS_VOICE  默认 breeze（QQ 用的「清亮」音色）
//   DSH_TTS_SPEED  默认 1

import { readFileSync, writeFileSync } from 'node:fs';

const [outPath, textPath] = process.argv.slice(2);
if (!outPath || !textPath) {
  console.error('usage: tts-9880.mjs <outPath> <textPath>');
  process.exit(2);
}

const text = readFileSync(textPath, 'utf8').replace(/\s+/g, ' ').trim();
if (!text) {
  console.error('empty text');
  process.exit(2);
}

const base = (process.env.DSH_TTS_URL || 'http://127.0.0.1:9880/tts').trim();
const voice = (process.env.DSH_TTS_VOICE || 'breeze').trim();
const speed = (process.env.DSH_TTS_SPEED || '1').trim();
const url = `${base}?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}&speed=${encodeURIComponent(speed)}`;

const res = await fetch(url, { signal: AbortSignal.timeout(180_000) });
if (!res.ok) {
  console.error(`tts http ${res.status}`);
  process.exit(1);
}
const bytes = Buffer.from(await res.arrayBuffer());
if (bytes.length < 1000) {
  console.error(`tts returned only ${bytes.length} bytes`);
  process.exit(1);
}
writeFileSync(outPath, bytes);
console.log(`ok ${bytes.length} bytes -> ${outPath}`);
