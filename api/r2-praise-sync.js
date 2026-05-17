const crypto = require('crypto');

const DEFAULT_SUPABASE_URL = 'https://rmtysrytveexshwzenxj.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdHlzcnl0dmVleHNod3plbnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjQ3OTYsImV4cCI6MjA5MjEwMDc5Nn0.5FzzJ1rg-uRG4jAGZ75xVT3i3NH0m6J_tDeOS4GxyT8';

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function hmac(key, value, encoding) {
  return crypto.createHmac('sha256', key).update(value, 'utf8').digest(encoding);
}
function sha256(value, encoding = 'hex') {
  return crypto.createHash('sha256').update(value).digest(encoding);
}
function encodeKey(key) {
  return String(key).split('/').map(encodeURIComponent).join('/');
}
function contentType(path) {
  const ext = String(path).split('.').pop().toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'json') return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

function authorized(req) {
  const token = process.env.R2_SYNC_TOKEN || process.env.ADMIN_SYNC_TOKEN || '';
  if (!token) return true;
  const sent = req.headers['x-r2-sync-token'] || req.headers['x-admin-token'] || '';
  return String(sent) === String(token);
}

async function r2Put({ key, body, type }) {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME || 'praise-songs';
  const missing = [];
  if (!accountId) missing.push('R2_ACCOUNT_ID');
  if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
  if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
  if (!bucket) missing.push('R2_BUCKET 또는 R2_BUCKET_NAME');
  if (missing.length) throw new Error('R2 환경변수 누락: ' + missing.join(', '));

  const service = 's3';
  const region = 'auto';
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(Buffer.isBuffer(body) ? body : Buffer.from(body));
  const canonicalUri = `/${bucket}/${encodeKey(key)}`;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = ['PUT', canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256(canonicalRequest)].join('\n');
  const kDate = hmac('AWS4' + secretAccessKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = hmac(kSigning, stringToSign, 'hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `https://${host}${canonicalUri}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': authorization,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'Content-Type': type || contentType(key)
    },
    body
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`R2 업로드 실패 ${response.status}: ${text.slice(0, 500)}`);
  }
}

async function supabaseGet(path) {
  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (!response.ok) throw new Error(`Supabase 읽기 실패 ${response.status}: ${await response.text()}`);
  return response.json();
}

async function fetchScoreFile(storagePath) {
  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const safePath = String(storagePath || '').split('/').map(encodeURIComponent).join('/');
  const url = `${supabaseUrl}/storage/v1/object/public/scores/${safePath}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`악보 파일 읽기 실패 ${response.status}: ${storagePath}`);
  return Buffer.from(await response.arrayBuffer());
}

function publicUrl(key) {
  const base = process.env.R2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_URL || '';
  return base ? `${base.replace(/\/$/, '')}/${encodeKey(key)}` : key;
}

async function buildManifest(allSongs, allScores) {
  const bySong = new Map();
  for (const file of allScores) {
    if (!file.song_id || !file.storage_path) continue;
    if (!bySong.has(file.song_id)) bySong.set(file.song_id, []);
    const key = `scores/${file.storage_path}`;
    bySong.get(file.song_id).push({
      id: file.id,
      page_no: file.page_no || file.page || 1,
      version_id: file.version_id || null,
      storage_path: file.storage_path,
      file_name: file.file_name || String(file.storage_path).split('/').pop(),
      r2_path: key,
      url: publicUrl(key)
    });
  }
  return allSongs.map(song => ({
    ...song,
    score_files: (bySong.get(song.id) || []).sort((a, b) => Number(a.page_no || 0) - Number(b.page_no || 0))
  }));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'POST만 지원합니다.' });
  if (!authorized(req)) return send(res, 401, { ok: false, error: 'R2 동기화 권한이 필요합니다.' });
  try {
    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const allSongs = await supabaseGet('songs?select=*&order=name.asc');
    const allScores = await supabaseGet('song_score_files?select=*&order=page_no.asc');

    let selected = allSongs;
    if (body.songId) selected = allSongs.filter(s => String(s.id) === String(body.songId));
    if (Array.isArray(body.songIds) && body.songIds.length) {
      const set = new Set(body.songIds.map(String));
      selected = allSongs.filter(s => set.has(String(s.id)));
    }
    if (body.batch) {
      const offset = Math.max(0, Number(body.offset || 0));
      const limit = Math.max(1, Math.min(100, Number(body.limit || 20)));
      selected = allSongs.slice(offset, offset + limit);
    }

    const selectedIds = new Set(selected.map(s => String(s.id)));
    const selectedScores = allScores.filter(f => selectedIds.has(String(f.song_id)) && f.storage_path);
    const uploaded = [];
    const errors = [];

    for (const file of selectedScores) {
      try {
        const source = await fetchScoreFile(file.storage_path);
        const key = `scores/${file.storage_path}`;
        await r2Put({ key, body: source, type: contentType(file.storage_path) });
        uploaded.push(key);
      } catch (e) {
        errors.push(`${file.storage_path}: ${e.message}`);
      }
    }

    if (errors.length) {
      return send(res, 500, { ok: false, error: errors.slice(0, 5).join(' / '), uploaded, errorCount: errors.length });
    }

    const manifest = await buildManifest(allSongs, allScores);
    await r2Put({ key: 'praise_songs.json', body: Buffer.from(JSON.stringify(manifest, null, 2)), type: 'application/json; charset=utf-8' });

    const offset = Math.max(0, Number(body.offset || 0));
    const limit = Math.max(1, Math.min(100, Number(body.limit || 20)));
    const done = body.batch ? offset + selected.length >= allSongs.length : true;
    return send(res, 200, {
      ok: true,
      processedCount: selected.length,
      uploaded,
      manifestCount: manifest.length,
      nextOffset: body.batch ? offset + selected.length : null,
      done
    });
  } catch (e) {
    return send(res, 500, { ok: false, error: e.message || String(e) });
  }
};
