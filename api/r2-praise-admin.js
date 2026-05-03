const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rmtysrytveexshwzenxj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET || 'score';
const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL || 'https://pub-a62ecaff5aa54055be3c5d01d98ed78f.r2.dev').replace(/\/$/, '');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function requiredEnv() {
  return [
    ['SUPABASE_ANON_KEY', SUPABASE_KEY],
    ['R2_ACCOUNT_ID', R2_ACCOUNT_ID],
    ['R2_ACCESS_KEY_ID', R2_ACCESS_KEY_ID],
    ['R2_SECRET_ACCESS_KEY', R2_SECRET_ACCESS_KEY],
  ].filter(([, value]) => !value).map(([name]) => name);
}

function sha256(value, encoding = 'hex') {
  return crypto.createHash('sha256').update(value).digest(encoding);
}

function hmac(key, value, encoding) {
  return crypto.createHmac('sha256', key).update(value).digest(encoding);
}

function dateParts(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

function encodeKey(key) {
  return key.split('/').map(encodeURIComponent).join('/');
}

function signingKey(dateStamp) {
  const kDate = hmac(`AWS4${R2_SECRET_ACCESS_KEY}`, dateStamp);
  const kRegion = hmac(kDate, 'auto');
  const kService = hmac(kRegion, 's3');
  return hmac(kService, 'aws4_request');
}

async function putR2Object(key, body, contentType) {
  const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const path = `/${R2_BUCKET}/${encodeKey(key)}`;
  const { amzDate, dateStamp } = dateParts();
  const payloadHash = sha256(body);
  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join('\n') + '\n';
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = ['PUT', path, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256(canonicalRequest)].join('\n');
  const signature = hmac(signingKey(dateStamp), stringToSign, 'hex');

  const response = await fetch(`https://${host}${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      'Content-Type': contentType || 'application/octet-stream',
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    },
    body,
  });
  if (!response.ok) {
    throw new Error(`R2 upload failed: ${response.status} ${await response.text()}`);
  }
}

async function deleteR2Object(key) {
  const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const path = `/${R2_BUCKET}/${encodeKey(key)}`;
  const { amzDate, dateStamp } = dateParts();
  const payloadHash = sha256('');
  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join('\n') + '\n';
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = ['DELETE', path, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256(canonicalRequest)].join('\n');
  const signature = hmac(signingKey(dateStamp), stringToSign, 'hex');

  const response = await fetch(`https://${host}${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    },
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`R2 delete failed: ${response.status} ${await response.text()}`);
  }
}

async function supabaseFetch(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status} ${await response.text()}`);
  }
  return response;
}

async function loadManifest() {
  try {
    const response = await fetch(`${R2_PUBLIC_BASE_URL}/praise_songs.json`, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function extFromContentType(contentType) {
  if (contentType && contentType.includes('png')) return 'png';
  if (contentType && contentType.includes('webp')) return 'webp';
  return 'jpg';
}

function normalizeSong(raw) {
  return {
    id: String(raw.id || crypto.randomUUID()),
    name: String(raw.name || raw.title || '').trim(),
    status: String(raw.status || ''),
    count: Number(raw.count || 0),
    seasons: Array.isArray(raw.seasons) ? raw.seasons : [],
    key: String(raw.key || ''),
    bpm: Number(raw.bpm || 0),
    has_score: raw.has_score !== false,
    music_url: String(raw.music_url || ''),
    updated_at: new Date().toISOString(),
  };
}

function manifestEntry(song, files) {
  return {
    id: song.id,
    type: 'praise',
    title: song.name,
    name: song.name,
    status: song.status || '',
    count: song.count || 0,
    seasons: song.seasons || [],
    key: song.key || '',
    bpm: song.bpm || 0,
    has_score: files.length > 0,
    music_url: song.music_url || '',
    pages: files.length,
    files,
    updated_at: song.updated_at || new Date().toISOString(),
  };
}

async function saveManifest(items) {
  await putR2Object(
    'praise_songs.json',
    Buffer.from(JSON.stringify(items, null, 2)),
    'application/json; charset=utf-8',
  );
}

async function upsertSupabase(song) {
  const body = {
    id: song.id,
    name: song.name,
    status: song.status,
    count: song.count,
    seasons: song.seasons,
    key: song.key,
    bpm: song.bpm,
    has_score: song.has_score,
    music_url: song.music_url,
  };
  await supabaseFetch('/rest/v1/songs?on_conflict=id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return json(res, 405, { ok: false, error: 'POST or DELETE only' });
  }

  const missing = requiredEnv();
  if (missing.length) return json(res, 500, { ok: false, error: `Missing environment variables: ${missing.join(', ')}` });

  try {
    const payload = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const manifest = await loadManifest();
    const action = String(payload.action || (req.method === 'DELETE' ? 'delete' : 'update'));
    const song = normalizeSong(payload.song || payload);

    if (action === 'delete' || req.method === 'DELETE') {
      if (!song.id && !song.name) return json(res, 400, { ok: false, error: 'song id or name is required' });
      const current = manifest.find((item) => item && (item.id === song.id || item.name === song.name));
      if (current && Array.isArray(current.files)) {
        for (const file of current.files) {
          if (file && file.path) await deleteR2Object(String(file.path));
        }
      }
      await supabaseFetch(`/rest/v1/songs?id=eq.${encodeURIComponent(song.id)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      });
      const nextManifest = manifest.filter((item) => item && item.id !== song.id && item.name !== song.name);
      await saveManifest(nextManifest);
      return json(res, 200, { ok: true, deleted: !!current, manifestCount: nextManifest.length });
    }

    if (!song.name) return json(res, 400, { ok: false, error: 'song name is required' });

    const current = manifest.find((item) => item && (item.id === song.id || item.name === song.name));
    const currentFiles = Array.isArray(current?.files) ? current.files : [];
    let files = currentFiles;

    if (payload.mode === 'page') {
      const pageNumber = Math.max(1, Number(payload.pageNumber || 1));
      const pageCount = Math.max(pageNumber, Number(payload.pageCount || pageNumber));
      const page = payload.page || {};
      if (!page.data) return json(res, 400, { ok: false, error: 'page.data is required' });
      const contentType = page.contentType || 'image/jpeg';
      const ext = extFromContentType(contentType);
      const key = `scores/praise/${song.id}/page_${pageNumber}.${ext}`;
      const body = Buffer.from(String(page.data || ''), 'base64');
      await putR2Object(key, body, contentType);
      const nextFile = { page: pageNumber, path: key, url: `${R2_PUBLIC_BASE_URL}/${key}` };
      files = [
        ...currentFiles.filter((file) => Number(file?.page || 0) !== pageNumber),
        nextFile,
      ].sort((a, b) => Number(a.page || 0) - Number(b.page || 0));
      while (files.length > pageCount) files.pop();
    }

    song.has_score = files.length > 0;
    const nextEntry = manifestEntry(song, files);
    const nextManifest = [
      nextEntry,
      ...manifest.filter((item) => item && item.id !== song.id && item.name !== song.name),
    ].filter((item) => Number(item.pages || 0) > 0)
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ko'));

    await upsertSupabase(song);
    await saveManifest(nextManifest);

    return json(res, 200, { ok: true, song: nextEntry, manifestCount: nextManifest.length });
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message });
  }
};
