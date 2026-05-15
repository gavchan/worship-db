
const SUPABASE_URL='https://rmtysrytveexshwzenxj.supabase.co';
const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdHlzcnl0dmVleHNod3plbnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjQ3OTYsImV4cCI6MjA5MjEwMDc5Nn0.5FzzJ1rg-uRG4jAGZ75xVT3i3NH0m6J_tDeOS4GxyT8';
const HEADERS={'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Prefer':'return=representation'};
let songs=[], songMap=new Map(), planned=[];
function $(id){return document.getElementById(id)}
function log(msg){const el=$('log');el.textContent+=(el.textContent==='대기 중...'?'':'\n')+msg;el.scrollTop=el.scrollHeight}
function resetLog(msg='대기 중...'){$('log').textContent=msg}
function esc(s){return String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function norm(v){return String(v||'').normalize('NFC').replace(/\s+/g,' ').trim().toLowerCase()}
function safeArray(v){
  if(Array.isArray(v))return v;
  if(v==null||v==='')return [];
  if(typeof v==='string'){
    const t=v.trim();
    try{const parsed=JSON.parse(t); if(Array.isArray(parsed))return parsed}catch(e){}
    if(t.startsWith('{')&&t.endsWith('}'))return t.slice(1,-1).split(',').map(x=>x.replace(/^"|"$/g,'').trim()).filter(Boolean);
    return t.split(',').map(x=>x.trim()).filter(Boolean);
  }
  return [];
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
async function api(method,path,body){
  const res=await fetch(SUPABASE_URL+'/rest/v1/'+path,{method,headers:HEADERS,body:body?JSON.stringify(body):undefined});
  if(!res.ok)throw new Error(await res.text());
  const txt=await res.text(); return txt?JSON.parse(txt):null;
}
function setStat(id,v){$(id).textContent=String(v)}
async function loadSongs(){
  if(songs.length)return;
  log('🎵 곡 목록 불러오는 중...');
  songs=await api('GET','songs?select=id,name,key,bpm,status&limit=5000');
  songMap=new Map(songs.map(s=>[String(s.id),s]));
  log(`✅ ${songs.length}곡 불러옴`);
}
function cleanHistoryRow(h){
  const ids=safeArray(h.song_ids).map(x=>x==null?'':String(x).trim());
  const names=safeArray(h.song_names).map(x=>String(x||'').replace(/\s+/g,' ').trim());
  const max=Math.max(ids.length,names.length);
  const seenIds=new Set(), seenNames=new Set();
  const nextIds=[], nextNames=[], reasons=[];
  for(let i=0;i<max;i++){
    let id=ids[i]||'';
    let name=names[i]||'';
    const dbSong=id?songMap.get(String(id)):null;
    if(id && !dbSong){reasons.push(`없는 song_id 제거: ${id}`); id=''}
    if(!name && dbSong) name=dbSong.name||'';
    if(!name){reasons.push(`빈 곡명 제거: ${i+1}번째`); continue}
    const base=contiBaseName(name)||norm(name);
    if(id){
      if(seenIds.has(id)){reasons.push(`중복 song_id 제거: ${name}`); continue}
      seenIds.add(id);
    }
    if(base){
      if(seenNames.has(base)){reasons.push(`같은 기본 곡명 중복 제거: ${name}`); continue}
      seenNames.add(base);
    }
    nextIds.push(id||null); nextNames.push(name);
  }
  const changed=JSON.stringify(ids)!==JSON.stringify(nextIds.map(x=>x||'')) || JSON.stringify(names)!==JSON.stringify(nextNames);
  return {id:h.id,worship_date:h.worship_date,note:h.note||'',before:{ids,names},after:{ids:nextIds,names:nextNames},changed,reasons};
}
async function scanHistories(){
  try{
    resetLog('점검 시작...'); planned=[]; $('fix-btn').disabled=true; $('result-box').innerHTML='<p>점검 중...</p>';
    await loadSongs();
    log('📋 콘티 기록 불러오는 중...');
    const rows=await api('GET','worship_history?select=id,worship_date,note,song_ids,song_names&order=worship_date.desc&limit=1000');
    setStat('st-history',rows.length);
    planned=rows.map(cleanHistoryRow).filter(x=>x.changed);
    setStat('st-issues',planned.length); setStat('st-fixed',0);
    $('fix-btn').disabled=planned.length===0;
    renderPlanned();
    log(planned.length?`⚠️ 정리 필요 콘티 ${planned.length}개 발견`:'✅ 정리할 콘티 찌꺼기가 없습니다');
  }catch(e){log('✗ 점검 실패: '+e.message); $('result-box').innerHTML='<p>점검 실패: '+esc(e.message)+'</p>'}
}
function renderPlanned(){
  if(!planned.length){$('result-box').innerHTML='<p>정리할 항목이 없습니다.</p>';return}
  $('result-box').innerHTML=`<table class="table"><thead><tr><th>날짜</th><th>정리 이유</th><th class="hide-sm">정리 전</th><th>정리 후</th></tr></thead><tbody>${planned.map(p=>`<tr><td>${esc(p.worship_date||'-')}</td><td>${p.reasons.map(r=>`<span class="tag amber">${esc(r)}</span>`).join('')}</td><td class="hide-sm">${p.before.names.map(n=>`<span class="tag red">${esc(n||'(빈칸)')}</span>`).join('')}</td><td>${p.after.names.map(n=>`<span class="tag green">${esc(n)}</span>`).join('')}</td></tr>`).join('')}</tbody></table>`;
}
async function applyHistoryFixes(){
  if(!planned.length){alert('먼저 점검해 주세요.');return}
  if(!confirm(`정리 대상 ${planned.length}개 콘티를 DB에 반영할까요?\n곡/악보 파일은 삭제하지 않고 콘티 배열만 정리합니다.`))return;
  let ok=0;
  try{
    for(const p of planned){
      await api('PATCH',`worship_history?id=eq.${encodeURIComponent(p.id)}`,{song_ids:p.after.ids,song_names:p.after.names});
      ok++; log(`✅ ${p.worship_date||p.id} 정리 완료`);
    }
    setStat('st-fixed',ok); planned=[]; $('fix-btn').disabled=true; $('result-box').innerHTML='<p>정리 완료. 공유/연주 화면을 강력 새로고침하면 하단 찌꺼기가 사라집니다.</p>';
  }catch(e){log('✗ 정리 실패: '+e.message)}
}
function cacheKeys(){
  const keys=[];
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||''; if(/^worshipdb_conti_overrides_|^currentConti$|^wdb-current-setlist$|^wdb-viewer-mode$/.test(k))keys.push(k)}
  for(let i=0;i<sessionStorage.length;i++){const k=sessionStorage.key(i)||''; if(/viewer|conti|share|performance|song/i.test(k))keys.push('session:'+k)}
  return keys;
}
function scanLocalCache(){const keys=cacheKeys();setStat('st-local',keys.length);log(keys.length?`🧺 브라우저 연주/콘티 캐시 ${keys.length}개 발견:\n- ${keys.join('\n- ')}`:'✅ 정리할 브라우저 캐시가 없습니다')}
function clearPlayCache(){
  const keys=cacheKeys();
  if(!keys.length){scanLocalCache();return}
  if(!confirm(`현재 브라우저의 연주/콘티 임시값 ${keys.length}개를 지울까요?\nAI 설정, 테마, 곡 데이터는 유지합니다.`))return;
  keys.forEach(k=>{if(k.startsWith('session:'))sessionStorage.removeItem(k.slice(8));else localStorage.removeItem(k)});
  setStat('st-local',0); log(`🧼 브라우저 캐시 ${keys.length}개 정리 완료`);
}
scanLocalCache();
