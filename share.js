const SUPABASE_URL='https://rmtysrytveexshwzenxj.supabase.co';
const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdHlzcnl0dmVleHNod3plbnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjQ3OTYsImV4cCI6MjA5MjEwMDc5Nn0.5FzzJ1rg-uRG4jAGZ75xVT3i3NH0m6J_tDeOS4GxyT8';
const HEADERS={'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY};
let shareTitle='이번주 콘티';
function esc(s){return String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function norm(v){return (v||'').normalize('NFC').replace(/\s+/g,' ').trim().toLowerCase()}
function safeArray(v){if(Array.isArray(v))return v;if(v==null||v==='')return [];if(typeof v==='string'){const t=v.trim();try{const p=JSON.parse(t);if(Array.isArray(p))return p;}catch(e){}if(t.startsWith('{')&&t.endsWith('}'))return t.slice(1,-1).split(',').map(x=>x.replace(/^\"|\"$/g,'').trim()).filter(Boolean);return t.split(',').map(x=>x.trim()).filter(Boolean)}return []}
function uniquePairs(names,ids){const seen=new Set();const out=[];safeArray(names).forEach((name,i)=>{const id=safeArray(ids)[i]||'';const key=id?('id:'+id):('name:'+norm(name));if(seen.has(key))return;seen.add(key);out.push({name,id})});return out}
function parseLocalDate(value){const [y,m,d]=String(value||'').split('-').map(Number);return y&&m&&d?new Date(y,m-1,d):new Date(value)}
function weekBoundsFor(date=new Date()){const base=new Date(date.getFullYear(),date.getMonth(),date.getDate());const day=base.getDay();const mondayOffset=day===0?-6:1-day;const start=new Date(base);start.setDate(base.getDate()+mondayOffset);start.setHours(0,0,0,0);const end=new Date(start);end.setDate(start.getDate()+6);end.setHours(23,59,59,999);return {start,end}}
async function api(path){const res=await fetch(SUPABASE_URL+'/rest/v1/'+path,{headers:HEADERS});if(!res.ok)throw new Error(await res.text());return await res.json()}
async function load(){
  const params=new URLSearchParams(location.search);const id=params.get('id');
  try{
    let rows=[];
    if(id) rows=await api(`worship_history?id=eq.${encodeURIComponent(id)}&select=*`);
    if(!rows.length){
      const all=await api('worship_history?select=*&order=worship_date.desc&limit=50');
      const {start,end}=weekBoundsFor(new Date());
      rows=[all.find(h=>{const d=parseLocalDate(h.worship_date);return d>=start&&d<=end})||all[0]].filter(Boolean);
    }
    if(!rows.length){document.getElementById('content').innerHTML='<div class="empty">공유할 콘티가 없습니다.</div>';document.getElementById('desc').textContent='콘티가 아직 등록되지 않았습니다.';return}
    const h=rows[0]; const d=parseLocalDate(h.worship_date); shareTitle=`${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 이번주 콘티`;
    document.getElementById('title').textContent=shareTitle;
    document.getElementById('desc').textContent=h.note||'찬양 순서와 Key, BPM, 메모를 확인할 수 있는 공유용 페이지입니다.';
    const rawIds=safeArray(h.song_ids);
    const ids=rawIds.filter(Boolean); let songMap={};
    if(ids.length){try{const detail=await api(`songs?id=in.(${ids.map(encodeURIComponent).join(',')})&select=id,name,key,bpm,memo,music_url,has_score,seasons`);detail.forEach(s=>songMap[s.id]=s)}catch(e){}}
    const pairs=uniquePairs(h.song_names,rawIds); const names=pairs.map(x=>x.name);
    document.getElementById('content').className='list';
    document.getElementById('content').innerHTML=names.map((name,i)=>{const id=pairs[i]?.id||'';const s=id?(songMap[id]||{}):{};const key=s.key||'';const bpm=s.bpm||'';const memo=s.memo||'';return `<div class="song"><div class="song-head"><div class="num">${i+1}</div><div class="name">${esc(name)}</div></div><div class="meta">${key?`<span class="pill">Key ${esc(key)}</span>`:''}${bpm?`<span class="pill">BPM ${esc(bpm)}</span>`:''}<span class="pill">${s.has_score?'악보 있음':'악보 확인 필요'}</span>${s.music_url?'<span class="pill">영상 있음</span>':''}</div>${memo?`<div class="memo">${esc(memo)}</div>`:''}</div>`}).join('')||'<div class="empty">등록된 곡이 없습니다.</div>';
  }catch(e){document.getElementById('content').innerHTML='<div class="empty">콘티를 불러오지 못했습니다.<br>'+esc(e.message)+'</div>';}
}
async function shareThisPage(){
  const url=location.href;
  try{if(navigator.share){await navigator.share({title:shareTitle,text:shareTitle,url});return}}catch(e){}
  try{await navigator.clipboard.writeText(url);alert('공유 링크를 복사했습니다. 카톡에 붙여넣어 보내세요.')}catch(e){prompt('이 링크를 복사해서 공유하세요',url)}
}
load();
