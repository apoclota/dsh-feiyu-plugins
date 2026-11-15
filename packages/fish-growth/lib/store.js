import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomBytes } from 'node:crypto';
import { freshState, normalizeState } from './engine.js';

export class GrowthStore {
  constructor({ home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh'), profileKey = 'feiyu', now = Date.now } = {}) {
    this.directory = path.join(home, 'fish-growth');
    this.profileKey = String(profileKey).replace(/[^\p{L}\p{N}_.-]/gu, '_').slice(0, 80) || 'feiyu';
    this.file = path.join(this.directory, `${this.profileKey}.json`);
    this.now = now;
  }
  read() {
    try { return normalizeState(JSON.parse(fs.readFileSync(this.file, 'utf8').replace(/^\uFEFF/u, '')), this.profileKey, this.now()); }
    catch (error) { if (error.code === 'ENOENT') return freshState(this.now()); throw error; }
  }
  write(state) {
    fs.mkdirSync(this.directory, { recursive: true });
    const temporary = `${this.file}.${process.pid}.${randomBytes(5).toString('hex')}.tmp`;
    try {
      fs.writeFileSync(temporary, JSON.stringify(state, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      fs.renameSync(temporary, this.file);
    } finally { try { fs.unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
  }
  backup() {
    fs.mkdirSync(this.directory, { recursive: true });
    const backup = `${this.file}.bak-${this.now()}`;
    if (fs.existsSync(this.file)) fs.copyFileSync(this.file, backup);
    return backup;
  }
}
