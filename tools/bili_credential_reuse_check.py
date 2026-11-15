"""One-shot same-account credential migration; emits no credential values."""
import hashlib
import json
import os
from pathlib import Path
import sys

import httpx
from bilibili_api import Credential
from bili_cli import config


def main():
    source = Path(os.environ['USERPROFILE']) / '.bili-ai' / 'credentials.json'
    original = source.read_bytes()
    values = json.loads(original)
    if not all(values.get(k) for k in ('sessdata', 'bili_jct')):
        raise ValueError('required_fields_missing')
    cookie = '; '.join(f'{name}={values[key]}' for name, key in [('SESSDATA', 'sessdata'), ('bili_jct', 'bili_jct'), ('buvid3', 'buvid3')] if values.get(key))
    with httpx.Client(timeout=25, headers={'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.bilibili.com/', 'Cookie': cookie}) as client:
        response = client.get('https://api.bilibili.com/x/web-interface/nav')
        response.raise_for_status()
        nav = response.json()
    account = nav.get('data') or {}
    if nav.get('code') != 0 or account.get('isLogin') is not True or str(account.get('mid')) != '277384306':
        print(json.dumps({'ok': False, 'stage': 'account_validation'}, ensure_ascii=True))
        return 2
    target = config.credential_path()
    backup = None
    if target.exists():
        from datetime import datetime
        backup = target.with_name('credential.pre-reuse-' + datetime.now().strftime('%Y%m%dT%H%M%S%f') + '.json.bak')
        backup.write_bytes(target.read_bytes())
    fields = {key: values.get(key) for key in config.CREDENTIAL_FIELDS}
    fields['dedeuserid'] = str(account['mid'])
    config.save_credential(Credential(**fields))
    unchanged = hashlib.sha256(original).digest() == hashlib.sha256(source.read_bytes()).digest()
    print(json.dumps({'ok': True, 'mid': account['mid'], 'saved': str(target), 'backup': str(backup) if backup else None, 'legacy_unchanged': unchanged, 'has_refresh_token': bool(fields.get('ac_time_value'))}, ensure_ascii=True))
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print(json.dumps({'ok': False, 'error_type': type(error).__name__}, ensure_ascii=True))
        sys.exit(1)
