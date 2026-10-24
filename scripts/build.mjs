import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (process.platform === 'win32') {
  run('cmd.exe', ['/d', '/s', '/c', 'npx vite build']);
} else {
  run('/bin/bash', ['-lc', 'npx vite build']);
}

run(process.execPath, [path.join(rootDir, 'scripts', 'build-server.mjs')]);
