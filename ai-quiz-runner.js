/**
 * AI 전용 퀴즈 탭 + 풀이 UI (기존 퀴즈와 분리)
 */
(function (global) {
  if (!global.AIQuiz) return;

  var TAB_GEN = "ai-quiz-gen";
  var TAB_PLAY = "ai-quiz";
  var mounts = {};

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function shuffle(a) {
    var b = a.slice();
    for (var i = b.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = b[i];
      b[i] = b[j];
      b[j] = t;
    }
    return b;
  }

  function createRunner(appId, mountEl) {
    var S = {
      phase: "menu",
      queue: [],
      sel: null,
      lockedQ: null,
      lockedOpts: [],
      lockedAns: "",
      sess: { c: 0, w: 0 },
      streak: 0
    };

    function loadProg() {
      return global.AIQuiz.loadProg ? global.AIQuiz.loadProg(appId) : { mastered: {}, wrongCnt: {}, best: 0 };
    }

    function saveProg() {
      if (global.AIQuiz.saveProg) global.AIQuiz.saveProg(appId, S.prog);
    }

    S.prog = loadProg();

    function items() {
      return global.AIQuiz.loadSaved(appId);
    }

    function playable() {
      return items().filter(function (q) {
        return (q.opts || []).length > 0 && q.q;
      });
    }

    function nextQ() {
      var n = S.queue.find(function (id) {
        return !S.prog.mastered[id];
      });
      if (!n) return null;
      return playable().find(function (q) { return q.id === n; }) || null;
    }

    function lockNext() {
      var nq = nextQ();
      if (nq) {
        S.lockedQ = nq;
        S.lockedAns = nq.a;
        S.lockedOpts = shuffle((nq.opts || []).slice());
      } else {
        S.lockedQ = null;
        S.lockedOpts = [];
        S.lockedAns = "";
      }
    }

    function wrongQs() {
      return playable().filter(function (q) {
        return S.prog.wrongCnt[q.id] && !S.prog.mastered[q.id];
      });
    }

    function render() {
      if (!mountEl) return;
      var list = playable();
      if (!list.length) {
        mountEl.innerHTML =
          '<div class="ai-run-empty"><p>아직 AI 문제가 없습니다.</p><p class="ai-run-empty__hint">아래에서 주제를 입력해 생성하세요.</p></div>';
        return;
      }

      if (S.phase === "menu") {
        var wqs = wrongQs();
        var done = list.filter(function (q) { return S.prog.mastered[q.id]; }).length;
        var pct = list.length ? Math.round(done / list.length * 100) : 0;
        var h =
          '<p class="ai-run-intro">AI가 만든 <strong>' +
          list.length +
          "문항</strong>입니다. 기존 문제와 별도로 풀 수 있습니다.</p>";
        h +=
          '<div class="ai-run-progress"><div class="ai-run-progress__head"><span>진행</span><span>' +
          done +
          "/" +
          list.length +
          " (" +
          pct +
          "%)</span></div>";
        h += '<div class="ai-run-bar"><div class="ai-run-bar__fill" style="width:' + pct + '%"></div></div></div>';
        if (wqs.length) {
          h +=
            '<button type="button" class="ai-run-btn ai-run-btn--review" data-ai-run="review">틀린 문제 (' +
            wqs.length +
            ")</button>";
        }
        h +=
          '<button type="button" class="ai-run-btn ai-run-btn--main" data-ai-run="start">' +
          (done === 0 ? "AI 문제 풀기 시작" : "이어서 풀기") +
          " — " +
          (list.length - done) +
          "문항 남음</button>";
        if (done > 0 || Object.keys(S.prog.wrongCnt).length) {
          h +=
            '<button type="button" class="ai-run-btn ai-run-btn--ghost" data-ai-run="reset">AI 풀이 기록 초기화</button>';
        }
        mountEl.innerHTML = h;
        return;
      }

      if (S.phase === "review") {
        var rq = wrongQs()[S.revIdx || 0];
        if (!rq) {
          S.phase = "menu";
          render();
          return;
        }
        mountEl.innerHTML =
          '<div class="ai-run-head"><button type="button" class="ai-run-link" data-ai-run="menu">&larr; 목록</button></div>' +
          '<span class="ai-run-qmeta">AI · ' +
          esc(rq.cat) +
          "</span>" +
          '<div class="ai-run-qtext">' +
          esc(rq.q) +
          "</div>" +
          '<div class="ai-run-ans">정답: ' +
          esc(rq.a) +
          "</div>" +
          '<div class="ai-run-ex"><strong>해설</strong> ' +
          esc(rq.ex || "—") +
          "</div>";
        return;
      }

      var cur = S.lockedQ;
      var ans = S.lockedAns;
      var unmast = list.filter(function (q) { return !S.prog.mastered[q.id]; }).length;
      var doneQuiz = !cur && unmast === 0;
      var ok = S.sel !== null && S.sel === ans;

      var qh =
        '<div class="ai-run-head"><button type="button" class="ai-run-link" data-ai-run="menu">&larr; 목록</button>';
      if (S.streak >= 3) qh += '<span class="ai-run-streak">' + S.streak + "연속!</span>";
      qh += "</div>";

      if (doneQuiz) {
        mountEl.innerHTML =
          qh +
          '<div class="ai-run-done"><div class="ai-run-done__icon">✓</div><h3>AI 문제 완료</h3><p>정답 ' +
          S.sess.c +
          " · 오답 " +
          S.sess.w +
          '</p><button type="button" class="ai-run-btn ai-run-btn--main" data-ai-run="menu">목록으로</button></div>';
        return;
      }

      if (!cur) {
        mountEl.innerHTML = qh + '<p class="ai-run-loading">불러오는 중…</p>';
        return;
      }

      qh += '<span class="ai-run-qmeta">AI · ' + esc(cur.cat) + "</span>";
      qh += '<div class="ai-run-qtext">' + esc(cur.q) + "</div>";
      qh += '<div class="ai-run-opts">';
      S.lockedOpts.forEach(function (o, i) {
        var cls = "";
        var lbl = "";
        if (S.sel !== null) {
          if (o === ans) {
            cls = " ai-run-opt--ok";
            lbl = "정답";
          } else if (o === S.sel) {
            cls = " ai-run-opt--err";
            lbl = "오답";
          }
        }
        qh +=
          '<button type="button" class="ai-run-opt' +
          cls +
          '" data-ai-run-pick="' +
          encodeURIComponent(o) +
          '" ' +
          (S.sel !== null ? "disabled" : "") +
          "><span class=\"ai-run-opt__n\">" +
          (i + 1) +
          "</span>" +
          esc(o) +
          (lbl ? '<span class="ai-run-opt__lbl">' + lbl + "</span>" : "") +
          "</button>";
      });
      qh += "</div>";

      if (S.sel !== null) {
        qh +=
          '<div class="ai-run-result ai-run-result--' +
          (ok ? "ok" : "err") +
          '">' +
          (ok ? "정답입니다" : "틀렸습니다 · 정답: " + esc(ans)) +
          (cur.ex ? '<p class="ai-run-ex">' + esc(cur.ex) + "</p>" : "") +
          "</div>";
        qh += '<button type="button" class="ai-run-btn ai-run-btn--main" data-ai-run="next">다음</button>';
      }

      mountEl.innerHTML = qh;
    }

    mountEl.addEventListener("click", function (ev) {
      var pick = ev.target.closest("[data-ai-run-pick]");
      if (pick && !pick.disabled) {
        if (S.sel !== null || !S.lockedQ) return;
        var o = decodeURIComponent(pick.getAttribute("data-ai-run-pick") || "");
        S.sel = o;
        var cur = S.lockedQ;
        if (o === S.lockedAns) {
          S.prog.mastered[cur.id] = true;
          S.sess.c++;
          S.streak++;
          if (S.streak > (S.prog.best || 0)) S.prog.best = S.streak;
        } else {
          S.prog.wrongCnt[cur.id] = (S.prog.wrongCnt[cur.id] || 0) + 1;
          S.sess.w++;
          S.streak = 0;
          S.queue = S.queue.filter(function (id) { return id !== cur.id; }).concat([cur.id]);
        }
        saveProg();
        render();
        return;
      }

      var act = ev.target.closest("[data-ai-run]");
      if (!act) return;
      var kind = act.getAttribute("data-ai-run");
      if (kind === "menu") {
        S.phase = "menu";
        S.lockedQ = null;
        S.sel = null;
        render();
      } else if (kind === "start") {
        S.queue = shuffle(playable().map(function (q) { return q.id; }));
        S.sel = null;
        S.sess = { c: 0, w: 0 };
        S.streak = 0;
        S.phase = "quiz";
        lockNext();
        render();
      } else if (kind === "next") {
        S.sel = null;
        S.lockedQ = null;
        lockNext();
        render();
      } else if (kind === "review") {
        S.revIdx = 0;
        S.phase = "review";
        render();
      } else if (kind === "reset") {
        if (!confirm("AI 문제 풀이 기록만 초기화할까요? (문제 목록은 유지)")) return;
        S.prog = { mastered: {}, wrongCnt: {}, best: 0 };
        S.streak = 0;
        saveProg();
        S.phase = "menu";
        render();
      }
    });

    function refresh() {
      if (S.phase === "quiz" && !S.lockedQ) lockNext();
      render();
    }

    function resetAll() {
      S.phase = "menu";
      S.prog = { mastered: {}, wrongCnt: {}, best: 0 };
      saveProg();
      refresh();
    }

    render();
    return { refresh: refresh, resetAll: resetAll, count: function () { return items().length; } };
  }

  function updateTabLabel(btn, count) {
    if (!btn) return;
    btn.innerHTML = "생성 AI 문제<small>" + (count ? count + "문항" : "비어 있음") + "</small>";
    btn.hidden = false;
    btn.style.display = "";
    btn.classList.add("ai-quiz-tab", "ai-quiz-tab--ready");
  }

  function ensureTab(tabBar, tabAttr, tabBtnClass, val, html) {
    if (!tabBar) return null;
    var btn = tabBar.querySelector("[" + tabAttr + '="' + val + '"]');
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = tabBtnClass + " ai-quiz-tab ai-quiz-tab--ready";
      btn.setAttribute(tabAttr, val);
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", "false");
      btn.innerHTML = html;
      tabBar.appendChild(btn);
    } else {
      btn.classList.add("ai-quiz-tab", "ai-quiz-tab--ready");
      btn.hidden = false;
      btn.style.display = "";
      if (!btn.innerHTML.trim()) btn.innerHTML = html;
    }
    return btn;
  }

  function setTabOn(tabBar, tabAttr, tabBtnClass, activeBtn) {
    if (!tabBar) return;
    tabBar.querySelectorAll("[" + tabAttr + "]").forEach(function (b) {
      var on = b === activeBtn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function ensureFab(appId, genMount, openGenTab) {
    var fab = document.getElementById("aiQuizFab-" + appId);
    if (!fab) {
      fab = document.createElement("button");
      fab.id = "aiQuizFab-" + appId;
      fab.className = "ai-quiz-fab";
      fab.type = "button";
      fab.setAttribute("aria-label", "AI 문제 생성 탭으로 이동");
      fab.innerHTML = "✨ AI 문제 생성";
      fab.addEventListener("click", function () {
        if (typeof openGenTab === "function") openGenTab();
        else if (genMount) {
          genMount.scrollIntoView({ behavior: "smooth", block: "start" });
          var topic = genMount.querySelector(".ai-quiz-topic");
          if (topic) setTimeout(function () { topic.focus(); }, 350);
        }
      });
      document.body.appendChild(fab);
    }
    fab.hidden = false;
    document.documentElement.classList.add("ai-quiz-mounted");
  }

  async function mountSubject(opts) {
    if (!opts || !opts.appId) return null;
    var appId = opts.appId;

    var bottomMount =
      typeof opts.bottomMount === "string"
        ? document.querySelector(opts.bottomMount)
        : opts.bottomMount;
    if (!bottomMount) bottomMount = document.querySelector(".page-card") || document.body;

    var tabBar = opts.tabBar ? document.querySelector(opts.tabBar) : null;
    var tabAttr = opts.tabAttr || "data-ai-view";
    var tabBtnClass = opts.tabBtnClass || "ai-quiz-tab-btn";
    var hideHosts = (opts.hideHosts || [])
      .map(function (s) { return document.querySelector(s); })
      .filter(Boolean);

    var stage = document.getElementById("aiQuizStage-" + appId);
    if (!stage) {
      stage = document.createElement("div");
      stage.id = "aiQuizStage-" + appId;
      stage.className = "ai-quiz-stage";
      if (tabBar) tabBar.insertAdjacentElement("afterend", stage);
      else bottomMount.insertBefore(stage, bottomMount.firstChild);
    }

    function placeInStage(el) {
      if (el.parentElement !== stage) stage.appendChild(el);
    }

    var genMount = document.getElementById("aiQuizGen-" + appId);
    if (!genMount) {
      genMount = document.createElement("div");
      genMount.id = "aiQuizGen-" + appId;
      genMount.className = "ai-quiz-gen-mount";
      placeInStage(genMount);
    } else {
      placeInStage(genMount);
    }

    var wrap = document.getElementById("aiQuizWrap-" + appId);
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "aiQuizWrap-" + appId;
      wrap.className = "ai-quiz-wrap";
      wrap.hidden = true;
      var runMount = document.createElement("div");
      runMount.className = "ai-quiz-run";
      runMount.id = "aiQuizRun-" + appId;
      wrap.appendChild(runMount);
      placeInStage(wrap);
    } else {
      placeInStage(wrap);
    }

    global.AIQuiz.attachPanel({
      mount: genMount,
      appId: appId,
      preset: opts.preset || "generic",
      onInject: function () {
        if (mounts[appId]) {
          mounts[appId].syncTab();
          mounts[appId].runner.refresh();
          mounts[appId].activatePlay();
          if (mounts[appId].playTabBtn && mounts[appId].tabBar) {
            setTabOn(mounts[appId].tabBar, mounts[appId].tabAttr, mounts[appId].tabBtnClass, mounts[appId].playTabBtn);
          }
        }
      },
      onClear: function () {
        if (mounts[appId]) {
          mounts[appId].runner.resetAll();
          mounts[appId].syncTab();
        }
      }
    });

    function ensurePanel() {
      if (!genMount || !global.AIQuiz.attachPanel) return;
      if (!genMount.querySelector(".ai-quiz-panel") || !genMount.querySelector(".ai-quiz-topic")) {
        global.AIQuiz.attachPanel({
          mount: genMount,
          appId: appId,
          preset: opts.preset || "generic",
          onInject: function () {
            if (mounts[appId]) {
              mounts[appId].syncTab();
              mounts[appId].runner.refresh();
              mounts[appId].activatePlay();
            }
          },
          onClear: function () {
            if (mounts[appId]) {
              mounts[appId].runner.resetAll();
              mounts[appId].syncTab();
            }
          }
        });
      }
    }

    var runner = createRunner(appId, document.getElementById("aiQuizRun-" + appId));

    var genTabBtn = null;
    var playTabBtn = null;
    if (tabBar) {
      genTabBtn = ensureTab(
        tabBar,
        tabAttr,
        tabBtnClass,
        TAB_GEN,
        "AI 문제 생성<small>주제 입력</small>"
      );
      playTabBtn = ensureTab(
        tabBar,
        tabAttr,
        tabBtnClass,
        TAB_PLAY,
        "생성 AI 문제<small>비어 있음</small>"
      );
      if (!tabBar.dataset.aiQuizBound) {
        tabBar.dataset.aiQuizBound = "1";
        tabBar.addEventListener(
          "click",
          function (ev) {
            var btn = ev.target.closest("[" + tabAttr + "]");
            if (!btn) return;
            var val = btn.getAttribute(tabAttr);
            if (val === TAB_GEN) {
              activateGen();
              setTabOn(tabBar, tabAttr, tabBtnClass, genTabBtn);
            } else if (val === TAB_PLAY) {
              activatePlay();
              setTabOn(tabBar, tabAttr, tabBtnClass, playTabBtn);
            } else {
              deactivate();
            }
          },
          true
        );
      }
    } else {
      var bar = document.getElementById("aiQuizStandalone-" + appId);
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "aiQuizStandalone-" + appId;
        bar.className = "ai-quiz-standalone";
        bar.innerHTML =
          '<button type="button" class="ai-quiz-standalone__btn" data-ai-standalone-gen>AI 문제 생성</button>' +
          '<button type="button" class="ai-quiz-standalone__btn" data-ai-standalone-play>생성 AI 문제</button>' +
          '<button type="button" class="ai-quiz-standalone__back" data-ai-standalone-close hidden>&larr; 돌아가기</button>';
        var anchor =
          bottomMount.querySelector("h1.app-title, h1.page-title, h1") ||
          bottomMount.querySelector(".page-card") ||
          bottomMount.querySelector(".site-nav");
        if (anchor) anchor.insertAdjacentElement("afterend", bar);
        else bottomMount.insertBefore(bar, bottomMount.firstChild);
      }
    }

    function setStandaloneNav(active) {
      var bar = document.getElementById("aiQuizStandalone-" + appId);
      if (!bar) return;
      var genBtn = bar.querySelector("[data-ai-standalone-gen]");
      var playBtn = bar.querySelector("[data-ai-standalone-play]");
      var backBtn = bar.querySelector("[data-ai-standalone-close]");
      if (genBtn) genBtn.hidden = !!active;
      if (playBtn) playBtn.hidden = !!active;
      if (backBtn) backBtn.hidden = !active;
    }

    function wireStandalone() {
      var bar = document.getElementById("aiQuizStandalone-" + appId);
      if (!bar || bar.dataset.aiStandaloneBound) return;
      bar.dataset.aiStandaloneBound = "1";
      bar.querySelector("[data-ai-standalone-gen]").addEventListener("click", function () {
        activateGen();
        setStandaloneNav(true);
      });
      bar.querySelector("[data-ai-standalone-play]").addEventListener("click", function () {
        activatePlay();
        setStandaloneNav(true);
      });
      bar.querySelector("[data-ai-standalone-close]").addEventListener("click", function () {
        deactivate();
        setStandaloneNav(false);
      });
    }

    function hideMainPanels() {
      hideHosts.forEach(function (el) {
        el.dataset.aiQuizPrevDisplay = el.style.display || "";
        el.dataset.aiQuizPrevHidden = el.hidden ? "1" : "0";
        if (el.id === "feConcepts" || el.id === "fkConcepts" || el.id === "feMockWrap" || el.id === "fkQuizWrap") {
          el.hidden = true;
        } else {
          el.style.display = "none";
        }
      });
    }

    function restoreMainPanels() {
      hideHosts.forEach(function (el) {
        el.hidden = el.dataset.aiQuizPrevHidden === "1";
        el.style.display = el.dataset.aiQuizPrevDisplay || "";
      });
    }

    function activateGen() {
      ensurePanel();
      hideMainPanels();
      stage.hidden = false;
      stage.style.display = "";
      if (genMount) genMount.style.display = "";
      wrap.hidden = true;
      document.body.classList.add("ai-quiz-active");
      setStandaloneNav(true);
      if (stage) stage.scrollIntoView({ behavior: "smooth", block: "start" });
      var topic = genMount && genMount.querySelector(".ai-quiz-topic");
      if (topic) setTimeout(function () { topic.focus(); }, 80);
    }

    function activatePlay() {
      ensurePanel();
      hideMainPanels();
      stage.hidden = false;
      stage.style.display = "";
      if (genMount) genMount.style.display = "none";
      wrap.hidden = false;
      runner.refresh();
      document.body.classList.add("ai-quiz-active");
      setStandaloneNav(true);
      if (stage) stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function deactivate() {
      restoreMainPanels();
      stage.hidden = true;
      stage.style.display = "none";
      wrap.hidden = true;
      document.body.classList.remove("ai-quiz-active");
      if (genMount) genMount.style.display = "none";
      setStandaloneNav(false);
    }

    function openGenTab() {
      activateGen();
      if (tabBar && genTabBtn) setTabOn(tabBar, tabAttr, tabBtnClass, genTabBtn);
    }

    function syncTab() {
      var n = runner.count();
      updateTabLabel(playTabBtn, n);
      var standalone = document.getElementById("aiQuizStandalone-" + appId);
      if (standalone) {
        standalone.style.display = "flex";
        var playBtn = standalone.querySelector("[data-ai-standalone-play]");
        if (playBtn) playBtn.textContent = "생성 AI 문제 (" + n + "문항)";
      }
    }

    if (genMount) genMount.style.display = "none";
    wrap.hidden = true;
    stage.hidden = true;
    stage.style.display = "none";
    wireStandalone();

    syncTab();
    if (tabBar) {
      var activeBtn = tabBar.querySelector("[" + tabAttr + '"].is-on');
      if (activeBtn) {
        var activeVal = activeBtn.getAttribute(tabAttr);
        if (activeVal === TAB_GEN) activateGen();
        else if (activeVal === TAB_PLAY) activatePlay();
      }
    }

    mounts[appId] = {
      runner: runner,
      syncTab: syncTab,
      activateGen: activateGen,
      activatePlay: activatePlay,
      ensurePanel: ensurePanel,
      tabBar: tabBar,
      tabAttr: tabAttr,
      tabBtnClass: tabBtnClass,
      playTabBtn: playTabBtn,
      genTabBtn: genTabBtn,
      preset: opts.preset || "generic"
    };

    if (global.AIQuiz.ensureData) {
      global.AIQuiz.ensureData(appId).then(function () {
        syncTab();
        runner.refresh();
        if (global.AIQuiz.refreshPanel) global.AIQuiz.refreshPanel(appId, opts.preset);
      });
    }

    ensureFab(appId, genMount, openGenTab);
    return mounts[appId];
  }

  function refreshSubject(appId) {
    if (global.AIQuiz.refreshPanel) global.AIQuiz.refreshPanel(appId);
    if (mounts[appId]) mounts[appId].syncTab();
  }

  global.AIQuiz.mountSubject = mountSubject;
  global.AIQuiz.refreshSubject = refreshSubject;
  global.AIQuiz.TAB_GEN = TAB_GEN;
  global.AIQuiz.TAB_PLAY = TAB_PLAY;

  var TAB_ATTRS = [
    "data-fk-view",
    "data-fe-view",
    "data-prog-view",
    "data-fsci-tab",
    "data-fs-tab",
    "data-kh-view",
    "data-hist-view",
    "data-econ-view"
  ];

  function resumeActiveTab() {
    Object.keys(mounts).forEach(function (appId) {
      var m = mounts[appId];
      if (!m || !m.tabBar || !m.tabAttr) return;
      var active = m.tabBar.querySelector("[" + m.tabAttr + '"].is-on');
      if (!active) return;
      var val = active.getAttribute(m.tabAttr);
      if (val === TAB_GEN) m.activateGen();
      else if (val === TAB_PLAY) m.activatePlay();
    });
  }

  if (!document.documentElement.dataset.aiQuizAuthHook) {
    document.documentElement.dataset.aiQuizAuthHook = "1";
    document.addEventListener("siteauth:ready", function () {
      resumeActiveTab();
      if (global.AIQuiz.refreshSubject) {
        Object.keys(mounts).forEach(function (appId) {
          global.AIQuiz.refreshSubject(appId);
        });
      }
    });
  }

  if (!document.documentElement.dataset.aiQuizGlobalClick) {
    document.documentElement.dataset.aiQuizGlobalClick = "1";
    document.addEventListener(
      "click",
      function (ev) {
        var btn = ev.target.closest(".ai-quiz-tab");
        if (!btn) return;
        var val = "";
        TAB_ATTRS.forEach(function (attr) {
          var v = btn.getAttribute(attr);
          if (v) val = v;
        });
        if (val !== TAB_GEN && val !== TAB_PLAY) return;
        function run() {
          var keys = Object.keys(mounts);
          if (!keys.length) return false;
          var entry = mounts[keys[0]];
          if (!entry) return false;
          if (entry.ensurePanel) entry.ensurePanel();
          if (val === TAB_GEN) entry.activateGen();
          else entry.activatePlay();
          return true;
        }
        if (!run()) {
          document.dispatchEvent(new CustomEvent("ai-quiz:request-mount"));
          setTimeout(function () {
            if (!run()) setTimeout(run, 400);
          }, 150);
        }
      },
      true
    );
  }
})(typeof window !== "undefined" ? window : globalThis);
