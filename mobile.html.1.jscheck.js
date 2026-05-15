
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
