const SUPABASE_URL = 'https://rmtysrytveexshwzenxj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdHlzcnl0dmVleHNod3plbnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjQ3OTYsImV4cCI6MjA5MjEwMDc5Nn0.5FzzJ1rg-uRG4jAGZ75xVT3i3NH0m6J_tDeOS4GxyT8';
const HEADERS = {'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Prefer':'return=representation'};
const STORAGE_URL = SUPABASE_URL + '/storage/v1/object/public/scores/';
const LS_SET = 'nextUiSetV6';
const LS_SET_NAME = 'nextUiSetNameV6';
const LS_CHOIR_SET = 'nextUiChoirSetV6';
const state = {
  songs: [],
  scores: new Map(),
  history: [],
  choir: [],
  selectedSong: null,
  selectedChoir: null,
  set: readJson(LS_SET, []),
  choirSet: readJson(LS_CHOIR_SET, []),
  setName: localStorage.getItem(LS_SET_NAME) || '이번 주일 콘티',
  performIndex: 0,
  performPage: 0,
  choirPart: 'full',
  loaded: {songs:false, scores:false, history:false, choir:false},
  errors: []
};
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
function readJson(key, fallback){try{const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback;}catch{return fallback}}
function esc(value){return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function safeArray(value){
  if(Array.isArray(value)) return value;
  if(value == null || value === '') return [];
  if(typeof value === 'string'){
    const text = value.trim();
    try{const parsed = JSON.parse(text); if(Array.isArray(parsed)) return parsed;}catch{}
    if(text.startsWith('{') && text.endsWith('}')) return text.slice(1,-1).split(',').map(v=>v.replace(/^"|"$/g,'').trim()).filter(Boolean);
    return text.split(',').map(v=>v.trim()).filter(Boolean);
  }
  return [];
}
function norm(value){return String(value || '').normalize('NFC').replace(/\s+/g,' ').trim().toLowerCase()}
function toast(text){const el = $('#toast'); if(!el) return; el.textContent = text; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'), 1800)}
async function rest(path){
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, {headers: HEADERS, cache:'no-store'});
  if(!response.ok) throw new Error(await response.text());
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
function isScoreImagePath(path){return /\.(png|jpe?g|webp|gif)$/i.test(String(path || '').toLowerCase())}
function scoreUrl(path){return STORAGE_URL + encodeURIComponent(String(path || '')).replaceAll('%2F','/')}
function brokenImage(img){img.classList.add('broken-img'); const box = img.closest('.score-page') || img.parentElement; if(box && !box.querySelector('.broken-note')) box.insertAdjacentHTML('beforeend','<div class="empty broken-note">악보 이미지 경로 확인 필요</div>')}
function youtubeId(url){
  const raw = String(url || '').trim();
  const match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{6,})/) || raw.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : '';
}
function youtubeEmbed(url){const id = youtubeId(url); return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1` : ''}
function songYoutube(song){return song?.music_url || song?.youtube_url || song?.youtube || song?.video_url || song?.url || ''}
function tagList(song){return [...safeArray(song.tags), ...safeArray(song.seasons), ...safeArray(song.situations), ...safeArray(song.category)].filter(Boolean)}
function normalizeSong(song){
  return {
    ...song,
    name: song.name || song.title || '제목 없음',
    key: song.key || song.default_key || song.song_key || '',
    bpm: song.bpm || song.tempo || '',
    status: song.status || '',
    memo: song.memo || song.note || '',
    youtube_url: songYoutube(song),
    tags: tagList(song)
  };
}
function songScores(songId){return state.scores.get(String(songId)) || []}
function setStatus(key, ok){state.loaded[key] = !!ok}
async function loadSongs(){
  try{
    const rows = await rest('songs?select=*&order=name.asc&limit=3000');
    state.songs = (rows || []).map(normalizeSong);
    setStatus('songs', true);
    if(!state.selectedSong && state.songs[0]) state.selectedSong = state.songs[0];
  }catch(error){state.errors.push('찬양곡 DB: ' + error.message); setStatus('songs', false)}
}
async function loadScores(){
  try{
    const rows = await rest('song_score_files?select=id,song_id,storage_path,file_name,page_no,version_id,created_at&order=page_no.asc,created_at.asc&limit=12000');
    const map = new Map();
    (rows || []).filter(row => row.song_id && row.storage_path && isScoreImagePath(row.storage_path)).forEach((row, index) => {
      const key = String(row.song_id);
      if(!map.has(key)) map.set(key, []);
      map.get(key).push({...row, page_no: Number(row.page_no || index + 1)});
    });
    for(const list of map.values()) list.sort((a,b)=>(Number(a.page_no||0)-Number(b.page_no||0)) || String(a.storage_path).localeCompare(String(b.storage_path)));
    state.scores = map;
    setStatus('scores', true);
  }catch(error){state.errors.push('악보 DB: ' + error.message); setStatus('scores', false)}
}
async function loadHistory(){
  try{
    const rows = await rest('worship_history?select=*&order=worship_date.desc&limit=80');
    state.history = rows || [];
    setStatus('history', true);
  }catch(error){state.errors.push('공유 기록: ' + error.message); setStatus('history', false)}
}
async function loadChoir(){
  try{
    const response = await fetch('/api/r2-choir-upload', {cache:'no-store'});
    const text = await response.text();
    let data = {};
    try{data = text ? JSON.parse(text) : {}}catch{throw new Error('성가대 API 응답이 JSON 형식이 아닙니다')}
    if(!response.ok || !data.ok) throw new Error(data.error || '성가대 자료 읽기 실패');
    const groups = Array.isArray(data.manifest) ? data.manifest : safeArray(data.manifest?.groups);
    state.choir = groups.filter(item => item && item.type === 'choir_song');
    setStatus('choir', true);
    if(!state.selectedChoir && state.choir[0]) state.selectedChoir = state.choir[0];
  }catch(error){state.errors.push('성가대 API: ' + error.message); setStatus('choir', false)}
}
function renderStatus(){
  const totalScores = [...state.scores.values()].reduce((sum, list) => sum + list.length, 0);
  const rows = [
    ['작업 위치', '/next-ui 하위폴더', 'ok'],
    ['원본 파일', '수정 없음', 'ok'],
    ['찬양곡 DB', state.loaded.songs ? `${state.songs.length}곡 읽음` : '확인 필요', state.loaded.songs ? 'ok' : 'warn'],
    ['악보 DB', state.loaded.scores ? `${totalScores}개 경로 읽음` : '확인 필요', state.loaded.scores ? 'ok' : 'warn'],
    ['기존 공유 기록', state.loaded.history ? `${state.history.length}개 읽음` : '확인 필요', state.loaded.history ? 'ok' : 'warn'],
    ['성가대 API', state.loaded.choir ? `${state.choir.length}곡 읽음` : '배포 서버에서 확인 필요', state.loaded.choir ? 'ok' : 'warn'],
    ['저장 모드', 'localStorage 전용', 'warn']
  ];
  if(state.errors.length) rows.push(['오류 기록', state.errors.slice(-3).join(' / '), 'bad']);
  $('#statusLines').innerHTML = rows.map(([name,value,kind]) => `<div class="status-line"><b>${esc(name)}</b><span class="badge ${kind}">${esc(value)}</span></div>`).join('');
}
function setView(name){
  $$('.view').forEach(view => view.classList.toggle('active', view.id === 'view-' + name));
  $$('.mode-tabs button').forEach(button => button.classList.toggle('active', button.dataset.view === name));
  if(name === 'builder') renderBuilder();
  if(name === 'perform') renderPerform();
  if(name === 'share') renderShare();
  if(name === 'choir') renderChoir();
}
function filteredSongs(){
  const query = norm($('#songSearch')?.value || '');
  const filter = $('#songFilter')?.value || 'all';
  return state.songs.filter(song => {
    const hay = norm([song.name, song.key, song.bpm, song.status, song.memo, ...tagList(song)].join(' '));
    if(query && !hay.includes(query)) return false;
    if(filter === 'score' && !songScores(song.id).length) return false;
    if(filter === 'youtube' && !youtubeId(songYoutube(song))) return false;
    if(filter === 'ready' && !['ready','used','active'].includes(String(song.status || '').toLowerCase())) return false;
    return true;
  }).slice(0, 300);
}
function selectSong(id){state.selectedSong = state.songs.find(song => String(song.id) === String(id)) || state.selectedSong; renderSongs(); renderBuilder()}
function renderSongs(){
  const list = filteredSongs();
  $('#songList').innerHTML = list.map(song => {
    const scores = songScores(song.id).length;
    const hasVideo = !!youtubeId(songYoutube(song));
    return `<article class="song-card ${state.selectedSong?.id === song.id ? 'active' : ''}">
      <div class="song-title">${esc(song.name)}</div>
      <div class="meta"><span class="chip">Key ${esc(song.key || '-')}</span><span class="chip">BPM ${esc(song.bpm || '-')}</span><span class="chip">악보 ${scores}</span><span class="chip">영상 ${hasVideo ? '있음' : '없음'}</span></div>
      <div class="card-actions"><button type="button" onclick="addToSet('${esc(song.id)}')">+ 콘티</button><button class="primary" type="button" onclick="selectSong('${esc(song.id)}');setView('builder')">세트 만들기</button></div>
    </article>`;
  }).join('') || '<div class="empty">검색 결과가 없습니다.</div>';
  renderSongDetail();
}
function renderSongDetail(){
  const song = state.selectedSong;
  if(!song){$('#songDetail').innerHTML = '<div class="empty">곡을 선택하세요.</div>'; return}
  const scores = songScores(song.id);
  const tags = tagList(song).slice(0, 10).map(tag => `<span class="chip">${esc(tag)}</span>`).join('');
  $('#songDetail').innerHTML = `<div class="eyebrow">곡 상세</div><h2>${esc(song.name)}</h2>
    <div class="meta"><span class="chip">Key ${esc(song.key || '-')}</span><span class="chip">BPM ${esc(song.bpm || '-')}</span><span class="chip">상태 ${esc(song.status || '-')}</span></div>
    <p class="muted">${esc(song.memo || '등록된 메모가 없습니다.')}</p>
    <div class="meta">${tags}</div>
    <div class="action-row" style="margin-top:16px"><button class="primary" type="button" onclick="addToSet('${esc(song.id)}')">콘티 추가</button><button type="button" onclick="setView('builder')">악보/영상 확인</button></div>
    <div class="media-stage" style="min-height:260px;margin-top:16px">${scores[0] ? scoreImages(scores.slice(0,1)) : '<div class="empty">악보 경로가 없습니다.</div>'}</div>`;
}
function scoreImages(scores){
  return `<div class="score-stack">${scores.map(file => `<div class="score-page"><img src="${esc(scoreUrl(file.storage_path))}" alt="${esc(file.file_name || '악보')}" loading="lazy" onerror="brokenImage(this)"></div>`).join('')}</div>`;
}
function renderBuilder(){
  const song = state.selectedSong;
  $('#builderTitle').textContent = song ? song.name : '곡을 선택하세요';
  if(!song){
    $('#builderScore').innerHTML = '<div class="empty">곡 탐색에서 세트 만들기를 누르세요.</div>';
    $('#builderVideo').innerHTML = '<div class="empty">곡을 선택하면 유튜브가 여기에 표시됩니다.</div>';
    $('#builderScoreCount').textContent = '0장';
    $('#builderVideoState').textContent = '확인 대기';
    renderSet();
    return;
  }
  const scores = songScores(song.id);
  const embed = youtubeEmbed(songYoutube(song));
  $('#builderScoreCount').textContent = `${scores.length}장`;
  $('#builderVideoState').textContent = embed ? '영상 있음' : '링크 없음';
  $('#builderScore').innerHTML = scores.length ? scoreImages(scores.slice(0, 8)) : '<div class="empty">등록된 악보 경로가 없습니다.</div>';
  $('#builderVideo').innerHTML = embed ? `<iframe class="video-frame" src="${esc(embed)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>` : '<div class="empty">등록된 유튜브 링크가 없습니다.</div>';
  renderSet();
}
function saveSet(){localStorage.setItem(LS_SET, JSON.stringify(state.set)); localStorage.setItem(LS_SET_NAME, $('#setName')?.value || state.setName)}
function addToSet(id){
  const song = state.songs.find(item => String(item.id) === String(id));
  if(!song) return;
  if(!state.set.some(item => String(item.id) === String(id))) state.set.push({id:song.id, name:song.name, key:song.key || '', bpm:song.bpm || ''});
  saveSet(); renderSet(); renderShare(); toast('콘티에 추가했어요');
}
function removeSet(index){state.set.splice(index, 1); saveSet(); renderSet(); renderShare(); renderPerform()}
function moveSet(index, dir){const next = index + dir; if(next < 0 || next >= state.set.length) return; [state.set[index], state.set[next]] = [state.set[next], state.set[index]]; saveSet(); renderSet(); renderShare(); renderPerform()}
function renderSet(){
  const input = $('#setName'); if(input) input.value = localStorage.getItem(LS_SET_NAME) || state.setName;
  $('#setList').innerHTML = state.set.map((song, index) => `<div class="set-row"><div class="num">${index + 1}</div><div><b>${esc(song.name)}</b><div class="meta"><span>Key ${esc(song.key || '-')}</span><span>BPM ${esc(song.bpm || '-')}</span></div></div><div class="mini-actions"><button type="button" onclick="moveSet(${index},-1)">↑</button><button type="button" onclick="moveSet(${index},1)">↓</button><button type="button" onclick="removeSet(${index})">×</button></div></div>`).join('') || '<div class="empty">카드에서 + 콘티를 눌러 곡을 담으세요.</div>';
}
function performSong(){return state.set[state.performIndex] || null}
function performScores(){const row = performSong(); const song = row ? state.songs.find(item => String(item.id) === String(row.id)) : null; return song ? songScores(song.id) : []}
function goPerformSong(index){state.performIndex = Math.max(0, Math.min(index, state.set.length - 1)); state.performPage = 0; renderPerform()}
function stepSong(dir){if(!state.set.length) return; goPerformSong(state.performIndex + dir)}
function stepPage(dir){
  const scores = performScores();
  if(!state.set.length) return;
  if(!scores.length){stepSong(dir); return}
  const nextPage = state.performPage + dir;
  if(nextPage >= 0 && nextPage < scores.length){state.performPage = nextPage; renderPerform(); return}
  if(dir > 0 && state.performIndex < state.set.length - 1){state.performIndex += 1; state.performPage = 0; renderPerform(); return}
  if(dir < 0 && state.performIndex > 0){state.performIndex -= 1; const prevScores = performScores(); state.performPage = Math.max(0, prevScores.length - 1); renderPerform()}
}
function renderPerform(){
  if(!state.set.length){$('#performTitle').textContent = '콘티에 곡을 추가하세요'; $('#performMeta').textContent = '연주 대기'; $('#performScore').innerHTML = '<div class="empty">연주할 곡이 없습니다.</div>'; $('#performBar').innerHTML = ''; return}
  state.performIndex = Math.max(0, Math.min(state.performIndex, state.set.length - 1));
  const row = performSong();
  const scores = performScores();
  state.performPage = Math.max(0, Math.min(state.performPage, Math.max(0, scores.length - 1)));
  $('#performTitle').textContent = row.name;
  $('#performMeta').textContent = `${state.performIndex + 1}/${state.set.length} · ${scores.length ? `${state.performPage + 1}/${scores.length}장` : '악보 없음'} · Key ${row.key || '-'} · BPM ${row.bpm || '-'}`;
  $('#performScore').innerHTML = scores[state.performPage] ? `<img src="${esc(scoreUrl(scores[state.performPage].storage_path))}" alt="${esc(row.name)} 악보" onerror="brokenImage(this)">` : '<div class="empty">악보가 없습니다. 다음곡 버튼으로 이동할 수 있습니다.</div>';
  $('#performBar').innerHTML = state.set.map((item, index) => `<button type="button" class="${index === state.performIndex ? 'primary' : ''}" onclick="goPerformSong(${index})">${index + 1}. ${esc(item.name)}</button>`).join('');
}
function renderShare(){
  const name = $('#setName')?.value || localStorage.getItem(LS_SET_NAME) || '이번 주일 콘티';
  const body = state.set.map((song, index) => `${index + 1}. ${song.name}${song.key ? ' / ' + song.key : ''}${song.bpm ? ' / ' + song.bpm : ''}`).join('\n');
  $('#sharePreview').innerHTML = `<h2>${esc(name)}</h2>${state.set.map((song,index)=>`<div class="share-item"><div class="num">${index + 1}</div><div><b>${esc(song.name)}</b><div class="meta">Key ${esc(song.key || '-')} · BPM ${esc(song.bpm || '-')}</div></div></div>`).join('') || '<div class="empty">공유할 콘티가 없습니다.</div>'}`;
  $('#shareText').value = `${name}\n\n${body || '곡이 없습니다.'}`;
  renderHistoryPreview();
}
function renderHistoryPreview(){
  const rows = state.history.slice(0, 8);
  $('#historyPreview').innerHTML = rows.map(row => {
    const songs = safeArray(row.song_names).slice(0, 8);
    return `<div class="history-item"><div class="num">${esc(String(row.worship_date || '').slice(5) || '-')}</div><div><b>${esc(row.worship_date || '날짜 없음')}</b><div class="muted">${esc(songs.join(' · ') || '곡 정보 없음')}</div></div></div>`;
  }).join('') || '<div class="empty">기존 공유 기록을 불러오지 못했거나 기록이 없습니다.</div>';
}
const partLabels = {full:'4성부', soprano:'소프라노', alto:'알토', tenor:'테너', bass:'베이스'};
const partOrder = ['full','soprano','alto','tenor','bass'];
function choirPages(song, part = state.choirPart){return safeArray(song?.scores?.[part])}
function choirVideo(song, part = state.choirPart){return part === 'full' ? song?.videos?.full : song?.videos?.[part]}
function filteredChoir(){
  const query = norm($('#choirSearch')?.value || '');
  const filter = $('#choirFilter')?.value || 'all';
  return state.choir.filter(song => {
    const hay = norm([song.title, song.search_title, song.memo, song.schedule?.date, song.schedule?.type, song.schedule?.label].join(' '));
    if(query && !hay.includes(query)) return false;
    if(filter !== 'all' && String(song.schedule?.type || '') !== filter) return false;
    return true;
  });
}
function selectChoir(id){state.selectedChoir = state.choir.find(item => String(item.id) === String(id)) || state.selectedChoir; renderChoir()}
function setChoirPart(part){state.choirPart = partOrder.includes(part) ? part : 'full'; renderChoirDetail()}
function renderChoir(){
  const list = filteredChoir();
  if(!state.selectedChoir && list[0]) state.selectedChoir = list[0];
  $('#choirList').innerHTML = list.map(song => `<button class="choir-item ${state.selectedChoir?.id === song.id ? 'active' : ''}" type="button" onclick="selectChoir('${esc(song.id)}')"><b>${esc(song.title || '제목 없음')}</b><span class="muted">${esc(song.schedule?.date || '날짜 미정')} · ${esc(song.schedule?.type || '자료')} · 파일 ${safeArray(song.files).length}</span></button>`).join('') || '<div class="empty">성가대 자료가 없습니다.</div>';
  renderChoirDetail(); renderChoirSet();
}
function renderChoirDetail(){
  const song = state.selectedChoir;
  if(!song){$('#choirDetail').innerHTML = '<div class="empty">성가곡을 선택하세요.</div>'; return}
  const part = state.choirPart;
  const pages = choirPages(song, part);
  const embed = youtubeEmbed(choirVideo(song, part));
  $('#choirDetail').innerHTML = `<div class="eyebrow">성가대모드</div><h2>${esc(song.title || '제목 없음')}</h2><p class="muted">${esc(song.schedule?.date || '날짜 미정')} · ${esc(song.memo || '등록된 메모 없음')}</p><div class="part-tabs">${partOrder.map(item => `<button type="button" class="${item === part ? 'active' : ''}" onclick="setChoirPart('${item}')">${partLabels[item]}</button>`).join('')}</div><div class="choir-media"><div class="choir-score">${pages.length ? `<div class="score-stack">${pages.map(file => `<img src="${esc(file.url || '')}" alt="${esc(song.title)} ${partLabels[part]} 악보" loading="lazy" onerror="brokenImage(this)">`).join('')}</div>` : '<div class="empty">이 성부 악보가 없습니다.</div>'}</div><div class="choir-side"><div class="panel flat"><h3>연습 영상</h3>${embed ? `<iframe class="video-frame" src="${esc(embed)}" allowfullscreen></iframe>` : '<p class="muted">이 성부 영상이 없습니다.</p>'}</div><div class="part-summary">${partOrder.map(item => `<div class="part-row"><b>${partLabels[item]}</b><span class="muted">악보 ${choirPages(song,item).length} · 영상 ${choirVideo(song,item) ? '있음' : '없음'}</span></div>`).join('')}</div></div></div>`;
}
function saveChoirSet(){localStorage.setItem(LS_CHOIR_SET, JSON.stringify(state.choirSet))}
function addChoirSet(){
  const song = state.selectedChoir;
  if(!song) return;
  if(!state.choirSet.some(item => String(item.id) === String(song.id))) state.choirSet.push({id:song.id, title:song.title || '제목 없음', date:song.schedule?.date || '', part:state.choirPart});
  saveChoirSet(); renderChoirSet(); toast('성가대 세트에 추가했어요');
}
function removeChoirSet(index){state.choirSet.splice(index, 1); saveChoirSet(); renderChoirSet()}
function renderChoirSet(){
  $('#choirSetList').innerHTML = state.choirSet.map((song,index) => `<div class="set-row"><div class="num">${index + 1}</div><div><b>${esc(song.title)}</b><div class="meta"><span>${esc(song.date || '날짜 미정')}</span><span>${esc(partLabels[song.part] || '4성부')}</span></div></div><div class="mini-actions"><button type="button" onclick="removeChoirSet(${index})">×</button></div></div>`).join('') || '<div class="empty">성가곡을 선택하고 성가대 세트 추가를 누르세요.</div>';
}
function wire(){
  $$('.mode-tabs button,[data-view-jump]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view || button.dataset.viewJump)));
  $('#reloadBtn').addEventListener('click', init);
  $('#songSearch').addEventListener('input', renderSongs);
  $('#songFilter').addEventListener('change', renderSongs);
  $('#openBuilderBtn').addEventListener('click', () => setView('builder'));
  $('#builderAddBtn').addEventListener('click', () => state.selectedSong && addToSet(state.selectedSong.id));
  $('#clearSetBtn').addEventListener('click', () => {state.set = []; saveSet(); renderSet(); renderShare(); renderPerform()});
  $('#setName').addEventListener('input', saveSet);
  $('#prevSongBtn').addEventListener('click', () => stepSong(-1));
  $('#nextSongBtn').addEventListener('click', () => stepSong(1));
  $('#prevPageBtn').addEventListener('click', () => stepPage(-1));
  $('#nextPageBtn').addEventListener('click', () => stepPage(1));
  $('#copyShareBtn').addEventListener('click', async () => {try{await navigator.clipboard.writeText($('#shareText').value); toast('복사했어요')}catch{toast('복사 실패')}});
  $('#choirSearch').addEventListener('input', renderChoir);
  $('#choirFilter').addEventListener('change', renderChoir);
  $('#addChoirSetBtn').addEventListener('click', addChoirSet);
  $('#clearChoirSetBtn').addEventListener('click', () => {state.choirSet = []; saveChoirSet(); renderChoirSet()});
  $('#performScore').addEventListener('touchstart', event => {state.touchX = event.touches[0].clientX}, {passive:true});
  $('#performScore').addEventListener('touchend', event => {const dx = (event.changedTouches[0].clientX || 0) - (state.touchX || 0); if(Math.abs(dx) > 50) stepPage(dx < 0 ? 1 : -1)}, {passive:true});
  window.addEventListener('keydown', event => {if(!$('#view-perform').classList.contains('active')) return; if(event.key === 'ArrowRight') stepPage(1); if(event.key === 'ArrowLeft') stepPage(-1)});
}
async function init(){
  state.errors = [];
  renderStatus();
  await Promise.all([loadSongs(), loadScores(), loadHistory(), loadChoir()]);
  renderStatus(); renderSongs(); renderBuilder(); renderSet(); renderPerform(); renderShare(); renderChoir();
}
window.selectSong = selectSong;
window.addToSet = addToSet;
window.removeSet = removeSet;
window.moveSet = moveSet;
window.setView = setView;
window.goPerformSong = goPerformSong;
window.brokenImage = brokenImage;
window.selectChoir = selectChoir;
window.setChoirPart = setChoirPart;
window.removeChoirSet = removeChoirSet;
wire();
init();
