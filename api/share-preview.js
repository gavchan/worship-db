const DEFAULT_SUPABASE_URL = 'https://rmtysrytveexshwzenxj.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdHlzcnl0dmVleHNod3plbnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjQ3OTYsImV4cCI6MjA5MjEwMDc5Nn0.5FzzJ1rg-uRG4jAGZ75xVT3i3NH0m6J_tDeOS4GxyT8';

function esc(value) {
  return String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function parseLocalDate(value) {
  const [y, m, d] = String(value || '').split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : new Date(value || Date.now());
}

function koreanWeekTitle(date) {
  const d = date instanceof Date && !Number.isNaN(date) ? date : new Date();
  const weeks = ['첫째주', '둘째주', '셋째주', '넷째주', '다섯째주', '여섯째주'];
  const week = weeks[Math.max(0, Math.min(5, Math.ceil(d.getDate() / 7) - 1))] || `${Math.ceil(d.getDate() / 7)}째주`;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${week} 찬양 콘티`;
}

function originFromReq(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'worship-db-sable.vercel.app';
  return `${proto}://${host}`;
}

async function getHistory(id) {
  if (!id) return null;
  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  const url = `${supabaseUrl}/rest/v1/worship_history?id=eq.${encodeURIComponent(id)}&select=worship_date,song_names,note&limit=1`;
  const response = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!response.ok) return null;
  const rows = await response.json().catch(() => []);
  return rows && rows[0] ? rows[0] : null;
}

module.exports = async function handler(req, res) {
  const id = String(req.query?.id || '').trim();
  const conti = String(req.query?.conti || '1').trim() === '2' ? '2' : '1';
  const origin = originFromReq(req);
  const shareUrl = `${origin}/share.html${id ? `?id=${encodeURIComponent(id)}&conti=${conti}` : ''}`;
  const row = await getHistory(id).catch(() => null);
  const title = row?.worship_date ? koreanWeekTitle(parseLocalDate(row.worship_date)) : '주일 찬양 콘티';
  const songs = Array.isArray(row?.song_names) ? row.song_names.filter(Boolean).slice(0, 6).join(' · ') : '';
  const desc = songs ? songs : '드림찬양단 콘티 악보를 확인하세요.';
  const image = `${origin}/assets/main-church-bg.png`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.end(`<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(shareUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${esc(shareUrl)}">
<script>location.replace(${JSON.stringify(shareUrl)});</script>
</head>
<body><a href="${esc(shareUrl)}">${esc(title)} 열기</a></body>
</html>`);
};
