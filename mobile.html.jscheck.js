
const SUPABASE_URL = 'https://rmtysrytveexshwzenxj.supabase.co';
const REAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdHlzcnl0dmVleHNod3plbnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjQ3OTYsImV4cCI6MjA5MjEwMDc5Nn0.5FzzJ1rg-uRG4jAGZ75xVT3i3NH0m6J_tDeOS4GxyT8';
const HEADERS = {'Content-Type':'application/json','apikey':REAL_KEY,'Authorization':'Bearer '+REAL_KEY,'Prefer':'return=representation'};
const STORAGE_URL = SUPABASE_URL + '/storage/v1';
const STOR_HEADERS = {'apikey': REAL_KEY, 'Authorization': 'Bearer ' + REAL_KEY};
let songs = [], history = [], currentConti = null, contiSongs = [], activeIdx = 0, scoreCache = {};
const CONTI_PLAYLIST_URL = 'https://youtube.com/playlist?list=PL_PTDB_rnKMJ3auZsgilJUx_C_S_o1dsL&si=t2rGgUjSRmETi5WH';
const liturgy = ['대림절','성탄절','주현절','사순절','고난주간','부활절','성령강림절','추수감사절'];
let mobilePreviewMode='score';
let expandedDbSongId=null;
let singleScoreSongId=null, singleScoreFiles=[], singleScorePage=0;
let performanceImageCache=new Map();
function setMobilePreviewMode(mode){mobilePreviewMode=mode==='video'?'video':'score';setActiveSong(activeIdx)}
function mobilePreviewTabs(){return `<div class="score-mode-tabs"><button class="${mobilePreviewMode==='score'?'on':''}" onclick="setMobilePreviewMode('score')">🎼 악보</button><button class="${mobilePreviewMode==='video'?'on':''}" onclick="setMobilePreviewMode('video')">▶ 영상</button></div>`}


async function api(method,path,body){const res=await fetch(SUPABASE_URL+'/rest/v1/'+path,{method,headers:HEADERS,body:body?JSON.stringify(body):undefined});if(!res.ok)throw new Error(await res.text());const t=await res.text();return t?JSON.parse(t):null}
async function listScores(songId){const res=await fetch(`${STORAGE_URL}/object/list/scores`,{method:'POST',headers:{...STOR_HEADERS,'Content-Type':'application/json'},body:JSON.stringify({prefix:songId+'/',limit:50})});if(!res.ok)return[];return await res.json()}
function scoreUrl(path){return `${STORAGE_URL}/object/public/scores/${path}`}
function norm(v){return (v||'').normalize('NFC').replace(/\s+/g,' ').trim().toLowerCase()}
function esc(s){return String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
const MOBILE_TOOLS_PASSWORD='1955';
let pendingMobileToolsButton=null;
function guardMobileTools(e,btn){
  if(e) e.preventDefault();
  pendingMobileToolsButton=btn||pendingMobileToolsButton;
  if(sessionStorage.getItem('worshipMobileToolsUnlocked')==='1'){
    showSection('tools', pendingMobileToolsButton);
    return;
  }
  openMobilePasswordModal();
}
function openMobilePasswordModal(){
  const modal=document.getElementById('mobile-password-modal');
  const input=document.getElementById('mobile-password-input');
  if(input) input.value='';
  modal?.classList.add('show');
  setTimeout(()=>input&&input.focus(),40);
}
function closeMobilePasswordModal(){document.getElementById('mobile-password-modal')?.classList.remove('show')}
function checkMobileToolsPassword(){
  const input=document.getElementById('mobile-password-input');
  if((input?.value||'').trim()===MOBILE_TOOLS_PASSWORD){
    sessionStorage.setItem('worshipMobileToolsUnlocked','1');
    closeMobilePasswordModal();
    showSection('tools', pendingMobileToolsButton || document.querySelectorAll('.nav button')[3]);
    toast('관리도구가 열렸어요');
    return;
  }
  toast('비밀번호가 올바르지 않습니다');
  if(input){input.value=''; input.focus();}
}
function showSection(name,btn){
  if(name==='tools' && sessionStorage.getItem('worshipMobileToolsUnlocked')!=='1'){
    pendingMobileToolsButton=btn||pendingMobileToolsButton;
    openMobilePasswordModal();
    return;
  }
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('show'));
  document.getElementById('sec-'+name).classList.add('show');
  document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('on'));
  if(btn)btn.classList.add('on');
}

async function init(){try{songs=await api('GET','songs?select=*&order=name');history=await api('GET','worship_history?select=*&order=worship_date.desc&limit=30');pickCurrentConti();renderHome();renderSongCards();renderHistory()}catch(e){document.getElementById('flow-list').innerHTML='<div class="loading">연결 실패: '+esc(e.message)+'</div>';toast('데이터 연결 실패')}}
function parseLocalDate(value){
  const [y,m,d]=String(value||'').split('-').map(Number);
  return y&&m&&d?new Date(y,m-1,d):new Date(value);
}
function weekBoundsFor(date=new Date()){
  const base=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  const day=base.getDay();
  const mondayOffset=day===0?-6:1-day;
  const start=new Date(base); start.setDate(base.getDate()+mondayOffset); start.setHours(0,0,0,0);
  const end=new Date(start); end.setDate(start.getDate()+6); end.setHours(23,59,59,999);
  return {start,end};
}
function findThisWeekConti(){
  const list=history||[];
  if(!list.length)return null;
  const {start,end}=weekBoundsFor(new Date());
  return list.find(h=>{const d=parseLocalDate(h.worship_date);return d>=start&&d<=end})||list[0];
}
function contiStoreKey(){return 'worshipdb_conti_overrides_'+(currentConti?.id||currentConti?.worship_date||'draft')}
function contiSongOverrideKey(song,i){
  const id=song?._base_id||song?.id;
  return id?`song:${id}:pos:${i}`:`name:${norm(song?.name||'')}:pos:${i}`;
}
function getContiOverrides(){try{return JSON.parse(localStorage.getItem(contiStoreKey())||'{}')}catch(e){return {}}}
function setContiOverrides(data){try{localStorage.setItem(contiStoreKey(),JSON.stringify(data||{}))}catch(e){}}
function cloneSongForConti(song,name=''){
  const base=song?{...song}:{name,status:'plan',count:0,seasons:[],key:'',bpm:0,music_url:'',has_score:false,memo:''};
  if(!base.name)base.name=name;
  base._base_id=base.id||null;
  return base;
}
function applyContiOverrides(){
  const overrides=getContiOverrides();
  contiSongs=contiSongs.map((s,i)=>{
    const key=contiSongOverrideKey(s,i);
    const legacy=overrides[i]||null;
    const next=overrides[key]||legacy;
    return {...s,...(next||{}),_conti_override:next||null};
  });
}

function namesCompatible(savedName, dbName){
  const a=norm(savedName||'');
  const b=norm(dbName||'');
  return !!a && !!b && a===b;
}
function findSongByExactName(name){
  const key=norm(name||'');
  if(!key)return null;
  const hits=(songs||[]).filter(s=>norm(s.name||'')===key);
  return hits.length===1?hits[0]:null;
}

function contiBaseName(v){
  return norm(v)
    .replace(/\[[^\]]*\]/g,' ')
    .replace(/\([^)]*\)/g,' ')
    .replace(/[_-](?:[a-g](?:#|b)?|코드|악보|ver\.?\s*\d+|v\d+|\d+페이지|\d+p)$/gi,' ')
    .replace(/\b(?:key|ver|version|코드)\b\s*[a-g](?:#|b)?/gi,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function uniqueContiSongsByName(list){
  const seenIds=new Set();
  const seenNames=new Set();
  return (list||[]).filter(s=>{
    const id=String(s?.id||'').trim();
    const nameKey=contiBaseName(s?.name||'') || norm(s?.name||'');
    if(id){
      if(seenIds.has(id))return false;
      seenIds.add(id);
    }
    if(nameKey){
      if(seenNames.has(nameKey))return false;
      seenNames.add(nameKey);
    }
    return !!(id||nameKey);
  });
}
function buildContiSongsFromHistory(h){
  // 예전 콘티는 song_ids가 song_names와 어긋난 기록이 있을 수 있다.
  // id가 있어도 저장된 곡명과 DB 곡명이 정확히 같을 때만 신뢰한다.
  // 다르면 저장된 곡명으로 정확히 1곡만 다시 찾고, 애매하면 이름만 표시한다.
  const ids=Array.isArray(h?.song_ids)?h.song_ids.map(x=>x?String(x):null):[];
  const list=(h?.song_names||[]).map((name,i)=>{
    const id=ids[i]||null;
    const byId=id?songs.find(s=>String(s.id)===String(id)):null;
    const safe=byId && namesCompatible(name,byId.name) ? byId : findSongByExactName(name);
    return cloneSongForConti(safe,name);
  });
  return uniqueContiSongsByName(list);
}
function pickCurrentConti(){
  currentConti=findThisWeekConti();
  if(!currentConti){contiSongs=songs.slice(0,4).map(s=>cloneSongForConti(s));applyContiOverrides();return}
  contiSongs=buildContiSongsFromHistory(currentConti);
  applyContiOverrides();
}
function songMeta(s){
  const tempo=(!s.bpm||s.bpm==0)?'':s.bpm>=120?'빠름':s.bpm>=76?'중간':'느림';
  const base=`${s.status==='used'?`사용 ${s.count||0}회`:s.status==='ready'?'악보 완료':'작업 예정'}${s.key?' · Key '+s.key:''}${tempo?' · '+tempo+' '+s.bpm:''}`;
  return s.score_version?`${base} · 악보 ${s.score_version}`:base;
}
function availabilityIcon(ok,label){
  return `<span class="state-icon ${ok?'ok':'missing'}" title="${label} ${ok?'있음':'없음'}">${label==='악보'?'🎼':'▶'}</span>`;
}
function compactKeyBpm(s){
  const key=s?.key?String(s.key).trim():'';
  const bpm=s?.bpm?String(s.bpm).trim():'';
  if(key&&bpm)return `${esc(key)} / ${esc(bpm)}`;
  return esc(key||bpm||'-');
}
function contiMainSubject(s){
  const pools=[s?.main_subject,s?.subject,s?.category,s?.section,s?.situation,s?.situation_tag,s?.season,(s?.situations||[])[0],(s?.seasons||[])[0],(s?.tags||[])[0]].filter(Boolean);
  if(pools.length)return String(pools[0]);
  if(s?.status==='ready'||s?.has_score)return '악보완료';
  if(s?.status==='used')return '사용곡';
  return '주성';
}
function renderHome(){
  if(currentConti){
    const d=parseLocalDate(currentConti.worship_date);
    const title=currentConti.title||currentConti.name||currentConti.worship_name||'';
    document.getElementById('today-badge').textContent=`✨ ${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 지정 콘티`;
    document.getElementById('hero-title').textContent=title?`${title} · ${(currentConti.song_names||[]).length}곡`:`${(currentConti.song_names||[]).length}곡 콘티`;
    document.getElementById('hero-desc').textContent=currentConti.note||'선택한 콘티의 순서와 곡별 악보를 보여줍니다.';
  }else{
    document.getElementById('today-badge').textContent='✨ 지정 콘티';
    document.getElementById('hero-title').textContent='아직 콘티 기록이 없습니다';
    document.getElementById('hero-desc').textContent='PC 화면에서 콘티 기록을 추가하면 지정 콘티로 표시됩니다.';
  }
  renderFlow();setActiveSong(activeIdx)
}
function renderFlow(){
  const el=document.getElementById('flow-list');
  if(!contiSongs.length){el.innerHTML='<div class="loading">콘티 곡이 없습니다.</div>';return}
  const head='<div class="flow-list-head"><span>순서</span><span>곡이름</span><span>Key</span><span>속도</span><span>악보</span><span>영상</span></div>';
  const rows=contiSongs.map((s,i)=>`<button class="flow-item ${i===activeIdx?'on':''}" onclick="setActiveSong(${i})" title="${esc(s.memo||s.note||s.name||'')}"><div class="flow-row conti-table-row"><div class="num">${i+1}</div><div class="conti-cell title">${esc(s.name||'-')}</div><div class="conti-cell key">${esc(s.key||'-')}</div><div class="conti-cell bpm">${esc(s.bpm||'-')}</div>${availabilityIcon(!!s.has_score,'악보')}${availabilityIcon(!!s.music_url,'영상')}</div></button>`).join('');
  el.innerHTML=head+rows;
}
async function setActiveSong(i){
  activeIdx=Math.max(0,Math.min(i,contiSongs.length-1));renderFlow();
  const s=contiSongs[activeIdx]||{};
  document.getElementById('score-title').textContent=s.name||'악보';
  const key=s.key?`${esc(s.key)} Key`:'';
  const bpm=s.bpm?`BPM ${esc(s.bpm)}`:'';
  const seasons=Array.isArray(s.seasons)?s.seasons.filter(Boolean).slice(0,2).map(esc).join(' · '):(s.season?esc(s.season):'');
  const situations=Array.isArray(s.situations)?s.situations.filter(Boolean).slice(0,2).map(esc).join(' · '):(s.situation?esc(s.situation):'');
  const meta=[key,bpm,seasons,situations].filter(Boolean);
  document.getElementById('score-tags').innerHTML=meta.length?meta.map(v=>`<span>${v}</span>`).join('<span class="sep">/</span>'):'<span class="empty">Key · BPM · 절기 · 상황 정보 없음</span>';
  const actionBox=document.getElementById('score-view-actions');
  if(actionBox) actionBox.innerHTML=mobilePreviewTabs();
  document.getElementById('score-memo').textContent=s.memo||s.note||'등록된 메모가 없습니다.';
  document.getElementById('score-link').textContent=`${contiSongs[activeIdx-1]?.name||'시작'} → ${s.name||''} → ${contiSongs[activeIdx+1]?.name||'마무리'}`;
  await loadPreview(s)
}
async function loadPreview(s){
  const box=document.getElementById('score-preview');
  if(mobilePreviewMode==='video'){
    if(!s?.music_url){box.innerHTML='<div class="score-empty">▶ 등록된 영상이 없습니다</div>';return}
    const embed=getYoutubeEmbedUrl(s.music_url);
    if(!embed){box.innerHTML='<div class="score-empty">유튜브 주소 형식을 확인해주세요<br><small>watch, youtu.be, shorts, live, embed 주소를 지원합니다.</small></div>';return}
    box.innerHTML=`<iframe class="mobile-inline-youtube" src="${embed}" title="${esc(s.name)} 영상보기" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    return;
  }
  box.innerHTML='<div class="score-empty">⟳ 악보 불러오는 중...</div>';
  if(!s.id){box.innerHTML='<div class="score-empty">🎼 DB에 없는 곡입니다</div>';return}
  let files=scoreCache[s.id];
  if(!files){files=await listScores(s.id);scoreCache[s.id]=files}
  if(!files||!files.length){box.innerHTML='<div class="score-empty">⏳ 악보 업로드 예정<br><small>준비되면 이 자리에 표시됩니다</small></div>';return}
  box.innerHTML=`<img src="${scoreUrl(s.id+'/'+files[0].name)}" alt="${esc(s.name)} 악보">`;
}
function moveSong(d){setActiveSong(activeIdx+d)}
function scrollToScore(){document.getElementById('score-panel').scrollIntoView({behavior:'smooth',block:'start'})}

function normalizeYoutubeInput(raw){
  return String(raw||'').trim();
}
function parseYoutubeSeconds(value){
  if(!value) return '';
  const text=String(value).trim().toLowerCase();
  if(/^\d+$/.test(text)) return text;
  const simple=text.match(/^(\d+)s$/);
  if(simple) return simple[1];
  const rich=text.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if(rich && (rich[1]||rich[2]||rich[3])){
    return String((parseInt(rich[1]||0)*3600)+(parseInt(rich[2]||0)*60)+parseInt(rich[3]||0));
  }
  return '';
}
function extractYoutubeInfo(raw){
  const input=normalizeYoutubeInput(raw);
  if(!input) return null;
  const direct=input.match(/^[a-zA-Z0-9_-]{11}$/);
  if(direct) return {id:direct[0], list:'', start:''};
  try{
    const url=new URL(input.startsWith('http')?input:'https://'+input);
    const host=url.hostname.replace(/^www\./,'').replace(/^m\./,'');
    const parts=url.pathname.split('/').filter(Boolean);
    const info={id:'', list:url.searchParams.get('list')||'', start:url.searchParams.get('start')||url.searchParams.get('t')||''};
    if(host==='youtu.be') info.id=parts[0]||'';
    else if(host.includes('youtube.com') || host.includes('youtube-nocookie.com')){
      if(parts[0]==='embed' || parts[0]==='shorts' || parts[0]==='live') info.id=parts[1]||'';
      else info.id=url.searchParams.get('v')||'';
    }
    if(info.id && !/^[a-zA-Z0-9_-]{11}$/.test(info.id)) info.id='';
    return (info.id||info.list)?info:null;
  }catch(e){
    const match=input.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
    return match?{id:match[1], list:'', start:''}:null;
  }
}
function getYoutubeEmbedUrl(raw){
  const info=extractYoutubeInfo(raw);
  if(!info) return '';
  const params=new URLSearchParams({rel:'0',modestbranding:'1',playsinline:'1'});
  if(info.list) params.set('list',info.list);
  const start=parseYoutubeSeconds(info.start);
  if(start) params.set('start',start);
  if(!info.id && info.list) return `https://www.youtube-nocookie.com/embed/videoseries?${params.toString()}`;
  if(!info.id) return '';
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(info.id)}?${params.toString()}`;
}
function openYoutubePlayer(url,title){
  if(!url){toast('유튜브 링크가 없어요');return}
  const embed = getYoutubeEmbedUrl(url);
  if(!embed){toast('유튜브 주소 형식을 확인해주세요');return}
  document.getElementById('youtube-player-title').textContent = title || '유튜브 보기';
  const frame = document.getElementById('youtube-player-frame');
  frame.src = embed;
  const link = document.getElementById('youtube-open-link');
  link.href = url;
  document.getElementById('youtube-player-modal').classList.add('show');
}
function closeYoutubePlayer(){
  document.getElementById('youtube-player-modal').classList.remove('show');
  document.getElementById('youtube-player-frame').src = 'about:blank';
}

function openActiveYoutube(){const s=contiSongs[activeIdx];if(s&&s.music_url)openYoutubePlayer(s.music_url,s.name+' · 유튜브');else toast('이 곡은 유튜브 링크가 없어요')}
function openActiveSongScoreViewer(){
  const s=contiSongs[activeIdx];
  if(!s){toast('선택된 곡이 없어요');return}
  if(s.id)openDbScoreViewer(s.id);else toast('이 곡은 연결된 악보 ID가 없어요')
}
function openCurrentYoutube(){openYoutubePlayer(CONTI_PLAYLIST_URL,'이번 주 콘티 · 유튜브 플레이리스트')}

function fullScorePrefix(){
  const key = currentConti?.id || currentConti?.worship_date || 'latest';
  return `_full_scores/${key}/`;
}
function safeFileName(name){
  const ext = (name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g,'') || 'jpg';
  return `${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`;
}
async function listFullScores(){
  const res=await fetch(`${STORAGE_URL}/object/list/scores`,{method:'POST',headers:{...STOR_HEADERS,'Content-Type':'application/json'},body:JSON.stringify({prefix:fullScorePrefix(),limit:100,sortBy:{column:'name',order:'asc'}})});
  if(!res.ok)return[];
  return (await res.json()).filter(f=>!f.name.startsWith('.'));
}
function fullScoreUrl(name){return scoreUrl(fullScorePrefix()+name)}
async function openFullScore(){
  document.getElementById('viewer').classList.remove('performance');
  document.getElementById('viewer').dataset.mode='full';
  document.getElementById('viewer-title').textContent='콘티 한눈에보기';
  document.getElementById('viewer-subtitle').textContent='업로드된 한눈보기 악보 이미지';
  document.getElementById('viewer-mini').innerHTML='';
  document.getElementById('viewer-body').innerHTML='<div class="loading">한눈보기 불러오는 중...</div>';
  document.getElementById('viewer').classList.add('show');
  const files=await listFullScores();
  if(!files.length){document.getElementById('viewer-body').innerHTML='<div class="loading">업로드된 한눈보기 악보가 없습니다.<br><br><button class="mini-btn white" onclick="closeViewer();openFullScoreManager()">한눈보기 업로드</button></div>';return}
  document.getElementById('viewer-body').innerHTML=files.map(f=>`<img src="${fullScoreUrl(f.name)}" alt="한눈에보기">`).join('');
}
async function openFullScoreManager(){
  document.getElementById('full-score-modal').classList.add('show');
  await renderFullScoreList();
}
function closeFullScoreManager(){document.getElementById('full-score-modal').classList.remove('show')}
async function renderFullScoreList(){
  const el=document.getElementById('full-score-list');
  el.innerHTML='<div class="selected-item"><span>불러오는 중...</span></div>';
  const files=await listFullScores();
  if(!files.length){el.innerHTML='<div class="selected-item"><span>아직 업로드된 한눈보기 악보가 없습니다.</span></div>';return}
  el.innerHTML=files.map((f,i)=>`<div class="selected-item"><span>${i+1}. ${esc(f.name)}</span><span><button onclick="openFullScore()">보기</button> <button onclick="deleteFullScore('${esc(f.name)}')">삭제</button></span></div>`).join('');
}
async function uploadFullScores(){
  const input=document.getElementById('full-score-files');
  const files=[...(input.files||[])];
  if(!files.length){toast('업로드할 JPG/PNG를 선택해주세요');return}
  for(const file of files){
    if(!/^image\/(png|jpeg)$/.test(file.type)){toast('JPG/PNG 파일만 가능해요');continue}
    const path=fullScorePrefix()+safeFileName(file.name);
    const res=await fetch(`${STORAGE_URL}/object/scores/${path}`,{method:'POST',headers:{...STOR_HEADERS,'Content-Type':file.type,'x-upsert':'true'},body:file});
    if(!res.ok){toast('업로드 실패: '+await res.text());return}
  }
  input.value='';
  await renderFullScoreList();
  toast('한눈보기 악보를 업로드했어요');
}
async function deleteFullScore(name){
  if(!confirm('이 한눈보기 이미지를 삭제할까요?'))return;
  const path=fullScorePrefix()+name;
  const res=await fetch(`${STORAGE_URL}/object/scores`,{method:'DELETE',headers:{...STOR_HEADERS,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[path]})});
  if(!res.ok){toast('삭제 실패: '+await res.text());return}
  await renderFullScoreList();
  toast('삭제했어요');
}


function preloadImage(url){
  return new Promise(resolve=>{
    if(performanceImageCache.has(url)) return resolve(performanceImageCache.get(url));
    const img=new Image();
    img.onload=()=>{performanceImageCache.set(url,img);resolve(img)};
    img.onerror=()=>resolve(null);
    img.src=url;
  });
}
async function preloadPerformanceScores(){
  performanceImageCache.clear();
  const jobs=[];
  for(const song of contiSongs){
    if(!song?.id) continue;
    jobs.push((async()=>{
      const files=scoreCache[song.id]||await listScores(song.id);
      scoreCache[song.id]=files;
      await Promise.all((files||[]).map(f=>preloadImage(scoreUrl(song.id+'/'+f.name))));
    })());
  }
  await Promise.allSettled(jobs);
}
function clearPerformanceImageCache(){performanceImageCache.clear()}

let pendingPerformanceOpen=false;
let orientationLocked=false;
let requestedPerformanceOrientation=null;
let performanceBodySnapshot=null;
let viewerPage=0, viewerFiles=[], viewerPageMode=(window.PERFORMANCE_LAYOUT==='landscape'?2:1), wakeLock=null;
function closeOrientationChooser(){document.getElementById('performance-orientation-modal')?.classList.remove('show');pendingPerformanceOpen=false}
function openSongViewer(){
  if(!contiSongs.length){toast('콘티 곡이 없습니다');return}
  pendingPerformanceOpen=true;
  const mode = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  startPerformanceWithOrientation(mode);
}
function freezePerformancePage(){
  if(performanceBodySnapshot) return;
  performanceBodySnapshot={
    overflow:document.body.style.overflow,
    position:document.body.style.position,
    inset:document.body.style.inset,
    width:document.body.style.width,
    height:document.body.style.height,
    touchAction:document.body.style.touchAction,
    overscrollBehavior:document.body.style.overscrollBehavior
  };
  document.body.classList.add('performance-active');
}
function restorePerformancePage(){
  document.body.classList.remove('performance-active','performance-landscape','performance-portrait');
  if(!performanceBodySnapshot) return;
  Object.assign(document.body.style,performanceBodySnapshot);
  performanceBodySnapshot=null;
}
async function startPerformanceWithOrientation(mode){
  if(!pendingPerformanceOpen && !contiSongs.length){toast('콘티 곡이 없습니다');return}
  pendingPerformanceOpen=false;
  requestedPerformanceOrientation=mode;
  window.PERFORMANCE_LAYOUT=mode==='landscape'?'landscape':'portrait';
  viewerPageMode=window.innerWidth > window.innerHeight ? 2 : 1;
  freezePerformancePage();
  document.body.classList.toggle('performance-landscape',mode==='landscape');
  document.body.classList.toggle('performance-portrait',mode==='portrait');
  closeOrientationChooser();
  await enterFullscreenForPerformance();
  await lockPerformanceOrientation(mode);
  await actuallyOpenSongViewer();
}
async function enterFullscreenForPerformance(){
  const el=document.documentElement;
  try{
    if(!document.fullscreenElement && el.requestFullscreen){
      await el.requestFullscreen({navigationUI:'hide'}).catch(()=>el.requestFullscreen());
    }
  }catch(e){}
}
async function lockPerformanceOrientation(mode){
  orientationLocked=false;
  try{
    if(screen.orientation && screen.orientation.lock){
      await screen.orientation.lock(mode==='landscape'?'landscape':'portrait');
      orientationLocked=true;
      toast('모바일 연주모드로 화면 고정을 시도했어요');
    }else{
      toast('이 브라우저는 방향 고정을 지원하지 않아요');
    }
  }catch(e){
    orientationLocked=false;
    toast('방향 고정 실패: 기기 회전잠금도 함께 사용해주세요');
  }
}
async function unlockPerformanceOrientation(){
  try{if(screen.orientation && screen.orientation.unlock)screen.orientation.unlock()}catch(e){}
  orientationLocked=false;
  try{if(document.fullscreenElement && document.exitFullscreen)await document.exitFullscreen()}catch(e){}
}
async function actuallyOpenSongViewer(){
  if(!contiSongs.length){toast('콘티 곡이 없습니다');return}
  const v=document.getElementById('viewer');
  v.dataset.mode='song';
  v.classList.add('show');
  viewerPage=0;
  await requestWakeLock();
  preloadPerformanceScores();
  await renderPerformanceViewer();
}

async function goViewerSong(i){
  await goViewerSongPage(i,0);
}
async function goViewerSongPage(i,page='first'){
  activeIdx=Math.max(0,Math.min(i,contiSongs.length-1));
  renderFlow();
  await setActiveSong(activeIdx);
  const song=contiSongs[activeIdx];
  viewerFiles=[];
  if(song?.id){
    viewerFiles=scoreCache[song.id]||await listScores(song.id);
    scoreCache[song.id]=viewerFiles;
  }
  const max=Math.max(0,(viewerFiles?.length||1)-1);
  if(page==='last'){
    const spread=viewerPageMode===2?2:1;
    viewerPage=Math.max(0,max-(spread-1));
  }else if(typeof page==='number'){
    viewerPage=Math.max(0,Math.min(max,page));
  }else{
    viewerPage=0;
  }
  renderPerformanceBodyOnly();
}
async function viewerNext(){if(activeIdx<contiSongs.length-1)await goViewerSongPage(activeIdx+1,0)}
async function viewerPrev(){if(activeIdx>0)await goViewerSongPage(activeIdx-1,'last')}
async function viewerPageStep(delta){
  const max=Math.max(0,(viewerFiles?.length||1)-1);
  const step=viewerPageMode===2?2:1;
  const rawNext=viewerPage+(delta*step);
  if(rawNext>max){
    if(activeIdx<contiSongs.length-1){
      await goViewerSongPage(activeIdx+1,0);
      toast('다음 곡으로 이동했어요');
      return true;
    }
    toast('마지막 곡의 마지막 페이지입니다');
    return false;
  }
  if(rawNext<0){
    if(activeIdx>0){
      await goViewerSongPage(activeIdx-1,'last');
      toast('이전 곡으로 이동했어요');
      return true;
    }
    toast('첫 곡의 첫 페이지입니다');
    return false;
  }
  viewerPage=rawNext;
  renderPerformanceBodyOnly();
  return true;
}
function setPageMode(mode){
  viewerPageMode=mode===2?2:1;
  renderPerformanceBodyOnly();
}
function togglePageMode(){
  setPageMode(viewerPageMode===2?1:2);
}
async function togglePerformanceScreenLock(){
  if(wakeLock){await releaseWakeLock();toast('화면잠금을 해제했어요');}
  else{await requestWakeLock();toast(wakeLock?'화면잠금을 켰어요':'화면잠금이 지원되지 않아요');}
  renderPerformanceBodyOnly();
}
async function renderPerformanceViewer(){
  const s=contiSongs[activeIdx];if(!s)return;
  const prev=contiSongs[activeIdx-1]?.name||'처음';
  const next=contiSongs[activeIdx+1]?.name||'마지막';
  document.getElementById('viewer-title').textContent=`${activeIdx+1}. ${s.name}`;
  document.getElementById('viewer-subtitle').textContent=`← ${prev} · 다음: ${next} →`;
  document.getElementById('viewer-mini').innerHTML='';
  viewerFiles=[];
  if(s.id){viewerFiles=scoreCache[s.id]||await listScores(s.id);scoreCache[s.id]=viewerFiles}
  const max=Math.max(0,viewerFiles.length-1); viewerPage=Math.max(0,Math.min(viewerPage,max));
  renderPerformanceBodyOnly();
}
function renderPerformanceBodyOnly(){
  const s=contiSongs[activeIdx];if(!s)return;
  const prev=contiSongs[activeIdx-1]?.name||'처음';
  const next=contiSongs[activeIdx+1]?.name||'마지막';
  const body=document.getElementById('viewer-body');
  const isLandscape=window.PERFORMANCE_LAYOUT==='landscape';
  const mode=viewerPageMode===2?2:1;
  const pageCount=viewerFiles.length||0;
  const pages=[];
  if(!pageCount){
    pages.push(`<div class="viewer-page empty">⏳ 악보 업로드 예정<small>${esc(s.name)} 악보가 준비되면 여기에 표시됩니다.</small></div>`);
  }else{
    for(let p=0;p<mode;p++){
      const file=viewerFiles[viewerPage+p];
      if(file){pages.push(`<div class="viewer-page"><img src="${scoreUrl(s.id+'/'+file.name)}" alt="${esc(s.name)} 악보 ${viewerPage+p+1}"></div>`)}
      else if(mode===2){pages.push(`<div class="viewer-page empty">마지막 페이지<small>${viewerPage+p+1}쪽은 없습니다.</small></div>`)}
    }
  }
  const wakeOk=!!wakeLock;
  contiSongs=uniqueContiSongsByName(contiSongs||[]);
  activeIdx=Math.max(0,Math.min(activeIdx,Math.max(0,contiSongs.length-1)));
  const activeName=norm(s.name||'');
  const orderStrip=contiSongs.map((song,i)=>{
    const same=norm(song.name||'')===activeName;
    const cls=i===activeIdx?'perf-current':(same?'perf-same':'perf-other');
    const label=`${i+1} ${song.name||'곡'}`;
    return `<button class="${cls}" onclick="goViewerSong(${i})" title="${esc(label)}">${esc(label)}</button>`;
  }).join('');
  const memoText=(s.memo||s.conti_memo||s.note||'').trim();
  const memoStrip=memoText?`<div class="performance-memo-strip">${esc(memoText)}</div>`:'';
  const topOverlay=`<div class="performance-top-overlay"><div class="performance-top-left"><button class="performance-chip ${mode===1?'on':''}" onclick="setPageMode(1)">1페이지 보기</button><button class="performance-chip ${mode===2?'on':''}" onclick="setPageMode(2)">2페이지 보기</button></div><div class="performance-top-right"><button class="performance-chip close-chip" onclick="closeViewer()">×</button></div></div>`;
  const bottomLock=`<button class="performance-lock ${wakeOk?'on':''}" onclick="togglePerformanceScreenLock()">화면잠금</button>`;
  const layoutClass=isLandscape?'landscape':'portrait';
  body.innerHTML=`<div class="viewer-stage ${layoutClass} ${mode===2?'two':'one'}">${pages.join('')}${topOverlay}${memoStrip}<div class="performance-song-strip">${orderStrip}</div>${bottomLock}</div>`;
}
async function requestWakeLock(){
  try{ if('wakeLock' in navigator){ wakeLock=await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release',()=>{wakeLock=null}); } }
  catch(e){ wakeLock=null; toast('화면 유지가 지원되지 않으면 기기 자동잠금을 꺼주세요'); }
}
async function releaseWakeLock(){ try{ if(wakeLock){ await wakeLock.release(); wakeLock=null; } }catch(e){} }
async function closeViewer(){
  const v=document.getElementById('viewer');
  v?.classList.remove('show');
  clearPerformanceImageCache();
  await releaseWakeLock();
  await unlockPerformanceOrientation();
  restorePerformancePage();
}


function formatUsageDate(raw){
  if(!raw)return '';
  try{const d=parseLocalDate(raw);return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;}catch(e){return String(raw).slice(0,10).replaceAll('-','.')}
}
function songUsageHistoryRows(song,limit=3){
  const name=norm(song?.name||'');
  const id=String(song?.id||'');
  return (history||[]).filter(h=>{
    const ids=(h.song_ids||[]).map(x=>String(x));
    const names=(h.song_names||[]).map(x=>norm(x));
    return (id&&ids.includes(id)) || (name&&names.includes(name));
  }).sort((a,b)=>String(b.worship_date||'').localeCompare(String(a.worship_date||''))).slice(0,limit);
}
function renderExpandedUsage(song){
  const rows=songUsageHistoryRows(song,3);
  if(!rows.length){
    return `<div class="expanded-usage-box"><div class="expanded-usage-title">🕘 언제 사용했나요?</div><div class="expanded-usage-empty">아직 연결된 사용 기록이 없습니다.</div></div>`;
  }
  return `<div class="expanded-usage-box"><div class="expanded-usage-title">🕘 언제 사용했나요?</div><div class="expanded-usage-list">${rows.map(h=>{
    const label=h.title||h.name||h.worship_name||'예배 콘티';
    return `<div class="expanded-usage-row"><b>${esc(formatUsageDate(h.worship_date))}</b><span>${esc(label)}</span></div>`;
  }).join('')}</div></div>`;
}

function renderSongCards(){
  const q=norm(document.getElementById('song-q')?.value||'');
  const f=document.getElementById('song-filter')?.value||'all';
  let list=songs.filter(s=>{
    if(q&&!norm(s.name).includes(q))return false;
    if(f==='ready')return s.status==='ready'||s.has_score;
    if(f==='no_score')return !s.has_score;
    if(f==='video')return !!s.music_url;
    if(f==='used')return s.status==='used';
    return true;
  }).slice(0,120);
  const el=document.getElementById('song-grid');
  el.innerHTML=list.map(s=>renderDbSongCard(s)).join('')||'<div class="loading">검색 결과가 없습니다.</div>';
  setTimeout(hydrateExpandedDbScorePreview,0);
}
function renderDbSongCard(s){
  const expanded=String(expandedDbSongId)===String(s.id);
  const seas=s.seasons||[];
  const tags=[...(seas.filter(t=>!liturgy.includes(t)).slice(0,2)),...(seas.filter(t=>liturgy.includes(t)).slice(0,2))];
  const scoreCls=s.has_score?'':' missing';
  const videoCls=s.music_url?'':' missing';
  if(!expanded){
    return `<div class="song-card" onclick="toggleDbSongDetail('${esc(s.id)}')">
      <h4>${esc(s.name)}</h4>
      <div class="meta">${esc([s.key?'Key '+s.key:'Key -',s.bpm?'BPM '+s.bpm:'BPM -'].join(' · '))}</div>
      <div class="song-card-icons"><span class="state-icon${scoreCls}" title="${s.has_score?'악보 있음':'악보 없음'}">🎼</span><span class="state-icon${videoCls}" title="${s.music_url?'영상 있음':'영상 없음'}">▶</span></div>
      <button class="mini-btn white quick-add" onclick="event.stopPropagation();addDbSongToConti('${esc(s.id)}')">콘티추가</button>
    </div>`;
  }
  return `<div class="song-card expanded" onclick="event.stopPropagation()">
    <div class="expanded-song-deck">
      <div class="expanded-song-left">
        <div onclick="toggleDbSongDetail('${esc(s.id)}')" style="cursor:pointer">
          <h4>${esc(s.name)}</h4>
          <div class="meta">${esc(songMeta(s))}</div>
        </div>
        <div class="expanded-song-meta">
          <span class="pill">${esc(s.key?'Key '+s.key:'Key 미등록')}</span>
          <span class="pill">${esc(s.bpm?'BPM '+s.bpm:'BPM 미등록')}</span>
          <span class="pill">${s.has_score?'🎼 악보 있음':'🎼 악보 없음'}</span>
          <span class="pill">${s.music_url?'▶ 영상 있음':'▶ 영상 없음'}</span>
          ${tags.map(t=>`<span class="pill">${esc(t)}</span>`).join('')}
        </div>
        <div class="expanded-song-desc">${esc(s.memo||'등록된 메모가 없습니다.')}</div>
        ${renderExpandedUsage(s)}
        <div class="expanded-actions">
          <button class="mini-btn" onclick="event.stopPropagation();openSongEdit('${esc(s.id)}')">수정</button>
          <button class="mini-btn" onclick="event.stopPropagation();openDbScoreViewer('${esc(s.id)}')">악보보기</button>
          <button class="mini-btn" onclick="event.stopPropagation();openDbYoutube('${esc(s.id)}')">영상보기</button>
          <button class="mini-btn white" onclick="event.stopPropagation();openSongScoreManager('${esc(s.id)}')">다른버전 악보추가</button>
        </div>
      </div>
      <div class="expanded-song-viewer" id="db-score-preview-${esc(s.id)}" data-song-id="${esc(s.id)}" data-has-score="${s.has_score?'1':'0'}" data-song-name="${esc(s.name)}">
        <div class="score-empty"><b>🎼 작은 악보</b><span>${s.has_score?'악보를 불러오는 중입니다':'등록된 악보가 없어요'}</span></div>
      </div>
    </div>
  </div>`;
}
function toggleDbSongDetail(id){
  expandedDbSongId=String(expandedDbSongId)===String(id)?null:id;
  renderSongCards();
}

async function hydrateExpandedDbScorePreview(){
  const targets=Array.from(document.querySelectorAll('.expanded-song-viewer[data-song-id]'));
  for(const el of targets){
    const id=el.dataset.songId;
    const name=el.dataset.songName||'선택곡';
    if(el.dataset.hasScore!=='1'){
      el.classList.remove('video-mode');
      el.innerHTML='<div class="score-empty"><b>🎼 작은 악보</b><span>등록된 악보가 없어요</span></div>';
      continue;
    }
    try{
      let files=scoreCache[id];
      if(!files){files=await listScores(id);scoreCache[id]=files;}
      if(!files||!files.length){
        el.classList.remove('video-mode');
        el.innerHTML='<div class="score-empty"><b>🎼 작은 악보</b><span>악보 있음으로 표시되지만 파일을 찾지 못했어요</span></div>';
        continue;
      }
      const url=scoreUrl(id+'/'+files[0].name);
      el.classList.remove('video-mode');
      el.innerHTML=`<img src="${url}" alt="${esc(name)} 작은 악보" loading="lazy">`;
    }catch(e){
      el.classList.remove('video-mode');
      el.innerHTML='<div class="score-empty"><b>🎼 작은 악보</b><span>악보를 불러오지 못했어요</span></div>';
    }
  }
}
function moveExpandedDbSong(delta){
  if(!expandedDbSongId)return;
  const visible=Array.from(document.querySelectorAll('.song-card')).map((_,i)=>i);
  const q=norm(document.getElementById('song-q')?.value||'');
  const f=document.getElementById('song-filter')?.value||'all';
  const list=songs.filter(s=>{if(q&&!norm(s.name).includes(q))return false;if(f==='ready')return s.status==='ready'||s.has_score;if(f==='no_score')return !s.has_score;if(f==='video')return !!s.music_url;if(f==='used')return s.status==='used';return true}).slice(0,120);
  const idx=list.findIndex(s=>String(s.id)===String(expandedDbSongId));
  const next=list[Math.max(0,Math.min(list.length-1,idx+delta))];
  if(next){expandedDbSongId=next.id;renderSongCards();}
}
function selectSongFromDb(id){toggleDbSongDetail(id)}
function addDbSongToConti(id){const s=songs.find(x=>x.id===id);if(!s)return;const exists=contiSongs.find(x=>String(x.id)===String(id));if(!exists){contiSongs.push(cloneSongForConti(s));}renderHome();toast(exists?'이미 콘티에 있는 곡이에요':'현재 화면 콘티에 추가했어요')}
function deleteDbSongFromCard(id){mobileSongId=id;deleteMobileSong()}
function openDbYoutube(id){
  const s=songs.find(x=>String(x.id)===String(id));
  if(!s||!s.music_url){toast('유튜브 링크가 없어요');return}
  const embed=getYoutubeEmbedUrl(s.music_url);
  if(!embed){toast('유튜브 주소 형식을 확인해주세요');return}
  const rawId='db-score-preview-'+String(id);
  let box=document.getElementById(rawId);
  if(!box){
    box=document.querySelector('[data-song-id="'+CSS.escape(String(id))+'"]');
  }
  if(!box){toast('오른쪽 미리보기 영역을 찾지 못했어요. 곡을 다시 선택해 주세요.');return}
  box.classList.add('video-mode');
  box.scrollTop=0;
  box.innerHTML=`<iframe class="mobile-inline-youtube" src="${embed}" title="${esc(s.name)} 영상보기" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
}
async function openDbScoreViewer(id){
  const s=songs.find(x=>String(x.id)===String(id));
  if(!s){toast('곡을 찾을 수 없어요');return}
  singleScoreSongId=s.id;
  singleScorePage=0;
  singleScoreFiles=scoreCache[s.id]||await listScores(s.id);
  scoreCache[s.id]=singleScoreFiles;
  document.getElementById('viewer').dataset.mode='db-single-score';
  document.getElementById('viewer').classList.remove('performance');
  document.getElementById('viewer-title').textContent=s.name+' 악보';
  document.getElementById('viewer-subtitle').textContent='해당 곡 악보 크게보기';
  document.getElementById('viewer-mini').innerHTML='';
  document.getElementById('viewer').classList.add('show');
  renderSingleScoreViewer();
}
function renderSingleScoreViewer(){
  const s=songs.find(x=>String(x.id)===String(singleScoreSongId));
  const body=document.getElementById('viewer-body');
  if(!s){body.innerHTML='<div class="loading">곡을 찾을 수 없습니다.</div>';return}
  const count=singleScoreFiles.length;
  const toolbar=`<div class="single-score-toolbar">
    <button class="mini-btn" onclick="moveSingleScoreSong(-1)">이전곡</button>
    <button class="mini-btn" onclick="moveSingleScorePage(-1)">이전쪽</button>
    <span class="single-score-page">${count?singleScorePage+1:0} / ${count||0}쪽</span>
    <button class="mini-btn" onclick="moveSingleScorePage(1)">다음쪽</button>
    <button class="mini-btn" onclick="moveSingleScoreSong(1)">다음곡</button>
  </div>`;
  if(!count){body.innerHTML=toolbar+`<div class="viewer-empty-big">⏳ 악보 업로드 예정<small>${esc(s.name)} 악보가 준비되면 여기에 표시됩니다.</small></div>`;return}
  singleScorePage=Math.max(0,Math.min(singleScorePage,count-1));
  const f=singleScoreFiles[singleScorePage];
  body.innerHTML=toolbar+`<img src="${scoreUrl(s.id+'/'+f.name)}" alt="${esc(s.name)} 악보 ${singleScorePage+1}">`;
}
function moveSingleScorePage(delta){
  const max=Math.max(0,singleScoreFiles.length-1);
  singleScorePage=Math.max(0,Math.min(max,singleScorePage+delta));
  renderSingleScoreViewer();
}
async function moveSingleScoreSong(delta){
  const q=norm(document.getElementById('song-q')?.value||'');
  const list=songs.filter(s=>!q||norm(s.name).includes(q));
  const idx=list.findIndex(s=>String(s.id)===String(singleScoreSongId));
  const next=list[Math.max(0,Math.min(list.length-1,idx+delta))];
  if(next) await openDbScoreViewer(next.id);
}

function renderHistory(){const el=document.getElementById('history-grid');el.innerHTML=(history||[]).map(h=>{const d=parseLocalDate(h.worship_date);return `<div class="history-card"><div class="history-date">${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}</div><div class="history-title">주일예배</div><div class="pill-row" style="margin-top:10px">${(h.song_names||[]).map(n=>`<span class="pill">${esc(n)}</span>`).join('')}</div><div class="btn-row"><button class="mini-btn" onclick="loadHistoryAsConti('${h.id}')">이 콘티 보기</button><button class="mini-btn" onclick="shareHistory('${h.id}')">카톡공유</button><button class="mini-btn white" onclick="openMobileHistory('${h.id}')">수정</button></div></div>`}).join('')||'<div class="loading">콘티 기록이 없습니다.</div>'}
function loadHistoryAsConti(id){const h=history.find(x=>x.id===id);if(!h)return;currentConti=h;contiSongs=buildContiSongsFromHistory(h);applyContiOverrides();showSection('home',document.querySelector('.nav button'));renderHome();toast('선택한 콘티 기록을 열었어요')}


function shareUrlForHistory(id){
  const url=new URL('share.html', location.href);
  if(id) url.searchParams.set('id',id);
  return url.toString();
}
async function shareHistory(id){
  const h=(history||[]).find(x=>String(x.id)===String(id));
  const url=shareUrlForHistory(id);
  const title='콘티 공유';
  const text=h?`${h.worship_date} 콘티`:title;
  try{
    if(navigator.share){await navigator.share({title,text,url});toast('공유창을 열었어요');return}
  }catch(e){}
  try{
    await navigator.clipboard.writeText(url);
    toast('공유 링크를 복사했어요. 카톡에 붙여넣어 보내세요');
  }catch(e){
    toast('공유 링크 복사가 막혔어요. 브라우저 주소창에서 복사해주세요');
  }
}
function shareCurrentConti(){
  if(!currentConti?.id){toast('공유할 콘티가 없습니다');return}
  shareHistory(currentConti.id);
}


let editingContiSongIdx=null;
function openActiveContiSongEdit(){openContiSongEdit(activeIdx)}
function openActiveSongScoreUpload(){openContiSongEdit(activeIdx)}
function contiEditingSong(){return editingContiSongIdx==null?null:contiSongs[editingContiSongIdx]}
function openContiSongEdit(idx){
  if(idx==null||idx<0||idx>=contiSongs.length){toast('수정할 콘티 곡을 선택해주세요');return}
  editingContiSongIdx=idx;
  const s=contiSongs[idx]||{};
  document.getElementById('conti-song-modal-title').textContent=`${idx+1}. ${s.name||'콘티 곡'} 설정`;
  document.getElementById('m-conti-name').value=s.name||'';
  document.getElementById('m-conti-key').value=s.key||'';
  document.getElementById('m-conti-bpm').value=s.bpm||'';
  document.getElementById('m-conti-score-version').value=s.score_version||'';
  document.getElementById('m-conti-url').value=s.music_url||'';
  document.getElementById('m-conti-memo').value=s.memo||s.note||'';
  const scoreInput=document.getElementById('m-conti-score-files');
  if(scoreInput)scoreInput.value='';
  document.getElementById('conti-song-modal').classList.add('show');
  renderContiSongScoreList();
}
function closeContiSongEdit(){document.getElementById('conti-song-modal').classList.remove('show')}
async function renderContiSongScoreList(){
  const el=document.getElementById('m-conti-score-list');
  if(!el)return;
  const song=contiEditingSong();
  if(!song?.id){el.innerHTML='<div class="selected-item"><span>DB에 연결된 곡이 아니라 악보 업로드를 할 수 없습니다.</span></div>';return}
  el.innerHTML='<div class="selected-item"><span>악보 목록 불러오는 중...</span></div>';
  const files=await listScores(song.id);
  scoreCache[song.id]=files;
  if(!files.length){el.innerHTML=`<div class="selected-item"><span>⏳ ${esc(song.name||'선택곡')} 악보 업로드 예정</span></div>`;return}
  el.innerHTML=files.map((f,i)=>{const path=song.id+'/'+f.name;return `<div class="selected-item"><span>${i+1}. ${esc(f.name)}</span><span><button onclick="openSingleScoreImage('${esc(path)}','${esc(song.name||'선택곡')}')">보기</button> <button onclick="deleteContiSongScore('${esc(path)}')">삭제</button></span></div>`}).join('');
}
async function uploadContiSongScores(){
  const song=contiEditingSong();
  const input=document.getElementById('m-conti-score-files');
  if(!song?.id){toast('DB에 연결된 곡만 악보 업로드가 가능해요');return}
  const files=[...(input?.files||[])];
  if(!files.length){toast('업로드할 악보 이미지를 선택하세요');return}
  for(const file of files){
    if(!/^image\/(png|jpeg)$/.test(file.type)){toast('JPG/PNG 파일만 가능해요');continue}
    const path=`${song.id}/${safeFileName(file.name)}`;
    const res=await fetch(`${STORAGE_URL}/object/scores/${path}`,{method:'POST',headers:{...STOR_HEADERS,'Content-Type':file.type,'x-upsert':'true'},body:file});
    if(!res.ok){toast('업로드 실패: '+file.name);return}
  }
  try{await api('PATCH',`songs?id=eq.${song.id}`,{has_score:true,status:song.status==='plan'?'ready':song.status,updated_at:new Date().toISOString()})}catch(e){}
  const idx=songs.findIndex(s=>String(s.id)===String(song.id));
  if(idx>=0){songs[idx].has_score=true;if(songs[idx].status==='plan')songs[idx].status='ready'}
  contiSongs=contiSongs.map(s=>String(s.id)===String(song.id)?{...s,has_score:true,status:s.status==='plan'?'ready':s.status}:s);
  scoreCache[song.id]=null;
  if(input)input.value='';
  await renderContiSongScoreList();
  renderFlow();
  await setActiveSong(activeIdx);
  toast('현재 곡 악보를 업로드했어요');
}
async function deleteContiSongScore(path){
  if(!confirm('이 곡별 악보 이미지를 삭제할까요?'))return;
  const res=await fetch(`${STORAGE_URL}/object/scores`,{method:'DELETE',headers:{...STOR_HEADERS,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[path]})});
  if(!res.ok){toast('삭제 실패');return}
  const song=contiEditingSong();
  if(song?.id){
    scoreCache[song.id]=null;
    const files=await listScores(song.id);
    scoreCache[song.id]=files;
    if(!files.length){
      try{await api('PATCH',`songs?id=eq.${song.id}`,{has_score:false,updated_at:new Date().toISOString()})}catch(e){}
      const idx=songs.findIndex(s=>String(s.id)===String(song.id));
      if(idx>=0)songs[idx].has_score=false;
      contiSongs=contiSongs.map(s=>String(s.id)===String(song.id)?{...s,has_score:false}:s);
    }
  }
  await renderContiSongScoreList();
  renderFlow();
  await setActiveSong(activeIdx);
  toast('곡별 악보를 삭제했어요');
}
async function openContiSongScoreViewer(){
  const song=contiEditingSong();
  if(!song?.id){toast('연결된 곡 ID가 없어요');return}
  closeContiSongEdit();
  openDbScoreViewer(song.id);
}
function saveContiSongEdit(){
  if(editingContiSongIdx==null)return;
  const overrides=getContiOverrides();
  const next={
    key:document.getElementById('m-conti-key').value.trim(),
    bpm:parseInt(document.getElementById('m-conti-bpm').value)||'',
    score_version:document.getElementById('m-conti-score-version').value.trim(),
    music_url:document.getElementById('m-conti-url').value.trim(),
    memo:document.getElementById('m-conti-memo').value.trim()
  };
  Object.keys(next).forEach(k=>{if(next[k]===''||next[k]==null)delete next[k]});
  const currentSong=contiSongs[editingContiSongIdx]||{};
  const overrideKey=contiSongOverrideKey(currentSong,editingContiSongIdx);
  delete overrides[editingContiSongIdx];
  overrides[overrideKey]=next;
  setContiOverrides(overrides);
  contiSongs[editingContiSongIdx]={...contiSongs[editingContiSongIdx],...next,_conti_override:next};
  closeContiSongEdit();
  setActiveSong(editingContiSongIdx);
  toast('이번 콘티 곡 설정을 저장했어요');
}
function resetContiSongEdit(){
  if(editingContiSongIdx==null)return;
  if(!confirm('이번 콘티에서만 적용한 설정을 초기화할까요?'))return;
  const overrides=getContiOverrides();
  const currentSong=contiSongs[editingContiSongIdx]||{};
  delete overrides[editingContiSongIdx];
  delete overrides[contiSongOverrideKey(currentSong,editingContiSongIdx)];
  setContiOverrides(overrides);
  if(currentConti) contiSongs=buildContiSongsFromHistory(currentConti); else contiSongs=songs.slice(0,4).map(s=>cloneSongForConti(s));
  applyContiOverrides();
  closeContiSongEdit();
  setActiveSong(Math.min(editingContiSongIdx,contiSongs.length-1));
  toast('콘티 곡 설정을 초기화했어요');
}

let mobileSongId=null, mobileHistoryId=null, mobileSelectedSongs=[];
function todayISO(){return new Date().toISOString().split('T')[0]}
function openSongEdit(id){mobileSongId=id||null;editSongScoreFiles=[];editSongScoreIndex=0;const m=document.getElementById('song-modal');document.getElementById('song-modal-title').textContent=id?'찬양곡 수정':'찬양곡 추가';document.getElementById('m-song-delete').style.visibility=id?'visible':'hidden';const s=id?songs.find(x=>String(x.id)===String(id)):null;document.getElementById('m-song-name').value=s?.name||'';document.getElementById('m-song-status').value=s?.status||'used';document.getElementById('m-song-count').value=s?.count||0;document.getElementById('m-song-key').value=s?.key||'';const tp=mobileTempoParts(s);document.getElementById('m-song-bpm-min').value=tp.min||0;document.getElementById('m-song-bpm-max').value=tp.max||0;document.getElementById('m-song-url').value=s?.music_url||'';document.getElementById('m-song-tags').value=(s?.seasons||[]).join(', ');document.getElementById('m-song-memo').value=s?.memo||'';const hist=document.getElementById('m-song-memo-history');if(hist){hist.style.display='none';hist.innerHTML=''}const input=document.getElementById('m-song-score-files');if(input)input.value='';m.classList.add('show');renderMobileEditYoutubePreview();renderEditSongScoreList()}
function closeSongEdit(){document.getElementById('song-modal').classList.remove('show')}

function mobileTempoParts(song){
  const min=Number(song?.bpm_min ?? song?.tempo_min ?? 0) || Number(song?.bpm || 0) || 0;
  const max=Number(song?.bpm_max ?? song?.tempo_max ?? 0) || min || 0;
  return {min,max};
}
function renderMobileEditYoutubePreview(force){
  const box=document.getElementById('m-song-youtube-preview');
  if(!box)return;
  const raw=(document.getElementById('m-song-url')?.value||'').trim();
  if(!raw){box.innerHTML='유튜브 링크를 입력하면 이곳에서 바로 확인합니다.';return}
  const embed=getYoutubeEmbedUrl(raw);
  if(!embed){box.innerHTML='유튜브 주소 형식을 확인해주세요.';return}
  box.innerHTML=`<iframe src="${embed}" title="유튜브 미리보기" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
}
function mobileMemoCandidates(){
  const name=norm(document.getElementById('m-song-name')?.value||editSong()?.name||'');
  const id=String(mobileSongId||'');
  const out=[];
  const push=(label,text)=>{text=String(text||'').trim();if(!text)return;if(out.some(x=>norm(x.text)===norm(text)))return;out.push({label,text});};
  (songs||[]).forEach(s=>{if((id&&String(s.id)===id)||(name&&norm(s.name)===name))push(`찬양곡 메모 · ${s.name}`,s.memo)});
  (history||[]).forEach(h=>{const ids=(h.song_ids||[]).map(x=>String(x));const names=(h.song_names||[]).map(x=>norm(x));if((id&&ids.includes(id))||(name&&names.includes(name)))push(`${formatUsageDate(h.worship_date)} 콘티 메모`,h.note||h.memo||h.conti_memo)});
  return out.slice(0,12);
}
function showMobileMemoHistory(){
  const box=document.getElementById('m-song-memo-history');if(!box)return;
  const rows=mobileMemoCandidates();
  if(!rows.length){box.style.display='block';box.innerHTML='<div style="color:#94a3b8;font-size:12px;padding:6px">찾을 수 있는 이전 메모가 없습니다.</div>';return}
  box.style.display='block';
  box.innerHTML=rows.map((r,i)=>`<button type="button" class="memo-history-item" data-memo-idx="${i}"><small>${esc(r.label)}</small>${esc(r.text)}</button>`).join('');
  box.querySelectorAll('.memo-history-item').forEach((btn,i)=>btn.onclick=()=>{document.getElementById('m-song-memo').value=rows[i].text;});
}
async function saveMobileSongRecord(method,endpoint,payload){
  try{return await api(method,endpoint,payload)}catch(e){
    const msg=String(e?.message||e||'');
    const fallback={...payload};let changed=false;
    if(msg.includes('bpm_min')||msg.includes('bpm_max')||msg.includes('tempo_min')||msg.includes('tempo_max')||msg.includes('column')){delete fallback.bpm_min;delete fallback.bpm_max;changed=true;}
    if(changed){toast('템포 범위 컬럼이 없으면 기존 BPM만 저장합니다. SQL 실행 후 min~max가 저장됩니다.');return await api(method,endpoint,fallback)}
    throw e;
  }}

let editSongScoreFiles=[];
let editSongScoreIndex=0;
function editSong(){return songs.find(s=>String(s.id)===String(mobileSongId))}
function cleanEditScorePart(v){return String(v||'').trim().replace(/\s+/g,'').replace(/[\\/:*?"<>|]/g,'')||'곡명'}
function editSongScoreFileName(file,index){
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
  const songName=cleanEditScorePart(document.getElementById('m-song-name')?.value||editSong()?.name||'곡명');
  const key=cleanEditScorePart(document.getElementById('m-song-key')?.value||editSong()?.key||'Key');
  return `${songName}_${key}_코드_${index+1}.${ext}`;
}
async function renderEditSongScoreList(){
  const preview=document.getElementById('m-song-score-preview');
  const page=document.getElementById('m-song-score-page');
  const fileLabel=document.getElementById('m-song-score-file');
  if(!preview||!page||!fileLabel)return;
  const song=editSong();
  if(!mobileSongId||!song){
    editSongScoreFiles=[];editSongScoreIndex=0;
    preview.innerHTML='<div class="score-empty">새 곡은 먼저 저장한 뒤 악보를 추가할 수 있습니다.</div>';
    page.textContent='0 / 0';fileLabel.textContent='저장 후 악보 추가 가능';return;
  }
  preview.innerHTML='<div class="score-empty">악보 불러오는 중...</div>';
  const files=await listScores(song.id);
  editSongScoreFiles=files||[];
  scoreCache[song.id]=editSongScoreFiles;
  if(editSongScoreIndex>=editSongScoreFiles.length)editSongScoreIndex=Math.max(0,editSongScoreFiles.length-1);
  if(!editSongScoreFiles.length){
    preview.innerHTML='<div class="score-empty">등록된 악보가 없습니다.<br>아래에서 JPG/PNG를 선택해 추가하세요.</div>';
    page.textContent='0 / 0';fileLabel.textContent='등록된 악보가 없습니다.';return;
  }
  const f=editSongScoreFiles[editSongScoreIndex];
  const path=song.id+'/'+f.name;
  preview.innerHTML=`<img src="${scoreUrl(path)}" alt="${esc(song.name)} 악보">`;
  page.textContent=`${editSongScoreIndex+1} / ${editSongScoreFiles.length}`;
  fileLabel.textContent=f.name;
}
function moveEditSongScore(step){
  if(!editSongScoreFiles.length)return;
  editSongScoreIndex=(editSongScoreIndex+step+editSongScoreFiles.length)%editSongScoreFiles.length;
  renderEditSongScoreList();
}
function openEditSongScoreViewer(){
  const song=editSong();
  if(!song){toast('먼저 곡을 저장하세요');return}
  if(!editSongScoreFiles.length){toast('등록된 악보가 없습니다');return}
  const f=editSongScoreFiles[editSongScoreIndex];
  openSingleScoreImage(song.id+'/'+f.name,song.name);
}
async function uploadEditSongScores(){
  const song=editSong();
  const input=document.getElementById('m-song-score-files');
  if(!song){toast('새 곡은 먼저 저장한 뒤 악보를 추가하세요');return}
  const files=[...(input?.files||[])];
  if(!files.length){toast('업로드할 악보 이미지를 선택하세요');return}
  const existing=await listScores(song.id);
  for(let i=0;i<files.length;i++){
    const file=files[i];
    if(!/^image\/(png|jpeg)$/.test(file.type)){toast('JPG/PNG 파일만 가능해요');continue}
    const path=`${song.id}/${editSongScoreFileName(file,existing.length+i)}`;
    const res=await fetch(`${STORAGE_URL}/object/scores/${path}`,{method:'POST',headers:{...STOR_HEADERS,'Content-Type':file.type,'x-upsert':'true'},body:file});
    if(!res.ok){toast('업로드 실패: '+file.name);return}
  }
  try{await api('PATCH',`songs?id=eq.${song.id}`,{has_score:true,status:song.status==='plan'?'ready':song.status,updated_at:new Date().toISOString()})}catch(e){}
  const idx=songs.findIndex(s=>String(s.id)===String(song.id));
  if(idx>=0){songs[idx].has_score=true;if(songs[idx].status==='plan')songs[idx].status='ready'}
  scoreCache[song.id]=null;
  if(input)input.value='';
  editSongScoreIndex=0;
  await renderEditSongScoreList();
  renderSongCards();pickCurrentConti();renderHome();
  toast('악보를 추가했어요');
}
async function deleteEditSongScore(){
  const song=editSong();
  if(!song){toast('먼저 곡을 저장하세요');return}
  if(!editSongScoreFiles.length){toast('삭제할 악보가 없습니다');return}
  const f=editSongScoreFiles[editSongScoreIndex];
  const path=song.id+'/'+f.name;
  if(!confirm('현재 보이는 악보 이미지를 삭제할까요?'))return;
  const res=await fetch(`${STORAGE_URL}/object/scores`,{method:'DELETE',headers:{...STOR_HEADERS,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[path]})});
  if(!res.ok){toast('삭제 실패');return}
  scoreCache[song.id]=null;
  const files=await listScores(song.id);
  if(!files.length){
    try{await api('PATCH',`songs?id=eq.${song.id}`,{has_score:false,updated_at:new Date().toISOString()})}catch(e){}
    const idx=songs.findIndex(s=>String(s.id)===String(song.id));
    if(idx>=0)songs[idx].has_score=false;
  }
  if(editSongScoreIndex>=files.length)editSongScoreIndex=Math.max(0,files.length-1);
  await renderEditSongScoreList();
  renderSongCards();pickCurrentConti();renderHome();
  toast('악보를 삭제했어요');
}

async function saveMobileSong(){const name=document.getElementById('m-song-name').value.replace(/\s+/g,' ').trim();if(!name){toast('곡명을 입력해주세요');return}let bpmMin=parseInt(document.getElementById('m-song-bpm-min').value)||0;let bpmMax=parseInt(document.getElementById('m-song-bpm-max').value)||0;if(bpmMin<0||bpmMax<0||bpmMin>300||bpmMax>300){toast('템포는 0~300 사이로 입력해주세요');return}if(bpmMin&&bpmMax&&bpmMax<bpmMin){const t=bpmMin;bpmMin=bpmMax;bpmMax=t;}if(!bpmMax)bpmMax=bpmMin;const payload={name,status:document.getElementById('m-song-status').value,count:parseInt(document.getElementById('m-song-count').value)||0,key:document.getElementById('m-song-key').value.trim(),bpm:bpmMin,bpm_min:bpmMin,bpm_max:bpmMax,music_url:document.getElementById('m-song-url').value.trim(),seasons:document.getElementById('m-song-tags').value.split(',').map(x=>x.trim()).filter(Boolean),memo:document.getElementById('m-song-memo').value.trim(),updated_at:new Date().toISOString()};try{if(mobileSongId){const updated=await saveMobileSongRecord('PATCH',`songs?id=eq.${mobileSongId}`,payload);const i=songs.findIndex(x=>String(x.id)===String(mobileSongId));if(i>=0&&updated?.[0])songs[i]=updated[0];toast('찬양곡을 수정했어요')}else{const created=await saveMobileSongRecord('POST','songs',payload);if(created?.[0])songs.unshift(created[0]);toast('찬양곡을 추가했어요')}closeSongEdit();renderSongCards();pickCurrentConti();renderHome()}catch(e){toast('저장 실패: '+e.message)}}
async function deleteMobileSong(){if(!mobileSongId)return;if(!confirm('이 찬양곡을 삭제할까요?'))return;try{await api('DELETE',`songs?id=eq.${mobileSongId}`);songs=songs.filter(x=>x.id!==mobileSongId);closeSongEdit();renderSongCards();pickCurrentConti();renderHome();toast('삭제했어요')}catch(e){toast('삭제 실패: '+e.message)}}
function openCurrentMobileHistory(){openMobileHistory(currentConti?.id||null)}
function openMobileHistory(id){mobileHistoryId=id||null;const h=id?history.find(x=>x.id===id):null;document.getElementById('history-modal-title').textContent=id?'콘티 기록 수정':'콘티 기록 추가';document.getElementById('m-history-delete').style.visibility=id?'visible':'hidden';document.getElementById('m-history-date').value=h?.worship_date||todayISO();document.getElementById('m-history-note').value=h?.note||'';mobileSelectedSongs=h?uniqueContiSongsByName((h.song_names||[]).map((name,i)=>({id:(h.song_ids||[])[i]||null,name}))):[];renderMobileSelectedSongs();document.getElementById('m-history-q').value='';document.getElementById('m-history-results').style.display='none';document.getElementById('history-modal').classList.add('show')}
function closeMobileHistory(){document.getElementById('history-modal').classList.remove('show')}
let mobileDragFromIdx=null;
function renderMobileSelectedSongs(){
  const el=document.getElementById('m-history-selected');
  el.innerHTML=mobileSelectedSongs.length?mobileSelectedSongs.map((s,i)=>`<div class="selected-item" draggable="true" data-mobile-song-idx="${i}" ondragstart="startMobileSelectedDrag(event,${i})" ondragover="overMobileSelectedDrag(event,${i})" ondrop="dropMobileSelectedDrag(event,${i})" ondragend="endMobileSelectedDrag(event)"><div class="selected-main"><span class="selected-title">${i+1}. ${esc(s.name)}</span></div><span class="selected-actions"><button onclick="removeMobileSelected(${i})">✕</button><span class="drag-handle" title="잡고 순서 이동" aria-label="순서 이동">≡</span></span></div>`).join(''):'<div class="selected-item"><span>곡을 검색해서 추가하세요</span></div>';
  enableMobileSelectedTouchSort();
}
function moveMobileSong(i,d){const j=i+d;if(j<0||j>=mobileSelectedSongs.length)return;[mobileSelectedSongs[i],mobileSelectedSongs[j]]=[mobileSelectedSongs[j],mobileSelectedSongs[i]];renderMobileSelectedSongs()}
function reorderMobileSelectedSongs(from,to){
  if(from===to||from<0||to<0||from>=mobileSelectedSongs.length||to>=mobileSelectedSongs.length)return;
  const [item]=mobileSelectedSongs.splice(from,1);
  mobileSelectedSongs.splice(to,0,item);
  renderMobileSelectedSongs();
}
function startMobileSelectedDrag(e,i){mobileDragFromIdx=i;e.currentTarget.classList.add('dragging');try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(i))}catch(_){}}
function overMobileSelectedDrag(e,i){e.preventDefault();e.currentTarget.classList.add('drag-over');}
function dropMobileSelectedDrag(e,i){e.preventDefault();const from=mobileDragFromIdx ?? parseInt(e.dataTransfer?.getData('text/plain')||'-1',10);mobileDragFromIdx=null;reorderMobileSelectedSongs(from,i)}
function endMobileSelectedDrag(e){document.querySelectorAll('#m-history-selected .selected-item').forEach(x=>x.classList.remove('dragging','drag-over'));mobileDragFromIdx=null;}
function enableMobileSelectedTouchSort(){
  document.querySelectorAll('#m-history-selected .selected-item').forEach(item=>{
    const handle=item.querySelector('.drag-handle');
    if(!handle||handle.dataset.bound)return;
    handle.dataset.bound='1';
    handle.addEventListener('pointerdown',ev=>{
      if(ev.pointerType==='mouse')return;
      ev.preventDefault();
      const from=parseInt(item.dataset.mobileSongIdx||'-1',10);
      item.classList.add('dragging');
      const onMove=moveEv=>{
        const target=document.elementFromPoint(moveEv.clientX,moveEv.clientY)?.closest?.('#m-history-selected .selected-item');
        document.querySelectorAll('#m-history-selected .selected-item').forEach(x=>x.classList.remove('drag-over'));
        if(target)target.classList.add('drag-over');
      };
      const onUp=upEv=>{
        const target=document.elementFromPoint(upEv.clientX,upEv.clientY)?.closest?.('#m-history-selected .selected-item');
        const to=target?parseInt(target.dataset.mobileSongIdx||'-1',10):-1;
        document.removeEventListener('pointermove',onMove);
        document.removeEventListener('pointerup',onUp);
        document.querySelectorAll('#m-history-selected .selected-item').forEach(x=>x.classList.remove('dragging','drag-over'));
        if(to>=0)reorderMobileSelectedSongs(from,to);
      };
      document.addEventListener('pointermove',onMove,{passive:false});
      document.addEventListener('pointerup',onUp,{once:true});
    },{passive:false});
  });
}
function removeMobileSelected(i){mobileSelectedSongs.splice(i,1);renderMobileSelectedSongs()}
function searchMobileHistorySongs(){const q=norm(document.getElementById('m-history-q').value);const el=document.getElementById('m-history-results');if(!q){el.style.display='none';return}const found=songs.filter(s=>norm(s.name).includes(q)).slice(0,12);el.style.display='block';el.innerHTML=(found.map(s=>`<button onclick="addMobileHistorySong('${s.id}')">🎵 ${esc(s.name)}</button>`).join('')||'<button disabled>검색 결과 없음</button>')+`<button onclick="addMobileHistoryDirect()">➕ 입력한 이름 직접 추가</button>`}
function addMobileHistorySong(id){const s=songs.find(x=>x.id===id);if(!s)return;const key=contiBaseName(s.name);if(mobileSelectedSongs.find(x=>contiBaseName(x.name)===key)){toast('같은 곡의 다른 버전이 이미 들어가 있어요');return}mobileSelectedSongs.push({id:s.id,name:s.name});document.getElementById('m-history-q').value='';document.getElementById('m-history-results').style.display='none';renderMobileSelectedSongs()}
function addMobileHistoryDirect(){const name=document.getElementById('m-history-q').value.replace(/\s+/g,' ').trim();if(!name)return;const key=contiBaseName(name);if(mobileSelectedSongs.find(x=>contiBaseName(x.name)===key)){toast('같은 곡의 다른 버전이 이미 들어가 있어요');return}mobileSelectedSongs.push({id:null,name});document.getElementById('m-history-q').value='';document.getElementById('m-history-results').style.display='none';renderMobileSelectedSongs()}
async function saveMobileHistory(){const worship_date=document.getElementById('m-history-date').value;if(!worship_date){toast('날짜를 선택해주세요');return}mobileSelectedSongs=uniqueContiSongsByName(mobileSelectedSongs);const payload={worship_date,song_ids:mobileSelectedSongs.map(s=>s.id||null),song_names:mobileSelectedSongs.map(s=>s.name),note:document.getElementById('m-history-note').value.trim()};try{if(mobileHistoryId){const updated=await api('PATCH',`worship_history?id=eq.${mobileHistoryId}`,payload);const i=history.findIndex(x=>x.id===mobileHistoryId);if(i>=0&&updated?.[0])history[i]=updated[0];toast('콘티 기록을 수정했어요')}else{const created=await api('POST','worship_history',payload);if(created?.[0])history.unshift(created[0]);toast('콘티 기록을 추가했어요')}history.sort((a,b)=>String(b.worship_date).localeCompare(String(a.worship_date)));closeMobileHistory();renderHistory();pickCurrentConti();renderHome()}catch(e){toast('저장 실패: '+e.message)}}
async function deleteMobileHistory(){if(!mobileHistoryId)return;if(!confirm('이 콘티 기록을 삭제할까요?'))return;try{await api('DELETE',`worship_history?id=eq.${mobileHistoryId}`);history=history.filter(x=>x.id!==mobileHistoryId);closeMobileHistory();renderHistory();pickCurrentConti();renderHome();toast('삭제했어요')}catch(e){toast('삭제 실패: '+e.message)}}

let songScoreManagerId = null;
function fillSongScoreSelect(){
  const sel=document.getElementById('song-score-select');
  const q=norm(document.getElementById('song-score-search')?.value||'');
  const list=songs.filter(s=>!q||norm(s.name).includes(q)).slice(0,250);
  sel.innerHTML=list.map(s=>`<option value="${esc(s.id)}" ${String(s.id)===String(songScoreManagerId)?'selected':''}>${esc(s.name)}</option>`).join('');
  if(!list.find(s=>String(s.id)===String(songScoreManagerId)) && list[0]) songScoreManagerId=list[0].id;
  sel.value=songScoreManagerId||'';
}
function filterSongScoreSelect(){fillSongScoreSelect()}
async function openSongScoreManager(id){
  const active=contiSongs[activeIdx];
  songScoreManagerId=id||active?.id||songs[0]?.id||null;
  document.getElementById('song-score-search').value='';
  fillSongScoreSelect();
  document.getElementById('song-score-files').value='';
  document.getElementById('song-score-modal').classList.add('show');
  await renderSongScoreManagerList();
}
function closeSongScoreManager(){document.getElementById('song-score-modal').classList.remove('show')}
async function changeSongScoreManager(id){songScoreManagerId=id;document.getElementById('song-score-files').value='';await renderSongScoreManagerList()}
function scoreManagerSong(){return songs.find(s=>String(s.id)===String(songScoreManagerId))}
async function renderSongScoreManagerList(){
  const el=document.getElementById('song-score-list');
  const song=scoreManagerSong();
  if(!song){el.innerHTML='<div class="selected-item"><span>곡을 선택하세요</span></div>';return}
  el.innerHTML='<div class="selected-item"><span>불러오는 중...</span></div>';
  const files=await listScores(song.id);
  scoreCache[song.id]=files;
  if(!files.length){el.innerHTML=`<div class="selected-item"><span>⏳ ${esc(song.name)} 악보 업로드 예정</span></div>`;return}
  el.innerHTML=files.map((f,i)=>{const path=song.id+'/'+f.name;return `<div class="selected-item"><span>${i+1}. ${esc(f.name)}</span><span><button onclick="openSingleScoreImage('${esc(path)}','${esc(song.name)}')">보기</button> <button onclick="deleteSongScore('${esc(path)}')">삭제</button></span></div>`}).join('');
}
async function uploadSongScores(){
  const song=scoreManagerSong();
  const input=document.getElementById('song-score-files');
  if(!song){toast('곡을 먼저 선택하세요');return}
  if(!input.files||!input.files.length){toast('업로드할 악보 이미지를 선택하세요');return}
  for(const file of input.files){
    const path=`${song.id}/${safeFileName(file.name)}`;
    const res=await fetch(`${STORAGE_URL}/object/scores/${path}`,{method:'POST',headers:{...STOR_HEADERS,'Content-Type':file.type,'x-upsert':'true'},body:file});
    if(!res.ok){toast('업로드 실패: '+file.name);return}
  }
  await api('PATCH',`songs?id=eq.${song.id}`,{has_score:true,status:song.status==='plan'?'ready':song.status,updated_at:new Date().toISOString()});
  const idx=songs.findIndex(s=>String(s.id)===String(song.id));
  if(idx>=0){songs[idx].has_score=true;if(songs[idx].status==='plan')songs[idx].status='ready'}
  scoreCache[song.id]=null;
  input.value='';
  await renderSongScoreManagerList();
  renderHome();renderSongCards();
  toast('곡별 악보 업로드 완료');
}
async function deleteSongScore(path){
  if(!confirm('이 곡별 악보 이미지를 삭제할까요?'))return;
  const res=await fetch(`${STORAGE_URL}/object/scores`,{method:'DELETE',headers:{...STOR_HEADERS,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[path]})});
  if(!res.ok){toast('삭제 실패');return}
  const song=scoreManagerSong();
  if(song){
    scoreCache[song.id]=null;
    const files=await listScores(song.id);
    scoreCache[song.id]=files;
    if(!files.length){
      await api('PATCH',`songs?id=eq.${song.id}`,{has_score:false,updated_at:new Date().toISOString()});
      const idx=songs.findIndex(s=>String(s.id)===String(song.id));
      if(idx>=0)songs[idx].has_score=false;
    }
  }
  await renderSongScoreManagerList();
  renderHome();renderSongCards();
  toast('곡별 악보 삭제 완료');
}
function openSingleScoreImage(path,title){
  document.getElementById('viewer').dataset.mode='single-score';
  document.getElementById('viewer-title').textContent=title+' 악보';
  document.getElementById('viewer-subtitle').textContent='곡별 악보 미리보기';
  document.getElementById('viewer-mini').innerHTML='';
  document.getElementById('viewer-body').innerHTML=`<img src="${scoreUrl(path)}" alt="${esc(title)} 악보">`;
  document.getElementById('viewer').classList.add('show');
}
async function openSelectedSongScoreViewer(){
  const song=scoreManagerSong();
  if(!song){toast('곡을 먼저 선택하세요');return}
  let files=scoreCache[song.id]||await listScores(song.id);
  scoreCache[song.id]=files;
  document.getElementById('viewer').dataset.mode='song-score';
  document.getElementById('viewer-title').textContent=song.name+' 악보';
  document.getElementById('viewer-subtitle').textContent='곡별 악보 전체 보기';
  document.getElementById('viewer-mini').innerHTML='';
  document.getElementById('viewer').classList.add('show');
  if(!files.length){document.getElementById('viewer-body').innerHTML=`<div class="viewer-empty-big">⏳ 악보 업로드 예정<small>${esc(song.name)} 악보가 준비되면 여기에 표시됩니다.</small></div>`;return}
  document.getElementById('viewer-body').innerHTML=files.map(f=>`<img src="${scoreUrl(song.id+'/'+f.name)}" alt="${esc(song.name)} 악보">`).join('');
}


function openFilenameHelper(){document.getElementById('filename-helper-modal').classList.add('show');generateFileNames()}
function closeFilenameHelper(){document.getElementById('filename-helper-modal').classList.remove('show')}
function cleanPart(v){return String(v||'').trim().replace(/\s+/g,'').replace(/[\/:*?"<>|]/g,'')}
function generateFileNames(){const song=cleanPart(document.getElementById('fn-song').value)||'은혜';const key=cleanPart(document.getElementById('fn-key').value)||'G';const type=cleanPart(document.getElementById('fn-type').value)||'코드';const pages=Math.max(1,parseInt(document.getElementById('fn-pages').value||'1',10));const ext=document.getElementById('fn-ext').value||'jpg';document.getElementById('fn-result').value=Array.from({length:pages},(_,i)=>`${song}_${key}_${type}_${i+1}.${ext}`).join('\n')}
async function copyFileNames(){generateFileNames();try{await navigator.clipboard.writeText(document.getElementById('fn-result').value);toast('파일명을 복사했어요')}catch(e){toast('복사 실패: 직접 선택해서 복사하세요')}}
function openAiSettings(){const raw=localStorage.getItem('worship_ai_settings');const s=raw?JSON.parse(raw):{};document.getElementById('ai-provider').value=s.provider||'openrouter';document.getElementById('ai-model').value=s.model||'';document.getElementById('ai-key').value=s.key||'';document.getElementById('ai-enabled').value=s.enabled||'on';document.getElementById('ai-settings-modal').classList.add('show')}
function closeAiSettings(){document.getElementById('ai-settings-modal').classList.remove('show')}
function saveAiSettings(){const s={provider:document.getElementById('ai-provider').value,model:document.getElementById('ai-model').value.trim(),key:document.getElementById('ai-key').value.trim(),enabled:document.getElementById('ai-enabled').value};localStorage.setItem('worship_ai_settings',JSON.stringify(s));toast('AI 설정을 저장했어요')}
function clearAiSettings(){localStorage.removeItem('worship_ai_settings');document.getElementById('ai-key').value='';toast('AI 설정을 삭제했어요')}
function testAiSettings(){const key=document.getElementById('ai-key').value.trim();toast(key?'API 키 형식은 저장 가능합니다. 실제 연결은 2차에서 붙입니다.':'API 키를 먼저 입력하세요')}
document.addEventListener('visibilitychange',()=>{const v=document.getElementById('viewer');if(document.visibilityState==='visible'&&v?.classList.contains('show')&&v.dataset.mode==='song')requestWakeLock();});


let mobileToolFrameUrl='';
function openMobileToolFrame(url,title){mobileToolFrameUrl=url;document.getElementById('mobile-tool-title').textContent=title||'관리 도구';document.getElementById('mobile-tool-frame').src=url;document.getElementById('mobile-tool-frame-modal').classList.add('show')}
function closeMobileToolFrame(){document.getElementById('mobile-tool-frame-modal').classList.remove('show');document.getElementById('mobile-tool-frame').src='about:blank'}
function openMobileToolNewTab(){if(mobileToolFrameUrl) window.open(mobileToolFrameUrl,'_blank','noopener')}

['youtube-player-modal','song-modal','history-modal','full-score-modal','song-score-modal','filename-helper-modal','ai-settings-modal','mobile-tool-frame-modal','performance-orientation-modal'].forEach(id=>{setTimeout(()=>{const el=document.getElementById(id);if(el)el.addEventListener('click',e=>{if(e.target===el)el.classList.remove('show')})},0)})


let viewerTouchX=0, viewerTouchY=0;
let swipeStartX=0, swipeStartY=0, swipeStartTime=0, swipeTracking=false, swipePointerId=null, swipeLastAt=0;
function isPerformanceViewerOpen(){
  const v=document.getElementById('viewer');
  return !!(v?.classList.contains('show') && v.dataset.mode==='song');
}
function isSwipeIgnoredTarget(target){
  return !!target?.closest?.('button,a,input,select,textarea,.viewer-bottom,.performance-song-strip,.portrait-mini-track,.close');
}
function beginViewerSwipe(x,y,target,pointerId=null){
  if(!isPerformanceViewerOpen())return;
  if(isSwipeIgnoredTarget(target))return;
  swipeStartX=x; swipeStartY=y; swipeStartTime=Date.now(); swipeTracking=true; swipePointerId=pointerId;
}
function cancelViewerSwipe(){swipeTracking=false;swipePointerId=null;}
async function endViewerSwipe(x,y,pointerId=null){
  if(pointerId!==null && swipePointerId!==null && pointerId!==swipePointerId)return;
  if(!swipeTracking||!isPerformanceViewerOpen())return;
  swipeTracking=false; swipePointerId=null;
  const dx=x-swipeStartX;
  const dy=y-swipeStartY;
  const dt=Date.now()-swipeStartTime;
  const now=Date.now();
  if(now-swipeLastAt<220)return;
  const distance=Math.abs(dx);
  const horizontal=distance>48 && distance>Math.abs(dy)*1.15;
  if(horizontal && dt<1100){
    swipeLastAt=now;
    await (dx<0 ? viewerPageStep(1) : viewerPageStep(-1));
  }
}
function maybeBlockPerformanceTouch(e){
  if(!isPerformanceViewerOpen())return;
  if(isSwipeIgnoredTarget(e.target))return;
  e.preventDefault();
}
// 연주모드 제스처는 특정 이미지/div가 아니라 전체 전체화면 레이어에서 받는다.
// 좌우 스와이프: 곡 내부 페이지 이동, 마지막/첫 페이지에서는 다음/이전 곡으로 이동.
document.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;beginViewerSwipe(e.clientX,e.clientY,e.target,e.pointerId)},{passive:true});
document.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')return;endViewerSwipe(e.clientX,e.clientY,e.pointerId)},{passive:true});
document.addEventListener('pointercancel',cancelViewerSwipe,{passive:true});
document.addEventListener('touchstart',e=>{if(!isPerformanceViewerOpen())return;const t=e.changedTouches[0];beginViewerSwipe(t.clientX,t.clientY,e.target,t.identifier)},{passive:true});
document.addEventListener('touchmove',maybeBlockPerformanceTouch,{passive:false});
document.addEventListener('touchend',e=>{if(!isPerformanceViewerOpen())return;const t=e.changedTouches[0];endViewerSwipe(t.clientX,t.clientY,t.identifier)},{passive:true});
document.addEventListener('touchcancel',cancelViewerSwipe,{passive:true});
document.addEventListener('keydown',e=>{const v=document.getElementById('viewer');if(!v?.classList.contains('show'))return;if(v.dataset.mode==='song'&&e.key==='ArrowRight')viewerPageStep(1);if(v.dataset.mode==='song'&&e.key==='ArrowLeft')viewerPageStep(-1);if(e.key==='Escape')closeViewer();});
document.addEventListener('fullscreenchange',()=>{const v=document.getElementById('viewer');if(!document.fullscreenElement&&v?.classList.contains('show')&&v.dataset.mode==='song'){restorePerformancePage();unlockPerformanceOrientation();}});

document.addEventListener('DOMContentLoaded',init);


/* === Phase12 codefix: render existing score previews wherever "악보 있음" appears === */
(function () {
  if (window.__phase12ExistingScorePreviewInstalled) return;
  window.__phase12ExistingScorePreviewInstalled = true;

  function norm(v) {
    return String(v || "").replace(/\s+/g, "").trim().toLowerCase();
  }

  function scoreUrl(item) {
    return item?.url || item?.image_url || item?.file_url || item?.score_url || item?.publicUrl || item?.public_url || item?.src || item?.path || "";
  }

  function scoreName(item, i) {
    return item?.filename || item?.file_name || item?.name || item?.title || item?.score_name || ("악보 " + (i + 1));
  }

  function collectScores() {
    const arr = [];
    [
      window.scores,
      window.scoreFiles,
      window.songScores,
      window.scoreImages,
      window.allScores,
      window.scoreList,
      window.uploadedScores,
      window.existingScores
    ].forEach(v => Array.isArray(v) && v.forEach(x => arr.push(x)));

    ["state", "appState", "WorshipDB", "worshipDB", "db"].forEach(k => {
      const obj = window[k];
      if (!obj || typeof obj !== "object") return;
      ["scores", "scoreFiles", "songScores", "scoreImages", "allScores"].forEach(key => {
        if (Array.isArray(obj[key])) obj[key].forEach(x => arr.push(x));
      });
    });

    const seen = new Set();
    return arr.filter(item => {
      const sig = scoreUrl(item) + "|" + scoreName(item, 0);
      if (!scoreUrl(item) || seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  }

  function guessSongName(el) {
    const host = el.closest(".song-card, .song-item, .edit-card, .sequential-item, .seq-item, .card, li, tr, section, article, div") || el.parentElement;
    if (!host) return "";

    const input = host.querySelector('input[name*="title"], input[name*="song"], input[placeholder*="곡"], input[placeholder*="제목"], textarea[name*="title"]');
    if (input && input.value) return input.value.trim();

    const title = host.querySelector(".song-title, .title, .name, h1, h2, h3, h4, strong");
    if (title && title.textContent) return title.textContent.replace(/악보\s*있음/g, "").trim();

    const lines = (host.textContent || "").split(/\n|·|\|/).map(x => x.trim()).filter(Boolean);
    return (lines.find(x => !/악보\s*있음|저장|수정|삭제|업로드/.test(x)) || "").trim();
  }

  function matchingScores(songName) {
    const target = norm(songName);
    if (!target) return [];
    return collectScores().filter(item => {
      const hay = norm([
        item?.song_title, item?.song_name, item?.songTitle, item?.song,
        item?.filename, item?.file_name, item?.name, item?.title
      ].join(" "));
      return hay && (hay.includes(target) || target.includes(hay));
    }).slice(0, 12);
  }

  function modal() {
    let m = document.querySelector(".phase12-score-modal");
    if (m) return m;
    m = document.createElement("div");
    m.className = "phase12-score-modal";
    m.innerHTML = '<button class="phase12-score-modal-close" type="button">×</button><img alt="악보 확대 미리보기">';
    document.body.appendChild(m);
    m.addEventListener("click", e => {
      if (e.target === m || e.target.classList.contains("phase12-score-modal-close")) m.classList.remove("open");
    });
    return m;
  }

  function openPreview(url) {
    const m = modal();
    m.querySelector("img").src = url;
    m.classList.add("open");
  }

  function render(el) {
    if (!el || el.dataset.phase12PreviewDone === "1") return;
    const found = matchingScores(guessSongName(el));
    if (!found.length) return;

    el.dataset.phase12PreviewDone = "1";
    const box = document.createElement("div");
    box.className = "phase12-existing-score-preview";
    box.innerHTML = '<div class="phase12-existing-score-title">기존 악보 미리보기</div><div class="phase12-existing-score-list"></div>';
    const list = box.querySelector(".phase12-existing-score-list");

    found.forEach((item, i) => {
      const url = scoreUrl(item);
      if (!url) return;
      const card = document.createElement("div");
      card.className = "phase12-existing-score-item";
      card.innerHTML =
        '<img class="phase12-existing-score-thumb" loading="lazy" alt="">' +
        '<div class="phase12-existing-score-info">' +
        '<div class="phase12-existing-score-name"></div>' +
        '<div class="phase12-existing-score-meta"></div>' +
        '</div>';
      card.querySelector("img").src = url;
      card.querySelector("img").alt = scoreName(item, i);
      card.querySelector(".phase12-existing-score-name").textContent = scoreName(item, i);
      const page = item?.page || item?.page_no || item?.pageNumber || item?.page_number || (i + 1);
      card.querySelector(".phase12-existing-score-meta").textContent = page ? ("페이지 " + page) : "기존 악보";
      card.addEventListener("click", () => openPreview(url));
      list.appendChild(card);
    });

    if (!list.children.length) return;
    el.parentElement.insertBefore(box, el.nextSibling);
  }

  function scan() {
    Array.from(document.querySelectorAll("body *")).forEach(el => {
      const text = (el.textContent || "").trim();
      if (text && text.length <= 40 && /악보\s*있음/.test(text)) render(el);
    });
  }

  document.addEventListener("DOMContentLoaded", () => setTimeout(scan, 300));
  window.addEventListener("load", () => setTimeout(scan, 800));

  const observer = new MutationObserver(() => {
    clearTimeout(window.__phase12ScoreScanTimer);
    window.__phase12ScoreScanTimer = setTimeout(scan, 300);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
