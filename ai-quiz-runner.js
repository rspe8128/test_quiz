/**
 * AI 전용 퀴즈 탭 + 풀이 UI (기존 퀴즈와 분리)
 */
(function (global) {
  if (!global.AIQuiz) return;

  var TAB_VALUE = "ai-quiz";
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
    var LS_KEY = "ai-quiz-prog-" + appId;
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
      try {
        var t = localStorage.getItem(LS_KEY);
        return t ? JSON.parse(t) : { mastered: {}, wrongCnt: {}, best: 0 };
      } catch (e) {
        return { mastered: {}, wrongCnt: {}, best: 0 };
      }
    }

    function saveProg() {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(S.prog));
      } catch (e) {}
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
    btn.innerHTML = "AI 문제<small>" + (count ? count + "문항" : "생성 후 표시") + "</small>";
    btn.style.display = count > 0 ? "" : "none";
  }

  function setTabOn(tabBar, tabAttr, tabBtnClass, activeBtn) {
    if (!tabBar) return;
    tabBar.querySelectorAll("[" + tabAttr + "]").forEach(function (b) {
      var on = b === activeBtn;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function mountSubject(opts) {
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

    function placeBelowTabs(el) {
      if (tabBar) {
        tabBar.insertAdjacentElement("afterend", el);
      } else {
        var anchor =
          bottomMount.querySelector("h1.app-title, h1.page-title, h1") ||
          bottomMount.querySelector(".page-card") ||
          bottomMount.firstChild;
        if (anchor) anchor.insertAdjacentElement("afterend", el);
        else bottomMount.insertBefore(el, bottomMount.firstChild);
      }
    }

    var genMount = document.getElementById("aiQuizGen-" + appId);
    if (!genMount) {
      genMount = document.createElement("div");
      genMount.id = "aiQuizGen-" + appId;
      genMount.className = "ai-quiz-gen-mount";
      placeBelowTabs(genMount);
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
      if (genMount.nextSibling) {
        bottomMount.insertBefore(wrap, genMount.nextSibling);
      } else {
        genMount.insertAdjacentElement("afterend", wrap);
      }
    }

    var runner = createRunner(appId, document.getElementById("aiQuizRun-" + appId));

    var tabBtn = null;
    if (tabBar) {
      tabBtn = tabBar.querySelector("[" + tabAttr + '="' + TAB_VALUE + '"]');
      if (!tabBtn) {
        tabBtn = document.createElement("button");
        tabBtn.type = "button";
        tabBtn.className = tabBtnClass + " ai-quiz-tab";
        tabBtn.setAttribute(tabAttr, TAB_VALUE);
        tabBtn.setAttribute("role", "tab");
        tabBtn.setAttribute("aria-selected", "false");
        tabBar.appendChild(tabBtn);
      }
      tabBar.addEventListener(
        "click",
        function (ev) {
          var btn = ev.target.closest("[" + tabAttr + "]");
          if (!btn) return;
          var val = btn.getAttribute(tabAttr);
          if (val === TAB_VALUE) {
            activate();
            setTabOn(tabBar, tabAttr, tabBtnClass, tabBtn);
          } else {
            deactivate();
          }
        },
        true
      );
    } else {
      var bar = document.getElementById("aiQuizStandalone-" + appId);
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "aiQuizStandalone-" + appId;
        bar.className = "ai-quiz-standalone";
        bar.innerHTML =
          '<button type="button" class="ai-quiz-standalone__btn" data-ai-standalone-open>AI 문제 풀기</button>' +
          '<button type="button" class="ai-quiz-standalone__back" data-ai-standalone-close hidden>&larr; 돌아가기</button>';
        var anchor =
          bottomMount.querySelector("h1.app-title, h1.page-title, h1") ||
          bottomMount.querySelector(".page-card") ||
          bottomMount.querySelector(".site-nav");
        if (anchor) anchor.insertAdjacentElement("afterend", bar);
        else bottomMount.insertBefore(bar, bottomMount.firstChild);
        bar.querySelector("[data-ai-standalone-open]").addEventListener("click", function () {
          activate();
          bar.querySelector("[data-ai-standalone-open]").hidden = true;
          bar.querySelector("[data-ai-standalone-close]").hidden = false;
        });
        bar.querySelector("[data-ai-standalone-close]").addEventListener("click", function () {
          deactivate();
          bar.querySelector("[data-ai-standalone-open]").hidden = false;
          bar.querySelector("[data-ai-standalone-close]").hidden = true;
        });
      }
    }

    function activate() {
      hideHosts.forEach(function (el) {
        el.dataset.aiQuizPrevDisplay = el.style.display || "";
        el.dataset.aiQuizPrevHidden = el.hidden ? "1" : "0";
        if (el.id === "feConcepts" || el.id === "fkConcepts" || el.id === "feMockWrap" || el.id === "fkQuizWrap") {
          el.hidden = true;
        } else {
          el.style.display = "none";
        }
      });
      wrap.hidden = false;
      runner.refresh();
      document.body.classList.add("ai-quiz-active");
      var standalone = document.getElementById("aiQuizStandalone-" + appId);
      if (standalone) {
        var open = standalone.querySelector("[data-ai-standalone-open]");
        var back = standalone.querySelector("[data-ai-standalone-close]");
        if (open) open.hidden = true;
        if (back) back.hidden = false;
      }
    }

    function deactivate() {
      hideHosts.forEach(function (el) {
        el.hidden = el.dataset.aiQuizPrevHidden === "1";
        el.style.display = el.dataset.aiQuizPrevDisplay || "";
      });
      wrap.hidden = true;
      document.body.classList.remove("ai-quiz-active");
      var standalone = document.getElementById("aiQuizStandalone-" + appId);
      if (standalone) {
        var open = standalone.querySelector("[data-ai-standalone-open]");
        var back = standalone.querySelector("[data-ai-standalone-close]");
        if (open) open.hidden = false;
        if (back) back.hidden = true;
      }
    }

    function syncTab() {
      var n = runner.count();
      updateTabLabel(tabBtn, n);
      var standalone = document.getElementById("aiQuizStandalone-" + appId);
      if (standalone) {
        standalone.style.display = n > 0 ? "" : "none";
        var openBtn = standalone.querySelector("[data-ai-standalone-open]");
        if (openBtn) openBtn.textContent = "AI 문제 풀기 (" + n + "문항)";
      }
      if (!n) deactivate();
    }

    global.AIQuiz.attachPanel({
      mount: genMount,
      appId: appId,
      preset: opts.preset || "generic",
      onInject: function () {
        syncTab();
        runner.refresh();
        activate();
        if (tabBtn && tabBar) {
          setTabOn(tabBar, tabAttr, tabBtnClass, tabBtn);
        }
      },
      onClear: function () {
        runner.resetAll();
        syncTab();
      }
    });

    syncTab();
    mounts[appId] = { runner: runner, syncTab: syncTab, activate: activate };
    return mounts[appId];
  }

  global.AIQuiz.mountSubject = mountSubject;
  global.AIQuiz.TAB_VALUE = TAB_VALUE;
})(typeof window !== "undefined" ? window : globalThis);
