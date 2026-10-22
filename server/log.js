// Development log: requests, responses, commands run and files written or
// removed. Off unless the server is started with `--dev` or with the
// environment variable WB_DEV set (to anything but "", "0" or "false").
import { relative } from 'node:path';
import { config } from './config.js';

const env = process.env.WB_DEV;

export const dev = process.argv.includes('--dev') || (!!env && env !== '0' && env !== 'false');

// path relative to the project root when it is inside it
const short = path => {
  const rel = relative(config.root, path);

  return rel.startsWith('..') ? path : rel;
};

// quote an argument for display when it has spaces or quotes
const quote = arg => (/^[\w@%+=:,./-]+$/.test(arg) ? arg : JSON.stringify(arg));

export function log(kind, ...parts) {
  if(dev) console.log(`${new Date().toISOString().slice(11, 23)} ${kind.padEnd(5)} ${parts.join(' ')}`);
}

export const logCommand = argv => log('exec', argv.map(quote).join(' '));
export const logFile = (op, path, detail = '') => log(op, short(path), detail);
