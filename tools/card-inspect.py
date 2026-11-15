import sqlite3, json

db = r'Z:\肥鱼的一生0.1\artifacts\cardcopy\card.db'
c = sqlite3.connect(db)
c.row_factory = sqlite3.Row
tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'")]
print('tables:', tables)
name = 'mem' if 'mem' in tables else ('memory' if 'memory' in tables else tables[0])
cols = [r[1] for r in c.execute(f'PRAGMA table_info({name})')]
print(name, 'cols:', cols)
rows = c.execute(f'SELECT * FROM {name} ORDER BY id LIMIT 2').fetchall()
for r in rows:
    d = dict(r)
    for k, v in list(d.items()):
        if isinstance(v, (bytes,)):
            d[k] = f'<{len(v)} bytes>'
    print(json.dumps(d, ensure_ascii=False)[:900])
