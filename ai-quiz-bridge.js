/**
 * AI 퀴즈 생성 브리지 — 설정 UI, API 호출, 검증, 과목 앱 주입
 */
(function (global) {
  if (!global.AIQuizConfig) return;

  var CFG = global.AIQuizConfig;
  var LS_SAVED_PREFIX = "ai-quiz-saved-";
  var attached = null;
  var panelEl = null;
  var settingsOpen = false;

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function fillTemplate(tpl, vars) {
    return tpl.replace(/\{\{(\w+)\}\}/g, function (_, key) {
      return vars[key] != null ? String(vars[key]) : "";
    });
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

  function getApiUrl(settings) {
    var base = (settings.apiBase || "").trim().replace(/\/+$/, "");
    if (!base) return "";
    if (settings.directMode) return base + "/chat/completions";
    return base + "/generate";
  }

  async function callProxy(settings, presetKey, topic, count) {
    var preset = CFG.PRESETS[presetKey] || CFG.PRESETS.generic;
    var url = getApiUrl(settings);
    if (!url) throw new Error("API 주소를 먼저 설정하세요. (허브 또는 퀴즈 메뉴의 AI 설정)");

    var body;
    if (settings.directMode) {
      if (!(settings.apiKey || "").trim()) throw new Error("직접 연결 모드에서는 API 키가 필요합니다.");
      body = {
        model: settings.model || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: preset.system },
          { role: "user", content: fillTemplate(preset.userTemplate, { topic: topic, count: count }) }
        ]
      };
    } else {
      body = { preset: presetKey, topic: topic, count: count };
    }

    var headers = { "Content-Type": "application/json" };
    if (settings.directMode) headers.Authorization = "Bearer " + settings.apiKey.trim();

    var res = await fetch(url, { method: "POST", headers: headers, body: JSON.stringify(body) });
    var data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error("서버 응답을 읽을 수 없습니다.");
    }
    if (!res.ok) {
      throw new Error((data && (data.error || data.message)) || ("요청 실패 (" + res.status + ")"));
    }

    if (settings.directMode) {
      var text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!text) throw new Error("AI 응답이 비어 있습니다.");
      var parsed = JSON.parse(text);
      return parsed.items || parsed.questions || [];
    }
    return data.items || [];
  }

  function renderSettingsModal() {
    var s = CFG.loadSettings();
    var host = document.getElementById("aiQuizSettingsHost");
    if (!host) {
      host = document.createElement("div");
      host.id = "aiQuizSettingsHost";
      document.body.appendChild(host);
    }
    host.innerHTML =
      '<div class="ai-quiz-overlay" id="aiQuizOverlay">' +
      '<div class="ai-quiz-modal" role="dialog" aria-labelledby="aiQuizModalTitle">' +
      '<h2 id="aiQuizModalTitle">AI 퀴즈 설정</h2>' +
      '<p class="ai-quiz-modal__hint">사이트 파일은 어디에 두어도 됩니다. API 서버 주소만 맞추면 다른 PC·호스팅에서도 동일하게 사용할 수 있습니다.</p>' +
      '<label class="ai-quiz-field"><span>API 서버 주소</span>' +
      '<input type="url" id="aiApiBase" placeholder="http://localhost:8787" value="' + esc(s.apiBase) + '">' +
      '<small>로컬: python ai-quiz-server/server.py 실행 후 위 주소 입력</small></label>' +
      '<label class="ai-quiz-field ai-quiz-check">' +
      '<input type="checkbox" id="aiDirectMode"' + (s.directMode ? " checked" : "") + "> " +
      "브라우저에서 API 직접 호출 (개인용·키 노출 주의)</label>" +
      '<div id="aiDirectFields"' + (s.directMode ? "" : ' style="display:none"') + ">" +
      '<label class="ai-quiz-field"><span>OpenAI 호환 API 키</span><input type="password" id="aiApiKey" value="' + esc(s.apiKey) + '"></label>' +
      '<label class="ai-quiz-field"><span>모델</span><input type="text" id="aiModel" value="' + esc(s.model) + '"></label>' +
      "</div>" +
      '<div class="ai-quiz-modal__actions">' +
      '<button type="button" class="ai-quiz-btn ai-quiz-btn--ghost" id="aiSettingsCancel">취소</button>' +
      '<button type="button" class="ai-quiz-btn" id="aiSettingsSave">저장</button>' +
      "</div></div></div>";

    var direct = host.querySelector("#aiDirectMode");
    var directFields = host.querySelector("#aiDirectFields");
    direct.addEventListener("change", function () {
      directFields.style.display = direct.checked ? "" : "none";
    });
    host.querySelector("#aiSettingsCancel").addEventListener("click", closeSettings);
    host.querySelector("#aiSettingsSave").addEventListener("click", function () {
      CFG.saveSettings({
        apiBase: host.querySelector("#aiApiBase").value.trim(),
        directMode: direct.checked,
        apiKey: host.querySelector("#aiApiKey").value.trim(),
        model: host.querySelector("#aiModel").value.trim() || "gpt-4o-mini"
      });
      closeSettings();
      if (panelEl && attached) renderPanel(panelEl, attached);
    });
    host.querySelector("#aiQuizOverlay").addEventListener("click", function (ev) {
      if (ev.target.id === "aiQuizOverlay") closeSettings();
    });
    settingsOpen = true;
  }

  function closeSettings() {
    var host = document.getElementById("aiQuizSettingsHost");
    if (host) host.innerHTML = "";
    settingsOpen = false;
  }

  function renderPanel(el, opts) {
    panelEl = el;
    attached = opts;
    var presetKey = opts.preset || "generic";
    var preset = CFG.PRESETS[presetKey] || CFG.PRESETS.generic;
    var saved = loadSaved(opts.appId);
    var settings = CFG.loadSettings();
    var apiOk = !!(settings.apiBase || "").trim() || settings.directMode;

    el.className = "ai-quiz-panel";
    el.innerHTML =
      '<div class="ai-quiz-panel__head">' +
      '<span class="ai-quiz-panel__title">AI 문제 생성</span>' +
      '<button type="button" class="ai-quiz-link" data-ai-open-settings>설정</button>' +
      "</div>" +
      (apiOk
        ? ""
        : '<p class="ai-quiz-panel__warn">API 서버 주소를 설정하면 바로 생성할 수 있습니다.</p>') +
      '<label class="ai-quiz-field"><span>주제</span>' +
      '<input type="text" class="ai-quiz-topic" placeholder="' + esc(preset.topicPlaceholder) + '"></label>' +
      '<label class="ai-quiz-field"><span>문항 수</span>' +
      '<input type="number" class="ai-quiz-count" min="1" max="15" value="' + (preset.countDefault || 5) + '"></label>' +
      '<button type="button" class="ai-quiz-btn ai-quiz-btn--main ai-quiz-generate"' +
      (apiOk ? "" : " disabled") +
      ">생성 후 AI 탭에 추가</button>" +
      '<p class="ai-quiz-panel__status" aria-live="polite"></p>' +
      (saved.length
        ? '<p class="ai-quiz-panel__saved">저장된 AI 문제 ' + saved.length + '개 · ' +
          '<button type="button" class="ai-quiz-link ai-quiz-clear">전체 삭제</button></p>'
        : "");

    el.querySelector("[data-ai-open-settings]").addEventListener("click", renderSettingsModal);

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
      status.textContent = "생성 중… (10~30초)";
      try {
        var settingsNow = CFG.loadSettings();
        var raw = await callProxy(settingsNow, presetKey, topic, count);
        var items = normalizeItems(raw, opts.appId);
        if (!items.length) throw new Error("유효한 문제를 만들지 못했습니다. 다시 시도하세요.");
        var merged = loadSaved(opts.appId).concat(items);
        saveSaved(opts.appId, merged);
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

  function openSettings() {
    renderSettingsModal();
  }

  global.AIQuiz = {
    PRESETS: CFG.PRESETS,
    loadSettings: CFG.loadSettings,
    saveSettings: CFG.saveSettings,
    loadSaved: loadSaved,
    saveSaved: saveSaved,
    normalizeItems: normalizeItems,
    generate: async function (presetKey, topic, count) {
      var items = await callProxy(CFG.loadSettings(), presetKey, topic, count);
      return normalizeItems(items, presetKey);
    },
    attachPanel: attachPanel,
    openSettings: openSettings,
    menuHtml: function () {
      return (
        '<button type="button" class="ai-quiz-hub-btn" onclick="AIQuiz.openSettings()">' +
        "AI 퀴즈 설정<span>API 서버 주소 · 다른 곳에서도 동일하게 사용</span></button>"
      );
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
