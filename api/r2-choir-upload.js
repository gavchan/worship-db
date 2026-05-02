const crypto = require('crypto');

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

async function loadManifest() {
  try {
    const response = await fetch(`${R2_PUBLIC_BASE_URL}/choir_songs.json`, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function makeId(name) {
  return crypto.createHash('sha1').update(name.normalize('NFC')).digest('hex').slice(0, 16);
}

function extFromContentType(contentType) {
  if (contentType && contentType.includes('png')) return 'png';
  if (contentType && contentType.includes('webp')) return 'webp';
  return 'jpg';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return json(res, 405, { ok: false, error: 'POST or DELETE only' });
  }

  const missing = requiredEnv();
  if (missing.length) return json(res, 500, { ok: false, error: `Missing environment variables: ${missing.join(', ')}` });

  try {
    const payload = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const songName = String(payload.songName || '').trim();
    const songId = payload.songId || (songName ? makeId(songName) : '');
    const manifest = await loadManifest();

    if (req.method === 'DELETE') {
      if (!songId && !songName) return json(res, 400, { ok: false, error: 'songId or songName is required' });
      const current = manifest.find((song) => song && (song.id === songId || song.name === songName));
      if (current && Array.isArray(current.files)) {
        for (const file of current.files) {
          if (file && file.path) await deleteR2Object(String(file.path));
        }
      }
      const nextManifest = manifest.filter((song) => song && song.id !== songId && song.name !== songName);
      await putR2Object(
        'choir_songs.json',
        Buffer.from(JSON.stringify(nextManifest, null, 2)),
        'application/json; charset=utf-8',
      );
      return json(res, 200, { ok: true, deleted: !!current, manifestCount: nextManifest.length });
    }

    if (payload.mode === 'page') {
      const pageNumber = Math.max(1, Number(payload.pageNumber || 1));
      const pageCount = Math.max(pageNumber, Number(payload.pageCount || pageNumber));
      const page = payload.page || {};
      if (!songName || !page.data) return json(res, 400, { ok: false, error: 'songName and page.data are required' });

      const contentType = page.contentType || 'image/jpeg';
      const ext = extFromContentType(contentType);
      const key = `scores/choir/${songId}/page_${pageNumber}.${ext}`;
      const body = Buffer.from(String(page.data || ''), 'base64');
      await putR2Object(key, body, contentType);

      const current = manifest.find((song) => song && (song.id === songId || song.name === songName));
      const currentFiles = Array.isArray(current?.files) ? current.files : [];
      const nextFile = {
        page: pageNumber,
        path: key,
        url: `${R2_PUBLIC_BASE_URL}/${key}`,
      };
      const files = [
        ...currentFiles.filter((file) => Number(file?.page || 0) !== pageNumber),
        nextFile,
      ].sort((a, b) => Number(a.page || 0) - Number(b.page || 0));
      const nextEntry = {
        id: songId,
        type: 'choir',
        title: songName,
        name: songName,
        pages: Math.max(pageCount, files.length),
        files,
        updated_at: new Date().toISOString(),
      };
      const nextManifest = [
        nextEntry,
        ...manifest.filter((song) => song && song.id !== songId && song.name !== songName),
      ].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ko'));

      await putR2Object(
        'choir_songs.json',
        Buffer.from(JSON.stringify(nextManifest, null, 2)),
        'application/json; charset=utf-8',
      );
      return json(res, 200, { ok: true, song: nextEntry, page: nextFile, manifestCount: nextManifest.length });
    }

    const pages = Array.isArray(payload.pages) ? payload.pages : [];
    if (!songName || !pages.length) return json(res, 400, { ok: false, error: 'songName and pages are required' });

    const existing = manifest.find((song) => song && (song.id === songId || song.name === songName));
    if (payload.skipExisting === true && existing && Number(existing.pages || 0) >= pages.length) {
      return json(res, 200, { ok: true, skipped: true, song: existing, manifestCount: manifest.length });
    }

    const files = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] || {};
      const contentType = page.contentType || 'image/jpeg';
      const ext = extFromContentType(contentType);
      const key = `scores/choir/${songId}/page_${i + 1}.${ext}`;
      const body = Buffer.from(String(page.data || ''), 'base64');
      if (!body.length) continue;
      await putR2Object(key, body, contentType);
      files.push({
        page: i + 1,
        path: key,
        url: `${R2_PUBLIC_BASE_URL}/${key}`,
      });
    }

    const nextEntry = {
      id: songId,
      type: 'choir',
      title: songName,
      name: songName,
      pages: files.length,
      files,
      updated_at: new Date().toISOString(),
    };
    const nextManifest = [
      nextEntry,
      ...manifest.filter((song) => song && song.id !== songId && song.name !== songName),
    ].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ko'));

    await putR2Object(
      'choir_songs.json',
      Buffer.from(JSON.stringify(nextManifest, null, 2)),
      'application/json; charset=utf-8',
    );

    return json(res, 200, { ok: true, song: nextEntry, manifestCount: nextManifest.length });
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message });
  }
};
