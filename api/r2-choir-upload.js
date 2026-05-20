const crypto = require('crypto');

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

function authorized(req) {
  const token = process.env.R2_SYNC_TOKEN || process.env.ADMIN_SYNC_TOKEN || '';
  if (!token) return true;
  const sent = req.headers['x-r2-sync-token'] || req.headers['x-admin-token'] || '';
  return String(sent) === String(token);
}

function envConfig() {
  const config = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET || process.env.R2_BUCKET_NAME || 'praise-songs',
    publicBase: process.env.R2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_URL || '',
    choirPrefix: (process.env.R2_CHOIR_PREFIX || 'choir-songs').replace(/^\/+|\/+$/g, ''),
    manifestKey: process.env.R2_CHOIR_MANIFEST_KEY || 'choir_songs.json'
  };
  const missing = [];
  if (!config.accountId) missing.push('R2_ACCOUNT_ID');
  if (!config.accessKeyId) missing.push('R2_ACCESS_KEY_ID');
  if (!config.secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
  if (!config.bucket) missing.push('R2_BUCKET 또는 R2_BUCKET_NAME');
  if (missing.length) throw new Error('R2 환경변수 누락: ' + missing.join(', '));
  return config;
}

function extFromFile(name, type) {
  const ext = String(name || '').split('.').pop().toLowerCase();
  if (/^[a-z0-9]{1,8}$/.test(ext) && ext !== String(name || '').toLowerCase()) return ext;
  if (String(type || '').includes('pdf')) return 'pdf';
  if (String(type || '').includes('png')) return 'png';
  if (String(type || '').includes('jpeg')) return 'jpg';
  if (String(type || '').includes('webp')) return 'webp';
  return 'bin';
}

function contentType(name, type) {
  if (type) return type;
  const ext = extFromFile(name, '');
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'json') return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

function parseDataFile(file) {
  const raw = String(file.data || '');
  const comma = raw.indexOf(',');
  const base64 = comma >= 0 ? raw.slice(comma + 1) : raw;
  if (!base64) throw new Error(`${file.name || '파일'} 데이터가 비어 있습니다.`);
  return Buffer.from(base64, 'base64');
}

function safeText(value, fallback) {
  return String(value || fallback || '').trim().slice(0, 1000);
}

function publicUrl(config, key) {
  return config.publicBase ? `${config.publicBase.replace(/\/$/, '')}/${encodeKey(key)}` : key;
}

async function r2Request(method, key, body, type) {
  const config = envConfig();
  const service = 's3';
  const region = 'auto';
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payload = body ? (Buffer.isBuffer(body) ? body : Buffer.from(body)) : Buffer.alloc(0);
  const payloadHash = sha256(payload);
  const canonicalUri = `/${config.bucket}/${encodeKey(key)}`;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256(canonicalRequest)].join('\n');
  const kDate = hmac('AWS4' + config.secretAccessKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = hmac(kSigning, stringToSign, 'hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers = {
    Authorization: authorization,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate
  };
  if (method !== 'GET') headers['Content-Type'] = type || contentType(key);

  const response = await fetch(`https://${host}${canonicalUri}`, {
    method,
    headers,
    body: method === 'GET' ? undefined : payload
  });
  return { response, config };
}

async function r2Put(key, body, type) {
  const { response } = await r2Request('PUT', key, body, type);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`R2 업로드 실패 ${response.status}: ${text.slice(0, 500)}`);
  }
}

async function r2GetJson(key) {
  const { response } = await r2Request('GET', key);
  if (response.status === 404) return null;
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`R2 목록 읽기 실패 ${response.status}: ${text.slice(0, 500)}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function normalizeVideoMap(videos) {
  const source = videos && typeof videos === 'object' ? videos : {};
  return {
    full: safeText(source.full, ''),
    soprano: safeText(source.soprano, ''),
    alto: safeText(source.alto, ''),
    tenor: safeText(source.tenor, ''),
    bass: safeText(source.bass, '')
  };
}

function fileBuckets(body) {
  const partFiles = body.partFiles && typeof body.partFiles === 'object' ? body.partFiles : {};
  return {
    full: Array.isArray(body.fullScoreFiles) ? body.fullScoreFiles : (Array.isArray(body.files) ? body.files : []),
    soprano: Array.isArray(partFiles.soprano) ? partFiles.soprano : [],
    alto: Array.isArray(partFiles.alto) ? partFiles.alto : [],
    tenor: Array.isArray(partFiles.tenor) ? partFiles.tenor : [],
    bass: Array.isArray(partFiles.bass) ? partFiles.bass : []
  };
}

function totalFileCount(buckets) {
  return Object.values(buckets).reduce((sum, list) => sum + list.length, 0);
}

function normalizeUploadId(value) {
  return String(value || '').trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
}

function emptyScores() {
  return {
    full: [],
    soprano: [],
    alto: [],
    tenor: [],
    bass: []
  };
}

function makeChoirGroup(body, id, now) {
  const title = safeText(body.title, '');
  return {
    id,
    type: 'choir_song',
    title,
    search_title: title.replace(/\s+/g, '').toLowerCase(),
    schedule: {
      date: safeText(body.scheduleDate || body.date, ''),
      type: safeText(body.scheduleType, 'practice'),
      label: safeText(body.scheduleLabel, '')
    },
    memo: safeText(body.memo, ''),
    videos: normalizeVideoMap(body.videos),
    scores: emptyScores(),
    files: [],
    created_at: safeText(body.createdAt, now.toISOString()),
    updated_at: now.toISOString()
  };
}

function assertSection(section) {
  const value = safeText(section, 'full');
  if (!['full', 'soprano', 'alto', 'tenor', 'bass'].includes(value)) throw new Error('알 수 없는 성가대 악보 구분입니다.');
  return value;
}

async function saveChoirFile(config, uploadId, section, file, index) {
  const bucketName = assertSection(section);
  const fileName = safeText(file.name, `${bucketName}-${index + 1}`);
  const type = contentType(fileName, file.type);
  if (type === 'application/pdf') throw new Error('PDF는 업로드 화면에서 페이지별 이미지로 변환한 뒤 저장해야 합니다.');
  if (!String(type).startsWith('image/')) throw new Error(`${fileName}은 이미지 파일이 아닙니다.`);
  const buffer = parseDataFile(file);
  const ext = extFromFile(fileName, type);
  const key = `${config.choirPrefix}/${uploadId}/${bucketName}/${String(index + 1).padStart(2, '0')}.${ext}`;
  await r2Put(key, buffer, type);
  return {
    section: bucketName,
    file_name: fileName,
    content_type: type,
    size: buffer.length,
    page_no: index + 1,
    source_pdf: safeText(file.source_pdf, ''),
    source_page: file.source_page || null,
    r2_path: key,
    url: publicUrl(config, key)
  };
}

async function writeChoirManifest(config, group, now) {
  const manifest = await r2GetJson(config.manifestKey).catch(() => null) || { updated_at: null, groups: [] };
  manifest.updated_at = now.toISOString();
  manifest.groups = Array.isArray(manifest.groups) ? manifest.groups : [];
  manifest.groups = [group, ...manifest.groups.filter(item => item && item.id !== group.id)];
  await r2Put(config.manifestKey, Buffer.from(JSON.stringify(manifest, null, 2)), 'application/json; charset=utf-8');
}

module.exports = async function handler(req, res) {
  try {
    const config = envConfig();
    if (req.method === 'GET') {
      const manifest = await r2GetJson(config.manifestKey).catch(() => null) || { updated_at: null, groups: [] };
      return send(res, 200, { ok: true, manifest });
    }
    if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'GET 또는 POST만 지원합니다.' });
    if (!authorized(req)) return send(res, 401, { ok: false, error: 'R2 업로드 권한이 필요합니다.' });

    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const mode = safeText(body.mode, 'complete');
    const now = new Date();

    if (mode === 'file') {
      const uploadId = normalizeUploadId(body.uploadId);
      if (!uploadId) return send(res, 400, { ok: false, error: '업로드 묶음 ID가 없습니다.' });
      const file = body.file || {};
      const saved = await saveChoirFile(config, uploadId, body.section || 'full', file, Number(body.index || 0));
      return send(res, 200, { ok: true, upload_id: uploadId, file: saved });
    }

    if (mode === 'commit') {
      const uploadId = normalizeUploadId(body.uploadId);
      const title = safeText(body.title, '');
      const savedFiles = Array.isArray(body.savedFiles) ? body.savedFiles : [];
      if (!uploadId) return send(res, 400, { ok: false, error: '업로드 묶음 ID가 없습니다.' });
      if (!title) return send(res, 400, { ok: false, error: '성가곡 제목을 입력해주세요.' });
      if (!savedFiles.length) return send(res, 400, { ok: false, error: '목록에 등록할 악보 파일이 없습니다.' });
      const group = makeChoirGroup(body, uploadId, now);
      savedFiles.forEach(file => {
        const section = assertSection(file.section);
        const saved = {
          section,
          file_name: safeText(file.file_name, ''),
          content_type: safeText(file.content_type, ''),
          size: Number(file.size || 0),
          page_no: Number(file.page_no || 1),
          source_pdf: safeText(file.source_pdf, ''),
          source_page: file.source_page || null,
          r2_path: safeText(file.r2_path, ''),
          url: safeText(file.url, '')
        };
        group.scores[section].push(saved);
        group.files.push(saved);
      });
      await writeChoirManifest(config, group, now);
      return send(res, 200, {
        ok: true,
        group,
        manifest_key: config.manifestKey,
        manifest_url: publicUrl(config, config.manifestKey)
      });
    }

    const title = safeText(body.title, '');
    const buckets = fileBuckets(body);
    const count = totalFileCount(buckets);
    if (!title) return send(res, 400, { ok: false, error: '성가곡 제목을 입력해주세요.' });
    if (!count) return send(res, 400, { ok: false, error: '업로드할 4성부 악보 또는 파트 자료를 선택해주세요.' });
    if (count > 40) return send(res, 400, { ok: false, error: '한 번에 최대 40개 페이지까지 업로드할 수 있습니다.' });

    const id = `choir-${now.toISOString().slice(0, 10)}-${Date.now().toString(36)}`;
    const group = makeChoirGroup(body, id, now);

    for (const [bucketName, files] of Object.entries(buckets)) {
      for (let i = 0; i < files.length; i += 1) {
        const saved = await saveChoirFile(config, id, bucketName, files[i] || {}, i);
        group.scores[bucketName].push(saved);
        group.files.push(saved);
      }
    }

    await writeChoirManifest(config, group, now);

    return send(res, 200, {
      ok: true,
      group,
      manifest_key: config.manifestKey,
      manifest_url: publicUrl(config, config.manifestKey)
    });
  } catch (e) {
    return send(res, 500, { ok: false, error: e.message || String(e) });
  }
};
