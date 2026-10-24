const { spawn } = require('child_process');
const p = spawn(process.execPath, ['dist/server.js'], {
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let out = '';
p.stdout.on('data', (d) => (out += d));
p.stderr.on('data', (d) => (out += d));
setTimeout(async () => {
  console.log('---SERVER LOG---');
  console.log(out);
  try {
    const r = await fetch('http://localhost:3000/api/health');
    console.log('HEALTH:', r.status, await r.text());
    const h = await fetch('http://localhost:3000/');
    const t = await h.text();
    console.log('ROOT:', h.status, 'index.html served:', t.includes('id="root"'));
    const pr = await fetch('http://localhost:3000/api/products');
    console.log('PRODUCTS:', pr.status);
  } catch (e) {
    console.log('FETCH FAIL:', e.message);
  }
  p.kill();
  process.exit(0);
}, 5000);
