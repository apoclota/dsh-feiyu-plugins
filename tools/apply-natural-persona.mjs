import fs from 'node:fs';
const root = 'C:/Users/26102/.dsh';
const persona = fs.readFileSync('Z:/肥鱼的一生0.1/小渊人设-自然成长版.txt', 'utf8').trim();
const configPath = root + '/soul-config.json';
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
cfg.customInstructions = persona;
if (cfg.personas?.['大肥鱼']) cfg.personas['大肥鱼'].customInstructions = persona;
for (const scope of Object.values(cfg.workspaces?.scopes || {})) {
  if (scope.__persona === '大肥鱼') scope.customInstructions = persona;
}
fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2) + '\n');
const patchPath = root + '/profiles/desktop/cordis.patch.yml';
let patch = fs.readFileSync(patchPath, 'utf8');
if (patch.includes('    personaOverrides:')) throw new Error('Existing personaOverrides requires manual merge');
const entry = '    personaOverrides: ' + JSON.stringify('private:0000000000=' + persona.replace(/\r?\n+/g, ' ')) + '\n';
const anchor = '    reconnectMaxAttempts: 3\n';
if (patch.split(anchor).length !== 2) throw new Error('QQ configuration anchor not unique');
patch = patch.replace(anchor, anchor + entry);
fs.writeFileSync(patchPath, patch);
console.log('Updated shared soul persona and owner-only QQ override; retained reconnect limit.');
