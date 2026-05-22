/* Worship DB Next UI choir hotfix
   적용 위치: /next-ui/index.html 에서 app.js 다음에 로드
   목표:
   - 성가대 세트/콘티 흐름 대신 [악보 보기] 중심
   - 악보 보기 화면은 좌우 스와이프/이전장/다음장만 사용
   - 악보 순서 편집은 PC/태블릿 전용
   - 순서 편집은 위/아래/복사/삭제/원래순서 지원
   - 실제 파일 복사 없음, localStorage 표시 순서만 저장
*/
(function choirHotfix(){
  const LS_CHOIR_ORDER = 'nextUiChoirOrderV1';
  const orderState = {
    touchX: 0,
    viewerPage: 0,
    orders: readJson(LS_CHOIR_ORDER, {}) || {}
  };

  const isMobileEditorLocked = () => window.matchMedia('(max-width: 760px)').matches;

  function saveChoirOrders(){
    localStorage.setItem(LS_CHOIR_ORDER, JSON.stringify(orderState.orders));
  }

  function selectedChoir(){
    return state.selectedChoir || null;
  }

  function selectedPart(){
    return partOrder.includes(state.choirPart) ? state.choirPart : 'full';
  }

  function choirOrderKey(song, part = selectedPart()){
    return `${song?.id || song?.title || 'unknown'}::${part}`;
  }

  function choirPageKey(file, index){
    return String(file?.id || file?.path || file?.storage_path || file?.file || file?.name || file?.url || `page-${index}`);
  }

  function basePageKeys(song, part = selectedPart()){
    return choirPages(song, part).map((file, index) => choirPageKey(file, index));
  }

  function pageLookup(song, part = selectedPart()){
    const map = new Map();
    choirPages(song, part).forEach((file, index) => {
      map.set(choirPageKey(file, index), file);
    });
    return map;
  }

  function getOrder(song, part = selectedPart()){
    const sourceKeys = basePageKeys(song, part);
    const saved = Array.isArray(orderState.orders[choirOrderKey(song, part)])
      ? orderState.orders[choirOrderKey(song, part)]
      : [];

    if(!saved.length) return sourceKeys;

    const valid = new Set(sourceKeys);
    const merged = saved.filter(key => valid.has(key));

    sourceKeys.forEach(key => {
      if(!merged.includes(key)) merged.push(key);
    });

    return merged.length ? merged : sourceKeys;
  }

  function setOrder(song, part, order){
    orderState.orders[choirOrderKey(song, part)] = order;
    saveChoirOrders();
  }

  function displayChoirPages(song, part = selectedPart()){
    const lookup = pageLookup(song, part);
    return getOrder(song, part)
      .map((key, displayIndex) => {
        const file = lookup.get(key);
        return file ? {...file, __pageKey:key, __displayIndex:displayIndex} : null;
      })
      .filter(Boolean);
  }

  function clampPage(index, max){
    return Math.max(0, Math.min(index, Math.max(0, max - 1)));
  }

  function patchStaticLabels(){
    const openBtn = $('#addChoirSetBtn');
    if(openBtn && !openBtn.dataset.choirHotfixed){
      const cloned = openBtn.cloneNode(true);
      cloned.textContent = '악보 보기';
      cloned.dataset.choirHotfixed = '1';
      cloned.addEventListener('click', () => openChoirViewer(0));
      openBtn.replaceWith(cloned);
    }

    const resetBtn = $('#clearChoirSetBtn');
    if(resetBtn && !resetBtn.dataset.choirHotfixed){
      const cloned = resetBtn.cloneNode(true);
      cloned.textContent = '원래순서';
      cloned.title = '선택한 성부의 악보 표시 순서를 원래대로 되돌립니다.';
      cloned.dataset.choirHotfixed = '1';
      cloned.addEventListener('click', resetChoirOrder);
      resetBtn.replaceWith(cloned);
    }

    const side = document.querySelector('.choir-set-panel');
    if(side){
      side.classList.add('desktop-only', 'choir-order-panel');
      const eyebrow = side.querySelector('.eyebrow');
      const title = side.querySelector('h2');
      if(eyebrow) eyebrow.textContent = 'PC · 태블릿 전용';
      if(title) title.textContent = '악보 순서 편집';
    }
  }

  function scorePreviewHtml(song, pages, part){
    if(!pages.length) return '<div class="empty">이 성부 악보가 없습니다.</div>';
    const first = pages[0];
    return `
      <button type="button" class="choir-score-preview" onclick="openChoirViewer(0)" aria-label="악보 보기 열기">
        <img src="${esc(first.url || '')}" alt="${esc(song.title)} ${partLabels[part]} 악보 미리보기" loading="lazy" onerror="brokenImage(this)">
        <span class="choir-preview-badge">1 / ${pages.length}</span>
        <span class="choir-preview-hint">악보 보기</span>
      </button>
    `;
  }

  function renderPatchedChoirDetail(){
    patchStaticLabels();

    const song = selectedChoir();
    if(!song){
      $('#choirDetail').innerHTML = '<div class="empty">성가곡을 선택하세요.</div>';
      renderPatchedChoirOrderPanel();
      return;
    }

    const part = selectedPart();
    const pages = displayChoirPages(song, part);
    const embed = youtubeEmbed(choirVideo(song, part));

    $('#choirDetail').innerHTML = `
      <div class="eyebrow">성가대모드</div>
      <div class="panel-head compact choir-detail-head">
        <div>
          <h2>${esc(song.title || '제목 없음')}</h2>
          <p class="muted">${esc(song.schedule?.date || '날짜 미정')} · ${esc(song.memo || '등록된 메모 없음')}</p>
        </div>
        <div class="action-row choir-main-actions">
          <button class="primary" type="button" onclick="openChoirViewer(0)">악보 보기</button>
          <button class="ghost desktop-only" type="button" onclick="focusChoirOrderEditor()">순서 편집</button>
        </div>
      </div>

      <div class="part-tabs">
        ${partOrder.map(item => `<button type="button" class="${item === part ? 'active' : ''}" onclick="setChoirPart('${item}')">${partLabels[item]}</button>`).join('')}
      </div>

      <div class="choir-media choir-media-single-preview">
        <div class="choir-score choir-score-single">
          ${scorePreviewHtml(song, pages, part)}
        </div>
        <div class="choir-side">
          <div class="panel flat">
            <h3>연습 영상</h3>
            ${embed ? `<iframe class="video-frame" src="${esc(embed)}" allowfullscreen></iframe>` : '<p class="muted">이 성부 영상이 없습니다.</p>'}
          </div>
          <div class="part-summary">
            ${partOrder.map(item => {
              const displayCount = displayChoirPages(song, item).length;
              const sourceCount = choirPages(song, item).length;
              const extra = displayCount !== sourceCount ? ` · 표시 ${displayCount}` : '';
              return `<div class="part-row"><b>${partLabels[item]}</b><span class="muted">원본 ${sourceCount}${extra} · 영상 ${choirVideo(song,item) ? '있음' : '없음'}</span></div>`;
            }).join('')}
          </div>
          <p class="muted choir-mobile-note">모바일은 악보 보기 전용입니다. 순서 편집은 태블릿이나 PC에서만 보입니다.</p>
        </div>
      </div>
    `;

    renderPatchedChoirOrderPanel();
  }

  function renderPatchedChoirOrderPanel(){
    patchStaticLabels();

    const panel = $('#choirSetList');
    if(!panel) return;

    const song = selectedChoir();
    if(!song){
      panel.innerHTML = '<div class="empty">성가곡을 선택하세요.</div>';
      return;
    }

    if(isMobileEditorLocked()){
      panel.innerHTML = '<div class="empty">모바일에서는 순서 편집을 숨깁니다.<br>태블릿이나 PC에서 수정하세요.</div>';
      return;
    }

    const part = selectedPart();
    const pages = displayChoirPages(song, part);

    panel.innerHTML = `
      <div class="choir-order-help">
        <b>${esc(partLabels[part])}</b>
        <span>파일은 복사하지 않고 보기 순서만 저장합니다.</span>
      </div>
      ${pages.map((file, index) => `
        <div class="set-row choir-order-row">
          <div class="num">${index + 1}</div>
          <button type="button" class="choir-order-thumb" onclick="openChoirViewer(${index})" aria-label="${index + 1}번째 악보 보기">
            <img src="${esc(file.url || '')}" alt="${esc(song.title)} ${index + 1}페이지" loading="lazy" onerror="brokenImage(this)">
          </button>
          <div class="mini-actions choir-order-actions">
            <button type="button" onclick="moveChoirOrderPage(${index}, -1)" ${index === 0 ? 'disabled' : ''}>위</button>
            <button type="button" onclick="moveChoirOrderPage(${index}, 1)" ${index === pages.length - 1 ? 'disabled' : ''}>아래</button>
            <button type="button" onclick="copyChoirOrderPage(${index})">복사</button>
            <button type="button" class="danger" onclick="deleteChoirOrderPage(${index})" ${pages.length <= 1 ? 'disabled' : ''}>삭제</button>
          </div>
        </div>
      `).join('') || '<div class="empty">이 성부 악보가 없습니다.</div>'}
    `;
  }

  function mutateChoirOrder(mutator){
    const song = selectedChoir();
    if(!song || isMobileEditorLocked()) return;
    const part = selectedPart();
    const order = [...getOrder(song, part)];
    mutator(order);
    setOrder(song, part, order);
    renderPatchedChoirDetail();
  }

  function moveChoirOrderPage(index, dir){
    mutateChoirOrder(order => {
      const next = index + dir;
      if(next < 0 || next >= order.length) return;
      [order[index], order[next]] = [order[next], order[index]];
    });
  }

  function copyChoirOrderPage(index){
    mutateChoirOrder(order => {
      if(index < 0 || index >= order.length) return;
      order.splice(index + 1, 0, order[index]);
    });
  }

  function deleteChoirOrderPage(index){
    mutateChoirOrder(order => {
      if(order.length <= 1) return;
      order.splice(index, 1);
    });
  }

  function resetChoirOrder(){
    const song = selectedChoir();
    if(!song || isMobileEditorLocked()) return;
    const key = choirOrderKey(song, selectedPart());
    delete orderState.orders[key];
    saveChoirOrders();
    renderPatchedChoirDetail();
    toast('원래 순서로 되돌렸어요');
  }

  function focusChoirOrderEditor(){
    const panel = document.querySelector('.choir-order-panel');
    if(panel){
      panel.scrollIntoView({behavior:'smooth', block:'start'});
      panel.classList.add('pulse-once');
      setTimeout(() => panel.classList.remove('pulse-once'), 650);
    }
  }

  function ensureChoirViewer(){
    if($('#choirViewerOverlay')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="choirViewerOverlay" class="choir-viewer-overlay" aria-hidden="true">
        <div class="choir-viewer-top">
          <button type="button" class="ghost" onclick="closeChoirViewer()">×</button>
          <div>
            <b id="choirViewerTitle">악보 보기</b>
            <span id="choirViewerMeta" class="muted"></span>
          </div>
          <div class="choir-viewer-count" id="choirViewerCount">1 / 1</div>
        </div>
        <div id="choirViewerStage" class="choir-viewer-stage"></div>
        <div class="choir-viewer-bottom">
          <button type="button" class="ghost" onclick="stepChoirViewer(-1)">이전장</button>
          <span class="muted">좌우 스와이프로 장 이동</span>
          <button type="button" class="ghost" onclick="stepChoirViewer(1)">다음장</button>
        </div>
      </div>
    `);

    const overlay = $('#choirViewerOverlay');
    overlay.addEventListener('touchstart', event => {
      orderState.touchX = event.touches[0].clientX;
    }, {passive:true});

    overlay.addEventListener('touchend', event => {
      const dx = (event.changedTouches[0].clientX || 0) - (orderState.touchX || 0);
      if(Math.abs(dx) > 50) stepChoirViewer(dx < 0 ? 1 : -1);
    }, {passive:true});

    window.addEventListener('keydown', event => {
      if(!overlay.classList.contains('show')) return;
      if(event.key === 'Escape') closeChoirViewer();
      if(event.key === 'ArrowRight') stepChoirViewer(1);
      if(event.key === 'ArrowLeft') stepChoirViewer(-1);
    });
  }

  function openChoirViewer(startPage = 0){
    ensureChoirViewer();
    const pages = displayChoirPages(selectedChoir(), selectedPart());
    if(!pages.length){
      toast('이 성부 악보가 없습니다');
      return;
    }
    orderState.viewerPage = clampPage(startPage, pages.length);
    renderChoirViewer();
    $('#choirViewerOverlay').classList.add('show');
    $('#choirViewerOverlay').setAttribute('aria-hidden', 'false');
    document.body.classList.add('choir-viewing');
  }

  function closeChoirViewer(){
    const overlay = $('#choirViewerOverlay');
    if(!overlay) return;
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('choir-viewing');
  }

  function stepChoirViewer(dir){
    const pages = displayChoirPages(selectedChoir(), selectedPart());
    if(!pages.length) return;
    orderState.viewerPage = clampPage(orderState.viewerPage + dir, pages.length);
    renderChoirViewer();
  }

  function renderChoirViewer(){
    ensureChoirViewer();
    const song = selectedChoir();
    const part = selectedPart();
    const pages = displayChoirPages(song, part);
    const page = pages[orderState.viewerPage];

    $('#choirViewerTitle').textContent = song?.title || '악보 보기';
    $('#choirViewerMeta').textContent = `${partLabels[part]} · ${song?.schedule?.date || '날짜 미정'}`;
    $('#choirViewerCount').textContent = `${pages.length ? orderState.viewerPage + 1 : 0} / ${pages.length}`;
    $('#choirViewerStage').innerHTML = page
      ? `<img src="${esc(page.url || '')}" alt="${esc(song?.title || '성가대')} ${orderState.viewerPage + 1}페이지" onerror="brokenImage(this)">`
      : '<div class="empty">악보가 없습니다.</div>';
  }

  const originalSelectChoir = window.selectChoir;

  window.selectChoir = function patchedSelectChoir(id){
    if(typeof originalSelectChoir === 'function') originalSelectChoir(id);
    orderState.viewerPage = 0;
    renderPatchedChoirDetail();
  };

  window.setChoirPart = function patchedSetChoirPart(part){
    if(partOrder.includes(part)) state.choirPart = part;
    orderState.viewerPage = 0;
    renderPatchedChoirDetail();
  };

  window.openChoirViewer = openChoirViewer;
  window.closeChoirViewer = closeChoirViewer;
  window.stepChoirViewer = stepChoirViewer;
  window.focusChoirOrderEditor = focusChoirOrderEditor;
  window.moveChoirOrderPage = moveChoirOrderPage;
  window.copyChoirOrderPage = copyChoirOrderPage;
  window.deleteChoirOrderPage = deleteChoirOrderPage;
  window.resetChoirOrder = resetChoirOrder;

  renderChoirDetail = renderPatchedChoirDetail;
  renderChoirSet = renderPatchedChoirOrderPanel;

  patchStaticLabels();
  renderPatchedChoirDetail();
  window.addEventListener('resize', renderPatchedChoirOrderPanel);
})();
