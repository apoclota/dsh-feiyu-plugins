import fs from 'node:fs';
import zlib from 'node:zlib';
import { pipeline } from 'node:stream/promises';

const p = 'C:\\Users\\26102\\.dsh\\sessions\\--Z-feiyu-phone--\\phone-chat-owner\\session.v4.jsonl.zstd';
const chunks = [];
await pipeline(
  fs.createReadStream(p),
  zlib.createZstdDecompress({ finishFlush: zlib.constants.ZSTD_e_continue }),
  async function* (src) { for await (const c of src) chunks.push(c); },
);
const text = Buffer.concat(chunks).toString('utf8');
const lines = text.split('\n').filter((l) => l.trim());
console.log('lines', lines.length);
for (const l of lines.slice(-6)) {
  try {
    const o = JSON.parse(l);
    console.log('---', o.time ?? o.at ?? o.ts ?? '', o.type ?? o.kind ?? '');
    console.log(JSON.stringify(o).slice(0, 400));
  } catch { console.log(l.slice(0, 160)); }
}
