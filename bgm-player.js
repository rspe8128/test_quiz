/**
 * Floating BGM: Invidious instance list → search → YouTube embed (nocookie).
 * Paste YouTube URL if search backends are unavailable.
 */
(function () {
  const INST_CACHE_KEY = "bgm-invidious-bases-v1";
  const INST_TTL_MS = 30 * 60 * 1000;
  const FALLBACK_BASES = ["https://inv.thepixora.com"];
  const POS_KEY = "bgm-player-pos-v1";
  const PREFS_KEY = "bgm-prefs-v1";
  const SESSION_KEY = "bgm-session-v1";

  let basesPromise = null;
  let ytPlayer = null;
  let playlistQueue = [];
  let playlistIndex = 0;
  let youtubeApiCallbacks = [];

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return { repeatOne: true, autoNext: false };
      const o = JSON.parse(raw);
      return {
        repeatOne: o.repeatOne !== false,
        autoNext: Boolean(o.autoNext),
      };
    } catch (_) {
      return { repeatOne: true, autoNext: false };
    }
  }

  function savePrefs(repeatOne, autoNext) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ repeatOne, autoNext }));
    } catch (_) {
      /* ignore */
    }
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (!o || o.v !== 1 || !o.visible || !Array.isArray(o.queue) || !o.queue.length) return null;
      const queue = o.queue
        .filter((x) => x && typeof x.id === "string" && x.id.length === 11)
        .map((x) => ({ id: x.id, title: String(x.title || "") || "재생 중" }));
      if (!queue.length) return null;
      let index = Number(o.index);
      if (!Number.isFinite(index)) index = 0;
      index = Math.max(0, Math.min(index, queue.length - 1));
      let startSeconds = Number(o.startSeconds);
      if (!Number.isFinite(startSeconds) || startSeconds < 0) startSeconds = 0;
      return { queue, index, startSeconds };
    } catch (_) {
      return null;
    }
  }

  function writeSession(payload) {
    try {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          v: 1,
          visible: true,
          queue: payload.queue,
          index: payload.index,
          startSeconds: typeof payload.startSeconds === "number" ? payload.startSeconds : 0,
        })
      );
    } catch (_) {
      /* ignore */
    }
  }

  function clearSessionStorage() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (_) {
      /* ignore */
    }
  }

  function onYouTubeIframeAPIReadyBgm() {
    youtubeApiCallbacks.splice(0).forEach((fn) => {
      try {
        fn();
      } catch (_) {
        /* ignore */
      }
    });
  }

  function ensureYoutubeApi() {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve();
        return;
      }
      youtubeApiCallbacks.push(resolve);
      if (document.querySelector("script[data-bgm-yt-api]")) return;
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.dataset.bgmYtApi = "1";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
      const prior = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prior === "function") prior();
        onYouTubeIframeAPIReadyBgm();
      };
    });
  }

  async function fetchInstanceBases() {
    const raw = sessionStorage.getItem(INST_CACHE_KEY);
    if (raw) {
      try {
        const { t, bases } = JSON.parse(raw);
        if (Date.now() - t < INST_TTL_MS && Array.isArray(bases) && bases.length) return bases;
      } catch (_) {
        /* ignore */
      }
    }
    let bases = [];
    try {
      const res = await fetch("https://api.invidious.io/instances.json", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        bases = data
          .map((row) => row[1])
          .filter((m) => m && m.api && m.cors && m.uri)
          .map((m) => m.uri.replace(/\/$/, ""))
          .slice(0, 14);
      }
    } catch (_) {
      /* ignore */
    }
    if (!bases.length) bases = FALLBACK_BASES.slice();
    try {
      sessionStorage.setItem(INST_CACHE_KEY, JSON.stringify({ t: Date.now(), bases }));
    } catch (_) {
      /* ignore */
    }
    return bases;
  }

  function getBases() {
    if (!basesPromise) basesPromise = fetchInstanceBases();
    return basesPromise;
  }

  async function searchVideos(query) {
    const q = String(query || "").trim();
    if (!q) return [];
    const bases = await getBases();
    if (!bases.length) return [];
    const enc = encodeURIComponent(q);
    for (const base of bases) {
      try {
        const url = `${base}/api/v1/search?q=${enc}&type=video`;
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) continue;
        const j = await r.json();
        if (!Array.isArray(j)) continue;
        const videos = j
          .filter((it) => it && it.type === "video" && it.videoId && it.title)
          .slice(0, 22);
        if (videos.length) return videos;
      } catch (_) {
        /* try next */
      }
    }
    return [];
  }

  function parseYoutubeId(text) {
    const s = String(text || "").trim();
    const m = s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    return null;
  }

  function buildUi() {
    const root = document.createElement("div");
    root.id = "bgm-root";
    root.innerHTML = [
      '<button type="button" id="bgm-trigger" aria-haspopup="dialog" aria-controls="bgm-overlay">BGM · 유튜브</button>',
      '<div id="bgm-overlay" role="dialog" aria-modal="true" aria-labelledby="bgm-heading">',
      '  <div id="bgm-panel">',
      '    <div id="bgm-panel-header">',
      '      <h2 id="bgm-heading">BGM 검색 (YouTube)</h2>',
      '      <button type="button" id="bgm-close" aria-label="닫기">&times;</button>',
      "    </div>",
      '    <div id="bgm-search-row">',
      '      <input id="bgm-q" type="search" placeholder="예: lofi, piano, 힐링" autocomplete="off" />',
      '      <button type="button" id="bgm-search-btn">검색</button>',
      "    </div>",
      '    <div id="bgm-paste-row">',
      "      검색이 안 되면 유튜브 링크를 붙여넣을 수 있습니다.",
      '      <div id="bgm-paste-flex">',
      '        <input id="bgm-paste" type="url" placeholder="https://www.youtube.com/watch?v=..." />',
      '        <button type="button" id="bgm-paste-go">재생</button>',
      "      </div>",
      "    </div>",
      '    <div id="bgm-results"><div id="bgm-status">노래 제목을 검색해 보세요.</div></div>',
      "  </div>",
      "</div>",
      '<div id="bgm-player-wrap" aria-live="polite">',
      '  <div id="bgm-drag-handle" title="드래그하여 옮기기 · 더블클릭하면 기본 위치로">위치 이동 · ⋮⋮</div>',
      '  <div id="bgm-player-bar">',
      '    <p id="bgm-now-title"></p>',
      '    <div id="bgm-player-actions">',
      '      <button type="button" id="bgm-change">다른 곡</button>',
      '      <button type="button" id="bgm-stop">정지</button>',
      "    </div>",
      "  </div>",
      '  <div id="bgm-playback-opts" role="group" aria-label="재생 방식">',
      '    <label class="bgm-opt-label" title="끝나면 같은 영상을 처음부터 다시 재생합니다"><input type="checkbox" id="bgm-opt-repeat" /> 한 곡 반복</label>',
      '    <label class="bgm-opt-label" title="같은 검색 결과 목록에서 아래 순서로 자동 재생합니다"><input type="checkbox" id="bgm-opt-autonext" /> 다음 곡 자동재생</label>',
      "  </div>",
      '  <div id="bgm-iframe-box"><div id="bgm-frame" title="YouTube BGM"></div></div>',
      "</div>",
    ].join("");
    document.body.appendChild(root);
    return root;
  }

  function init() {
    if (document.getElementById("bgm-root")) return;
    buildUi();

    const overlay = document.getElementById("bgm-overlay");
    const trigger = document.getElementById("bgm-trigger");
    const closeBtn = document.getElementById("bgm-close");
    const q = document.getElementById("bgm-q");
    const searchBtn = document.getElementById("bgm-search-btn");
    const results = document.getElementById("bgm-results");
    const paste = document.getElementById("bgm-paste");
    const pasteGo = document.getElementById("bgm-paste-go");
    const playerWrap = document.getElementById("bgm-player-wrap");
    const iframeBox = document.getElementById("bgm-iframe-box");
    const nowTitle = document.getElementById("bgm-now-title");
    const cbRepeat = document.getElementById("bgm-opt-repeat");
    const cbAutoNext = document.getElementById("bgm-opt-autonext");
    const btnChange = document.getElementById("bgm-change");
    const btnStop = document.getElementById("bgm-stop");
    const dragHandle = document.getElementById("bgm-drag-handle");

    (function initPlaybackPrefs() {
      const p = loadPrefs();
      cbRepeat.checked = p.repeatOne;
      cbAutoNext.checked = p.autoNext;
      if (cbRepeat.checked && cbAutoNext.checked) cbAutoNext.checked = false;
      savePrefs(cbRepeat.checked, cbAutoNext.checked);
    })();
    cbRepeat.addEventListener("change", () => {
      if (cbRepeat.checked) cbAutoNext.checked = false;
      savePrefs(cbRepeat.checked, cbAutoNext.checked);
    });
    cbAutoNext.addEventListener("change", () => {
      if (cbAutoNext.checked) cbRepeat.checked = false;
      savePrefs(cbRepeat.checked, cbAutoNext.checked);
    });

    function readSavedPos() {
      try {
        const raw = localStorage.getItem(POS_KEY);
        if (!raw) return null;
        const o = JSON.parse(raw);
        if (typeof o.left !== "number" || typeof o.top !== "number") return null;
        return { left: o.left, top: o.top };
      } catch (_) {
        return null;
      }
    }

    function writeSavedPos(left, top) {
      try {
        localStorage.setItem(POS_KEY, JSON.stringify({ left, top }));
      } catch (_) {
        /* ignore */
      }
    }

    function clearSavedPos() {
      try {
        localStorage.removeItem(POS_KEY);
      } catch (_) {
        /* ignore */
      }
    }

    function applyCustomPos(left, top) {
      const rect = playerWrap.getBoundingClientRect();
      let w = rect.width;
      let h = rect.height;
      if (w < 8) w = Math.min(320, window.innerWidth - 28);
      if (h < 8) h = w * 0.5625 + 100;
      const pad = 8;
      const L = Math.min(Math.max(pad, left), window.innerWidth - w - pad);
      const T = Math.min(Math.max(pad, top), window.innerHeight - h - pad);
      playerWrap.style.left = `${L}px`;
      playerWrap.style.top = `${T}px`;
      playerWrap.style.right = "auto";
      playerWrap.style.bottom = "auto";
      playerWrap.classList.add("bgm-custom-pos");
      playerWrap.classList.remove("bgm-with-trigger");
      return { left: L, top: T };
    }

    function clearCustomPosStyles() {
      playerWrap.style.left = "";
      playerWrap.style.top = "";
      playerWrap.style.right = "";
      playerWrap.style.bottom = "";
      playerWrap.classList.remove("bgm-custom-pos");
    }

    function restorePlayerPositionFromStorage() {
      const p = readSavedPos();
      if (!p) return;
      playerWrap.classList.add("bgm-custom-pos");
      playerWrap.classList.remove("bgm-with-trigger");
      playerWrap.style.left = `${p.left}px`;
      playerWrap.style.top = `${p.top}px`;
      playerWrap.style.right = "auto";
      playerWrap.style.bottom = "auto";
    }

    function clampSavedPosition() {
      if (!playerWrap.classList.contains("bgm-custom-pos")) return;
      const p = readSavedPos();
      if (!p) return;
      if (playerWrap.classList.contains("bgm-visible")) {
        const r = playerWrap.getBoundingClientRect();
        const o = applyCustomPos(r.left, r.top);
        writeSavedPos(o.left, o.top);
        return;
      }
      const w = Math.min(320, window.innerWidth - 28);
      const approxH = w * 0.5625 + 100;
      const pad = 8;
      const L = Math.min(Math.max(pad, p.left), window.innerWidth - w - pad);
      const T = Math.min(Math.max(pad, p.top), window.innerHeight - approxH - pad);
      playerWrap.style.left = `${L}px`;
      playerWrap.style.top = `${T}px`;
      playerWrap.style.right = "auto";
      playerWrap.style.bottom = "auto";
      writeSavedPos(L, T);
    }

    let dragPtrId = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOriginLeft = 0;
    let dragOriginTop = 0;

    function onDragMove(ev) {
      if (dragPtrId === null || ev.pointerId !== dragPtrId) return;
      const dx = ev.clientX - dragStartX;
      const dy = ev.clientY - dragStartY;
      applyCustomPos(dragOriginLeft + dx, dragOriginTop + dy);
    }

    function onDragUp(ev) {
      if (dragPtrId === null || ev.pointerId !== dragPtrId) return;
      dragPtrId = null;
      playerWrap.classList.remove("bgm-dragging");
      document.removeEventListener("pointermove", onDragMove);
      document.removeEventListener("pointerup", onDragUp);
      document.removeEventListener("pointercancel", onDragUp);
      try {
        dragHandle.releasePointerCapture(ev.pointerId);
      } catch (_) {
        /* ignore */
      }
      const r = playerWrap.getBoundingClientRect();
      const o = applyCustomPos(r.left, r.top);
      writeSavedPos(o.left, o.top);
    }

    dragHandle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      if (!playerWrap.classList.contains("bgm-custom-pos")) {
        const r = playerWrap.getBoundingClientRect();
        playerWrap.classList.add("bgm-custom-pos");
        playerWrap.classList.remove("bgm-with-trigger");
        playerWrap.style.left = `${r.left}px`;
        playerWrap.style.top = `${r.top}px`;
        playerWrap.style.right = "auto";
        playerWrap.style.bottom = "auto";
      }
      const r = playerWrap.getBoundingClientRect();
      dragPtrId = e.pointerId;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragOriginLeft = r.left;
      dragOriginTop = r.top;
      playerWrap.classList.add("bgm-dragging");
      dragHandle.setPointerCapture(e.pointerId);
      document.addEventListener("pointermove", onDragMove);
      document.addEventListener("pointerup", onDragUp);
      document.addEventListener("pointercancel", onDragUp);
    });

    dragHandle.addEventListener("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearSavedPos();
      clearCustomPosStyles();
      if (playerWrap.classList.contains("bgm-visible")) playerWrap.classList.add("bgm-with-trigger");
    });

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => clampSavedPosition(), 120);
    });

    window.addEventListener("pagehide", () => {
      savePlaybackSession();
    });

    restorePlayerPositionFromStorage();

    function setStatus(html) {
      results.innerHTML = `<div id="bgm-status">${html}</div>`;
    }

    function openModal() {
      overlay.classList.add("bgm-open");
      document.body.style.overflow = "hidden";
      q.focus();
    }

    function closeModal() {
      overlay.classList.remove("bgm-open");
      document.body.style.overflow = "";
    }

    function ensureFrameHost() {
      if (!iframeBox) return;
      if (!document.getElementById("bgm-frame")) {
        iframeBox.innerHTML = '<div id="bgm-frame" title="YouTube BGM"></div>';
      }
    }

    function savePlaybackSession(forcedStartSeconds) {
      if (!playerWrap.classList.contains("bgm-visible") || !playlistQueue.length) {
        clearSessionStorage();
        return;
      }
      let t = 0;
      if (typeof forcedStartSeconds === "number" && Number.isFinite(forcedStartSeconds)) {
        t = Math.max(0, forcedStartSeconds);
      } else if (ytPlayer) {
        try {
          const g = ytPlayer.getCurrentTime();
          if (typeof g === "number" && g >= 0) t = g;
        } catch (_) {
          /* ignore */
        }
      }
      writeSession({
        queue: playlistQueue,
        index: playlistIndex,
        startSeconds: t,
      });
    }

    function onYtStateChange(e) {
      if (!ytPlayer || !window.YT || window.YT.PlayerState === undefined) return;
      if (e.data !== window.YT.PlayerState.ENDED) return;
      const repeat = cbRepeat.checked;
      const autoNext = cbAutoNext.checked;
      if (autoNext && playlistIndex < playlistQueue.length - 1) {
        playlistIndex += 1;
        const n = playlistQueue[playlistIndex];
        nowTitle.textContent = n.title || "재생 중";
        savePlaybackSession(0);
        ytPlayer.loadVideoById({ videoId: n.id, startSeconds: 0 });
        return;
      }
      if (repeat) {
        ytPlayer.seekTo(0, true);
        ytPlayer.playVideo();
        return;
      }
      try {
        ytPlayer.stopVideo();
      } catch (_) {
        /* ignore */
      }
    }

    function mountYtPlayer(videoId, startSeconds) {
      ensureFrameHost();
      if (!playerWrap.classList.contains("bgm-visible")) return;
      const start = typeof startSeconds === "number" && startSeconds > 0.25 ? startSeconds : 0;
      if (ytPlayer) {
        ytPlayer.loadVideoById({ videoId, startSeconds: start });
        try {
          ytPlayer.playVideo();
        } catch (_) {
          /* ignore */
        }
        return;
      }
      const playerVars = {
        autoplay: 1,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
      };
      if (start > 0.25) playerVars.start = Math.floor(start);
      ytPlayer = new window.YT.Player("bgm-frame", {
        videoId,
        width: "100%",
        height: "100%",
        playerVars,
        events: {
          onReady(ev) {
            try {
              if (start > 0.25) ev.target.seekTo(start, true);
              ev.target.playVideo();
            } catch (_) {
              /* ignore */
            }
          },
          onStateChange: onYtStateChange,
        },
      });
    }

    function showPlayer(videoId, title, queueMeta) {
      if (queueMeta && Array.isArray(queueMeta.queue) && queueMeta.queue.length) {
        playlistQueue = queueMeta.queue.map((x) => ({ id: x.id, title: x.title }));
        const idx = Number(queueMeta.index);
        playlistIndex = Math.max(0, Math.min(Number.isFinite(idx) ? idx : 0, playlistQueue.length - 1));
      } else {
        playlistQueue = [{ id: videoId, title: title || "재생 중" }];
        playlistIndex = 0;
      }
      const cur = playlistQueue[playlistIndex] || { id: videoId, title: title || "재생 중" };
      nowTitle.textContent = cur.title || title || "재생 중";
      playerWrap.classList.add("bgm-visible");
      if (playerWrap.classList.contains("bgm-custom-pos")) {
        const p = readSavedPos();
        if (p) {
          requestAnimationFrame(() => {
            const o = applyCustomPos(p.left, p.top);
            writeSavedPos(o.left, o.top);
          });
        }
      } else {
        playerWrap.classList.add("bgm-with-trigger");
      }
      savePlaybackSession(0);
      closeModal();
      ensureYoutubeApi().then(() => {
        if (!playerWrap.classList.contains("bgm-visible")) return;
        mountYtPlayer(cur.id, 0);
      });
    }

    function stopPlayer() {
      if (ytPlayer) {
        try {
          ytPlayer.destroy();
        } catch (_) {
          /* ignore */
        }
        ytPlayer = null;
      }
      if (iframeBox) iframeBox.innerHTML = '<div id="bgm-frame" title="YouTube BGM"></div>';
      nowTitle.textContent = "";
      playlistQueue = [];
      playlistIndex = 0;
      clearSessionStorage();
      playerWrap.classList.remove("bgm-visible", "bgm-with-trigger");
    }

    async function runSearch() {
      const query = q.value.trim();
      if (!query) {
        setStatus("검색어를 입력해 주세요.");
        return;
      }
      searchBtn.disabled = true;
      setStatus("검색 중… (공개 검색 게이트웨이 사용)");
      try {
        const videos = await searchVideos(query);
        if (!videos.length) {
          setStatus(
            "결과가 없거나 검색 서버에 연결할 수 없습니다. 아래에 유튜브 링크를 붙여넣어 재생해 보세요."
          );
          searchBtn.disabled = false;
          return;
        }
        results.innerHTML = "";
        const queue = videos.map((x) => ({ id: x.videoId, title: x.title }));
        videos.forEach((v, i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "bgm-item";
          const th = document.createElement("img");
          th.className = "bgm-thumb";
          th.alt = "";
          th.loading = "lazy";
          th.src = `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`;
          const meta = document.createElement("div");
          meta.className = "bgm-meta";
          const tEl = document.createElement("div");
          tEl.className = "bgm-title";
          tEl.textContent = v.title;
          const aEl = document.createElement("div");
          aEl.className = "bgm-author";
          aEl.textContent = v.author || "YouTube";
          meta.append(tEl, aEl);
          b.append(th, meta);
          b.addEventListener("click", () => showPlayer(v.videoId, v.title, { queue, index: i }));
          results.appendChild(b);
        });
      } catch (e) {
        setStatus(String(e.message || e));
      }
      searchBtn.disabled = false;
    }

    function tryPaste() {
      const id = parseYoutubeId(paste.value);
      if (!id) {
        setStatus("인식할 수 있는 유튜브 주소가 아닙니다. watch?v= 또는 youtu.be/ 형식을 확인해 주세요.");
        return;
      }
      showPlayer(id, paste.value.trim());
    }

    trigger.addEventListener("click", openModal);
    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("bgm-open")) closeModal();
    });
    searchBtn.addEventListener("click", runSearch);
    q.addEventListener("keydown", (e) => {
      if (e.key === "Enter") runSearch();
    });
    paste.addEventListener("keydown", (e) => {
      if (e.key === "Enter") tryPaste();
    });
    pasteGo.addEventListener("click", tryPaste);
    btnChange.addEventListener("click", openModal);
    btnStop.addEventListener("click", stopPlayer);

    (function restoreSessionFromNavigation() {
      const s = loadSession();
      if (!s) return;
      playlistQueue = s.queue;
      playlistIndex = s.index;
      const cur = playlistQueue[playlistIndex];
      if (!cur || !cur.id) {
        clearSessionStorage();
        return;
      }
      nowTitle.textContent = cur.title || "재생 중";
      playerWrap.classList.add("bgm-visible");
      if (playerWrap.classList.contains("bgm-custom-pos")) {
        const p = readSavedPos();
        if (p) {
          requestAnimationFrame(() => {
            const o = applyCustomPos(p.left, p.top);
            writeSavedPos(o.left, o.top);
          });
        }
      } else {
        playerWrap.classList.add("bgm-with-trigger");
      }
      const resumeAt = s.startSeconds > 0.5 ? s.startSeconds : 0;
      ensureYoutubeApi().then(() => {
        if (!playerWrap.classList.contains("bgm-visible")) return;
        mountYtPlayer(cur.id, resumeAt);
      });
    })();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
