import fs from 'node:fs';
import zlib from 'node:zlib';

const p = 'C:\\Users\\26102\\.dsh\\sessions\\--Z-feiyu-phone--\\phone-chat-owner\\session.v4.jsonl.zstd';
const buf = fs.readFileSync(p);
const out = [];
let off = 0;
while (off + 4 <= buf.length) {
  if (buf[off] !== 0x28 || buf[off + 1] !== 0xb5 || buf[off + 2] !== 0x2f || buf[off + 3] !== 0xfd) { off += 1; continue; }
  try {
    const res = zlib.zstdDecompressSync(buf.subarray(off), { finishFlush: zlib.constants.ZSTD_e_continue });
    out.push(res);
    break;
  } catch (e) {
    off += 1;
  }
}
const text = Buffer.concat(out).toString('utf8');
const lines = text.split('\n').filter((l) => l.trim());
console.log('lines', lines.length);
for (const l of lines.slice(-5)) {
  try {
    const o = JSON.parse(l);
    const t = o.time ?? o.at ?? o.ts ?? '';
    console.log('---', t, o.type ?? o.kind ?? '');
    console.log(JSON.stringify(o).slice(0, 420));
  } catch { console.log(l.slice(0, 200)); }
}
