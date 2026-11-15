import zlib, sys, json, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
p = r'C:\Users\26102\.dsh\sessions\--Z-feiyu-phone--\phone-chat-owner\session.v4.jsonl.zstd'
raw = open(p, 'rb').read()
out = bytearray()
i = 0
while i < len(raw):
    if raw[i:i+4] != b'\x28\xb5\x2f\xfd':
        i += 1
        continue
    d = zlib.decompressobj()
    try:
        out += d.decompress(raw[i:])
        i = len(raw) - len(d.unused_data)
    except Exception as e:
        print('frame err', e); break
lines = [l for l in out.decode('utf-8', 'replace').splitlines() if l.strip()]
print('frames→lines:', len(lines))
for l in lines[-6:]:
    try:
        o = json.loads(l)
    except Exception:
        print(l[:200]); continue
    t = o.get('time') or o.get('at') or o.get('ts') or ''
    kind = o.get('type') or o.get('kind') or ''
    print('---', t, kind)
    print(json.dumps(o, ensure_ascii=False)[:500])
