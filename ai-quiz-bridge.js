/**
 * AI 퀴즈 생성 — Render API 호출, 계정별 서버 저장
 */
(function (global) {
  if (!global.AIQuizConfig) return;

  var CFG = global.AIQuizConfig;
  var cache = {};
  var saveTimers = {};

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function nextId(appId) {
    return "ai-" + appId + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
  }

  function defaultProg() {
    return { mastered: {}, wrongCnt: {}, best: 0 };
  }

  function apiFetch(path, options) {
    if (global.SiteAuth && global.SiteAuth.api) {
      return global.SiteAuth.api(path, options);
    }
    var base = CFG.getApiBase();
    return fetch(base + path, options).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error((data && data.error) || "요청 실패");
        return data;
      });
    });
  }

  function normalizeItems(rawItems, appId) {
    if (!Array.isArray(rawItems)) return [];
    var out = [];
    rawItems.forEach(function (item) {
      if (!item || typeof item !== "object") return;
      var opts = Array.isArray(item.opts) ? item.opts.map(String).filter(Boolean) : [];
      if (opts.length < 2) return;
      var a = item.a != null ? String(item.a).trim() : "";
      if (!a) return;
      if (opts.indexOf(a) === -1) {
        var loose = opts.find(function (o) {
          return o.trim() === a || o.indexOf(a) !== -1 || a.indexOf(o) !== -1;
        });
        if (loose) a = loose;
        else return;
      }
      out.push({
        id: item.id || nextId(appId),
        cat: String(item.cat || "AI 생성").trim() || "AI 생성",
        q: String(item.q || "").trim(),
        opts: opts.slice(0, 5),
        a: a,
        ex: String(item.ex || "").trim(),
        ai: true
      });
    });
    return out.filter(function (q) { return q.q; });
  }

  function ensureCache(appId) {
    if (!cache[appId]) {
      cache[appId] = { items: [], prog: defaultProg(), loaded: false };
    }
    return cache[appId];
  }

  async function ensureData(appId) {
    var c = ensureCache(appId);
    if (c.loaded) return c;
    if (!global.SiteAuth || !global.SiteAuth.isReady || !global.SiteAuth.isReady()) {
      c.loaded = true;
      return c;
    }
    try {
      var data = await apiFetch("/ai-quiz/data?appId=" + encodeURIComponent(appId));
      c.items = normalizeItems(data.items || [], appId);
      c.prog = data.prog && typeof data.prog === "object" ? data.prog : defaultProg();
    } catch (e) {
      /* 오프라인/미로그인 시 빈 상태 */
    }
    c.loaded = true;
    return c;
  }

  function scheduleSave(appId) {
    if (saveTimers[appId]) clearTimeout(saveTimers[appId]);
    saveTimers[appId] = setTimeout(function () {
      flushSave(appId);
    }, 400);
  }

  async function flushSave(appId) {
    var c = cache[appId];
    if (!c || !global.SiteAuth || !global.SiteAuth.isReady || !global.SiteAuth.isReady()) return;
    try {
      await apiFetch("/ai-quiz/data", {
        method: "POST",
        body: JSON.stringify({ appId: appId, items: c.items, prog: c.prog })
      });
    } catch (e) {
      console.warn("AI 퀴즈 저장 실패:", e);
    }
  }

  function loadSaved(appId) {
    return ensureCache(appId).items;
  }

  function saveSaved(appId, items) {
    var c = ensureCache(appId);
    c.items = items;
    scheduleSave(appId);
  }

  function loadProg(appId) {
    var c = ensureCache(appId);
    return c.prog || defaultProg();
  }

  function saveProg(appId, prog) {
    var c = ensureCache(appId);
    c.prog = prog;
    scheduleSave(appId);
  }

  async function callProxy(presetKey, topic, count) {
    var base = CFG.getApiBase();
    if (!base) {
      throw new Error("API 서버 주소가 아직 설정되지 않았습니다. (ai-quiz-config.js)");
    }
    var headers = { "Content-Type": "application/json" };
    if (global.SiteAuth && global.SiteAuth.authHeaders) {
      headers = global.SiteAuth.authHeaders();
    }
    var res = await fetch(base + "/generate", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ preset: presetKey, topic: topic, count: count })
    });
    var data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error("서버 응답을 읽을 수 없습니다.");
    }
    if (!res.ok) {
      throw new Error((data && (data.error || data.message)) || "요청 실패 (" + res.status + ")");
    }
    return data.items || [];
  }

  function canGenerate() {
    if (!global.SiteAuth || !global.SiteAuth.isReady || !global.SiteAuth.isReady()) return true;
    var user = global.SiteAuth.getUser();
    return !!(user && (user.role === "admin" || user.role === "vip" || user.status === "approved"));
  }

  function renderPanel(el, opts) {
    var presetKey = opts.preset || "generic";
    var preset = CFG.PRESETS[presetKey] || CFG.PRESETS.generic;
    var saved = loadSaved(opts.appId);
    var apiOk = !!CFG.getApiBase();
    var approved = canGenerate();

    el.className = "ai-quiz-panel";
    el.innerHTML =
      '<div class="ai-quiz-panel__head">' +
      '<span class="ai-quiz-panel__title">AI 문제 생성</span>' +
      "</div>" +
      (!approved
        ? '<p class="ai-quiz-panel__warn">관리자 승인 후 AI 문제를 생성할 수 있습니다.</p>'
        : apiOk
          ? ""
          : '<p class="ai-quiz-panel__warn">API 서버 주소가 설정되지 않았습니다.</p>') +
      '<label class="ai-quiz-field"><span>주제</span>' +
      '<input type="text" class="ai-quiz-topic" placeholder="' + esc(preset.topicPlaceholder) + '"></label>' +
      '<label class="ai-quiz-field"><span>문항 수</span>' +
      '<input type="number" class="ai-quiz-count" min="1" max="15" value="' + (preset.countDefault || 5) + '"></label>' +
      '<button type="button" class="ai-quiz-btn ai-quiz-btn--main ai-quiz-generate"' +
      (apiOk && approved ? "" : " disabled") +
      ">생성 후 「생성 AI 문제」 탭에 추가</button>" +
      '<p class="ai-quiz-panel__status" aria-live="polite"></p>' +
      (saved.length
        ? '<p class="ai-quiz-panel__saved">저장된 AI 문제 ' + saved.length + "개 (계정에 저장됨) · " +
          '<button type="button" class="ai-quiz-link ai-quiz-clear">전체 삭제</button></p>'
        : '<p class="ai-quiz-panel__saved">생성한 문제는 계정에 저장되어 새로고침 후에도 유지됩니다.</p>');

    var clearBtn = el.querySelector(".ai-quiz-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (!confirm("저장된 AI 문제를 모두 삭제할까요?")) return;
        saveSaved(opts.appId, []);
        saveProg(opts.appId, defaultProg());
        flushSave(opts.appId);
        if (typeof opts.onClear === "function") opts.onClear();
        renderPanel(el, opts);
      });
    }

    el.querySelector(".ai-quiz-generate").addEventListener("click", async function () {
      var btn = el.querySelector(".ai-quiz-generate");
      var status = el.querySelector(".ai-quiz-panel__status");
      var topic = el.querySelector(".ai-quiz-topic").value.trim();
      var count = Math.min(15, Math.max(1, parseInt(el.querySelector(".ai-quiz-count").value, 10) || 5));
      if (!topic) {
        status.textContent = "주제를 입력하세요.";
        return;
      }
      btn.disabled = true;
      status.textContent = "생성 중… (10~30초, 첫 요청은 더 걸릴 수 있음)";
      try {
        var raw = await callProxy(presetKey, topic, count);
        var items = normalizeItems(raw, opts.appId);
        if (!items.length) throw new Error("유효한 문제를 만들지 못했습니다. 다시 시도하세요.");
        saveSaved(opts.appId, loadSaved(opts.appId).concat(items));
        await flushSave(opts.appId);
        if (typeof opts.onInject === "function") opts.onInject(items);
        status.textContent = items.length + "문항이 추가되었습니다. 「생성 AI 문제」 탭에서 풀 수 있습니다.";
        renderPanel(el, opts);
      } catch (err) {
        status.textContent = err.message || String(err);
      } finally {
        btn.disabled = false;
      }
    });
  }

  function attachPanel(opts) {
    var mount = typeof opts.mount === "string" ? document.querySelector(opts.mount) : opts.mount;
    if (!mount) return null;
    var existing = mount.querySelector(".ai-quiz-panel");
    if (existing) {
      if (!existing.querySelector(".ai-quiz-topic")) renderPanel(existing, opts);
      return existing;
    }
    var el = document.createElement("div");
    mount.appendChild(el);
    renderPanel(el, opts);
    return el;
  }

  global.AIQuiz = {
    PRESETS: CFG.PRESETS,
    getApiBase: CFG.getApiBase,
    ensureData: ensureData,
    loadSaved: loadSaved,
    saveSaved: saveSaved,
    loadProg: loadProg,
    saveProg: saveProg,
    flushSave: flushSave,
    normalizeItems: normalizeItems,
    refreshPanel: function (appId, preset) {
      var mount = document.getElementById("aiQuizGen-" + appId);
      if (!mount) return;
      var panel = mount.querySelector(".ai-quiz-panel");
      var opts = { appId: appId, preset: preset || "generic" };
      if (panel) renderPanel(panel, opts);
      else attachPanel(Object.assign({ mount: mount }, opts));
    },
    generate: async function (presetKey, topic, count, appId) {
      return normalizeItems(await callProxy(presetKey, topic, count), appId || "generic");
    },
    attachPanel: attachPanel
  };
})(typeof window !== "undefined" ? window : globalThis);
