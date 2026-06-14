/**
 * AI 퀴즈 생성 — Render API 호출, 검증, 과목 앱 주입
 */
(function (global) {
  if (!global.AIQuizConfig) return;

  var CFG = global.AIQuizConfig;
  var LS_SAVED_PREFIX = "ai-quiz-saved-";

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function nextId(appId) {
    return "ai-" + appId + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
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

  function loadSaved(appId) {
    try {
      var raw = localStorage.getItem(LS_SAVED_PREFIX + appId);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveSaved(appId, items) {
    try {
      localStorage.setItem(LS_SAVED_PREFIX + appId, JSON.stringify(items));
    } catch (e) {}
  }

  async function callProxy(presetKey, topic, count) {
    var base = CFG.getApiBase();
    if (!base) {
      throw new Error("API 서버 주소가 아직 설정되지 않았습니다. (ai-quiz-config.js)");
    }
    var res = await fetch(base + "/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  function renderPanel(el, opts) {
    var presetKey = opts.preset || "generic";
    var preset = CFG.PRESETS[presetKey] || CFG.PRESETS.generic;
    var saved = loadSaved(opts.appId);
    var apiOk = !!CFG.getApiBase();

    el.className = "ai-quiz-panel";
    el.innerHTML =
      '<div class="ai-quiz-panel__head">' +
      '<span class="ai-quiz-panel__title">AI 문제 생성</span>' +
      "</div>" +
      (apiOk
        ? ""
        : '<p class="ai-quiz-panel__warn">API 서버 배포 후 ai-quiz-config.js에 주소를 넣어 주세요.</p>') +
      '<label class="ai-quiz-field"><span>주제</span>' +
      '<input type="text" class="ai-quiz-topic" placeholder="' + esc(preset.topicPlaceholder) + '"></label>' +
      '<label class="ai-quiz-field"><span>문항 수</span>' +
      '<input type="number" class="ai-quiz-count" min="1" max="15" value="' + (preset.countDefault || 5) + '"></label>' +
      '<button type="button" class="ai-quiz-btn ai-quiz-btn--main ai-quiz-generate"' +
      (apiOk ? "" : " disabled") +
      ">생성 후 AI 탭에 추가</button>" +
      '<p class="ai-quiz-panel__status" aria-live="polite"></p>' +
      (saved.length
        ? '<p class="ai-quiz-panel__saved">저장된 AI 문제 ' + saved.length + "개 · " +
          '<button type="button" class="ai-quiz-link ai-quiz-clear">전체 삭제</button></p>'
        : "");

    var clearBtn = el.querySelector(".ai-quiz-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (!confirm("저장된 AI 문제를 모두 삭제할까요?")) return;
        saveSaved(opts.appId, []);
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
        if (typeof opts.onInject === "function") opts.onInject(items);
        status.textContent = items.length + "문항이 추가되었습니다.";
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
    var el = document.createElement("div");
    mount.appendChild(el);
    renderPanel(el, opts);
    return el;
  }

  global.AIQuiz = {
    PRESETS: CFG.PRESETS,
    getApiBase: CFG.getApiBase,
    loadSaved: loadSaved,
    saveSaved: saveSaved,
    normalizeItems: normalizeItems,
    generate: async function (presetKey, topic, count) {
      return normalizeItems(await callProxy(presetKey, topic, count), presetKey);
    },
    attachPanel: attachPanel
  };
})(typeof window !== "undefined" ? window : globalThis);
