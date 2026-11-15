import fs from "node:fs";
import { Readable } from "node:stream";
const url = process.argv[2];
const out = process.argv[3];
const t0 = Date.now();
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), 600000);
const res = await fetch(url, { redirect: "follow", signal: ctrl.signal });
console.log("status", res.status, res.headers.get("content-length"), res.headers.get("content-type"));
if (!res.ok) { process.exit(1); }
await new Promise((ok, bad) => {
  const s = fs.createWriteStream(out);
  Readable.fromWeb(res.body).pipe(s).on("finish", ok).on("error", bad);
});
clearTimeout(timer);
console.log("saved", out, (fs.statSync(out).size / 1048576).toFixed(1) + "MB", ((Date.now() - t0) / 1000).toFixed(1) + "s");
