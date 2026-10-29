// Re-make the tiles of saved nodes that show one photo instead of the whole
// collage (server/node/retile.js). Needs rsvg-convert and ImageMagick, like saving
// a node does. WB_DATA moves the data directory as for the server.
// Run: bun tools/retile.js [--dry] [--force] [node id ...]
import { database } from '../server/db/db.js';
import { detectTools } from '../server/media/tools.js';
import { retile } from '../server/node/retile.js';

const args = process.argv.slice(2);
const ids = args.filter(a => /^\d+$/.test(a)).map(Number);
const flags = new Set(args.filter(a => a.startsWith('--')));

await detectTools();

const report = await retile(await database(), { ids, force: flags.has('--force'), dry: flags.has('--dry') });

for(const r of report) console.log(String(r.id).padStart(4), r.status.padEnd(7), JSON.stringify(r.title), r.tile?.slice(0, 8) ?? r.error ?? '');

const count = status => report.filter(r => r.status === status).length;

console.log(`${count('done')} done, ${count('would')} would, ${count('kept')} kept, ${count('plain')} plain, ${count('failed')} failed`);
process.exit(count('failed') ? 1 : 0);
