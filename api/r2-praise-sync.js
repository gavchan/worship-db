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
  const url = `https://${host}${path}`;
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

  const response = await fetch(url, {
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

async function getPraiseSongs(songIds, offset = 0, limit = 5000) {
  const fields = 'id,name,status,count,seasons,key,bpm,has_score,music_url,updated_at';
  const filter = songIds && songIds.length ? `&id=in.(${songIds.join(',')})` : '';
  const response = await supabaseFetch(`/rest/v1/songs?select=${fields}&has_score=eq.true${filter}&order=name&limit=${limit}&offset=${offset}`);
  return response.json();
}

async function getAllPublishedSongs() {
  const fields = 'id,name,status,count,seasons,key,bpm,has_score,music_url,updated_at';
  const response = await supabaseFetch(`/rest/v1/songs?select=${fields}&has_score=eq.true&order=name&limit=5000`);
  return response.json();
}

async function listScoreFiles(songId) {
  const response = await supabaseFetch('/storage/v1/object/list/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: `${songId}/`, limit: 100, sortBy: { column: 'name', order: 'asc' } }),
  });
  const data = await response.json();
  return Array.isArray(data) ? data.filter((file) => file.name && !file.name.endsWith('/')) : [];
}

function extensionFromName(name, contentType) {
  const found = name.match(/\.([a-z0-9]+)$/i);
  if (found) return found[1].toLowerCase();
  if (contentType && contentType.includes('png')) return 'png';
  if (contentType && contentType.includes('webp')) return 'webp';
  return 'jpg';
}

async function uploadSongScores(song, force) {
  const files = await listScoreFiles(song.id);
  const scoreFiles = [];

  for (let i = 0; i < files.length; i++) {
    const sourceName = files[i].name;
    const sourcePath = `${song.id}/${encodeKey(sourceName)}`;
    const sourceUrl = `${SUPABASE_URL}/storage/v1/object/public/scores/${sourcePath}`;
    const sourceResponse = await fetch(sourceUrl);
    if (!sourceResponse.ok) {
      throw new Error(`Score download failed for ${song.name}: ${sourceResponse.status}`);
    }

    const contentType = sourceResponse.headers.get('content-type') || 'image/jpeg';
    const ext = extensionFromName(sourceName, contentType);
    const r2Key = `scores/praise/${song.id}/page_${i + 1}.${ext}`;
    const publicUrl = `${R2_PUBLIC_BASE_URL}/${r2Key}`;

    if (!force) {
      const exists = await fetch(publicUrl, { method: 'HEAD' });
      if (exists.ok) {
        scoreFiles.push({ page: i + 1, path: r2Key, url: publicUrl });
        continue;
      }
    }

    const body = Buffer.from(await sourceResponse.arrayBuffer());
    await putR2Object(r2Key, body, contentType);
    scoreFiles.push({ page: i + 1, path: r2Key, url: publicUrl });
  }

  return scoreFiles;
}

async function buildManifest() {
  const songs = await getAllPublishedSongs();
  const manifest = [];

  for (const song of songs) {
    const files = await listScoreFiles(song.id);
    const scoreFiles = files.map((file, index) => {
      const ext = extensionFromName(file.name);
      const path = `scores/praise/${song.id}/page_${index + 1}.${ext}`;
      return { page: index + 1, path, url: `${R2_PUBLIC_BASE_URL}/${path}` };
    });
    if (!scoreFiles.length) continue;
    manifest.push({
      id: song.id,
      type: 'praise',
      title: song.name,
      name: song.name,
      status: song.status || '',
      count: song.count || 0,
      seasons: song.seasons || [],
      key: song.key || '',
      bpm: song.bpm || 0,
      music_url: song.music_url || '',
      pages: scoreFiles.length,
      files: scoreFiles,
      updated_at: song.updated_at || null,
    });
  }

  return manifest;
}

async function loadCurrentManifest() {
  try {
    const response = await fetch(`${R2_PUBLIC_BASE_URL}/praise_songs.json`, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function manifestEntry(song, scoreFiles) {
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
    music_url: song.music_url || '',
    pages: scoreFiles.length,
    files: scoreFiles,
    updated_at: song.updated_at || null,
  };
}

async function updateManifestForSongs(songs, uploadedById) {
  const current = await loadCurrentManifest();
  const byId = new Map(current.filter((song) => song && song.id).map((song) => [song.id, song]));

  for (const song of songs) {
    const scoreFiles = uploadedById.get(song.id) || [];
    if (scoreFiles.length) {
      byId.set(song.id, manifestEntry(song, scoreFiles));
    } else {
      byId.delete(song.id);
    }
  }

  return Array.from(byId.values()).sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ko'));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'POST only' });
  }

  const missing = requiredEnv();
  if (missing.length) {
    return json(res, 500, { ok: false, error: `Missing environment variables: ${missing.join(', ')}` });
  }

  try {
    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const songIds = Array.isArray(body.songIds) ? body.songIds.filter(Boolean) : [];
    const offset = Number.isFinite(Number(body.offset)) ? Number(body.offset) : 0;
    const limit = Number.isFinite(Number(body.limit)) ? Math.min(Math.max(Number(body.limit), 1), 50) : 5000;
    const batch = body.batch === true;
    const force = body.force !== false;
    const songs = await getPraiseSongs(songIds, offset, batch ? limit : 5000);
    const uploaded = [];
    const uploadedById = new Map();

    for (const song of songs) {
      const files = await uploadSongScores(song, force);
      uploadedById.set(song.id, files);
      if (files.length) uploaded.push({ id: song.id, name: song.name, pages: files.length });
    }

    const manifest = songIds.length || batch
      ? await updateManifestForSongs(songs, uploadedById)
      : await buildManifest();
    await putR2Object(
      'praise_songs.json',
      Buffer.from(JSON.stringify(manifest, null, 2)),
      'application/json; charset=utf-8',
    );

    return json(res, 200, {
      ok: true,
      uploaded,
      processedCount: songs.length,
      nextOffset: offset + songs.length,
      done: batch ? songs.length < limit : true,
      manifestCount: manifest.length,
    });
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message });
  }
};
