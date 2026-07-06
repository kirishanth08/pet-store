import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const [, , manifestPath] = process.argv;

if (!manifestPath) {
  console.error('Usage: node tools/convert-images-to-webp.mjs <manifest.json>');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(resolve(manifestPath), 'utf8'));
const root = process.cwd();
const port = 41777 + Math.floor(Math.random() * 1000);
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = mkdtempSync(resolve(tmpdir(), 'petmart-edge-webp-'));
const results = [];

function send(res, status, body, type = 'text/plain') {
  res.writeHead(status, { 'content-type': type, 'access-control-allow-origin': '*' });
  res.end(body);
}

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    send(res, 200, page(), 'text/html');
    return;
  }

  if (req.method === 'GET' && req.url?.startsWith('/file?')) {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const path = resolve(root, url.searchParams.get('path') || '');
    const data = readFileSync(path);
    send(res, 200, data, contentType(path));
    return;
  }

  if (req.method === 'POST' && req.url === '/save') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const out = resolve(root, payload.out);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, Buffer.from(payload.data, 'base64'));
      results.push(payload.out);
      send(res, 200, 'ok');
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/log') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      console.log(Buffer.concat(chunks).toString('utf8'));
      send(res, 200, 'ok');
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/done') {
    send(res, 200, 'done');
    shutdown();
    return;
  }

  send(res, 404, 'not found');
});

function contentType(path) {
  const lower = path.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function page() {
  const jobs = JSON.stringify(manifest);
  return `<!doctype html>
<meta charset="utf-8">
<script>
const jobs = ${jobs};

async function log(message) {
  await fetch('/log', { method: 'POST', body: message });
}

function loadImage(job) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => reject(new Error('Decode timeout: ' + job.src)), 10000);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Decode failed: ' + job.src));
    };
    img.src = '/file?path=' + encodeURIComponent(job.src) + '&v=' + Math.random();
  });
}

async function convert(job) {
  await log('Converting ' + job.out);
  const img = await loadImage(job);
  const canvas = document.createElement('canvas');
  canvas.width = job.width || img.naturalWidth;
  canvas.height = job.height || img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  const cover = job.fit === 'cover';
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (cover) {
    const sourceRatio = img.naturalWidth / img.naturalHeight;
    const targetRatio = canvas.width / canvas.height;
    if (sourceRatio > targetRatio) {
      sw = Math.round(img.naturalHeight * targetRatio);
      sx = Math.round((img.naturalWidth - sw) / 2);
    } else {
      sh = Math.round(img.naturalWidth / targetRatio);
      sy = Math.round((img.naturalHeight - sh) / 2);
    }
  }
  ctx.fillStyle = job.background || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const data = canvas.toDataURL('image/webp', job.quality || 0.86).split(',')[1];
  await fetch('/save', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ out: job.out, data })
  });
}

(async () => {
  for (const job of jobs) {
    try {
      await convert(job);
    } catch (error) {
      await log('SKIP ' + job.out + ': ' + (error.stack || error.message));
    }
  }
  await fetch('/done', { method: 'POST' });
})().catch(async error => {
  document.body.textContent = error.stack || error.message;
});
</script>`;
}

let browser;
function shutdown() {
  setTimeout(() => {
    console.log(`Converted ${results.length} image(s).`);
    server.close();
    browser?.kill();
  }, 500);
}

server.listen(port, '127.0.0.1', () => {
  browser = spawn(edge, [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--disable-gpu-sandbox',
    '--disable-gpu-compositing',
    '--disable-d3d11',
    '--disable-software-rasterizer',
    '--disable-features=DawnGraphite,Vulkan,UseSkiaRenderer',
    '--disable-extensions',
    '--disable-sync',
    '--disable-background-networking',
    '--user-data-dir=' + profileDir,
    `http://127.0.0.1:${port}/`
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  browser.stdout.on('data', data => process.stdout.write(data));
  browser.stderr.on('data', data => process.stderr.write(data));
  browser.on('exit', code => {
    if (results.length === 0) {
      console.error(`Edge exited before converting images. Exit code: ${code}`);
      server.close();
    }
  });
});
