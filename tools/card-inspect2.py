import sqlite3, sys, json, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

db = r'Z:\肥鱼的一生0.1\artifacts\cardcopy\card.db'
c = sqlite3.connect(db)
c.row_factory = sqlite3.Row
for kw in ('爸爸', '主人'):
    rows = c.execute("SELECT id,raw,core,region,pool FROM mem WHERE raw LIKE ?", (f'%{kw}%',)).fetchall()
    print(f'== {kw}: {len(rows)} rows')
    for r in rows[:4]:
        print(' id', r['id'], '| raw:', r['raw'])
        print('   core:', r['core'], '| region', r['region'], 'pool', r['pool'])
        for d in c.execute('SELECT kind,text,weight FROM detail WHERE parent_id=? ORDER BY weight DESC', (r['id'],)):
            print('    detail', d['kind'], round(d['weight'], 2), d['text'][:80])
