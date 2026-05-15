
const savedTheme = localStorage.getItem('wdb-theme') || 'light';
if (savedTheme === 'dark') document.body.classList.add('dark');
function syncThemeIcon(){
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = document.body.classList.contains('dark') ? '🌙' : '☀️';
}
function toggleTheme(){
  document.body.classList.toggle('dark');
  localStorage.setItem('wdb-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  syncThemeIcon();
}
setTimeout(syncThemeIcon,0);
// ── CONFIG ────────────────────────────────────────────────
const SUPABASE_URL = 'https://rmtysrytveexshwzenxj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdHlzcnl0dmVleHNod3plbnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjQ3OTYsImV4cCI6MjA5MjEwMDc5Nn0.5FzzJ1rg-uRG4jAGZ75xVT3i3NH0m6J_tDeOS4GxyT8';
const HEADERS = {'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Prefer':'return=representation'};

// ── BASE DATA (초기 1회 업로드용) ─────────────────────────
const BASE_USED = {"다 원합니다":12,"주를 향한 나의 사랑을":11,"그 사랑":9,"아름다우신":8,"마지막 날에":7,"기뻐하라":7,"십자가 그 사랑":7,"감사해":5,"아 하나님의 은혜로":5,"전능하신 나의 주 하나님":5,"내가 주인 삼은":5,"그 사랑 얼마나":5,"나는 기도하는 것보다":5,"주가 일하시네":5,"선포하라":4,"전진하신 주":4,"하늘의 문을 여소서(임재)":4,"두손들고":3,"아침같이 눈앞 가리듯":3,"나의 영혼이":3,"내 맘 아래로":3,"주의 이름 찬양하리":3,"찬양 중에 들어":3,"은혜":2,"온 세상 창조주":2,"그가 오신 이유":2,"우리 모임 때 주의 성령 임하리":2,"하나님의 사랑을":2,"하나님은 우리의 피난처가 되시며":2,"아무것도 두려워 말라":2,"내 주 같은 분 없네":2,"부르신 곳에서":2,"주님 한결 같으시리라":2,"예수 열방의 소망":2,"주님의 영광 나타났네":2,"천사들의 노래가":2,"One Way":2,"주 사랑이 나를 숨기게 해":2,"주 봉예":2,"슬픈 마음 있는 사람":2,"셀 수 없네":1,"세상 모든 민족이":1,"나를 지으신 주님":1,"선하신 목자":1,"주여 이제 오소서":1,"예배합니다":1,"성령 오소서":1,"이 세상을 살아가는 동안에":1,"복되신 나 성자":1,"주님 손에 맡겨 드리리":1,"온 땅 다해":1,"나의 마음을":1,"전능하신 나의 주 사랑을":1,"주님 다시 오실 때까지":1,"사랑하는 나의 아버지":1,"오직 믿음으로":1,"내 영이":1,"주의 이름 앞에서":1,"성도여 함께":1,"찬양을 드리며":1,"전진하신 목자":1,"나의 가는 길":1,"찬송하세":1,"만왕의 왕 내 주께서":1,"주 안에서 기뻐해":1,"날마다 숨쉬는 순간마다":1,"나는 믿음으로":1,"찬송하리":1,"나의 모습 나의 소유":1,"주를 보게 하소서":1,"나의 반석이신 하나님":1,"내 위해 오신 주":1,"주여 내가 쉬임 없이":1,"주 신실하심 성이로다":1,"찬양하라":1,"나를 사랑하는 주":1,"당신은 하나님의 언약 위에":1,"내 가슴에 불을 주소서":1};
const BASE_READY = ["갈급한 내맘","갈릴리 마을 그 숲속에서","감사로 제사 드리는 자가","감사와 찬양 드리며","감사함으로","감사함으로-Fia","감사해 - copy","광야를 지나며","그 날이 도적같이","그 사랑 얼마나","그 크신 하나님의 사랑 4박자편곡","그의 생각","기뻐 찬양해","기뻐하며 승리의 노래 부르리","기뻐하며 왕께 노래부르리","꽃들도","나 기다립니다","나 기뻐하리","나 주님을 모른다 하여도","나는 믿네","나는 주를 섬기는 것에 후회가 없습니다","나는 주만 높이리","나로부터 시작되리","나를 사랑하는 주님","나의 가는길","나의 가장 낮은 마음","나의 마음을","나의 반석이신 하나님","나의 슬픔을","나의 안에 거하라","날 향한 계획","날마다 숨쉬는 순간마다","내 안에 부어주소서","내 안에 사는이","내 영혼이 은총입어","내 주 같은 분 없네","내 진정 사모하는","내 한가지 소원-주님앞에 간구 했었던","내게 있는 향유옥합","만세 반석","멈출수 없네","모든 능력과 모든 권세","모든 열방 주 볼 때까지","모든걸음되시네","모든걸음되시네+주품에","모든상황속에서+내영혼이은총입어","모든상황속에서+시선","믿음 따라","믿음이 없이는","비 준비하시니2","비길 수 없네","비길 수 없네 + 주여호와는 광대하시도다","빛 되신 주","빛되신주","새힘 얻으리","성령이여 임하소서","세상 모든 민족이","세상은 평화 원하지만","세상을 사는 지혜","슬픈 마음 있는 사람","시선","십자가 그 사랑","아 하나님의 은혜로","아침에 주의 인자하심을","어머니의 넓은 사랑(579)","언제나 주님께 감사해","예배하는 이에게","예수 귀하신 이름 내평생 사는 동안","예수 아름다우신","예수 열방의 소망","예수님 때문에","예수님 때문에+예수 열방의 소망","예수로 사는 인생","오직 예수 뿐이네","온땅의 주인 되신 주님이","온땅의 주인 되신 주님이 - drum","온맘다해","온세상 창조주","왕이신 하나님 높임을 받으소서","우릴 결코 놓지 않네","우릴 결코 놓지 않네 쉬운악보","은혜","일어나라 주의 백성","주 내 아버지","주 내 아버지 +  아하나님의 은혜로","주 사랑이 나를 숨쉬게 해 + 내 구주 예수를","주 안에서 기뻐해","주 여호와는 광대하시도다","주 예수 기뻐 찬양해","주 예수의 이름 높이세","주 임재하시는 곳에","주가 보이신 생명의 길","주가 일하시네","주께 가까이","주님 나를 택하사","주님 큰 영광 받으소서","주님은 아시네","주님을 바라봅니다","주님의 사랑-마커스워십","주님의 시선","주님의 임재 앞에서","주를 향한 나의 사랑을","주만 바라 볼지라","주의 이름 높이며","주품에","찬양중에 눈을 들어","찬양하세","풀은 마르고","하나님 아버지의 마음","하나님은 우리의 피난처가 되시며","하늘위에 주님 밖에","혼자걷지 않을거에요"];
const BASE_PLAN = ["Here I Am to Worship","With All I Am","감사-손경민","거룩하신 성령이여","거룩하신 하나님","거리마다 기쁨으로","괴로울 때 주님의 얼굴 보라","교회","그 날이 도적같이-fia","그 날이 도적같이2","그 사랑","그 사랑+예수 이름 높이세","그 안에 나 거하네","그가 오신 이유","그들은 모두 주가 필요해","그럼에도 불구하고","그리 아니 하실지라도","그리스도의 계절","기대","나 가진 재물 없으나","나 무엇과도 주님을","나 주님의 기쁨되기 원하네","나는 노래하네","나는 믿음으로","나는 아무것도 아닙니다","나는 예배자입니다","나는 찬양하리라","나를 받으옵소서","나를 지으신 주님","나를 향한 주의 사랑","나의 기도하는 것보다","나의 모습 나의 소유","나의 영혼이","나의 참 친구","나의 피난처 예수","나의 하나님","내 구주 예수님","내 눈 주의 영광을 보네","내 모습 이대로","내 주 되신 주를 참 사랑하고","내일 일은 난 몰라요","다시 일어나","더 가까이","돌아서지 않으리","두 손들고 찬양합니다","마음이 상한 자를","만왕의 왕 내 주께서","모든 상황 속에서","믿음으로 나아가네","보내소서","부르신 곳에서","불을 내려주소서","비 준비하시니","성령이여 내 영혼을","시온의 대로","실로암","십자가 그 사랑 멀리 떠나서","아름다우신","아무것도 두려워말라","예수 사랑하심은","예수님만을 더욱 사랑","오직 예수","오직 주의 사랑에 매여","온 땅의 주인","완전하신 나의 주","왕 되신 주께 감사하세","우리는 기대하고","우리는 주의 백성이오니","원하고 바라고 기도합니다","위대하신 주","은혜로다","임재","저 높은 곳을 향하여","전심으로","주 날 인도하시네","주 사랑이 나를 숨쉬게 해","주 신실하심 놀라워","주 안에 우린 하나","주가 주되심을","주님 곁으로 날 이끄소서","주님 말씀하시면","주님 한 분만으로","주의 거룩하심 생각할때","주의 사랑을 입어","주의 은혜라","주의 이름을 나는 찬양하리라","찬양의 열기","축복의 통로","평강의 왕","하나님은 너를 지키시는 자","하나님의 부르심","혼자걷지 않을 거에요"];
const BASE_SEASONS = {"십자가 그 사랑":["사순절","위로"],"내 위해 오신 주":["사순절"],"예수 열방의 소망":["사순절","부활절"],"그가 오신 이유":["성탄절"],"주님의 영광 나타났네":["성탄절"],"천사들의 노래가":["성탄절"],"기뻐하라":["감사","부활절"],"만왕의 왕 내 주께서":["부활절"],"주가 일하시네":["감사"],"다 원합니다":["위로","감사"],"그 사랑":["위로","감사"],"아름다우신":["감사","위로"],"주를 향한 나의 사랑을":["위로","감사"],"감사해":["감사"],"슬픈 마음 있는 사람":["위로"],"주 사랑이 나를 숨기게 해":["위로"],"하늘의 문을 여소서(임재)":["위로"],"은혜":["위로","감사"],"아 하나님의 은혜로":["감사"],"선포하라":["부활절","감사"],"그 사랑 얼마나":["위로","감사"],"나는 기도하는 것보다":["위로"],"내가 주인 삼은":["위로"],"전능하신 나의 주 하나님":["감사"],"두손들고":["감사"],"마지막 날에":["부활절"],"당신은 하나님의 언약 위에":["위로","감사"],"하나님은 우리의 피난처가 되시며":["위로"]};

// ── STATE ─────────────────────────────────────────────────
let songs = [], filt = 'all', exp = null, editId = null, sortBy = 'name', sortDir = 1;
let currentTab = 'songs', historyExp = null, selectedSongs = [];
let selectedSongId = null, currentSetlistId = localStorage.getItem('wdb-current-setlist') || '', currentSetlistRows = [];

// ── TAB ───────────────────────────────────────────────────
function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('tab-songs').style.display = tab==='songs' ? '' : 'none';
  document.getElementById('tab-history').style.display = tab==='history' ? '' : 'none';
  document.getElementById('tab-tools').style.display = tab==='tools' ? '' : 'none';
  document.getElementById('fab').style.display = tab==='songs' ? 'flex' : 'none';
  if (tab==='history') { initYearSelect(); loadHistory(); }
}

const TOOLS_PASSWORD='1955';
let pendingToolsButton=null;
function guardToolsClick(e, btn){
  e.preventDefault();
  pendingToolsButton=btn;
  if(sessionStorage.getItem('worshipToolsUnlocked')==='1'){
    switchTab('tools', btn);
    return;
  }
  showToolsPassword();
}
function showToolsPassword(){
  const m=document.getElementById('fake-pass-modal');
  const i=document.getElementById('fake-pass-input');
  if(i) i.value='';
  if(m){m.classList.add('show'); setTimeout(()=>i&&i.focus(),30);} 
}
function closeFakePass(){document.getElementById('fake-pass-modal')?.classList.remove('show');}
function checkToolsPassword(){
  const i=document.getElementById('fake-pass-input');
  const value=(i?.value||'').trim();
  if(value===TOOLS_PASSWORD){
    sessionStorage.setItem('worshipToolsUnlocked','1');
    closeFakePass();
    switchTab('tools', pendingToolsButton || document.getElementById('tools-tab'));
    showToast('관리도구가 열렸습니다');
    return;
  }
  showToast('비밀번호가 올바르지 않습니다');
  if(i){i.value=''; i.focus();}
}
function fakePassFail(){checkToolsPassword();}
function toggleFilterPanel(){
  const p=document.getElementById('filter-panel'), b=document.getElementById('filter-toggle');
  p?.classList.toggle('show'); b?.classList.toggle('on', p?.classList.contains('show'));
}
async function enterFullscreen(el){
  try{ if(el?.requestFullscreen && !document.fullscreenElement) await el.requestFullscreen(); }catch(e){}
}
function exitFullscreenSafe(){try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){} }

function openEmbeddedTool(url, title) {
  const modal = document.getElementById('tool-frame-modal');
  const frame = document.getElementById('tool-frame');
  document.getElementById('tool-frame-title').textContent = title || '관리 도구';
  document.getElementById('tool-frame-newtab').href = url;
  frame.src = url;
  modal.classList.add('show');
}
function closeEmbeddedTool() {
  const modal = document.getElementById('tool-frame-modal');
  const frame = document.getElementById('tool-frame');
  modal.classList.remove('show');
  frame.src = 'about:blank';
}

// ── HISTORY ───────────────────────────────────────────────
async function initYearSelect() {
  const sel = document.getElementById('h-year');
  try {
    const data = await api('GET', 'worship_history?select=worship_date&order=worship_date.asc&limit=1000');
    const years = [...new Set(data.map(d => new Date(d.worship_date).getFullYear()))].sort((a,b) => b-a);
    sel.innerHTML = '<option value="">전체 연도</option>';
    years.forEach(y => sel.innerHTML += `<option value="${y}">${y}년</option>`);
  } catch(e) {
    // 실패하면 현재 연도만
    const cur = new Date().getFullYear();
    sel.innerHTML = `<option value="">전체 연도</option><option value="${cur}">${cur}년</option>`;
  }
}

function getWeekOfMonth(date) {
  const d = new Date(date);
  const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  // 그 달 첫 번째 일요일
  const firstSunday = new Date(firstOfMonth);
  const dayOfWeek = firstOfMonth.getDay();
  if (dayOfWeek !== 0) {
    firstSunday.setDate(1 + (7 - dayOfWeek));
  }
  // 날짜가 첫 번째 일요일 이전이면 → 이전 달 마지막 주
  if (d < firstSunday) {
    const prevFirst = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const prevDow = prevFirst.getDay();
    const prevFirstSunday = new Date(prevFirst);
    if (prevDow !== 0) prevFirstSunday.setDate(1 + (7 - prevDow));
    return Math.floor((d - prevFirstSunday) / (7 * 864e5)) + 1;
  }
  // 첫 번째 일요일이 1주차
  return Math.floor((d - firstSunday) / (7 * 864e5)) + 1;
}

function weekLabel(date) {
  const labels = ['','첫째','둘째','셋째','넷째','다섯째'];
  const d = new Date(date);
  const w = getWeekOfMonth(date);
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${labels[w]||w} 주`;
}

async function loadHistory() {
  const year = document.getElementById('h-year').value;
  const month = document.getElementById('h-month').value;
  const week = document.getElementById('h-week').value;
  const el = document.getElementById('history-list');
  el.innerHTML = '<div class="loading"><span class="loading-spin">⟳</span>불러오는 중...</div>';
  try {
    let query = 'worship_history?order=worship_date.desc&limit=300';
    if (year) query += `&worship_date=gte.${year}-01-01&worship_date=lte.${year}-12-31`;
    let data = await api('GET', query);
    if (month) data = data.filter(d=>new Date(d.worship_date).getMonth()+1===parseInt(month));
    if (week) data = data.filter(d=>getWeekOfMonth(d.worship_date)===parseInt(week));
    if (!data||data.length===0) {
      el.innerHTML='<div class="nr"><span>📅</span>기록이 없어요<br><small>위 버튼으로 추가해보세요</small></div>';
      return;
    }
    el.innerHTML = data.map(h=>{
      const isOpen = historyExp===h.id;
      const names = h.song_names||[];
      return `<div class="history-card ${isOpen?'open':''}">
        <button class="history-delete-mini" title="삭제" onclick="event.stopPropagation();deleteHistory('${h.id}')">🗑</button>
        <div class="history-head" onclick="toggleHistory('${h.id}')">
          <div style="flex-shrink:0">
            <div class="history-week">${weekLabel(h.worship_date)}</div>
            <div class="history-date">${h.worship_date}</div>
          </div>
          <div class="history-songs">${names.length?names.join(' · '):'곡 없음'}</div>
          ${h.note?`<span style="font-size:.63rem;color:var(--text3);white-space:nowrap">${h.note}</span>`:''}
          <span class="chev">${isOpen?'▲':'▼'}</span>
        </div>
        <div class="history-body">
          <div style="padding-top:8px;display:flex;flex-direction:column;gap:2px">
            ${names.map(n=>`<div class="history-song-item"><span class="history-song-name" style="cursor:pointer;color:var(--accent);text-decoration:underline" onclick="goToSong('${n.replace(/'/g,"\\'")}')">🎵 ${n}</span></div>`).join('')}
            ${h.note?`<div style="margin-top:6px;font-size:.72rem;color:var(--text3)">메모: ${h.note}</div>`:''}
          </div>
          <div style="display:flex;gap:5px;margin-top:10px;flex-wrap:wrap">
            <button class="ab" onclick="shareHistory('${h.id}')">💬 공유</button>
            <button class="ab" onclick="openHistoryModal('${h.id}')">✏️ 수정</button>
            <button class="ab red" onclick="deleteHistory('${h.id}')">🗑 삭제</button>
          </div>
        </div>
      </div>`;
    }).join('');
  } catch(e) {
    el.innerHTML=`<div class="nr"><span>⚠️</span>불러오기 실패<br><small>${e.message}</small></div>`;
  }
}

// ── GO TO SONG FROM HISTORY ───────────────────────────────
function goToSong(name) {
  const songTab = document.querySelector('.tab:first-child');
  switchTab('songs', songTab);

  const q = document.getElementById('q');
  q.value = name;
  render();

  setTimeout(() => {
    const song = songs.find(s => s.name === name);
    if (song) {
      selectedSongId = song.id;
      render();
      setTimeout(() => {
        const panel = document.querySelector('.song-detail-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      // 곡이 없으면 추가 모달 띄우기
      showToast(`"${name}" 곡이 없어요 — 추가 화면을 열게요 📝`);
      setTimeout(() => {
        openModal();
        document.getElementById('f-name').value = name;
      }, 800);
    }
  }, 100);
}

// ── 달력 ──────────────────────────────────────────────────
let calYear, calMonth;

function toggleCalendar() {
  const cal = document.getElementById('h-calendar');
  if (cal.style.display === 'none') {
    calYear = parseInt(document.getElementById('h-year-input').value);
    calMonth = parseInt(document.getElementById('h-month-input').value) - 1;
    renderCalendar();
    cal.style.display = 'block';
  } else {
    cal.style.display = 'none';
  }
}

function moveCalMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

function renderCalendar() {
  if (!calYear) calYear = parseInt(document.getElementById('h-year-input').value);
  if (calMonth === undefined) calMonth = parseInt(document.getElementById('h-month-input').value) - 1;
  const selDay = parseInt(document.getElementById('h-day-input').value) || 0;
  const selY = parseInt(document.getElementById('h-year-input').value);
  const selM = parseInt(document.getElementById('h-month-input').value) - 1;
  document.getElementById('cal-title').textContent = `${calYear}년 ${calMonth+1}월`;
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  let html = '';
  for (let i = 0; i < firstDay; i++) html += '<div></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (firstDay + d - 1) % 7;
    const isSelected = (d === selDay && calYear === selY && calMonth === selM);
    const isToday = (d === new Date().getDate() && calYear === new Date().getFullYear() && calMonth === new Date().getMonth());
    const color = isSelected ? '#fff' : dow===0 ? 'var(--red)' : dow===6 ? 'var(--accent2)' : 'var(--text1)';
    const bg = isSelected ? 'var(--accent)' : isToday ? 'var(--blue-bg)' : 'transparent';
    html += `<div onclick="pickCalDay(${d})" style="cursor:pointer;font-size:.75rem;padding:4px 2px;border-radius:4px;color:${color};background:${bg};font-weight:${isSelected||isToday?'600':'400'}">${d}</div>`;
  }
  document.getElementById('cal-days').innerHTML = html;
}

function pickCalDay(d) {
  document.getElementById('h-year-input').value = String(calYear);
  document.getElementById('h-month-input').value = String(calMonth+1).padStart(2,'0');
  updateDaySel();
  document.getElementById('h-day-input').value = String(d).padStart(2,'0');
  renderCalendar();
  updateDatePreview();
  // 일요일이면 달력 닫기
  if (new Date(calYear, calMonth, d).getDay() === 0) {
    document.getElementById('h-calendar').style.display = 'none';
  }
}

function updateDatePreview() {
  const date = getSelectedDate();
  if (!date || date.includes('NaN')) {
    document.getElementById('h-date-preview').textContent = '';
    return;
  }
  const d = new Date(date);
  const dayNames = ['일','월','화','수','목','금','토'];
  const weekLabels = ['','첫째','둘째','셋째','넷째','다섯째'];
  const week = getWeekOfMonth(date);
  const dow = d.getDay();
  const isSun = dow === 0;
  document.getElementById('h-date-preview').innerHTML =
    `📅 ${d.getFullYear()}년 ${d.getMonth()+1}월 ${weekLabels[week]||week} 주 (${dayNames[dow]}요일)` +
    (isSun ? ' <span style="color:var(--green);font-size:.72rem">✓ 주일</span>' : ' <span style="color:var(--accent2);font-size:.72rem">⚠️ 주일이 아니에요</span>');
}

function syncCalendarFromSelectors() {
  calYear = parseInt(document.getElementById('h-year-input').value);
  calMonth = parseInt(document.getElementById('h-month-input').value) - 1;
  if (document.getElementById('h-calendar').style.display !== 'none') renderCalendar();
  updateDatePreview();
}

function initDateSelectors() {
  // 연도 셀렉터 (2020 ~ 현재+2)
  const yearSel = document.getElementById('h-year-input');
  const cur = new Date().getFullYear();
  yearSel.innerHTML = '';
  for (let y = cur + 2; y >= 2020; y--) {
    yearSel.innerHTML += `<option value="${y}">${y}년</option>`;
  }
  // 일 셀렉터 업데이트
  updateDaySel();
  document.getElementById('h-year-input').addEventListener('change', updateDaySel);
  document.getElementById('h-month-input').addEventListener('change', updateDaySel);
}

function updateDaySel() {
  const y = parseInt(document.getElementById('h-year-input').value);
  const m = parseInt(document.getElementById('h-month-input').value);
  const days = new Date(y, m, 0).getDate();
  const daySel = document.getElementById('h-day-input');
  const cur = parseInt(daySel.value) || 1;
  daySel.innerHTML = '';
  for (let d = 1; d <= days; d++) {
    const v = String(d).padStart(2,'0');
    daySel.innerHTML += `<option value="${v}" ${d===cur?'selected':''}>${d}일</option>`;
  }
}

function getSelectedDate() {
  const y = document.getElementById('h-year-input').value;
  const m = document.getElementById('h-month-input').value;
  const d = document.getElementById('h-day-input').value;
  return `${y}-${m}-${d}`;
}

function setSelectedDate(dateStr) {
  if (!dateStr) return;
  const [y, m, d] = dateStr.split('-');
  document.getElementById('h-year-input').value = y;
  document.getElementById('h-month-input').value = m;
  updateDaySel();
  document.getElementById('h-day-input').value = d;
  updateDatePreview();
}

function toggleHistory(id) {
  historyExp = historyExp===id ? null : id;
  // 카드 직접 토글 (loadHistory 재호출 없이)
  document.querySelectorAll('.history-card').forEach(card => {
    const head = card.querySelector('.history-head');
    const body = card.querySelector('.history-body');
    const chev = card.querySelector('.chev');
    if (!head) return;
    const cardId = head.getAttribute('onclick').match(/'([^']+)'/)?.[1];
    if (cardId === id) {
      const isOpen = card.classList.toggle('open');
      if (body) body.style.display = isOpen ? 'block' : 'none';
      if (chev) chev.textContent = isOpen ? '▲' : '▼';
    }
  });
}

// ── HISTORY MODAL ─────────────────────────────────────────
let editHistoryId = null;

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
    if(id){ if(seenIds.has(id))return false; seenIds.add(id); }
    if(nameKey){ if(seenNames.has(nameKey))return false; seenNames.add(nameKey); }
    return !!(id||nameKey);
  });
}
async function openHistoryModal(id) {
  editHistoryId = id||null;
  selectedSongs = [];
  document.getElementById('h-song-q').value='';
  document.getElementById('h-song-results').style.display='none';
  document.getElementById('h-note').value='';
  initDateSelectors();
  if (editHistoryId) {
    document.getElementById('hmodal-title').textContent='콘티 기록 수정';
    try {
      const data = await api('GET',`worship_history?id=eq.${editHistoryId}`);
      if (data&&data[0]) {
        const h=data[0];
        setSelectedDate(h.worship_date);
        document.getElementById('h-note').value=h.note||'';
        selectedSongs=uniqueContiSongsByName((h.song_names||[]).map((name,i)=>({id:(h.song_ids||[])[i]||null,name})));
      }
    } catch(e){}
  } else {
    document.getElementById('hmodal-title').textContent='콘티 기록 추가';
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }
  renderSelectedSongs();
  document.getElementById('hmodal').classList.add('show');
}

function closeHistoryModal() {
  document.getElementById('hmodal').classList.remove('show');
  document.getElementById('h-song-results').style.display='none';
}
document.getElementById('hmodal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeHistoryModal();});

function searchHistorySongs() {
  const raw = document.getElementById('h-song-q').value;
  const q = raw.replace(/\s+/g,' ').trim().toLowerCase();
  const res = document.getElementById('h-song-results');
  if(!q){res.style.display='none';return;}
  const matches = songs.filter(s=>s.name.replace(/\s+/g,' ').trim().toLowerCase().includes(q)).slice(0,8);
  const orig = raw.trim();
  const safeOrig = orig.replace(/\\/g,'\\\\').replace(/'/g,"\\'");

  res.style.display='block';
  res.innerHTML = (matches.length
    ? matches.map(s=>`<div class="ssr-item" onclick="addToSelected('${s.id}','${s.name.replace(/'/g,"\\'")}')">🎵 ${s.name}</div>`).join('')
    : `<div style="padding:8px 10px;font-size:.75rem;color:var(--text3)">DB에 없는 곡이에요</div>`)
    + `<div class="ssr-item" style="color:var(--accent2);border-top:1px solid var(--border);font-weight:500" onclick="addToSelectedDirect('${safeOrig}')">➕ "${orig}" 직접 추가</div>`;
}


function contiBaseName(v){
  return String(v||'').normalize('NFC').replace(/\s+/g,' ').trim().toLowerCase()
    .replace(/\[[^\]]*\]/g,' ')
    .replace(/\([^)]*\)/g,' ')
    .replace(/[_-](?:[a-g](?:#|b)?|코드|악보|ver\.?\s*\d+|v\d+|\d+페이지|\d+p)$/gi,' ')
    .replace(/\b(?:key|ver|version|코드)\b\s*[a-g](?:#|b)?/gi,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function uniqueSelectedSongsByBaseName(list){
  const seen=new Set();
  return (list||[]).filter(s=>{
    const key=contiBaseName(s?.name||'') || String(s?.id||'');
    if(!key)return true;
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });
}

function addToSelectedDirect(name) {
  if(!name) return;
  if(selectedSongs.find(s=>contiBaseName(s.name)===contiBaseName(name))){showToast('같은 곡의 다른 버전이 이미 들어가 있어요');return;}
  selectedSongs.push({id:null, name});
  renderSelectedSongs();
  document.getElementById('h-song-q').value='';
  document.getElementById('h-song-results').style.display='none';
}

function addToSelected(id,name) {
  if(selectedSongs.find(s=>contiBaseName(s.name)===contiBaseName(name))){showToast('같은 곡의 다른 버전이 이미 들어가 있어요');return;}
  selectedSongs.push({id,name});
  renderSelectedSongs();
  document.getElementById('h-song-q').value='';
  document.getElementById('h-song-results').style.display='none';
}

function removeFromSelected(idx) { selectedSongs.splice(idx,1); renderSelectedSongs(); }
function moveSelectedSong(idx,delta){const next=idx+delta;if(next<0||next>=selectedSongs.length)return;[selectedSongs[idx],selectedSongs[next]]=[selectedSongs[next],selectedSongs[idx]];renderSelectedSongs();}
let selectedDragFromIdx=null;
function reorderSelectedSongs(from,to){
  if(from===to||from<0||to<0||from>=selectedSongs.length||to>=selectedSongs.length)return;
  const [item]=selectedSongs.splice(from,1);
  selectedSongs.splice(to,0,item);
  renderSelectedSongs();
}
function startSelectedDrag(e,i){selectedDragFromIdx=i;e.currentTarget.classList.add('dragging');try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(i))}catch(_){}}
function overSelectedDrag(e,i){e.preventDefault();e.currentTarget.classList.add('drag-over');}
function dropSelectedDrag(e,i){e.preventDefault();const from=selectedDragFromIdx ?? parseInt(e.dataTransfer?.getData('text/plain')||'-1',10);selectedDragFromIdx=null;reorderSelectedSongs(from,i);}
function endSelectedDrag(){document.querySelectorAll('#h-selected .sel-song').forEach(x=>x.classList.remove('dragging','drag-over'));selectedDragFromIdx=null;}

function renderSelectedSongs() {
  const el=document.getElementById('h-selected');
  el.innerHTML=selectedSongs.length
    ?selectedSongs.map((s,i)=>`<div class="sel-song" draggable="true" data-selected-idx="${i}" ondragstart="startSelectedDrag(event,${i})" ondragover="overSelectedDrag(event,${i})" ondrop="dropSelectedDrag(event,${i})" ondragend="endSelectedDrag()"><span class="sel-title">${i+1}. ${s.name}</span><button onclick="removeFromSelected(${i})">✕</button><span class="drag-handle" title="잡고 순서 이동">≡</span></div>`).join('')
    :'<div style="font-size:.72rem;color:var(--text3)">곡을 검색해서 추가하세요</div>';
  enableSelectedTouchSort();
}
function enableSelectedTouchSort(){
  document.querySelectorAll('#h-selected .sel-song').forEach(item=>{
    const handle=item.querySelector('.drag-handle');
    if(!handle||handle.dataset.bound)return;
    handle.dataset.bound='1';
    handle.addEventListener('pointerdown',ev=>{
      if(ev.pointerType==='mouse')return;
      ev.preventDefault();
      const from=parseInt(item.dataset.selectedIdx||'-1',10);
      item.classList.add('dragging');
      const onMove=moveEv=>{
        const target=document.elementFromPoint(moveEv.clientX,moveEv.clientY)?.closest?.('#h-selected .sel-song');
        document.querySelectorAll('#h-selected .sel-song').forEach(x=>x.classList.remove('drag-over'));
        if(target)target.classList.add('drag-over');
      };
      const onUp=upEv=>{
        const target=document.elementFromPoint(upEv.clientX,upEv.clientY)?.closest?.('#h-selected .sel-song');
        const to=target?parseInt(target.dataset.selectedIdx||'-1',10):-1;
        document.removeEventListener('pointermove',onMove);
        document.removeEventListener('pointerup',onUp);
        document.querySelectorAll('#h-selected .sel-song').forEach(x=>x.classList.remove('dragging','drag-over'));
        if(to>=0)reorderSelectedSongs(from,to);
      };
      document.addEventListener('pointermove',onMove,{passive:false});
      document.addEventListener('pointerup',onUp,{once:true});
    },{passive:false});
  });
}

async function saveHistory() {
  const date=getSelectedDate();
  if(!date){showToast('날짜를 선택해주세요');return;}
  const note=document.getElementById('h-note').value.trim();
  // song_names와 song_ids의 순서를 반드시 맞춘다.
  // filter(Boolean)을 쓰면 ID가 없는 항목 때문에 인덱스가 밀려서
  // 같은 제목의 다른 버전 곡이 연주 화면에 섞일 수 있다.
  selectedSongs=uniqueSelectedSongsByBaseName(selectedSongs);
  const song_ids=selectedSongs.map(s=>s.id||null);
  const song_names=selectedSongs.map(s=>s.name);
  const btn=document.getElementById('h-btn-save');
  btn.disabled=true;btn.textContent='저장 중...';
  setSync('sync','저장 중...');
  try {
    let prevNames = [];
    if(editHistoryId) {
      // 수정 시 이전 곡 목록 가져오기
      const prev = await api('GET',`worship_history?id=eq.${editHistoryId}`);
      if(prev&&prev[0]) prevNames = prev[0].song_names||[];
      await api('PATCH',`worship_history?id=eq.${editHistoryId}`,{worship_date:date,song_ids,song_names,note});
      showToast('수정되었습니다 ✓');
    } else {
      await api('POST','worship_history',{worship_date:date,song_ids,song_names,note});
      showToast('기록이 추가되었습니다 ✓');
    }

    // 찬양곡 사용 횟수 자동 연동
    await syncSongCounts(song_names, prevNames);

    setSync('on','자료 연결됨');
    closeHistoryModal();
    // 찬양곡 데이터 새로 불러오기
    songs = await api('GET','songs?select=*&order=name');
    updateStats();
    await loadCurrentSetlists();
    render();
    // 연도 목록 갱신 후 기록 다시 불러오기
    const sel = document.getElementById('h-year');
    sel.innerHTML = '<option value="">전체 연도</option>';
    await initYearSelect();
    await loadCurrentSetlists();
    loadHistory();
  } catch(e){showToast('저장 실패: '+e.message);setSync('off','저장 실패');}
  btn.disabled=false;btn.textContent='저장';
}

// 콘티기록 변경에 따라 찬양곡 사용 횟수 자동 업데이트
async function syncSongCounts(newNames, prevNames) {
  const norm = n => n.replace(/\s+/g,' ').trim();
  const added = newNames.filter(n => !prevNames.map(norm).includes(norm(n)));
  const removed = prevNames.filter(n => !newNames.map(norm).includes(norm(n)));

  for (const name of added) {
    const normName = norm(name);
    const song = songs.find(s => norm(s.name) === normName);
    if (song) {
      const newCount = (song.count||0) + 1;
      await api('PATCH', `songs?id=eq.${song.id}`, { status:'used', count: newCount, updated_at: new Date().toISOString() });
    } else {
      const created = await api('POST', 'songs', { name: normName, status:'used', count:1, seasons:[], key:'', bpm:0, music_url:'' });
      if (created&&created[0]) songs.unshift(created[0]);
      showToast(`"${normName}" 곡이 자동으로 추가됐어요 ✓`);
    }
  }

  for (const name of removed) {
    const normName = norm(name);
    const song = songs.find(s => norm(s.name) === normName);
    if (song && song.count > 0) {
      const newCount = Math.max(0, (song.count||0) - 1);
      const newStatus = newCount === 0 ? 'ready' : 'used';
      await api('PATCH', `songs?id=eq.${song.id}`, { status: newStatus, count: newCount, updated_at: new Date().toISOString() });
    }
  }
}

async function deleteHistory(id) {
  if(!confirm('이 콘티 기록을 삭제할까요?'))return;
  try {
    // 삭제 전 곡 목록 가져오기
    const prev = await api('GET',`worship_history?id=eq.${id}`);
    const prevNames = (prev&&prev[0]) ? (prev[0].song_names||[]) : [];
    await api('DELETE',`worship_history?id=eq.${id}`);
    // 사용 횟수 -1
    await syncSongCounts([], prevNames);
    songs = await api('GET','songs?select=*&order=name');
    updateStats();
    render();
    showToast('삭제되었습니다');
    loadHistory();
  } catch(e){showToast('삭제 실패: '+e.message);}
}

// ── YOUTUBE PLAYER ────────────────────────────────────────
function extractYoutubeId(rawUrl) {
  const input = String(rawUrl || '').trim();
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input.startsWith('http') ? input : 'https://' + input);
    const host = url.hostname.replace(/^www\./,'').replace(/^m\./,'');
    if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || null;
    if (host.includes('youtube.com')) {
      if (url.searchParams.get('v')) return url.searchParams.get('v');
      const parts = url.pathname.split('/').filter(Boolean);
      const keys = ['embed','shorts','live'];
      for (const key of keys) {
        const idx = parts.indexOf(key);
        if (idx >= 0 && parts[idx+1]) return parts[idx+1];
      }
    }
  } catch(e) {
    const match = input.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
  const match = input.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}
function youtubeEmbedUrl(id) {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`;
}
function openExternalUrl(url) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function openYT(url, name) {
  const id = extractYoutubeId(url);
  if (!id) { openExternalUrl(url); return; }
  const modal = document.getElementById('yt-player-modal');
  const title = document.getElementById('yt-player-title');
  const frameWrap = document.getElementById('yt-frame-wrap');
  const openLink = document.getElementById('yt-player-open');
  if (!modal || !frameWrap) { openExternalUrl(url); return; }
  title.textContent = name ? `영상보기 · ${name}` : '영상보기';
  openLink.href = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
  frameWrap.innerHTML = `<iframe src="${youtubeEmbedUrl(id)}" title="${String(name||'영상보기').replace(/[&<>"']/g,'')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  modal.classList.add('show');
}
function closeYTPlayer() {
  const modal = document.getElementById('yt-player-modal');
  const frameWrap = document.getElementById('yt-frame-wrap');
  if (frameWrap) frameWrap.innerHTML = '';
  if (modal) modal.classList.remove('show');
}
const STORAGE_URL = SUPABASE_URL + '/storage/v1';
const STOR_HEADERS = {'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY};

async function listScores(songId) {
  const res = await fetch(`${STORAGE_URL}/object/list/scores`, {
    method:'POST', headers:{...STOR_HEADERS,'Content-Type':'application/json'},
    body: JSON.stringify({prefix: songId+'/', limit:50})
  });
  if (!res.ok) return [];
  return await res.json();
}

function scoreUrl(path) {
  return `${STORAGE_URL}/object/public/scores/${path}`;
}

async function syncR2Praise(songId) {
  try {
    setSync('sync', 'R2 반영 중...');
    const res = await fetch('/api/r2-praise-sync', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({songIds: songId ? [songId] : [], force: true})
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'R2 반영 실패');
    setSync('on', 'R2 반영 완료');
    return true;
  } catch(e) {
    console.warn('R2 sync failed', e);
    setSync('off', 'R2 반영 실패');
    showToast('저장은 됐지만 R2 반영은 실패했어요');
    return false;
  }
}

function safeScoreFilePart(v) {
  return String(v || '')
    .replace(/[\\/:*?"<>|#%{}^~`\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60) || '악보';
}
function currentModalScoreBaseName() {
  const name = safeScoreFilePart(document.getElementById('f-name')?.value || '찬양곡');
  const keys = (formKeys && formKeys.length) ? formKeys.join('-') : (document.getElementById('f-key')?.value || 'Key');
  const key = safeScoreFilePart(keys || 'Key');
  return `${name}_${key}_코드`;
}
async function uploadScore(songId, file, idx, total) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const base = currentModalScoreBaseName();
  const path = `${songId}/${base}_${idx + 1}.${ext}`;
  const bar = document.getElementById('upload-bar');
  bar.style.width = Math.round((idx/total)*60)+'%';
  const res = await fetch(`${STORAGE_URL}/object/scores/${path}`, {
    method:'POST', headers:{...STOR_HEADERS,'Content-Type':file.type,'x-upsert':'true'},
    body: file
  });
  bar.style.width = Math.round(((idx+1)/total)*100)+'%';
  if (!res.ok) throw new Error(await res.text());
  return path;
}

async function deleteScore(path) {
  await fetch(`${STORAGE_URL}/object/scores/${path}`, {
    method:'DELETE', headers: STOR_HEADERS
  });
}

// ── THUMBNAIL LOADER ──────────────────────────────────────
const thumbCache = {};
async function loadThumb(songId) {
  const el = document.getElementById('thumb-'+songId);
  if (!el) return;
  if (thumbCache[songId] === null) { el.style.display='none'; return; }
  if (thumbCache[songId]) { el.src = thumbCache[songId]; el.style.display='block'; return; }
  try {
    const files = await listScores(songId);
    if (!files || files.length === 0) { thumbCache[songId] = null; el.style.display='none'; return; }
    const url = scoreUrl(songId + '/' + files[0].name);
    thumbCache[songId] = url;
    el.src = url;
    el.style.display = 'block';
  } catch(e) { el.style.display='none'; }
}
async function loadExistingScores(songId) {
  const wrap = document.getElementById('existing-scores');
  if (!wrap) return;
  if (!songId) {
    wrap.innerHTML = '<div style="font-size:.72rem;color:var(--text3)">저장 후 악보를 업로드할 수 있어요</div>';
    return;
  }
  try {
    const files = await listScores(songId);
    if (!files || files.length === 0) {
      wrap.innerHTML = '<div style="font-size:.72rem;color:var(--text3);padding:12px;border:1px dashed var(--border2);border-radius:12px;text-align:center">업로드된 악보 없음</div>';
      return;
    }
    wrap.innerHTML = `<div class="existing-score-grid">${files.map((f, i) => {
      const path = songId + '/' + f.name;
      const url = scoreUrl(path);
      return `<div class="existing-score-card" data-score-path="${path}">
        <img src="${url}" alt="악보 ${i+1}" onclick="openViewer('${songId}', document.getElementById('f-name').value || '악보')">
        <div class="existing-score-meta">
          <div class="existing-score-name">${i+1}. ${f.name}</div>
          <div class="existing-score-actions">
            <button type="button" onclick="openViewer('${songId}', document.getElementById('f-name').value || '악보')">크게보기</button>
            <button type="button" class="danger" onclick="deleteScoreFromModal('${path}', this)">삭제</button>
          </div>
        </div>
      </div>`;
    }).join('')}</div>`;
  } catch(e) {
    wrap.innerHTML = '<div style="font-size:.72rem;color:var(--red)">불러오기 실패</div>';
  }
}

async function deleteScoreFromModal(path, btn) {
  if (!confirm('이 악보 이미지 파일을 삭제할까요?\n삭제하면 Storage에서도 제거됩니다.')) return;
  const songId = String(path || '').split('/')[0] || editId;
  btn.textContent = '삭제 중...';
  btn.disabled = true;
  try {
    await deleteScore(path);
    delete thumbCache[songId];
    const filesLeft = songId ? await listScores(songId) : [];
    if (!filesLeft || filesLeft.length === 0) {
      await api('PATCH', `songs?id=eq.${songId}`, { has_score:false, updated_at:new Date().toISOString() });
      const s = songs.find(x => x.id === songId);
      if (s) s.has_score = false;
    }
    await loadExistingScores(songId);
    if (songId) await syncR2Praise(songId);
    showToast('악보가 삭제되었습니다 ✓');
    updateStats();
    render();
  } catch(e) {
    showToast('삭제 실패: ' + e.message);
    btn.textContent = '삭제';
    btn.disabled = false;
  }
}

let pendingFiles = [];
function renderPendingScores() {
  const preview = document.getElementById('score-preview');
  if (!preview) return;
  if (!pendingFiles.length) { preview.innerHTML = ''; return; }
  preview.innerHTML = `<div class="pending-score-grid">${pendingFiles.map((f,i)=>`
    <div class="pending-score-card">
      <img src="${URL.createObjectURL(f)}" alt="추가할 악보 ${i+1}">
      <div class="score-actions">
        <span style="flex:1;font-size:.66rem;color:var(--text2);word-break:break-all">${i+1}. ${f.name}</span>
        <button type="button" class="score-del" onclick="removePending(${i})">제거</button>
      </div>
    </div>`).join('')}</div>`;
}
function previewScores(input) {
  pendingFiles = [...input.files];
  renderPendingScores();
}
function removePending(i) {
  pendingFiles.splice(i,1);
  const input = document.getElementById('f-score');
  if (input) input.value = '';
  renderPendingScores();
}

// ── VIEWER ────────────────────────────────────────────────
async function openViewer(id, name) {
  document.getElementById('viewer-title').textContent = name + ' — 악보';
  document.getElementById('viewer-body').innerHTML = '<div class="viewer-empty"><span>⟳</span>불러오는 중...</div>';
  document.getElementById('viewer').classList.add('show');
  enterFullscreen(document.getElementById('viewer'));
  try {
    const files = await listScores(id);
    if (!files || files.length===0) {
      document.getElementById('viewer-body').innerHTML = '<div class="viewer-empty"><span>🎼</span>업로드된 악보가 없어요<br><small>수정 버튼에서 악보를 추가하세요</small></div>';
      return;
    }
    document.getElementById('viewer-body').innerHTML = files.map(f=>`
      <img src="${scoreUrl(id+'/'+f.name)}" alt="악보" loading="lazy">`).join('');
  } catch(e) {
    document.getElementById('viewer-body').innerHTML = '<div class="viewer-empty"><span>⚠️</span>불러오기 실패</div>';
  }
}
function closeViewer() { document.getElementById('viewer').classList.remove('show'); exitFullscreenSafe(); }
async function api(method, path, body) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    method, headers: HEADERS, body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) { const e = await res.text(); throw new Error(e); }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── INIT ──────────────────────────────────────────────────
async function init() {
  setSync('sync', '불러오는 중...');
  try {
    let data = await api('GET', 'songs?select=*&order=name');
    if (!data || data.length === 0) {
      setSync('sync', '초기 데이터 업로드 중...');
      await uploadBaseData();
      data = await api('GET', 'songs?select=*&order=name');
    }
    songs = data;
    // 먼저 화면에 바로 렌더링 (빠른 로딩감)
    setSync('on', `자료 연결됨 · ${songs.length}곡`);
    updateStats();
    render();
    // 백그라운드에서 has_score 불일치 수정 (화면 블로킹 없이)
    const toFix = songs.filter(s => s.has_score && s.status === 'plan');
    if (toFix.length > 0) {
      for (const s of toFix) {
        await api('PATCH', `songs?id=eq.${s.id}`, { status: 'ready', updated_at: new Date().toISOString() });
        s.status = 'ready';
      }
      showToast(`${toFix.length}곡 상태 자동 수정 ✓`);
      updateStats();
      render();
    }
  } catch(e) {
    setSync('off', '자료 연결 실패');
    document.getElementById('list').innerHTML = `<div class="nr"><span>⚠️</span>서버 연결에 실패했어요<br><small style="color:var(--red)">${e.message}</small></div>`;
  }
}

async function uploadBaseData() {
  const rows = [];
  const seen = new Set();
  function add(name, status, count) {
    if (seen.has(name)) return;
    seen.add(name);
    rows.push({ name, status, count: count || 0, seasons: BASE_SEASONS[name] || [] });
  }
  Object.entries(BASE_USED).forEach(([n,c]) => add(n,'used',c));
  BASE_READY.forEach(n => add(n,'ready',0));
  BASE_PLAN.forEach(n => add(n,'plan',0));
  // 50개씩 나눠서 업로드
  for (let i = 0; i < rows.length; i += 50) {
    await api('POST', 'songs', rows.slice(i, i+50));
  }
}

function setSync(state, txt) {
  const dot = document.getElementById('dot');
  dot.className = 'dot' + (state==='on' ? '' : state==='sync' ? ' sync' : ' off');
  document.getElementById('sync-txt').textContent = txt;
}

// ── STATS ─────────────────────────────────────────────────
function updateStats() {
  document.getElementById('st-used').textContent = songs.filter(s=>s.status==='used').length;
  document.getElementById('st-ready').textContent = songs.filter(s=>s.status==='ready' || (s.status==='used' && s.has_score)).length;
  document.getElementById('st-total').textContent = songs.length;
  document.getElementById('st-plan').textContent = songs.filter(s=>s.status==='plan' || !s.has_score).length;
  document.getElementById('st-video').textContent = songs.filter(s=>!!s.music_url).length;
}

// ── FILTER ────────────────────────────────────────────────
let dropSitu = '', dropSeas = '';

function statFilter(f) {
  switchTab('songs', document.querySelector('.tabs .tab'));
  sf(f, null);
  document.querySelectorAll('.stat-filter').forEach(el=>el.classList.toggle('active', el.dataset.filter===f));
  const labels={all:'전체 곡',used:'사용 이력 있는 곡',ready:'악보 완료 곡',no_score:'악보 없는 곡',video:'영상 있는 곡'};
  showToast((labels[f]||'선택한 항목')+'을 표시합니다');
  document.getElementById('tab-songs')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function sfSel(val) {
  filt = val;
  dropSitu = ''; dropSeas = '';
  document.getElementById('sel-situ').value = '';
  document.getElementById('sel-seas').value = '';
  render();
}

function sfDrop(val, type) {
  if (type === 'situ') dropSitu = val;
  if (type === 'seas') dropSeas = val;
  filt = 'all';
  document.getElementById('sel-filt').value = 'all';
  render();
}

function ssDrop(val) {
  sortBy = val;
  sortDir = val === 'count' ? -1 : 1;
  render();
}

function sf(f, btn) {
  filt = f;
  document.querySelectorAll('.stat-filter').forEach(el=>el.classList.toggle('active', el.dataset.filter===f));
  dropSitu = ''; dropSeas = '';
  const sf2 = document.getElementById('sel-filt');
  const ss2 = document.getElementById('sel-situ');
  const se = document.getElementById('sel-seas');
  if (sf2) sf2.value = f;
  if (ss2) ss2.value = '';
  if (se) se.value = '';
  render();
}
function ss(by, btn) {
  if (sortBy === by) { sortDir *= -1; }
  else { sortBy = by; sortDir = 1; }
  const sd = document.getElementById('sel-sort');
  if (sd) sd.value = by;
  render();
}
async function toggle(id) {
  exp = exp===id ? null : id;
  render();
  if (exp === id) loadThumb(id);
}

// ── MODAL ─────────────────────────────────────────────────
function openModal(id) {
  editId = id || null;
  document.getElementById('song-modal-box')?.classList.add('score-edit-wide');
  document.querySelectorAll('.check-group input').forEach(cb=>cb.checked=false);
  if (editId) {
    const s = songs.find(x=>x.id===editId);
    document.getElementById('modal-title').textContent = '곡 정보 수정';
    document.getElementById('f-name').value = s.name;
    document.getElementById('f-status').value = s.status;
    document.getElementById('f-cnt').value = s.count || 1;
    formKeys = songKeys(s); renderKeyChips();
    const tp = tempoParts(s);
    document.getElementById('f-bpm-min').value = tp.min || 0;
    document.getElementById('f-bpm-max').value = tp.max || 0;
    document.getElementById('f-url').value = s.music_url || '';
    document.getElementById('f-memo').value = s.memo || '';
    const mh=document.getElementById('f-memo-history');if(mh){mh.style.display='none';mh.innerHTML=''}
    renderEditYoutubePreview();
    document.getElementById('f-score-wrap').style.display = 'block';
    document.getElementById('score-preview').innerHTML = '';
    document.getElementById('upload-bar').style.width = '0%';
    document.getElementById('existing-scores').innerHTML = '<div style="font-size:.72rem;color:var(--text3)">불러오는 중...</div>';
    pendingFiles = [];
    loadExistingScores(editId);
    (s.seasons||[]).forEach(t=>{ const cb=document.querySelector(`.check-group input[value="${t}"]`); if(cb)cb.checked=true; });
  } else {
    document.getElementById('modal-title').textContent = '새 곡 추가';
    document.getElementById('f-name').value = '';
    document.getElementById('f-status').value = 'used';
    document.getElementById('f-cnt').value = 1;
    formKeys = []; renderKeyChips();
    document.getElementById('f-bpm-min').value = 0;
    document.getElementById('f-bpm-max').value = 0;
    document.getElementById('f-url').value = '';
    document.getElementById('f-memo').value = '';
    const mh=document.getElementById('f-memo-history');if(mh){mh.style.display='none';mh.innerHTML=''}
    renderEditYoutubePreview();
    document.getElementById('f-score-wrap').style.display = 'block';
    document.getElementById('existing-scores').innerHTML = '<div style="font-size:.72rem;color:var(--text3)">저장 후 악보를 업로드할 수 있어요</div>';
    document.getElementById('score-preview').innerHTML = '';
    document.getElementById('upload-bar').style.width = '0%';
    pendingFiles = [];
  }
  toggleCntField();
  document.getElementById('modal').classList.add('show');
  setTimeout(()=>document.getElementById('f-name').focus(), 100);
}
function closeModal() { document.getElementById('modal').classList.remove('show'); document.getElementById('song-modal-box')?.classList.remove('score-edit-wide'); }

function renderEditYoutubePreview(){
  const box=document.getElementById('f-youtube-preview');
  if(!box)return;
  const raw=(document.getElementById('f-url')?.value||'').trim();
  if(!raw){box.innerHTML='유튜브 링크를 입력하면 수정 화면에서 바로 확인합니다.';return}
  const id=extractYoutubeId(raw);
  if(!id){box.innerHTML='유튜브 주소 형식을 확인해주세요.';return}
  box.innerHTML=`<iframe src="${youtubeEmbedUrl(id)}" title="유튜브 미리보기" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
}
function editMemoCandidates(){
  const name=norm(document.getElementById('f-name')?.value||'');
  const id=String(editId||'');
  const out=[];
  const push=(label,text)=>{text=String(text||'').trim();if(!text)return;if(out.some(x=>norm(x.text)===norm(text)))return;out.push({label,text});};
  (songs||[]).forEach(s=>{if((id&&String(s.id)===id)||(name&&norm(s.name)===name))push(`찬양곡 메모 · ${s.name}`,s.memo)});
  (history||[]).forEach(h=>{const ids=(h.song_ids||[]).map(x=>String(x));const names=(h.song_names||[]).map(x=>norm(x));if((id&&ids.includes(id))||(name&&names.includes(name)))push(`${formatUsageDate(h.worship_date)} 콘티 메모`,h.note||h.memo||h.conti_memo)});
  return out.slice(0,12);
}
function showEditMemoHistory(){
  const box=document.getElementById('f-memo-history');if(!box)return;
  const rows=editMemoCandidates();
  if(!rows.length){box.style.display='block';box.innerHTML='<div style="color:var(--text3);font-size:.72rem;padding:6px">찾을 수 있는 이전 메모가 없습니다.</div>';return}
  box.style.display='block';
  box.innerHTML=rows.map((r,i)=>`<button type="button" class="memo-history-item" data-memo-idx="${i}"><small>${escHtml(r.label)}</small>${escHtml(r.text)}</button>`).join('');
  box.querySelectorAll('.memo-history-item').forEach((btn,i)=>btn.onclick=()=>{document.getElementById('f-memo').value=rows[i].text;});
}

function toggleCntField() {
  document.getElementById('f-cnt-wrap').style.display =
    document.getElementById('f-status').value==='used' ? 'block' : 'none';
}
document.getElementById('modal').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeModal(); });


async function saveSongRecord(method, endpoint, payload){
  try { return await api(method, endpoint, payload); }
  catch(e){
    const msg = String(e?.message || e || '');
    const fallback = {...payload};
    let changed = false;
    if(msg.includes('bpm_min') || msg.includes('bpm_max') || msg.includes('tempo_min') || msg.includes('tempo_max') || msg.includes('column')){
      delete fallback.bpm_min;
      delete fallback.bpm_max;
      changed = true;
    }
    if(msg.includes('keys') || msg.includes('score_key') || msg.includes('column')){
      delete fallback.keys;
      changed = true;
    }
    if(changed){
      showToast('일부 새 DB 컬럼이 없어 기존 형식으로 저장합니다. migration SQL 실행 후 전체 저장됩니다.');
      return await api(method, endpoint, fallback);
    }
    throw e;
  }
}

async function saveSong() {
  const rawName = document.getElementById('f-name').value.trim();
  if (!rawName) { showToast('곡명을 입력해주세요'); return; }
  // 공백 정규화 (앞뒤 + 중복 공백 제거)
  const name = rawName.replace(/\s+/g, ' ').trim();
  if (name !== rawName) {
    document.getElementById('f-name').value = name;
  }
  const status = document.getElementById('f-status').value;
  const count = status==='used' ? (parseInt(document.getElementById('f-cnt').value)||1) : 0;
  commitKeyChipInput();
  const key = formKeys.join(' / ');
  let bpmMin = parseInt(document.getElementById('f-bpm-min').value) || 0;
  let bpmMax = parseInt(document.getElementById('f-bpm-max').value) || 0;
  if (bpmMin < 0 || bpmMax < 0 || bpmMin > 300 || bpmMax > 300) { showToast('템포는 0~300 사이로 입력해주세요'); return; }
  if (bpmMin && bpmMax && bpmMax < bpmMin) { const t = bpmMin; bpmMin = bpmMax; bpmMax = t; }
  if (!bpmMax) bpmMax = bpmMin;
  const bpm = bpmMin;
  const music_url = document.getElementById('f-url').value.trim();
  const memo = document.getElementById('f-memo')?.value.trim() || '';
  const seasons = [...document.querySelectorAll('.check-group input:checked')].map(cb=>cb.value);

  // 새 곡 추가 시 유사 곡명 체크
  if (!editId) {
    const similar = songs.find(s => {
      const a = s.name.replace(/\s+/g,' ').trim().toLowerCase();
      const b = name.replace(/\s+/g,' ').trim().toLowerCase();
      return a === b && s.name !== name;
    });
    if (similar) {
      showToast(`⚠️ "${similar.name}" 과 같은 곡 같아요! 저장을 취소했어요`);
      // 이름을 DB의 정규화된 이름으로 교체 제안
      if (confirm(`"${similar.name}" 이(가) 이미 있어요.\n\n기존 곡을 수정할까요?`)) {
        closeModal();
        openModal(similar.id);
      }
      return;
    }
    const exact = songs.find(s => s.name === name);
    if (exact) { showToast('이미 있는 곡이에요'); return; }
  }

  const btn = document.getElementById('btn-save');
  btn.disabled = true; btn.textContent = '저장 중...';
  setSync('sync', '저장 중...');
  try {
    if (editId) {
      const updated = await saveSongRecord('PATCH', `songs?id=eq.${editId}`, { name, status, count, seasons, key, keys: formKeys, bpm, bpm_min:bpmMin, bpm_max:bpmMax, music_url, memo, updated_at: new Date().toISOString() });
      const idx = songs.findIndex(s=>s.id===editId);
      if (idx>=0) songs[idx] = updated[0];
      showToast('수정되었습니다 ✓');
    } else {
      if (songs.find(s=>s.name===name)) { showToast('이미 있는 곡이에요'); btn.disabled=false; btn.textContent='저장'; return; }
      const created = await saveSongRecord('POST', 'songs', { name, status, count, seasons, key, keys: formKeys, bpm, bpm_min:bpmMin, bpm_max:bpmMax, music_url, memo });
      songs.unshift(created[0]);
      showToast('추가되었습니다 ✓');
    }
    setSync('on', '자료 연결됨');
    // 악보 업로드 — 수정 또는 새 곡 모두 처리
    const uploadTargetId = editId || (songs[0]?.id);
    if (pendingFiles.length > 0 && uploadTargetId) {
      setSync('sync', '악보 업로드 중...');
      for (let i=0; i<pendingFiles.length; i++) {
        await uploadScore(uploadTargetId, pendingFiles[i], i, pendingFiles.length);
      }
      await api('PATCH', `songs?id=eq.${uploadTargetId}`, { has_score: true, updated_at: new Date().toISOString() });
      const idx = songs.findIndex(s=>s.id===uploadTargetId);
      if (idx>=0) songs[idx].has_score = true;
      delete thumbCache[uploadTargetId];
      pendingFiles = [];
      document.getElementById('upload-bar').style.width = '100%';
      showToast('악보 업로드 완료 ✓');
      await loadExistingScores(uploadTargetId);
      setSync('on', '자료 연결됨');
    }
    if (uploadTargetId) {
      await syncR2Praise(uploadTargetId);
    }
    closeModal();
    updateStats();
    render();
  } catch(e) {
    showToast('저장 실패: ' + e.message);
    setSync('off', '저장 실패');
  }
  btn.disabled=false; btn.textContent='저장';
}

// ── STATUS CHANGE ─────────────────────────────────────────
async function changeStatus(id, newStatus) {
  const s = songs.find(x=>x.id===id);
  const count = newStatus==='used' ? Math.max(s.count||0,1) : 0;
  setSync('sync', '업데이트 중...');
  try {
    await api('PATCH', `songs?id=eq.${id}`, { status: newStatus, count, updated_at: new Date().toISOString() });
    s.status = newStatus; s.count = count;
    const labels = {used:'사용 이력',ready:'악보 완료',plan:'작업 예정'};
    showToast(`"${s.name}" → ${labels[newStatus]} ✓`);
    setSync('on', '자료 연결됨');
    updateStats(); render();
  } catch(e) { showToast('실패: '+e.message); setSync('off','업데이트 실패'); }
}

async function addUseCount(id) {
  const s = songs.find(x=>x.id===id);
  const newCount = (s.count||0) + 1;
  setSync('sync', '업데이트 중...');
  try {
    await api('PATCH', `songs?id=eq.${id}`, { status:'used', count: newCount, updated_at: new Date().toISOString() });
    s.status='used'; s.count=newCount;
    showToast(`사용 횟수 +1 (총 ${newCount}회) ✓`);
    setSync('on', '자료 연결됨');
    updateStats(); render();
  } catch(e) { showToast('실패: '+e.message); setSync('off','실패'); }
}

async function deleteSong(id) {
  const s = songs.find(x=>x.id===id);
  if (!confirm(`"${s.name}" 을(를) 삭제할까요?`)) return;
  setSync('sync', '삭제 중...');
  try {
    await api('DELETE', `songs?id=eq.${id}`);
    songs = songs.filter(x=>x.id!==id);
    exp = null;
    showToast('삭제되었습니다');
    setSync('on', '자료 연결됨');
    updateStats(); render();
  } catch(e) { showToast('실패: '+e.message); setSync('off','삭제 실패'); }
}


function shareUrlForHistory(id){
  const url=new URL('share.html', location.href);
  if(id) url.searchParams.set('id',id);
  return url.toString();
}
async function shareHistory(id){
  const url=shareUrlForHistory(id);
  let text='콘티 공유';
  try{
    const row=await api('GET',`worship_history?id=eq.${id}&select=worship_date,song_names`);
    if(row?.[0]) text=`${row[0].worship_date} 콘티`;
  }catch(e){}
  try{
    if(navigator.share){await navigator.share({title:'콘티 공유',text,url});showToast('공유창을 열었습니다');return;}
  }catch(e){}
  try{await navigator.clipboard.writeText(url);showToast('공유 링크를 복사했습니다');}
  catch(e){prompt('이 링크를 복사해서 공유하세요',url);}
}

// ── TOAST ─────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}


let activeInlineVideoId = null;
let detailPanelPct = parseFloat(localStorage.getItem('wdb-detail-panel-pct') || '5') || 5;
let detailResizeMove = null;
let detailResizeUp = null;
function clampDetailPct(v){ return Math.max(5, Math.min(60, Number(v)||5)); }
function setDetailPanelPct(v, persist=false){
  detailPanelPct = clampDetailPct(v);
  const shell=document.querySelector('.song-library-shell.resizable-detail');
  if(shell) shell.style.setProperty('--detail-height', detailPanelPct + '%');
  if(persist) localStorage.setItem('wdb-detail-panel-pct', String(Math.round(detailPanelPct)));
}
function startDetailResize(e){
  e.preventDefault();
  const shell=document.querySelector('.song-library-shell.resizable-detail');
  if(!shell) return;
  const move=(ev)=>{
    const rect=shell.getBoundingClientRect();
    const y=(ev.touches&&ev.touches[0]?ev.touches[0].clientY:ev.clientY);
    const pct=((rect.bottom-y)/rect.height)*100;
    setDetailPanelPct(pct,false);
  };
  const up=()=>{
    setDetailPanelPct(detailPanelPct,true);
    window.removeEventListener('pointermove',move);
    window.removeEventListener('pointerup',up);
    window.removeEventListener('touchmove',move);
    window.removeEventListener('touchend',up);
  };
  window.addEventListener('pointermove',move);
  window.addEventListener('pointerup',up);
  window.addEventListener('touchmove',move,{passive:false});
  window.addEventListener('touchend',up);
}
function toggleDetailPanelSize(){ setDetailPanelPct(detailPanelPct<=7 ? 20 : 5, true); }
let formKeys = [];
const LITURGY_TAGS = ['대림절','성탄절','주현절','사순절','고난주간','종려주일','성금요일','부활절','성령강림절','맥추감사절','추수감사절','송구영신','신년','어린이주일','어버이주일','창립기념','세례식','성찬식'];
function escHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function jsStr(v){return String(v??'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' ');}
function splitKeys(raw){
  const arr = Array.isArray(raw) ? raw : String(raw||'').split(/[\/|,·\s]+/);
  return arr.map(x=>String(x).trim()).filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i);
}
function songKeys(s){return splitKeys(s?.keys || s?.score_key || s?.key || '');}
function commitKeyChipInput(){
  const input=document.getElementById('f-key-input');
  if(input && input.value.trim()) { splitKeys(input.value).forEach(addKeyChip); input.value=''; }
}
function handleKeyChipPaste(e){
  const text=(e.clipboardData||window.clipboardData)?.getData('text')||'';
  if(/[\/|,·\s]/.test(text)){ e.preventDefault(); splitKeys(text).forEach(addKeyChip); }
}
function tempoParts(s){
  const min = parseInt(s?.bpm_min ?? s?.tempo_min ?? s?.bpm ?? 0,10)||0;
  const max = parseInt(s?.bpm_max ?? s?.tempo_max ?? 0,10)||0;
  return {min,max:max||min};
}
function tempoText(s){const {min,max}=tempoParts(s); if(!min&&!max)return ''; return max&&max!==min?`${min}-${max} BPM`:`${min||max} BPM`;}
function tempoMood(s){const {min,max}=tempoParts(s); const v=max||min; return !v?'':v>=120?'빠름':v>=76?'중간':'느림';}
function renderKeyChips(){
  const wrap=document.getElementById('f-key-chips'); if(!wrap)return;
  wrap.innerHTML=formKeys.map((k,i)=>`<span class="key-chip">${escHtml(k)} <button type="button" onclick="removeKeyChip(${i})">×</button></span>`).join('');
}
function addKeyChip(v){
  const key=String(v||'').trim(); if(!key)return;
  if(!formKeys.includes(key)) formKeys.push(key);
  const input=document.getElementById('f-key-input'); if(input) input.value='';
  renderKeyChips();
}
function removeKeyChip(i){formKeys.splice(i,1);renderKeyChips();}
function handleKeyChipInput(e){
  if(e.key==='Enter' || e.key===',' || e.key==='/') { e.preventDefault(); splitKeys(e.target.value).forEach(addKeyChip); }
  if(e.key==='Backspace' && !e.target.value && formKeys.length){formKeys.pop();renderKeyChips();}
}
function openInlineVideo(id){activeInlineVideoId = activeInlineVideoId===id ? null : id; render();}
function closeInlineVideo(){activeInlineVideoId=null; render();}
function inlineVideoHtml(s){
  if(!s.music_url) return `<div class="song-video-empty"><b>영상 없음</b><span>등록된 링크가 없습니다.</span></div>`;
  const id=extractYoutubeId(s.music_url);
  if(activeInlineVideoId!==s.id){
    if(id){
      return `<div class="video-preview" style="background-image:url('https://img.youtube.com/vi/${id}/hqdefault.jpg')"></div><div class="video-preview-content"><b>영상보기</b><button class="song-video-btn" onclick="openInlineVideo('${jsStr(s.id)}')">▶ 작은 플레이어 열기</button></div>`;
    }
    return `<div class="song-video-empty"><b>영상보기</b><button class="song-video-btn" onclick="openInlineVideo('${jsStr(s.id)}')">▶ 재생</button></div>`;
  }
  if(!id) return `<div class="song-video-empty"><b>링크 확인 필요</b><span>유튜브 주소를 수정해주세요.</span></div>`;
  return `<div class="inline-video"><div class="inline-video-head"><span>${escHtml(s.name)} 영상</span><div class="inline-video-actions"><button onclick="closeInlineVideo()">닫기</button></div></div><div class="inline-video-frame"><iframe src="${youtubeEmbedUrl(id)}" title="${escHtml(s.name)} 영상보기" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div></div>`;
}


async function loadCurrentSetlists(){
  const sel=document.getElementById('current-setlist'); if(!sel) return;
  try{
    const rows=await api('GET','worship_history?select=id,worship_date,note,song_names,song_ids&order=worship_date.desc&limit=80');
    currentSetlistRows=rows||[];
    sel.innerHTML='<option value="">콘티 선택 없음</option>'+currentSetlistRows.map(h=>{
      const names=(h.song_names||[]).slice(0,2).join(' · ');
      const label=`${weekLabel(h.worship_date)}${h.note?' · '+h.note:''}${names?' · '+names:''}`;
      return `<option value="${escHtml(h.id)}">${escHtml(label)}</option>`;
    }).join('');
    if(currentSetlistId && currentSetlistRows.some(h=>h.id===currentSetlistId)) sel.value=currentSetlistId;
    else { currentSetlistId=''; localStorage.removeItem('wdb-current-setlist'); }
  }catch(e){ /* 콘티 목록 실패는 앱 흐름을 막지 않음 */ }
}
function setCurrentSetlist(id){currentSetlistId=id||''; if(id) localStorage.setItem('wdb-current-setlist',id); else localStorage.removeItem('wdb-current-setlist');}
async function addSongToCurrentSetlist(songId){
  const s=songs.find(x=>x.id===songId); if(!s) return;
  if(!currentSetlistId){
    showToast('콘티를 먼저 선택하거나 새 콘티를 만들어주세요');
    const sel=document.getElementById('current-setlist'); if(sel) sel.focus();
    return;
  }
  setSync('sync','콘티에 추가 중...');
  try{
    const rows=await api('GET',`worship_history?id=eq.${currentSetlistId}`);
    if(!rows||!rows[0]) throw new Error('선택한 콘티를 찾을 수 없습니다');
    const h=rows[0];
    const existing=uniqueContiSongsByName((h.song_names||[]).map((name,i)=>({id:(h.song_ids||[])[i]||null,name})));
    const already=existing.some(x=>String(x.id||'')===String(s.id||'') || norm(x.name)===norm(s.name));
    if(already){showToast('이미 이 콘티에 들어간 곡이에요');setSync('on','자료 연결됨');return;}
    existing.push({id:s.id,name:s.name});
    const song_names=existing.map(x=>x.name);
    const song_ids=existing.map(x=>x.id||null);
    await api('PATCH',`worship_history?id=eq.${currentSetlistId}`,{song_names,song_ids});
    showToast(`"${s.name}" 콘티에 추가 ✓`);
    await syncSongCounts(song_names, h.song_names||[]);
    songs=await api('GET','songs?select=*&order=name');
    await loadCurrentSetlists();
    updateStats(); render(); setSync('on','자료 연결됨');
  }catch(e){showToast('콘티 추가 실패: '+e.message);setSync('off','콘티 추가 실패');}
}
function compactTags(tags, max=2){
  const arr=(tags||[]).filter(t=>!LITURGY_TAGS.includes(t));
  if(!arr.length) return '<span style="color:var(--text3)">미지정</span>';
  const shown=arr.slice(0,max).map(t=>`<span class="song-mini-tag">${escHtml(t)}</span>`).join('');
  return shown + (arr.length>max?`<span class="song-mini-tag">+${arr.length-max}</span>`:'');
}
function selectSong(id){selectedSongId=id; activeInlineVideoId=null; if(detailPanelPct < 20) detailPanelPct = 20; render(); setTimeout(()=>setDetailPanelPct(detailPanelPct,true),0);}
function selectedSongDetailHtml(song){
  if(!song) return `<div class="song-detail-empty">위 목록에서 곡을 선택하면 이곳에 상세 정보와 영상 플레이어가 표시됩니다.</div>`;
  const keys=songKeys(song), tempo=tempoText(song), seas=Array.isArray(song.seasons)?song.seasons:[];
  const seasTags=seas.filter(t=>LITURGY_TAGS.includes(t));
  const situTags=seas.filter(t=>!LITURGY_TAGS.includes(t));
  const statusLabel=song.status==='used'?`사용 ${song.count||0}회`:song.status==='ready'?'악보 완료':'작업 예정';
  return `<div class="song-detail-panel">
    <div>
      <div class="song-detail-title">${escHtml(song.name)} ${song.has_score?'<span class="song-pill score-ok">🎼 악보</span>':'<span class="song-pill score-no">🎼 준비중</span>'} ${song.music_url?'<span class="song-pill video-ok">▶ 영상</span>':''}</div>
      <div class="song-detail-grid">
        <div class="song-detail-box"><div class="song-detail-label">코드</div><div class="song-detail-value">${keys.length?keys.map(escHtml).join(' / '):'코드 미정'}</div></div>
        <div class="song-detail-box"><div class="song-detail-label">BPM</div><div class="song-detail-value">${tempo?escHtml(tempo):'템포 미정'}</div></div>
        <div class="song-detail-box"><div class="song-detail-label">상황별</div><div class="song-detail-tags">${situTags.length?situTags.map(t=>`<span class="tag-mini situ">${escHtml(t)}</span>`).join(''):'<span style="color:var(--text3)">미지정</span>'}</div></div>
        <div class="song-detail-box"><div class="song-detail-label">절기별</div><div class="song-detail-tags">${seasTags.length?seasTags.map(t=>`<span class="tag-mini">${escHtml(t)}</span>`).join(''):'<span style="color:var(--text3)">미지정</span>'}</div></div>
        <div class="song-detail-box"><div class="song-detail-label">상태</div><div class="song-detail-value">${escHtml(statusLabel)}</div></div>
        <div class="song-detail-box"><div class="song-detail-label">자료</div><div class="song-detail-value">${song.has_score?'악보 연결됨':'악보 준비중'} · ${song.music_url?'영상 연결됨':'영상 없음'}</div></div>
      </div>
      <div class="song-detail-actions">
        <div class="song-action-lines">
          <div class="song-action-line">
            <button class="ab conti" onclick="addSongToCurrentSetlist('${jsStr(song.id)}')">➕ 콘티추가</button>
            <button class="ab primary-action" onclick="openModal('${jsStr(song.id)}')">✏️ 수정</button>
          </div>
          <div class="song-action-line">
            ${song.has_score?`<button class="ab" onclick="openViewer('${jsStr(song.id)}','${jsStr(song.name)}')">🎼 악보보기</button>`:`<button class="ab" style="color:var(--red)" onclick="openModal('${jsStr(song.id)}')">⬆ 악보올리기</button>`}
            <button class="ab" onclick="changeStatus('${jsStr(song.id)}','plan')">작업예정</button>
          </div>
        </div>
        <button class="ab song-delete-icon" title="삭제" onclick="deleteSong('${jsStr(song.id)}')">🗑</button>
      </div>
    </div>
    <div class="song-video-panel">${inlineVideoHtml(song)}</div>
  </div>`;
}

// ── RENDER ────────────────────────────────────────────────
function render() {
  const q = document.getElementById('q').value.normalize('NFC').toLowerCase().trim();
  const bpmInput = parseInt(document.getElementById('tempo-filter')?.value || '', 10) || 0;
  const top10 = [...songs].filter(s=>s.count>0).sort((a,b)=>b.count-a.count).slice(0,10).map(s=>s.name);

  let list = songs.filter(s=>{
    const normQ = q.replace(/\s+/g,' ').trim();
    const normName = s.name.normalize('NFC').replace(/\s+/g,' ').trim().toLowerCase();
    const keyText = songKeys(s).join(' ').toLowerCase();
    const tagText = (s.seasons||[]).join(' ').toLowerCase();
    const mq = !q || normName.includes(normQ.toLowerCase()) || keyText.includes(normQ.toLowerCase()) || tagText.includes(normQ.toLowerCase());
    if (!mq) return false;
    if (bpmInput) {
      const {min,max}=tempoParts(s);
      const lo=min||max, hi=max||min;
      if(!lo || bpmInput < lo || bpmInput > hi) return false;
    }
    const seas = s.seasons||[];
    if (dropSitu && !seas.includes(dropSitu)) return false;
    if (dropSeas && !seas.includes(dropSeas)) return false;
    if (filt==='all') return true;
    if (filt==='used') return s.status==='used';
    if (filt==='ready') return s.status==='ready' || (s.status==='used' && s.has_score) || s.has_score;
    if (filt==='plan') return s.status==='plan';
    if (filt==='no_score') return !s.has_score;
    if (filt==='video') return !!s.music_url;
    if (filt==='top') return top10.includes(s.name);
    return seas.includes(filt);
  });

  const statusOrder = {used:0, ready:1, plan:2};
  list.sort((a,b)=>{
    let v = 0;
    if (sortBy==='name') v = a.name.localeCompare(b.name, 'ko');
    else if (sortBy==='status') v = (statusOrder[a.status]||0) - (statusOrder[b.status]||0);
    else if (sortBy==='count') v = (b.count||0) - (a.count||0);
    else if (sortBy==='key') v = (songKeys(a).join(' / ')||'zzz').localeCompare(songKeys(b).join(' / ')||'zzz');
    else if (sortBy==='bpm') v = (tempoParts(a).min||tempoParts(a).max||0) - (tempoParts(b).min||tempoParts(b).max||0);
    else if (sortBy==='created') v = new Date(b.created_at||0) - new Date(a.created_at||0);
    return sortBy==='count' ? v : v * sortDir;
  });

  document.getElementById('cnt').textContent = list.length+'곡 표시 중';
  const listEl = document.getElementById('list');
  if (!list.length) {
    const rawQ = document.getElementById('q').value.trim();
    listEl.innerHTML = `<div class="nr"><span>🎵</span>검색 결과가 없습니다
      ${rawQ ? `<div style="margin-top:12px"><button class="btn-save" style="padding:8px 20px;border-radius:8px;font-size:.82rem" onclick="openModal();document.getElementById('f-name').value='${rawQ.replace(/'/g,"\\'")}'">"${escHtml(rawQ)}" 곡 추가하기 +</button></div>` : ''}
    </div>`;
    return;
  }
  if(selectedSongId && !list.some(s=>s.id===selectedSongId)) selectedSongId = null;
  const selected = selectedSongId ? songs.find(s=>s.id===selectedSongId) : null;
  const shellPct = selected ? Math.max(detailPanelPct,20) : 5;
  if(selected) detailPanelPct = shellPct;
  listEl.innerHTML = `<div class="song-library-shell resizable-detail" style="--detail-height:${shellPct}%">
    <div class="song-list-table">
      <div class="song-list-head"><div>곡제목</div><div>코드</div><div>BPM</div><div>상황</div><div>악보·영상</div></div>
      <div class="song-list-body">
        ${list.map(s=>{
          const keys=songKeys(s); const tempo=tempoText(s); const isSel=s.id===selectedSongId;
          return `<div class="song-list-row ${isSel?'selected':''}" onclick="selectSong('${jsStr(s.id)}')">
            <div class="song-list-title">${escHtml(s.name)}</div>
            <div class="song-list-cell">${keys.length?keys.map(escHtml).join(' / '):'-'}</div>
            <div class="song-list-cell">${tempo?escHtml(tempo).replace(' BPM',''):'-'}</div>
            <div class="song-list-tags">${compactTags(s.seasons,2)}</div>
            <div class="song-state-icons"><span class="${s.has_score?'ok':''}">🎼${s.has_score?'O':'-'}</span><span class="${s.music_url?'vid':''}">▶${s.music_url?'O':'-'}</span></div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="song-detail-dock">
      <div class="detail-resize-handle" title="드래그해서 상세 영역 크기 조절 · 더블클릭으로 접기/펼치기" onpointerdown="startDetailResize(event)" ondblclick="toggleDetailPanelSize()"></div>
      <div class="song-detail-content">${selectedSongDetailHtml(selected)}</div>
    </div>
  </div>`;
}


// ── DESKTOP BOOKMARK VIEWER OVERRIDE ─────────────────────
let selectedViewerMode = localStorage.getItem('wdb-viewer-mode') || 'score';
function setViewerMode(mode){
  selectedViewerMode = mode === 'video' ? 'video' : 'score';
  localStorage.setItem('wdb-viewer-mode', selectedViewerMode);
  render();
}
function selectSong(id){
  selectedSongId = id;
  render();
}
function selectedSongInfoBar(song){
  if(!song){
    return `<div class="song-info-bar"><div><div class="song-info-title">곡을 선택하세요</div><div class="song-info-meta"><span class="info-chip">왼쪽 목록에서 곡을 고르면 정보와 작업 버튼이 여기에 표시됩니다.</span></div></div></div>`;
  }
  const keys=songKeys(song); const tempo=tempoText(song); const tags=song.seasons||[];
  const situ=tags.filter(t=>!LITURGY_TAGS.includes(t));
  const seas=tags.filter(t=>LITURGY_TAGS.includes(t));
  const statusLabel = song.has_score ? '악보완료' : (song.status==='plan' ? '작업예정' : '악보준비중');
  return `<div class="song-info-bar">
    <div>
      <div class="song-info-title">${escHtml(song.name)}</div>
      <div class="song-info-meta">
        <span class="info-chip">코드 ${keys.length?keys.map(escHtml).join(' / '):'미정'}</span>
        <span class="info-chip">BPM ${tempo?escHtml(tempo).replace(' BPM',''):'미정'}</span>
        <span class="info-chip ${song.has_score?'good':'warn'}">🎼 ${escHtml(statusLabel)}</span>
        <span class="info-chip ${song.music_url?'good':''}">▶ ${song.music_url?'영상있음':'영상없음'}</span>
        <span class="info-chip">상황 ${situ.length?situ.map(escHtml).join(' · '):'미지정'}</span>
        <span class="info-chip">절기 ${seas.length?seas.map(escHtml).join(' · '):'미지정'}</span>
      </div>
    </div>
    <div class="song-actions-compact">
      <button class="ab conti" onclick="addSongToCurrentSetlist('${jsStr(song.id)}')">➕ 콘티추가</button>
      <button class="ab primary-action" onclick="openModal('${jsStr(song.id)}')">✏️ 수정</button>
      ${song.has_score?`<button class="ab" onclick="openViewer('${jsStr(song.id)}','${jsStr(song.name)}')">🎼 전체보기</button>`:`<button class="ab" onclick="openModal('${jsStr(song.id)}')">⬆ 악보올리기</button>`}
      <button class="ab" onclick="changeStatus('${jsStr(song.id)}','plan')">작업예정</button>
      <button class="ab danger-mini" title="삭제" onclick="deleteSong('${jsStr(song.id)}')">🗑</button>
    </div>
  </div>`;
}
function rightViewerHtml(song){
  if(!song){
    return `<div class="viewer-card"><div class="viewer-tabs"><div class="viewer-tab-buttons"><button class="viewer-tab on">악보보기</button><button class="viewer-tab">영상보기</button></div><div class="viewer-title-small">선택된 곡 없음</div></div><div class="viewer-stage"><div class="viewer-empty-panel"><b>곡을 선택하세요</b>왼쪽 책갈피 목록에서 곡을 고르면<br>악보 또는 영상이 이곳에 표시됩니다.</div></div></div>`;
  }
  const title=escHtml(song.name);
  const tabs=`<div class="viewer-tabs"><div class="viewer-tab-buttons"><button class="viewer-tab ${selectedViewerMode==='score'?'on':''}" onclick="setViewerMode('score')">🎼 악보보기</button><button class="viewer-tab ${selectedViewerMode==='video'?'on':''}" onclick="setViewerMode('video')">▶ 영상보기</button></div><div class="viewer-title-small">${title}</div></div>`;
  let body='';
  if(selectedViewerMode==='video'){
    if(!song.music_url) body=`<div class="viewer-empty-panel"><b>영상 없음</b>이 곡에는 유튜브 링크가 아직 등록되지 않았습니다.</div>`;
    else {
      const id=extractYoutubeId(song.music_url);
      if(id) body=`<div class="right-video-frame"><iframe src="${youtubeEmbedUrl(id)}" title="${title} 영상보기" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
      else body=`<div class="viewer-empty-panel"><b>링크 확인 필요</b>유튜브 주소를 수정해주세요.</div>`;
    }
  } else {
    if(!song.has_score) body=`<div class="viewer-empty-panel"><b>악보 준비중</b>등록된 악보가 없습니다.<br><button class="ab" style="margin-top:10px" onclick="openModal('${jsStr(song.id)}')">⬆ 악보올리기</button></div>`;
    else body=`<div class="right-score-preview" id="right-score-preview" data-song="${escHtml(song.id)}"><div class="viewer-empty-panel"><b>악보 불러오는 중...</b>잠시만 기다려주세요.</div></div>`;
  }
  return `<div class="viewer-card">${tabs}<div class="viewer-stage">${body}</div></div>`;
}
async function loadRightScorePreview(song){
  if(!song || selectedViewerMode!=='score' || !song.has_score) return;
  const box=document.getElementById('right-score-preview');
  if(!box || box.dataset.song!==String(song.id)) return;
  try{
    const files=await listScores(song.id);
    if(!files || !files.length){box.innerHTML=`<div class="viewer-empty-panel"><b>악보 없음</b>업로드된 악보 파일을 찾지 못했습니다.</div>`;return;}
    box.innerHTML=files.slice(0,2).map(f=>`<img src="${scoreUrl(song.id+'/'+f.name)}" alt="${escHtml(song.name)} 악보" loading="lazy">`).join('') + (files.length>2?`<div class="viewer-empty-panel" style="width:100%"><button class="ab" onclick="openViewer('${jsStr(song.id)}','${jsStr(song.name)}')">전체 ${files.length}페이지 보기</button></div>`:'');
  }catch(e){box.innerHTML=`<div class="viewer-empty-panel"><b>악보 불러오기 실패</b>${escHtml(e.message||'')}</div>`;}
}
function render() {
  const q = document.getElementById('q').value.normalize('NFC').toLowerCase().trim();
  const bpmInput = parseInt(document.getElementById('tempo-filter')?.value || '', 10) || 0;
  const top10 = [...songs].filter(s=>s.count>0).sort((a,b)=>b.count-a.count).slice(0,10).map(s=>s.name);
  let list = songs.filter(s=>{
    const normQ = q.replace(/\s+/g,' ').trim();
    const normName = s.name.normalize('NFC').replace(/\s+/g,' ').trim().toLowerCase();
    const keyText = songKeys(s).join(' ').toLowerCase();
    const tagText = (s.seasons||[]).join(' ').toLowerCase();
    const mq = !q || normName.includes(normQ.toLowerCase()) || keyText.includes(normQ.toLowerCase()) || tagText.includes(normQ.toLowerCase());
    if (!mq) return false;
    if (bpmInput) { const {min,max}=tempoParts(s); const lo=min||max, hi=max||min; if(!lo || bpmInput < lo || bpmInput > hi) return false; }
    const seas = s.seasons||[];
    if (dropSitu && !seas.includes(dropSitu)) return false;
    if (dropSeas && !seas.includes(dropSeas)) return false;
    if (filt==='all') return true;
    if (filt==='used') return s.status==='used';
    if (filt==='ready') return s.status==='ready' || (s.status==='used' && s.has_score) || s.has_score;
    if (filt==='plan') return s.status==='plan';
    if (filt==='no_score') return !s.has_score;
    if (filt==='video') return !!s.music_url;
    if (filt==='top') return top10.includes(s.name);
    return seas.includes(filt);
  });
  const statusOrder = {used:0, ready:1, plan:2};
  list.sort((a,b)=>{
    let v=0;
    if(sortBy==='name') v=a.name.localeCompare(b.name,'ko');
    else if(sortBy==='status') v=(statusOrder[a.status]||0)-(statusOrder[b.status]||0);
    else if(sortBy==='count') v=(b.count||0)-(a.count||0);
    else if(sortBy==='key') v=(songKeys(a).join(' / ')||'zzz').localeCompare(songKeys(b).join(' / ')||'zzz');
    else if(sortBy==='bpm') v=(tempoParts(a).min||tempoParts(a).max||0)-(tempoParts(b).min||tempoParts(b).max||0);
    else if(sortBy==='created') v=new Date(b.created_at||0)-new Date(a.created_at||0);
    return sortBy==='count'?v:v*sortDir;
  });
  document.getElementById('cnt').textContent = list.length+'곡 표시 중';
  const listEl=document.getElementById('list');
  if(!list.length){
    const rawQ=document.getElementById('q').value.trim();
    listEl.innerHTML=`<div class="nr"><span>🎵</span>검색 결과가 없습니다${rawQ?`<div style="margin-top:12px"><button class="btn-save" style="padding:8px 20px;border-radius:8px;font-size:.82rem" onclick="openModal();document.getElementById('f-name').value='${rawQ.replace(/'/g,"\\'")}'">\"${escHtml(rawQ)}\" 곡 추가하기 +</button></div>`:''}</div>`;
    return;
  }
  if(selectedSongId && !list.some(s=>s.id===selectedSongId)) selectedSongId=null;
  const selected=selectedSongId?songs.find(s=>s.id===selectedSongId):null;
  listEl.innerHTML=`<div class="song-library-shell bookmark-layout">
    <div class="bookmark-list">
      <div class="bookmark-head"><div>곡이름</div><div>코드</div><div>BPM</div></div>
      <div class="bookmark-body">${list.map(s=>{const keys=songKeys(s);const tempo=tempoText(s).replace(' BPM','');const isSel=s.id===selectedSongId;return `<div class="bookmark-row ${isSel?'selected':''}" onclick="selectSong('${jsStr(s.id)}')"><div class="bookmark-title">${escHtml(s.name)}</div><div class="bookmark-cell">${keys.length?keys.map(escHtml).join('/'):'-'}</div><div class="bookmark-cell">${tempo||'-'}</div></div>`;}).join('')}</div>
    </div>
    <div class="viewer-workspace">
      ${rightViewerHtml(selected)}
      ${selectedSongInfoBar(selected)}
    </div>
  </div>`;
  if(selected && selectedViewerMode==='score') setTimeout(()=>loadRightScorePreview(selected),0);
}

init();
